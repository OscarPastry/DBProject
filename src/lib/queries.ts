import { Prisma, type PrismaClient } from '@prisma/client'

// The hand-written SQL behind the feed, pantry, recommendations and analytics.
// Kept here (taking the client as a parameter) so pages and tests run the same queries.
type Db = Pick<PrismaClient, '$queryRaw'>

// A recipe "fits" a user when there is no diet the user follows that the recipe
// is not tagged with — relational division (FOLLOWS ÷ FITS_DIET) as a double NOT EXISTS.
const fitsAllDiets = (userId: number) => Prisma.sql`
  NOT EXISTS (
    SELECT 1 FROM "FOLLOWS" fo
    WHERE fo.user_id = ${userId}
      AND NOT EXISTS (
        SELECT 1 FROM "FITS_DIET" fd
        WHERE fd.recipe_id = r.recipe_id AND fd.restriction_id = fo.restriction_id))`

// ── Feed ─────────────────────────────────────────────────────────────────────

export type FeedFilters = {
  userId: number
  difficulty?: string | null
  cuisineId?: number | null
  moodId?: number | null
  search?: string | null
  page: number
  pageSize: number
}

/**
 * One page of the feed: public recipes matching the filters that fit every diet
 * the user follows. Preferred cuisines rank first (rank 1 → 100, rank 2 → 80, …),
 * then search relevance, then newest. Returns ids in order plus the total match count.
 */
export async function feedPage(db: Db, f: FeedFilters) {
  const difficulty = f.difficulty ?? null
  const cuisineId = f.cuisineId ?? null
  const moodId = f.moodId ?? null
  const search = f.search?.trim() || null

  const rows = await db.$queryRaw<{ recipe_id: number; total: bigint }[]>(Prisma.sql`
    SELECT r.recipe_id, COUNT(*) OVER () AS total
    FROM "Recipe" r
    LEFT JOIN "User_Onboarding" uo ON uo.user_id = ${f.userId}
    LEFT JOIN "SELECTS" sel ON sel.onboarding_id = uo.onboarding_id AND sel.cuisine_id = r.cuisine_id
    WHERE r.is_public
      AND (${difficulty}::text IS NULL OR r.difficulty_level = ${difficulty}::text)
      AND (${cuisineId}::int IS NULL OR r.cuisine_id = ${cuisineId}::int)
      AND (${moodId}::int IS NULL OR EXISTS (
            SELECT 1 FROM "FITS" fi WHERE fi.recipe_id = r.recipe_id AND fi.mood_id = ${moodId}::int))
      AND (${search}::text IS NULL
            OR r.search_vector @@ websearch_to_tsquery('english', ${search}::text)
            OR r.title ILIKE '%' || ${search}::text || '%')
      AND ${fitsAllDiets(f.userId)}
    ORDER BY COALESCE(100 - 20 * (sel.preference_rank - 1), 0) DESC,
             CASE WHEN ${search}::text IS NULL THEN 0
                  ELSE ts_rank(r.search_vector, websearch_to_tsquery('english', ${search}::text)) END DESC,
             r.created_at DESC,
             r.recipe_id
    LIMIT ${f.pageSize} OFFSET ${(f.page - 1) * f.pageSize}
  `)

  return {
    ids: rows.map(r => r.recipe_id),
    total: rows.length > 0 ? Number(rows[0].total) : 0,
  }
}

export async function ratingStats(db: Db, recipeIds: number[]) {
  if (recipeIds.length === 0) return []
  return db.$queryRaw<{ recipe_id: number; review_count: number; avg_rating: number }[]>(Prisma.sql`
    SELECT recipe_id, review_count, avg_rating
    FROM "Recipe_Rating_Stats" WHERE recipe_id = ANY(${recipeIds}::int[])
  `)
}

// ── Pantry ───────────────────────────────────────────────────────────────────

/**
 * Public recipes that use at least one pantry ingredient, best coverage first:
 * total = all the recipe's ingredients, matched = the ones in the pantry.
 */
export async function pantryMatches(db: Db, ingredientIds: number[], limit: number) {
  if (ingredientIds.length === 0) return []
  return db.$queryRaw<{ recipe_id: number; total: number; matched: number }[]>(Prisma.sql`
    SELECT u.recipe_id,
           COUNT(*)::int                                                                AS total,
           COUNT(*) FILTER (WHERE u.ingredient_id = ANY(${ingredientIds}::int[]))::int AS matched
    FROM "USES" u
    JOIN "Recipe" r ON r.recipe_id = u.recipe_id
    WHERE r.is_public
    GROUP BY u.recipe_id
    HAVING COUNT(*) FILTER (WHERE u.ingredient_id = ANY(${ingredientIds}::int[])) > 0
    ORDER BY COUNT(*) FILTER (WHERE u.ingredient_id = ANY(${ingredientIds}::int[]))::float / COUNT(*) DESC,
             matched DESC,
             u.recipe_id
    LIMIT ${limit}
  `)
}

// ── Recommendations ──────────────────────────────────────────────────────────

/**
 * "For you": public recipes from cuisines the user has a taste signal for,
 * scored by signal weight plus a small rating bonus. Skips the user's own recipes
 * and ones they already cooked, respects their diets, and keeps at most
 * `perCuisine` per cuisine (ROW_NUMBER window) so one strong signal can't fill the row.
 */
export async function forYou(db: Db, userId: number, limit = 6, perCuisine = 2) {
  return db.$queryRaw<{ recipe_id: number; cuisine_name: string; score: number }[]>(Prisma.sql`
    WITH scored AS (
      SELECT r.recipe_id, c.cuisine_name,
             ts.weight + COALESCE(rs.avg_rating, 0) / 10 AS score,
             ROW_NUMBER() OVER (
               PARTITION BY r.cuisine_id
               ORDER BY ts.weight + COALESCE(rs.avg_rating, 0) / 10 DESC, r.recipe_id
             ) AS rank_in_cuisine
      FROM "Recipe" r
      JOIN "Cuisine" c ON c.cuisine_id = r.cuisine_id
      JOIN "User_Taste_Signal" ts
        ON ts.user_id = ${userId}
       AND ts.signal_type = 'cuisine_' || lower(replace(c.cuisine_name, ' ', '_'))
       AND ts.weight > 0
      LEFT JOIN "Recipe_Rating_Stats" rs ON rs.recipe_id = r.recipe_id
      WHERE r.is_public
        AND r.user_id <> ${userId}
        AND NOT EXISTS (SELECT 1 FROM "Cooking_Log" cl WHERE cl.user_id = ${userId} AND cl.recipe_id = r.recipe_id)
        AND ${fitsAllDiets(userId)}
    )
    SELECT recipe_id, cuisine_name, score::float8 AS score
    FROM scored
    WHERE rank_in_cuisine <= ${perCuisine}
    ORDER BY score DESC, recipe_id
    LIMIT ${limit}
  `)
}

/**
 * "People who cooked this also cooked": other public recipes cooked by users who
 * cooked this one, ranked by how many such users they share (a self-join on Cooking_Log).
 */
export async function alsoCooked(db: Db, recipeId: number, limit = 4) {
  return db.$queryRaw<{ recipe_id: number; shared_cooks: number }[]>(Prisma.sql`
    SELECT other.recipe_id, COUNT(DISTINCT other.user_id)::int AS shared_cooks
    FROM "Cooking_Log" base
    JOIN "Cooking_Log" other
      ON other.user_id = base.user_id AND other.recipe_id <> base.recipe_id
    JOIN "Recipe" r ON r.recipe_id = other.recipe_id AND r.is_public
    WHERE base.recipe_id = ${recipeId}
    GROUP BY other.recipe_id
    ORDER BY shared_cooks DESC, other.recipe_id
    LIMIT ${limit}
  `)
}

// ── Analytics (reads the Recipe_Popularity materialized view) ────────────────

/** Top `n` recipes in each cuisine by popularity, using RANK() per cuisine. */
export async function topPerCuisine(db: Db, n = 3) {
  return db.$queryRaw<{
    cuisine_name: string; rank: number; recipe_id: number; title: string
    popularity: number; views: number; cooks: number; avg_rating: number
  }[]>(Prisma.sql`
    SELECT cuisine_name, rank, recipe_id, title, popularity, views, cooks, avg_rating
    FROM (
      SELECT c.cuisine_name, p.recipe_id, p.title, p.popularity, p.views, p.cooks, p.avg_rating,
             RANK() OVER (PARTITION BY p.cuisine_id ORDER BY p.popularity DESC)::int AS rank
      FROM "Recipe_Popularity" p
      JOIN "Cuisine" c ON c.cuisine_id = p.cuisine_id
    ) ranked
    WHERE rank <= ${n}
    ORDER BY cuisine_name, rank, recipe_id
  `)
}

/**
 * Daily recipe views for the last `days` days (zero-filled with generate_series),
 * with a 7-day moving average and a running total — both window functions.
 */
export async function viewsTimeline(db: Db, days = 90) {
  return db.$queryRaw<{ day: string; views: number; avg_7d: number; running_total: number }[]>(Prisma.sql`
    WITH days AS (
      SELECT generate_series(CURRENT_DATE - (${days}::int - 1), CURRENT_DATE, interval '1 day')::date AS day
    ),
    daily AS (
      SELECT d.day, COUNT(v.view_id)::int AS views
      FROM days d
      LEFT JOIN "Recipe_View_Log" v ON v.viewed_at::date = d.day
      GROUP BY d.day
    )
    SELECT to_char(day, 'YYYY-MM-DD') AS day,
           views,
           ROUND(AVG(views) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2)::float8 AS avg_7d,
           SUM(views) OVER (ORDER BY day)::int AS running_total
    FROM daily
    ORDER BY day
  `)
}

/** Chef leaderboard: total popularity of each chef's recipes, DENSE_RANK and quartile (NTILE). */
export async function chefLeaderboard(db: Db, limit = 10) {
  return db.$queryRaw<{
    username: string; display_name: string | null; recipes: number
    popularity: number; rank: number; quartile: number
  }[]>(Prisma.sql`
    SELECT u.username, pr.display_name, x.recipes, x.popularity, x.rank, x.quartile
    FROM (
      SELECT p.user_id,
             COUNT(*)::int        AS recipes,
             SUM(p.popularity)::int AS popularity,
             DENSE_RANK() OVER (ORDER BY SUM(p.popularity) DESC)::int AS rank,
             NTILE(4) OVER (ORDER BY SUM(p.popularity) DESC)::int     AS quartile
      FROM "Recipe_Popularity" p
      GROUP BY p.user_id
    ) x
    JOIN "User" u ON u.user_id = x.user_id
    LEFT JOIN "User_Profile" pr ON pr.user_id = x.user_id
    ORDER BY x.rank, u.username
    LIMIT ${limit}
  `)
}

/** Share of public recipes per cuisine, plus the cumulative share (a Pareto curve). */
export async function cuisineShare(db: Db) {
  return db.$queryRaw<{ cuisine_name: string; recipes: number; share: number; cumulative_share: number }[]>(Prisma.sql`
    SELECT c.cuisine_name,
           COUNT(*)::int AS recipes,
           ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1)::float8 AS share,
           ROUND(SUM(COUNT(*)) OVER (ORDER BY COUNT(*) DESC, c.cuisine_name) * 100.0
                 / SUM(COUNT(*)) OVER (), 1)::float8 AS cumulative_share
    FROM "Recipe_Popularity" p
    JOIN "Cuisine" c ON c.cuisine_id = p.cuisine_id
    GROUP BY c.cuisine_name
    ORDER BY recipes DESC, c.cuisine_name
  `)
}

export async function popularityRefreshedAt(db: Db) {
  const rows = await db.$queryRaw<{ refreshed_at: Date | null }[]>(Prisma.sql`
    SELECT MAX(refreshed_at) AS refreshed_at FROM "Recipe_Popularity"
  `)
  return rows[0]?.refreshed_at ?? null
}
