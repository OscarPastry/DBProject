import { test, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import { db, resetDb, disconnect, makeUser, makeCuisine, makeDiet, makeRecipe } from './helpers'
import { forYou, alsoCooked, topPerCuisine, cuisineShare, viewsTimeline, chefLeaderboard } from '../src/lib/queries'

beforeEach(resetDb)
after(disconnect)

const setSignal = (user_id: number, signal_type: string, weight: number) =>
  db.user_Taste_Signal.upsert({
    where: { user_id_signal_type: { user_id, signal_type } },
    update: { weight },
    create: { user_id, signal_type, weight },
  })

test('forYou ranks by taste signal and skips cooked, own and diet-violating recipes', async () => {
  const chef = await makeUser()
  const user = await makeUser()
  const [japanese, french] = await Promise.all(['Japanese', 'French'].map(makeCuisine))
  const vegan = await makeDiet('Vegan')
  await db.fOLLOWS.create({ data: { user_id: user.user_id, restriction_id: vegan.restriction_id } })

  const jp = await makeRecipe({ userId: chef.user_id, cuisineId: japanese.cuisine_id, dietIds: [vegan.restriction_id] })
  const fr = await makeRecipe({ userId: chef.user_id, cuisineId: french.cuisine_id, dietIds: [vegan.restriction_id] })
  const cooked = await makeRecipe({ userId: chef.user_id, cuisineId: japanese.cuisine_id, dietIds: [vegan.restriction_id] })
  await makeRecipe({ userId: chef.user_id, cuisineId: japanese.cuisine_id })                                    // not vegan
  await makeRecipe({ userId: user.user_id, cuisineId: japanese.cuisine_id, dietIds: [vegan.restriction_id] })  // their own

  await db.cooking_Log.create({ data: { user_id: user.user_id, recipe_id: cooked.recipe_id } }) // trigger adds 0.15
  await setSignal(user.user_id, 'cuisine_japanese', 0.9)
  await setSignal(user.user_id, 'cuisine_french', 0.4)

  const picks = await forYou(db, user.user_id)
  assert.deepEqual(picks.map(p => [p.recipe_id, p.cuisine_name]), [
    [jp.recipe_id, 'Japanese'],
    [fr.recipe_id, 'French'],
  ])
})

test('forYou caps picks per cuisine so one strong signal cannot fill the row', async () => {
  const chef = await makeUser()
  const user = await makeUser()
  const italian = await makeCuisine('Italian')
  for (let i = 0; i < 5; i++) await makeRecipe({ userId: chef.user_id, cuisineId: italian.cuisine_id })
  await setSignal(user.user_id, 'cuisine_italian', 1)

  assert.equal((await forYou(db, user.user_id, 6, 2)).length, 2)
})

test('alsoCooked counts users shared with this recipe and excludes the recipe itself', async () => {
  const chef = await makeUser()
  const [base, popular, niche, hidden] = await Promise.all([
    makeRecipe({ userId: chef.user_id }), makeRecipe({ userId: chef.user_id }),
    makeRecipe({ userId: chef.user_id }), makeRecipe({ userId: chef.user_id, isPublic: false }),
  ])
  const users = await Promise.all([makeUser(), makeUser(), makeUser()])
  const cook = (u: number, r: number) => db.cooking_Log.create({ data: { user_id: u, recipe_id: r } })
  for (const u of users) await cook(u.user_id, base.recipe_id)
  await cook(users[0].user_id, popular.recipe_id)
  await cook(users[0].user_id, popular.recipe_id) // same user twice still counts once
  await cook(users[1].user_id, popular.recipe_id)
  await cook(users[2].user_id, niche.recipe_id)
  await cook(users[2].user_id, hidden.recipe_id)

  assert.deepEqual(await alsoCooked(db, base.recipe_id), [
    { recipe_id: popular.recipe_id, shared_cooks: 2 },
    { recipe_id: niche.recipe_id, shared_cooks: 1 },
  ])
})

test('analytics read the refreshed materialized view: popularity, per-cuisine RANK, shares', async () => {
  const chef = await makeUser()
  const fan = await makeUser()
  const [indian, mexican] = await Promise.all(['Indian', 'Mexican'].map(makeCuisine))
  const curry = await makeRecipe({ userId: chef.user_id, title: 'Curry', cuisineId: indian.cuisine_id })
  const dal = await makeRecipe({ userId: chef.user_id, title: 'Dal', cuisineId: indian.cuisine_id })
  const taco = await makeRecipe({ userId: chef.user_id, title: 'Taco', cuisineId: mexican.cuisine_id })

  // curry: 2 views + 1 cook + 1 save + 1 review = 2 + 5 + 3 + 2 = 12
  await db.recipe_View_Log.createMany({ data: [{ user_id: fan.user_id, recipe_id: curry.recipe_id }, { user_id: fan.user_id, recipe_id: curry.recipe_id }] })
  await db.cooking_Log.create({ data: { user_id: fan.user_id, recipe_id: curry.recipe_id } })
  const board = await db.board.create({ data: { board_name: 'b', user_id: fan.user_id } })
  await db.sAVES.create({ data: { board_id: board.board_id, recipe_id: curry.recipe_id } })
  await db.review.create({ data: { user_id: fan.user_id, recipe_id: curry.recipe_id, rating: 4 } })
  await db.$executeRaw`REFRESH MATERIALIZED VIEW "Recipe_Popularity"`

  const top = await topPerCuisine(db, 3)
  assert.deepEqual(top.map(r => [r.cuisine_name, r.rank, r.title, r.popularity]), [
    ['Indian', 1, 'Curry', 12],
    ['Indian', 2, 'Dal', 0],
    ['Mexican', 1, 'Taco', 0],
  ])

  const share = await cuisineShare(db)
  assert.deepEqual(share.map(s => [s.cuisine_name, s.recipes, s.share, s.cumulative_share]), [
    ['Indian', 2, 66.7, 66.7],
    ['Mexican', 1, 33.3, 100],
  ])

  const [leader] = await chefLeaderboard(db)
  assert.deepEqual([leader.username, leader.recipes, leader.popularity, leader.rank], [chef.username, 3, 12, 1])
  assert.ok(dal && taco)
})

test('viewsTimeline zero-fills every day and keeps a running total', async () => {
  const chef = await makeUser()
  const recipe = await makeRecipe({ userId: chef.user_id })
  const daysAgo = (n: number) => new Date(Date.now() - n * 864e5)
  await db.recipe_View_Log.createMany({
    data: [daysAgo(0), daysAgo(0), daysAgo(2)].map(viewed_at => ({ user_id: chef.user_id, recipe_id: recipe.recipe_id, viewed_at })),
  })

  const rows = await viewsTimeline(db, 7)
  assert.equal(rows.length, 7)
  assert.deepEqual(rows.map(r => r.views), [0, 0, 0, 0, 1, 0, 2])
  assert.deepEqual(rows.map(r => r.running_total), [0, 0, 0, 0, 1, 1, 3])
  assert.equal(rows.at(-1)!.avg_7d, 0.43)
})
