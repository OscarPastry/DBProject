-- The Review model was added to schema.prisma without a migration (databases
-- built with `prisma db push` already have it). Written to be idempotent so it
-- applies cleanly to both fresh and db-push databases.

CREATE TABLE IF NOT EXISTS "Review" (
    "review_id" SERIAL NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "recipe_id" INTEGER NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("review_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Review_user_id_recipe_id_key" ON "Review"("user_id", "recipe_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Review_user_id_fkey') THEN
    ALTER TABLE "Review" ADD CONSTRAINT "Review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Review_recipe_id_fkey') THEN
    ALTER TABLE "Review" ADD CONSTRAINT "Review_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "Recipe"("recipe_id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
