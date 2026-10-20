import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// Tests run against their own database (migrated by `npm test`), never the dev one.
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://flavorforge:password@localhost:5432/flavorforge_test'

if (!new URL(TEST_DATABASE_URL).pathname.includes('test')) {
  throw new Error(`Refusing to run tests against ${TEST_DATABASE_URL}: the database name must contain "test"`)
}

const pool = new Pool({ connectionString: TEST_DATABASE_URL })
export const db = new PrismaClient({ adapter: new PrismaPg(pool) })

export async function disconnect() {
  await db.$disconnect()
  await pool.end()
}

/** Empty every table and reset id sequences. */
export async function resetDb() {
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `
  const list = tables.map(t => `"${t.tablename}"`).join(', ')
  await db.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`)
}

// ── Fixture builders ─────────────────────────────────────────────────────────

let counter = 0
const uniq = (prefix: string) => `${prefix}_${++counter}`

export const makeUser = (username = uniq('user')) =>
  db.user.create({ data: { username, email: `${username}@test.dev`, password_hash: 'x' } })

export const makeCuisine = (cuisine_name: string) => db.cuisine.create({ data: { cuisine_name } })
export const makeDiet = (restriction_name: string) => db.dietary_Restriction.create({ data: { restriction_name } })
export const makeIngredient = (ingredient_name: string) => db.ingredient.create({ data: { ingredient_name } })

export async function makeRecipe(opts: {
  userId: number
  title?: string
  description?: string
  cuisineId?: number | null
  isPublic?: boolean
  dietIds?: number[]
  ingredientIds?: number[]
  createdAt?: Date
}) {
  return db.recipe.create({
    data: {
      title: opts.title ?? uniq('Recipe'),
      description: opts.description ?? 'A test recipe.',
      estimated_time: 20,
      difficulty_level: 'Easy',
      is_public: opts.isPublic ?? true,
      user_id: opts.userId,
      cuisine_id: opts.cuisineId ?? null,
      created_at: opts.createdAt,
      diets: opts.dietIds ? { create: opts.dietIds.map(restriction_id => ({ restriction_id })) } : undefined,
      ingredients: opts.ingredientIds
        ? { create: opts.ingredientIds.map(ingredient_id => ({ ingredient_id, quantity: 1, unit: 'cup' })) }
        : undefined,
    },
  })
}

export async function signal(userId: number, signalType: string) {
  const row = await db.user_Taste_Signal.findUnique({
    where: { user_id_signal_type: { user_id: userId, signal_type: signalType } },
  })
  return row?.weight ?? null
}
