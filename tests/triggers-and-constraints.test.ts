import { test, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import { db, resetDb, disconnect, makeUser, makeCuisine, makeIngredient, makeRecipe, signal } from './helpers'

beforeEach(resetDb)
after(disconnect)

async function setup() {
  const chef = await makeUser()
  const user = await makeUser()
  const cuisine = await makeCuisine('Middle Eastern')
  const recipe = await makeRecipe({ userId: chef.user_id, cuisineId: cuisine.cuisine_id })
  return { chef, user, recipe, type: 'cuisine_middle_eastern' }
}

const close = (actual: number | null, expected: number) =>
  assert.ok(actual !== null && Math.abs(actual - expected) < 1e-9, `expected ${expected}, got ${actual}`)

test('cooking a recipe adds 0.15 to the cuisine signal and clamps at 1', async () => {
  const { user, recipe, type } = await setup()
  await db.cooking_Log.create({ data: { user_id: user.user_id, recipe_id: recipe.recipe_id } })
  close(await signal(user.user_id, type), 0.15)

  for (let i = 0; i < 10; i++) {
    await db.cooking_Log.create({ data: { user_id: user.user_id, recipe_id: recipe.recipe_id } })
  }
  close(await signal(user.user_id, type), 1)
})

test('views add 0.02 and board saves add 0.10 to the board owner', async () => {
  const { user, recipe, type } = await setup()
  await db.recipe_View_Log.create({ data: { user_id: user.user_id, recipe_id: recipe.recipe_id } })
  close(await signal(user.user_id, type), 0.02)

  const board = await db.board.create({ data: { board_name: 'Later', user_id: user.user_id } })
  await db.sAVES.create({ data: { board_id: board.board_id, recipe_id: recipe.recipe_id } })
  close(await signal(user.user_id, type), 0.12)
})

test('reviews move the signal by rating, and editing applies only the difference (floored at 0)', async () => {
  const { user, recipe, type } = await setup()
  const review = await db.review.create({ data: { user_id: user.user_id, recipe_id: recipe.recipe_id, rating: 5 } })
  close(await signal(user.user_id, type), 0.10)

  await db.review.update({ where: { review_id: review.review_id }, data: { rating: 4 } })
  close(await signal(user.user_id, type), 0.05)

  await db.review.update({ where: { review_id: review.review_id }, data: { rating: 1 } })
  close(await signal(user.user_id, type), 0)
})

test('recipes without a cuisine produce no signal', async () => {
  const chef = await makeUser()
  const user = await makeUser()
  const recipe = await makeRecipe({ userId: chef.user_id })
  await db.cooking_Log.create({ data: { user_id: user.user_id, recipe_id: recipe.recipe_id } })
  assert.equal(await db.user_Taste_Signal.count({ where: { user_id: user.user_id } }), 0)
})

test('CHECK constraints reject out-of-range values', async () => {
  const chef = await makeUser()
  const recipe = await makeRecipe({ userId: chef.user_id })
  const egg = await makeIngredient('egg')

  await assert.rejects(db.review.create({ data: { user_id: chef.user_id, recipe_id: recipe.recipe_id, rating: 6 } }), /Review_rating_check/)
  await assert.rejects(db.review.create({ data: { user_id: chef.user_id, recipe_id: recipe.recipe_id, rating: 0 } }), /Review_rating_check/)
  await assert.rejects(
    db.recipe.update({ where: { recipe_id: recipe.recipe_id }, data: { difficulty_level: 'Expert' } }),
    /Recipe_difficulty_level_check/,
  )
  await assert.rejects(db.board.create({ data: { board_name: 'x', visibility: 'friends', user_id: chef.user_id } }), /Board_visibility_check/)
  await assert.rejects(
    db.sUBSTITUTES.create({ data: { original_ingredient_id: egg.ingredient_id, substitute_ingredient_id: egg.ingredient_id, confidence_score: 0.5 } }),
    /SUBSTITUTES_not_self_check/,
  )
  const flax = await makeIngredient('flax')
  await assert.rejects(
    db.sUBSTITUTES.create({ data: { original_ingredient_id: egg.ingredient_id, substitute_ingredient_id: flax.ingredient_id, confidence_score: 1.5 } }),
    /SUBSTITUTES_confidence_score_check/,
  )
})

test('Recipe_Rating_Stats averages reviews and reports 0 for unreviewed recipes', async () => {
  const chef = await makeUser()
  const [u1, u2] = [await makeUser(), await makeUser()]
  const reviewed = await makeRecipe({ userId: chef.user_id })
  const unreviewed = await makeRecipe({ userId: chef.user_id })
  await db.review.createMany({
    data: [{ user_id: u1.user_id, recipe_id: reviewed.recipe_id, rating: 5 },
           { user_id: u2.user_id, recipe_id: reviewed.recipe_id, rating: 2 }],
  })
  const rows = await db.$queryRaw<{ recipe_id: number; review_count: number; avg_rating: number }[]>`
    SELECT recipe_id, review_count, avg_rating FROM "Recipe_Rating_Stats" ORDER BY recipe_id`
  assert.deepEqual(rows, [
    { recipe_id: reviewed.recipe_id, review_count: 2, avg_rating: 3.5 },
    { recipe_id: unreviewed.recipe_id, review_count: 0, avg_rating: 0 },
  ])
})
