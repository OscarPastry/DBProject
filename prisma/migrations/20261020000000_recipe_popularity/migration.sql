-- Materialized view behind the analytics page: one row per public recipe with
-- its engagement counts and a weighted popularity score. Precomputed because it
-- aggregates four log tables; refresh it with
--   REFRESH MATERIALIZED VIEW CONCURRENTLY "Recipe_Popularity";
-- (the analytics page has a button for this).

BEGIN;

CREATE MATERIALIZED VIEW "Recipe_Popularity" AS
SELECT r."recipe_id",
       r."title",
       r."cuisine_id",
       r."user_id",
       COALESCE(v.views, 0)            AS "views",
       COALESCE(c.cooks, 0)            AS "cooks",
       COALESCE(s.saves, 0)            AS "saves",
       COALESCE(rv.review_count, 0)    AS "review_count",
       COALESCE(rv.avg_rating, 0)      AS "avg_rating",
       -- a cook says more than a view; weights are a simple, documented choice
       (COALESCE(v.views, 0) * 1 + COALESCE(c.cooks, 0) * 5
        + COALESCE(s.saves, 0) * 3 + COALESCE(rv.review_count, 0) * 2)::int AS "popularity",
       CURRENT_TIMESTAMP               AS "refreshed_at"
FROM "Recipe" r
LEFT JOIN (SELECT "recipe_id", COUNT(*)::int AS views FROM "Recipe_View_Log" GROUP BY "recipe_id") v
       ON v."recipe_id" = r."recipe_id"
LEFT JOIN (SELECT "recipe_id", COUNT(*)::int AS cooks FROM "Cooking_Log" GROUP BY "recipe_id") c
       ON c."recipe_id" = r."recipe_id"
LEFT JOIN (SELECT "recipe_id", COUNT(*)::int AS saves FROM "SAVES" GROUP BY "recipe_id") s
       ON s."recipe_id" = r."recipe_id"
LEFT JOIN (SELECT "recipe_id", COUNT(*)::int AS review_count, AVG("rating")::float8 AS avg_rating
           FROM "Review" GROUP BY "recipe_id") rv
       ON rv."recipe_id" = r."recipe_id"
WHERE r."is_public";

-- A unique index is required for REFRESH ... CONCURRENTLY (readers aren't blocked)
CREATE UNIQUE INDEX "Recipe_Popularity_recipe_id_key" ON "Recipe_Popularity"("recipe_id");
CREATE INDEX "Recipe_Popularity_cuisine_id_idx" ON "Recipe_Popularity"("cuisine_id");

COMMIT;
