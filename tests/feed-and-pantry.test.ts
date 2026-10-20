import { test, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import { db, resetDb, disconnect, makeUser, makeCuisine, makeDiet, makeIngredient, makeRecipe } from './helpers'
import { feedPage, pantryMatches } from '../src/lib/queries'

beforeEach(resetDb)
after(disconnect)

const feed = (userId: number, extra: Partial<Parameters<typeof feedPage>[1]> = {}) =>
  feedPage(db, { userId, page: 1, pageSize: 50, ...extra })

test('feed keeps only recipes that fit every diet the user follows (relational division)', async () => {
  const chef = await makeUser()
  const vegan = await makeDiet('Vegan')
  const gf = await makeDiet('Gluten-Free')
  const both = await makeRecipe({ userId: chef.user_id, dietIds: [vegan.restriction_id, gf.restriction_id] })
  const veganOnly = await makeRecipe({ userId: chef.user_id, dietIds: [vegan.restriction_id] })
  const none = await makeRecipe({ userId: chef.user_id })

  const strict = await makeUser()
  await db.fOLLOWS.createMany({
    data: [{ user_id: strict.user_id, restriction_id: vegan.restriction_id },
           { user_id: strict.user_id, restriction_id: gf.restriction_id }],
  })
  const relaxed = await makeUser()

  assert.deepEqual((await feed(strict.user_id)).ids, [both.recipe_id])
  assert.deepEqual(
    new Set((await feed(relaxed.user_id)).ids),
    new Set([both.recipe_id, veganOnly.recipe_id, none.recipe_id]),
  )
})

test('feed hides private recipes', async () => {
  const chef = await makeUser()
  const visible = await makeRecipe({ userId: chef.user_id })
  await makeRecipe({ userId: chef.user_id, isPublic: false })
  const { ids, total } = await feed(chef.user_id)
  assert.deepEqual(ids, [visible.recipe_id])
  assert.equal(total, 1)
})

test('feed ranks preferred cuisines by preference rank, then newest', async () => {
  const chef = await makeUser()
  const [mexican, indian, italian] = await Promise.all(['Mexican', 'Indian', 'Italian'].map(makeCuisine))
  const day = (n: number) => new Date(Date.UTC(2026, 0, n))
  const mex = await makeRecipe({ userId: chef.user_id, cuisineId: mexican.cuisine_id, createdAt: day(1) })
  const ind = await makeRecipe({ userId: chef.user_id, cuisineId: indian.cuisine_id, createdAt: day(2) })
  const ita = await makeRecipe({ userId: chef.user_id, cuisineId: italian.cuisine_id, createdAt: day(3) })

  const user = await makeUser()
  const ob = await db.user_Onboarding.create({ data: { user_id: user.user_id, onboarding_version: 'test' } })
  await db.sELECTS.createMany({
    data: [{ onboarding_id: ob.onboarding_id, cuisine_id: mexican.cuisine_id, preference_rank: 1 },
           { onboarding_id: ob.onboarding_id, cuisine_id: indian.cuisine_id, preference_rank: 2 }],
  })

  assert.deepEqual((await feed(user.user_id)).ids, [mex.recipe_id, ind.recipe_id, ita.recipe_id])
  // without preferences it is simply newest first
  assert.deepEqual((await feed(chef.user_id)).ids, [ita.recipe_id, ind.recipe_id, mex.recipe_id])
})

test('full-text search ranks a title match above a description match and supports partial words', async () => {
  const chef = await makeUser()
  const inTitle = await makeRecipe({ userId: chef.user_id, title: 'Green Curry', description: 'Weeknight dinner.' })
  const inBody = await makeRecipe({ userId: chef.user_id, title: 'Rice Bowl', description: 'Goes well with any curry.' })
  await makeRecipe({ userId: chef.user_id, title: 'Pancakes', description: 'Sweet breakfast.' })

  assert.deepEqual((await feed(chef.user_id, { search: 'curry' })).ids, [inTitle.recipe_id, inBody.recipe_id])
  // "curr" isn't a full word, so it falls back to the title ILIKE match
  assert.deepEqual((await feed(chef.user_id, { search: 'curr' })).ids, [inTitle.recipe_id])
})

test('feed pages are disjoint and report the full total', async () => {
  const chef = await makeUser()
  for (let i = 0; i < 5; i++) await makeRecipe({ userId: chef.user_id })
  const p1 = await feed(chef.user_id, { pageSize: 2, page: 1 })
  const p2 = await feed(chef.user_id, { pageSize: 2, page: 2 })
  const p3 = await feed(chef.user_id, { pageSize: 2, page: 3 })
  assert.equal(p1.total, 5)
  assert.deepEqual([p1.ids.length, p2.ids.length, p3.ids.length], [2, 2, 1])
  assert.equal(new Set([...p1.ids, ...p2.ids, ...p3.ids]).size, 5)
})

test('pantry match orders by coverage and skips recipes with no match or that are private', async () => {
  const chef = await makeUser()
  const [a, b, c, d] = await Promise.all(['a', 'b', 'c', 'd'].map(makeIngredient))
  const twoOfThree = await makeRecipe({ userId: chef.user_id, ingredientIds: [a.ingredient_id, b.ingredient_id, d.ingredient_id] })
  const oneOfTwo = await makeRecipe({ userId: chef.user_id, ingredientIds: [a.ingredient_id, c.ingredient_id] })
  const oneOfThree = await makeRecipe({ userId: chef.user_id, ingredientIds: [b.ingredient_id, c.ingredient_id, d.ingredient_id] })
  await makeRecipe({ userId: chef.user_id, ingredientIds: [c.ingredient_id] })
  await makeRecipe({ userId: chef.user_id, ingredientIds: [a.ingredient_id], isPublic: false })

  const rows = await pantryMatches(db, [a.ingredient_id, b.ingredient_id], 10)
  assert.deepEqual(rows.map(r => [r.recipe_id, r.matched, r.total]), [
    [twoOfThree.recipe_id, 2, 3],
    [oneOfTwo.recipe_id, 1, 2],
    [oneOfThree.recipe_id, 1, 3],
  ])
})
