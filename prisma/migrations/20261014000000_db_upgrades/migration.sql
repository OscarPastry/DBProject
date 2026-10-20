-- ============================================================================
-- DB upgrades: FK indexes, CHECK constraints, full-text search, rating view,
-- and taste-signal triggers.
-- ============================================================================

-- Run as one transaction so a failure leaves nothing half-applied.
BEGIN;

-- ── Indexes on foreign keys ────────────────────────────────────────────────
-- Postgres does not index FK columns automatically. Composite PKs already
-- cover their leading column, so only the non-leading / plain FK columns
-- need their own index.
CREATE INDEX "FITS_DIET_restriction_id_idx" ON "FITS_DIET"("restriction_id");
CREATE INDEX "FOLLOWS_restriction_id_idx" ON "FOLLOWS"("restriction_id");
CREATE INDEX "SELECTS_cuisine_id_idx" ON "SELECTS"("cuisine_id");
CREATE INDEX "Recipe_user_id_idx" ON "Recipe"("user_id");
CREATE INDEX "Recipe_cuisine_id_idx" ON "Recipe"("cuisine_id");
CREATE INDEX "Recipe_is_public_created_at_idx" ON "Recipe"("is_public", "created_at");
CREATE INDEX "Recipe_View_Log_recipe_id_idx" ON "Recipe_View_Log"("recipe_id");
CREATE INDEX "Recipe_View_Log_user_id_idx" ON "Recipe_View_Log"("user_id");
CREATE INDEX "Cooking_Log_recipe_id_idx" ON "Cooking_Log"("recipe_id");
CREATE INDEX "Cooking_Log_user_id_idx" ON "Cooking_Log"("user_id");
CREATE INDEX "USES_ingredient_id_idx" ON "USES"("ingredient_id");
CREATE INDEX "SUBSTITUTES_substitute_ingredient_id_idx" ON "SUBSTITUTES"("substitute_ingredient_id");
CREATE INDEX "Board_user_id_idx" ON "Board"("user_id");
CREATE INDEX "SAVES_recipe_id_idx" ON "SAVES"("recipe_id");
CREATE INDEX "FITS_mood_id_idx" ON "FITS"("mood_id");
CREATE INDEX "Review_recipe_id_idx" ON "Review"("recipe_id");

-- ── Domain constraints ─────────────────────────────────────────────────────
ALTER TABLE "Recipe"
  ADD CONSTRAINT "Recipe_difficulty_level_check" CHECK ("difficulty_level" IN ('Easy', 'Medium', 'Hard')),
  ADD CONSTRAINT "Recipe_estimated_time_check" CHECK ("estimated_time" >= 0);
ALTER TABLE "Board"
  ADD CONSTRAINT "Board_visibility_check" CHECK ("visibility" IN ('public', 'private'));
ALTER TABLE "Review"
  ADD CONSTRAINT "Review_rating_check" CHECK ("rating" BETWEEN 1 AND 5);
ALTER TABLE "SUBSTITUTES"
  ADD CONSTRAINT "SUBSTITUTES_confidence_score_check" CHECK ("confidence_score" BETWEEN 0 AND 1),
  ADD CONSTRAINT "SUBSTITUTES_not_self_check" CHECK ("original_ingredient_id" <> "substitute_ingredient_id");
ALTER TABLE "USES"
  ADD CONSTRAINT "USES_quantity_check" CHECK ("quantity" >= 0);
ALTER TABLE "SELECTS"
  ADD CONSTRAINT "SELECTS_preference_rank_check" CHECK ("preference_rank" >= 1);

-- ── Full-text search on recipes ────────────────────────────────────────────
-- Title matches (weight A) rank above description matches (weight B).
ALTER TABLE "Recipe" ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("description", '')), 'B')
  ) STORED;
CREATE INDEX "Recipe_search_vector_idx" ON "Recipe" USING GIN ("search_vector");

-- ── Rating aggregate view ──────────────────────────────────────────────────
CREATE VIEW "Recipe_Rating_Stats" AS
SELECT r."recipe_id",
       COUNT(rv."review_id")::int                  AS "review_count",
       COALESCE(AVG(rv."rating"), 0)::float8       AS "avg_rating"
FROM "Recipe" r
LEFT JOIN "Review" rv ON rv."recipe_id" = r."recipe_id"
GROUP BY r."recipe_id";

-- ── Taste signals maintained by triggers ───────────────────────────────────
-- Collapse existing rows to one per (user, signal_type) before adding the key.
DELETE FROM "User_Taste_Signal" a
USING "User_Taste_Signal" b
WHERE a."user_id" = b."user_id"
  AND a."signal_type" = b."signal_type"
  AND a."signal_id" < b."signal_id";
CREATE UNIQUE INDEX "User_Taste_Signal_user_id_signal_type_key"
  ON "User_Taste_Signal"("user_id", "signal_type");

-- Adds p_delta to the user's "cuisine_<name>" signal for the recipe's cuisine,
-- clamped to [0, 1]. Recipes without a cuisine produce no signal.
CREATE FUNCTION bump_taste_signal(p_user INT, p_recipe INT, p_delta DOUBLE PRECISION)
RETURNS void AS $$
DECLARE
  v_type TEXT;
BEGIN
  SELECT 'cuisine_' || lower(replace(c."cuisine_name", ' ', '_'))
    INTO v_type
  FROM "Recipe" r
  JOIN "Cuisine" c ON c."cuisine_id" = r."cuisine_id"
  WHERE r."recipe_id" = p_recipe;

  IF v_type IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO "User_Taste_Signal" ("user_id", "signal_type", "weight")
  VALUES (p_user, v_type, LEAST(GREATEST(p_delta, 0), 1))
  ON CONFLICT ("user_id", "signal_type") DO UPDATE
    SET "weight" = LEAST(GREATEST("User_Taste_Signal"."weight" + p_delta, 0), 1),
        "recorded_at" = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION taste_on_view() RETURNS trigger AS $$
BEGIN
  PERFORM bump_taste_signal(NEW."user_id", NEW."recipe_id", 0.02);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION taste_on_cook() RETURNS trigger AS $$
BEGIN
  PERFORM bump_taste_signal(NEW."user_id", NEW."recipe_id", 0.15);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION taste_on_save() RETURNS trigger AS $$
BEGIN
  PERFORM bump_taste_signal(
    (SELECT "user_id" FROM "Board" WHERE "board_id" = NEW."board_id"),
    NEW."recipe_id", 0.10);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- A 5-star review adds 0.10, a 1-star review subtracts 0.10; editing a review
-- applies only the difference.
CREATE FUNCTION taste_on_review() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM bump_taste_signal(NEW."user_id", NEW."recipe_id", (NEW."rating" - 3) * 0.05);
  ELSIF NEW."rating" <> OLD."rating" THEN
    PERFORM bump_taste_signal(NEW."user_id", NEW."recipe_id", (NEW."rating" - OLD."rating") * 0.05);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Recipe_View_Log_taste" AFTER INSERT ON "Recipe_View_Log"
  FOR EACH ROW EXECUTE FUNCTION taste_on_view();
CREATE TRIGGER "Cooking_Log_taste" AFTER INSERT ON "Cooking_Log"
  FOR EACH ROW EXECUTE FUNCTION taste_on_cook();
CREATE TRIGGER "SAVES_taste" AFTER INSERT ON "SAVES"
  FOR EACH ROW EXECUTE FUNCTION taste_on_save();
CREATE TRIGGER "Review_taste" AFTER INSERT OR UPDATE OF "rating" ON "Review"
  FOR EACH ROW EXECUTE FUNCTION taste_on_review();

COMMIT;
