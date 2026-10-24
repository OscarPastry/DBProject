
import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import customSteps from './recipe_steps_patch'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding FlavorForge database (CSV-augmented)...')

  // ── Clear existing data (order matters due to FKs) ──────────────────────────
  await prisma.review.deleteMany()
  await prisma.cooking_Log.deleteMany()
  await prisma.recipe_View_Log.deleteMany()
  await prisma.sAVES.deleteMany()
  await prisma.fITS.deleteMany()
  await prisma.uSES.deleteMany()
  await prisma.sUBSTITUTES.deleteMany()
  await prisma.recipe_Step.deleteMany()
  await prisma.recipe_Image.deleteMany()
  await prisma.fITS_DIET.deleteMany()
  await prisma.recipe.deleteMany()
  await prisma.board.deleteMany()
  await prisma.fOLLOWS.deleteMany()
  await prisma.sELECTS.deleteMany()
  await prisma.user_Taste_Signal.deleteMany()
  await prisma.user_Onboarding.deleteMany()
  await prisma.user_Profile.deleteMany()
  await prisma.user.deleteMany()
  await prisma.ingredient.deleteMany()
  await prisma.dietary_Restriction.deleteMany()
  await prisma.cuisine.deleteMany()
  await prisma.mood.deleteMany()
  console.log('✓ Cleared existing data')

  // ── Cuisines (9 total) ──────────────────────────────────────────────────────
  const cuisineNames = [
    'Italian', 'Indian', 'Japanese', 'Mexican', 'French',
    'American', 'African', 'Middle Eastern', 'Spanish'
  ]
  const cuisineMap: Record<string, { cuisine_id: number }> = {}
  for (const name of cuisineNames) {
    const c = await prisma.cuisine.create({ data: { cuisine_name: name } })
    cuisineMap[name] = c
  }
  console.log(`✓ Created ${cuisineNames.length} cuisines`)

  // ── Dietary Restrictions (10 total) ─────────────────────────────────────────
  const dietNames = [
    'Vegan', 'Gluten-Free', 'Keto', 'Vegetarian', 'Dairy-Free',
    'Nut-Free', 'Halal', 'Low-Carb', 'Low-Fat', 'Low-Sodium'
  ]
  const dietMap: Record<string, { restriction_id: number }> = {}
  for (const name of dietNames) {
    const d = await prisma.dietary_Restriction.create({ data: { restriction_name: name } })
    dietMap[name] = d
  }
  console.log(`✓ Created ${dietNames.length} dietary restrictions`)

  // ── Moods (6 total) ─────────────────────────────────────────────────────────
  const moodNames = ['Comfort', 'Adventurous', 'Quick', 'Healthy', 'Festive', 'Light']
  const moodMap: Record<string, { mood_id: number }> = {}
  for (const name of moodNames) {
    const m = await prisma.mood.create({ data: { mood_name: name } })
    moodMap[name] = m
  }
  console.log(`✓ Created ${moodNames.length} moods`)


  // ── Ingredients (from CSV data) ─────────────────────────────────────────────
  const ingredientNames = [
    'Active Yeast',
    'All - Bran Cereal',
    'All - Purpose Flour',
    'Almond Meal',
    'Almonds',
    'Anchovy Fillets',
    'Apple',
    'Apple Cider',
    'Apple Cider Vinegar',
    'Apple Juice',
    'Applesauce',
    'Apricot Halves Juice Sugar',
    'Aromatic Bitters',
    'Artichokes',
    'Arugula Leaves',
    'Asiago Cheese Shredded',
    'Asparagus',
    'Avocado',
    'Baby Portabella Mushrooms',
    'Baby Shrimp',
    'Baby Spinach Leaves',
    'Bacon',
    'Bacon Fat',
    'Bacon Slices',
    'Baguette Italian Roll',
    'Baking Chocolate',
    'Baking Powder',
    'Baking Soda',
    'Balsamic Vinegar',
    'Banana',
    'Barbecue Sauce',
    'Basil',
    'Beaten Eggs',
    'Beef',
    'Beef Broth',
    'Beef Stew Seasoning',
    'Beef Tenderloin',
    'Beer',
    'Bell Pepper',
    'Bell Pepper Yellow Orange',
    'Bell Peppers',
    'Besan Flour Chick Pea Flour',
    'Big Potatoes',
    'Bittersweet Chocolate',
    'Black - Eyed Peas',
    'Black Beans',
    'Black Olives',
    'Black Pepper',
    'Boiled Water',
    'Boiling Coffee',
    'Boiling Water',
    'Bone Skin Chicken Thighs',
    'Boneless Beef Chuck',
    'Boneless Chicken Breasts',
    'Boneless Skin Chicken',
    'Boneless Skinless Chicken Breast',
    'Boneless Skinless Chicken Breasts',
    'Boneless Skinned Chicken Breasts',
    'Brandy Water',
    'Breadcrumbs',
    'Breadcrumbs Chicken',
    'Broccoli Chopped',
    'Broccoli Floret',
    'Broccoli Florets',
    'Broth',
    'Brown Lentils',
    'Brown Mustard Seeds',
    'Brown Rice',
    'Brown Sugar',
    'Butter',
    'Butter Beans',
    'Butter Flavor Crisco',
    'Butter Margarine',
    'Buttermilk',
    'Cabbage',
    'Cabbage Chopped',
    'Cajun Seasoning',
    'Cake',
    'Can Crabmeat Shells',
    'Can Tomatoes',
    'Cane Sugar',
    'Canned Chick - Peas',
    'Canned Peas',
    'Canned Tomatoes',
    'Canola Oil',
    'Cans Peas Small Sweet Peas',
    'Capers',
    'Caramel Ice Cream',
    'Caraway',
    'Caraway Seed',
    'Cardamom',
    'Carrot',
    'Carrots',
    'Cashews',
    'Catfish Nuggets',
    'Cauliflower',
    'Cayenne',
    'Cayenne Pepper',
    'Celery',
    'Celery Minced',
    'Celery Salt',
    'Cellophane Noodles Asian',
    'Cheddar Cheese',
    'Cheddar Cheese Shredded',
    'Cherries',
    'Cherry Pie Filling',
    'Cherry Tomatoes',
    'Chicken Bouillon Granules',
    'Chicken Broth',
    'Chicken Stock',
    'Chicken Thigh',
    'Chicken Thighs Chicken Breasts',
    'Chickpeas',
    'Chili - Garlic Sauce',
    'Chili Beans Chili Gravy',
    'Chili Paste Soya Oil',
    'Chili Powder',
    'Chinese Barbecued Duck Deboned Fat',
    'Chives',
    'Chocolate Chips',
    'Chopped Apple',
    'Chopped Fresh Basil',
    'Chopped Fresh Coriander',
    'Chopped Fresh Dill',
    'Chopped Fresh Flat - Leaf Parsley',
    'Chopped Fresh Gingerroot Juice',
    'Chopped Fresh Parsley',
    'Chopped Fresh Rosemary Leaf',
    'Chopped Fresh Thyme',
    'Chopped Garlic',
    'Chopped Green Bell Pepper',
    'Chopped Green Chilies',
    'Chopped Green Onion',
    'Chopped Green Pepper',
    'Chopped Nuts',
    'Chopped Onion',
    'Chopped Pecans',
    'Chopped Red Bell Pepper',
    'Chopped Salted Peanuts',
    'Chopped Tomatoes',
    'Chopped Walnuts',
    'Chopped Walnuts Chopped Pecans',
    'Chunky Salsa',
    'Cider Vinegar',
    'Cilantro Chopped',
    'Cilantro Leaves',
    'Cinnamon',
    'Cinnamon Sticks',
    'Clam Juice',
    'Cloves',
    'Cloves Garlic',
    'Cloves Garlic Chopped',
    'Coarse Ground Black Pepper',
    'Cocoa',
    'Cocoa Powder',
    'Cold Milk',
    'Condensed Beef Broth',
    'Condensed Milk',
    'Cooked Corned Beef Chopped',
    'Cooked Ham',
    'Cooked Penne Pasta',
    'Cooking Spray',
    'Coriander',
    'Coriander Seeds',
    'Corn',
    'Corn Tortillas',
    'Cornmeal',
    'Cornstarch',
    'Cornstarch Cold Water',
    'Crackers',
    'Cranberries',
    'Cranberries Chopped Craisins',
    'Cream',
    'Cream Cheese',
    'Cream Mushroom Soup',
    'Creamy Butter',
    'Creamy Peanut Butter',
    'Cremini Mushrooms White Mushrooms',
    'Crushed Cracker Crumb',
    'Crushed Dried Oregano',
    'Crushed Pineapple',
    'Crushed Red Pepper',
    'Crushed Red Pepper Flakes',
    'Cubed Seedless Watermelon',
    'Cucumber',
    'Cumin',
    'Cumin Powder',
    'Cumin Seed',
    'Cumin Seeds',
    'Curry Paste',
    'Curry Powder',
    'Dark Sesame Oil',
    'Date Sugar Date Sugar',
    'Dates Chopped',
    'Deli Mustard',
    'Diced Carrot',
    'Diced Celery',
    'Diced Jalapeno Pepper',
    'Diced Onion',
    'Diced Tomatoes',
    'Dijon Mustard',
    'Double Cream',
    'Dried Apricot',
    'Dried Fenugreek Leaves Kasuri Methi',
    'Dried Figs Dates',
    'Dried Oregano',
    'Dry Bread',
    'Dry Bread Crumbs',
    'Dry Mustard',
    'Dry Vegetable Soup',
    'Dry White Wine Red Wine',
    'Edam Cheese',
    'Egg',
    'Egg Noodles',
    'Egg Whites',
    'Eggplant',
    'Eggs',
    'Evaporated Milk',
    'Fat',
    'Fat - Free Cheddar Cheese',
    'Fat - Free Yogurt',
    'Fat Strawberry Yogurt',
    'Fennel Seed',
    'Fennel Seeds',
    'Firm Tofu',
    'Fish Sauce',
    'Flaky Refrigerated Biscuits',
    'Flat Bread Pita Bread',
    'Flat Leaf Parsley',
    'Flavored Olive Oil',
    'Flax Seed',
    'Flour',
    'Frank S Red Hot Sauce',
    'French Onion Soup',
    'Fresh Asparagus Spear',
    'Fresh Basil',
    'Fresh Basil Chopped',
    'Fresh Basil Leaves Chopped',
    'Fresh Blueberries',
    'Fresh Cilantro Chopped',
    'Fresh Coarse Ground Black Pepper',
    'Fresh Coconut',
    'Fresh Coriander Chopped',
    'Fresh Cranberries',
    'Fresh Cream',
    'Fresh Dill Chopped',
    'Fresh Dill Weed Chopped',
    'Fresh Flat - Leaf Parsley',
    'Fresh Flat Leaf Parsley',
    'Fresh Garlic Minced',
    'Fresh Ginger Root',
    'Fresh Ground',
    'Fresh Ground Black Pepper',
    'Fresh Italian Parsley',
    'Fresh Jalapeno Pepper',
    'Fresh Lemon Juice',
    'Fresh Minced Garlic',
    'Fresh Mint Chopped',
    'Fresh Mint Julienne',
    'Fresh Mushrooms',
    'Fresh Oregano Leaves',
    'Fresh Parsley',
    'Fresh Parsley Chopped',
    'Fresh Parsley Minced',
    'Fresh Parsley Sprigs',
    'Fresh Pita Bread',
    'Fresh Rosemary Chopped',
    'Fresh Rosemary Leaf',
    'Fresh Sage Leaf',
    'Fresh Squeezed Lemon Juice',
    'Fresh Strawberries',
    'Fresh Strawberries Chopped',
    'Fresh Thyme Chopped',
    'Fresh Thyme Leave',
    'Frozen Asian Style Vegetables',
    'Frozen Bananas',
    'Frozen Boneless Chicken Breasts',
    'Frozen Broad Bean',
    'Frozen Cheese Pizzas Crust',
    'Frozen Chopped Spinach',
    'Frozen Corn Kernels',
    'Frozen Hash Brown Potatoes',
    'Frozen Mixed Vegetables',
    'Frozen Peas',
    'Frozen Strawberries',
    'Garam Masala',
    'Garam Masala Powder',
    'Garlic Clove',
    'Garlic Clove Minced',
    'Garlic Cloves',
    'Garlic Cloves Chopped',
    'Garlic Cloves Minced',
    'Garlic Cloves Minced Garlic',
    'Garlic Paste',
    'Garlic Powder',
    'Garlic Powder Fresh Minced Garlic',
    'Garlic Salt',
    'Ginger',
    'Ginger Ale',
    'Ginger Paste',
  ]

  const ingredientMap: Record<string, { ingredient_id: number }> = {}
  const availTags = ['High', 'Medium', 'Low']
  for (let i = 0; i < ingredientNames.length; i++) {
    try {
      const ing = await prisma.ingredient.create({
        data: {
          ingredient_name: ingredientNames[i],
          availability_tag: availTags[i % 3],
        }
      })
      ingredientMap[ingredientNames[i].toLowerCase()] = ing
    } catch {
      // Skip duplicates
    }
  }
  console.log(`✓ Created ${Object.keys(ingredientMap).length} ingredients`)


  // ── Users (20 chefs) ────────────────────────────────────────────────────────
  const userData = [
    // Original 10
    { username: 'chef_mario', email: 'mario@flavor.co', name: 'Mario Rossi', bio: 'Italian cuisine specialist and pasta aficionado.' },
    { username: 'vegan_ninja', email: 'nina@flavor.co', name: 'Nina Chen', bio: 'Plant-based cooking advocate.' },
    { username: 'spice_queen', email: 'priya@flavor.co', name: 'Priya Sharma', bio: 'Lover of bold spices and Indian home cooking.' },
    { username: 'tokyo_toast', email: 'hiro@flavor.co', name: 'Hiroshi Tanaka', bio: 'Japanese fusion chef exploring world flavors.' },
    { username: 'bake_boss', email: 'emily@flavor.co', name: 'Emily Torres', bio: 'Pastry chef bringing French baking to your kitchen.' },
    { username: 'bbq_king', email: 'jake@flavor.co', name: 'Jake Miller', bio: 'Weekend warrior at the grill.' },
    { username: 'taco_time', email: 'rosa@flavor.co', name: 'Rosa Mendez', bio: 'Mexican street food lover and home cook.' },
    { username: 'salmon_sage', email: 'ben@flavor.co', name: 'Ben Harrison', bio: 'Health-conscious chef specializing in seafood.' },
    { username: 'currymaster', email: 'amir@flavor.co', name: 'Amir Patel', bio: 'Developed my palate in Mumbai, cooking for the world.' },
    { username: 'le_cordon', email: 'claire@flavor.co', name: 'Claire Dupont', bio: 'Trained at Le Cordon Bleu, Paris.' },
    // 10 NEW chefs
    { username: 'soul_kitchen', email: 'darnell@flavor.co', name: 'Darnell Washington', bio: 'Soul food and Southern BBQ master from Georgia.' },
    { username: 'wok_star', email: 'mei@flavor.co', name: 'Mei Lin', bio: 'Wok specialist and dim sum expert from Guangzhou.' },
    { username: 'herb_garden', email: 'sofia@flavor.co', name: 'Sofia Andersson', bio: 'Scandinavian chef obsessed with fresh herbs and foraging.' },
    { username: 'spice_route', email: 'fatima@flavor.co', name: 'Fatima Al-Rashid', bio: 'Middle Eastern cuisine with a modern twist.' },
    { username: 'pasta_prince', email: 'luca@flavor.co', name: 'Luca Bianchi', bio: 'Third-generation pasta maker from Naples.' },
    { username: 'farm_table', email: 'olivia@flavor.co', name: 'Olivia Green', bio: 'Farm-to-table advocate and organic cooking enthusiast.' },
    { username: 'kimchi_king', email: 'joon@flavor.co', name: 'Joon Park', bio: 'Korean fermentation expert and street food lover.' },
    { username: 'dessert_diva', email: 'isabella@flavor.co', name: 'Isabella Martinez', bio: 'Pastry artist specializing in Latin American desserts.' },
    { username: 'grill_guru', email: 'carlos@flavor.co', name: 'Carlos Herrera', bio: 'Argentine asado master and open-fire cooking enthusiast.' },
    { username: 'umami_hunter', email: 'yuki@flavor.co', name: 'Yuki Nakamura', bio: 'Ramen craftsman chasing the perfect broth for 10 years.' },
  ]

  const users: { user_id: number }[] = []
  for (const u of userData) {
    const user = await prisma.user.create({
      data: {
        username: u.username,
        email: u.email,
        password_hash: '$2b$10$placeholder_hash_for_demo',
        is_verified: true,
        profile: { create: { display_name: u.name, bio: u.bio } },
        onboarding: { create: { onboarding_version: 'v2.0', completed_at: new Date(), is_active: true } },
      }
    })
    users.push(user)
  }
  console.log(`✓ Created ${users.length} chefs`)

  // ── Dietary Follows ──────────────────────────────────────────────────────────
  await prisma.fOLLOWS.createMany({
    data: [
      { user_id: users[1].user_id, restriction_id: dietMap['Vegan'].restriction_id },
      { user_id: users[1].user_id, restriction_id: dietMap['Gluten-Free'].restriction_id },
      { user_id: users[2].user_id, restriction_id: dietMap['Vegetarian'].restriction_id },
      { user_id: users[4].user_id, restriction_id: dietMap['Dairy-Free'].restriction_id },
      { user_id: users[7].user_id, restriction_id: dietMap['Keto'].restriction_id },
      { user_id: users[7].user_id, restriction_id: dietMap['Low-Carb'].restriction_id },
      { user_id: users[8].user_id, restriction_id: dietMap['Halal'].restriction_id },
      { user_id: users[0].user_id, restriction_id: dietMap['Nut-Free'].restriction_id },
      { user_id: users[10].user_id, restriction_id: dietMap['Low-Fat'].restriction_id },
      { user_id: users[11].user_id, restriction_id: dietMap['Gluten-Free'].restriction_id },
      { user_id: users[12].user_id, restriction_id: dietMap['Vegetarian'].restriction_id },
      { user_id: users[13].user_id, restriction_id: dietMap['Halal'].restriction_id },
      { user_id: users[14].user_id, restriction_id: dietMap['Vegetarian'].restriction_id },
      { user_id: users[15].user_id, restriction_id: dietMap['Vegan'].restriction_id },
      { user_id: users[16].user_id, restriction_id: dietMap['Dairy-Free'].restriction_id },
      { user_id: users[17].user_id, restriction_id: dietMap['Nut-Free'].restriction_id },
      { user_id: users[18].user_id, restriction_id: dietMap['Low-Carb'].restriction_id },
      { user_id: users[19].user_id, restriction_id: dietMap['Low-Sodium'].restriction_id },
    ]
  })
  console.log('✓ Created dietary follows')

  // ── Onboarding Cuisine SELECTS ───────────────────────────────────────────────
  const allOnboardings = await prisma.user_Onboarding.findMany()
  const allCuisinesList = Object.values(cuisineMap)
  for (let i = 0; i < users.length; i++) {
    const ob = allOnboardings.find(o => o.user_id === users[i].user_id)
    if (!ob) continue
    const userCuisines = [
      allCuisinesList[i % allCuisinesList.length],
      allCuisinesList[(i + 3) % allCuisinesList.length],
    ]
    for (let rank = 0; rank < userCuisines.length; rank++) {
      await prisma.sELECTS.create({
        data: { onboarding_id: ob.onboarding_id, cuisine_id: userCuisines[rank].cuisine_id, preference_rank: rank + 1 }
      })
    }
  }
  console.log('✓ Created cuisine selections')

  // ── Taste Signals ────────────────────────────────────────────────────────────
  const signalTypes = ['cuisine_pref', 'difficulty_pref', 'dietary', 'spice_level', 'health_score']
  const signalData = users.map((u, i) => ({
    user_id: u.user_id,
    signal_type: signalTypes[i % signalTypes.length],
    weight: 0.5 + (((i * 17) % 50) / 100),
  }))
  await prisma.user_Taste_Signal.createMany({ data: signalData })
  console.log('✓ Created taste signals')


  // ── Recipes from CSV data ───────────────────────────────────────────────────
  const csvRecipes = [
    { title: 'Cherry Streusel Cobbler', description: 'I haven\\\\\'t made this in years, so I\\\\\'m just guessing on prep time.  I\\\\\'m putting in the shortest bake time, so you might have to adjust.', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Festive"], diets: [], steps: ["Preheat oven to 375\u00b0F.", "Spread cherry pie filling in a 8 x 8-inch square pan that has lightly been sprayed.", "In a medium-size bowl, beat eggs.", "Add milk, melted margarine, cinnamon, and nutmeg; mix well.", "Pour over cherry pie filling.", "In another medium size bowl, combine sugar and flour."], ingredients: ["cherry pie filling", "condensed milk", "melted margarine", "cinnamon", "nutmeg", "light brown sugar", "flour", "margarine"] },
    { title: 'Unstuffed Cabbage Rolls', description: 'I found this recipe circulating on facebook.  I\\\\\'m not sure who the original source is.', cuisine: 'American', difficulty: 'Easy', time: 45, moods: ["Quick", "Comfort", "Healthy"], diets: [], steps: ["In a large skillet, heat olive oil over medium heat. Add the ground beef and onion and cook, stirring, until ground beef is no longer pink and onion is tender.", "Add the garlic and continue cooking for 1 minute.", "Add the chopped cabbage, tomatoes, tomato sauce, pepper, and salt. Bring to a boil. Cover and simmer for 20 to 30 minutes, or until cabbage is tender."], ingredients: ["ground beef", "virgin olive oil", "large onion", "garlic clove minced", "cabbage chopped", "diced tomatoes", "tomato sauce", "black pepper"] },
    { title: 'Lazy Lasagna', description: 'This is a simplified version of lasagna, yet it has an authentic taste; better by far if made the day before or at least early in the morning, and then baked just before serving. I used ground beef, as posted but I\\\\\'m sure that some other ground meat would work in it\\\\\'s own way.', cuisine: 'French', difficulty: 'Medium', time: 120, moods: ["Comfort", "Quick"], diets: [], steps: ["In Dutch oven or large saucepan, brown meat in salt.", "Add spaghetti sauce mix, tomatoes, tomato sauce, basil and a 1/3 cup of Parmesan cheese.", "Simmer 30 minutes.", "Meanwhile cook lasagne noodles just until tender.", "In 9x11-inch casserole, layer meat sauce, noodles, and Mozzarella cheese.  Sprinkle with Parmesan cheese.  Repeat layers, saving enough meat sauce to pour over top layer.", "Bake in 300-325 degree oven for 20 minutes."], ingredients: ["ground beef", "spaghetti sauce mix", "tomatoes", "tomato sauce", "basil", "grated parmesan cheese", "lasagna noodles", "sliced mozzarella cheese"] },
    { title: 'Fall Harvest Cake', description: 'This is a cake that my mother-in-law makes.  It is a really nice fall cake that is similar to spice cake or carrot cake but this cake has pumpkin and apples.  It is really good topped with cream cheese icing.', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Festive", "Quick"], diets: [], steps: ["Mix together sugar, brown sugar, cinnamon, baking soda, salt, nutmeg, ginger, oil, vanilla and eggs.", "Add pumpkin to this mixture and stir well.", "Stir in 2 cups of flour, 1/2 cup at a time.", "Stir in apples and pecans.", "Bake 60-70 minutes at 350 in a greased and floured bundt pan.", "Ice with cream cheese frosting and sprinkle with nuts."], ingredients: ["brown sugar", "cinnamon", "baking soda", "nutmeg", "ginger", "oil", "vanilla", "pumpkin"] },
    { title: 'Grilled Potatoes', description: 'Recipe source: Southern Living', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Healthy"], diets: ["Low-Fat"], steps: ["In a large pot, add potatoes and water and bring to a boil over medium high heat and cook until potatoes are tender (20-30 minutes). Drain and toss with 2 tablespoons olive oil.", "In a large serving dish or bowl combine grated lemon rind and juice of one lemon and next 4 ingredients (garlic - parsley) plus the remaining oil (2 tablespoons). ***Lemon mixture can be made one day ahead and refrigerated; remove from refrigator 30 minutes before tossing with potatoes.***.", "Prepare barbecue.", "Coat cooking grate with Pam and place on grill on high heat (350-400 degrees F).", "Grill potatoes, covered for 5 minutes, turning occasionally.", "Remove potatoes from grill and toss with lemon mixture."], ingredients: ["red potatoes", "olive oil", "lemon juice zest", "garlic cloves", "parsley", "cooking spray"] },
    { title: 'Spinach Pecans and Gorgonzola Salad With Sherry Vinaigrette', description: 'Recipe courtesy Dave Lieberman Show:  Good Deal with Dave Lieberman Episode:  One Pot Meal PotluckNot like any of the other spinach salads on Zaar so I thought that I would post this one.', cuisine: 'American', difficulty: 'Easy', time: 15, moods: ["Quick", "Light"], diets: [], steps: ["Preheat oven to 400 degrees F.", "Toss pecans with vegetable oil, sugar and salt. Lay out on baking sheet. Roast until shade darker and aromatic, about 7 to 8 minutes. Set aside.   I have also done this one the stove top in a skillet but I stir frequently when doing so.", "Whisk together olive oil, vinegar, shallots and salt and pepper in a bowl.", "Mix spinach, goronzola and pecans in a serving bowl.", "Toss salad with dressing."], ingredients: ["spinach", "pecan", "vegetable oil", "olive oil", "sherry wine vinegar", "shallots minced", "kosher salt freshly ground black pepper", "gorgonzola"] },
    { title: '&quot; South Beach&quot; Stuffed Bell Peppers', description: 'This is a recipe I made up when I was in Phase 1 of the South Beach Diet. My kids have begun to request it for supper!', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick", "Comfort", "Healthy"], diets: [], steps: ["Wash the peppers, cut the tops off, and place in oiled glass dish.", "Cover and microwave the peppers for 5 minutes.", "Saute the veggies and ground turkey with a dollop of olive oil. (I chop up the usable remainders of the pepper tops as well).", "Add the tomatoes and seasonings. Cook for 3-4 minutes to evaporate some of the liquid.", "Stuff the peppers and top with cheese.", "Bake at 350 for 10 minutes or until the peppers are soft and the cheese is toasted."], ingredients: ["bell peppers", "olive oil", "ground turkey", "celery", "garlic clove minced", "small onion", "minced fresh parsley", "worcestershire sauce"] },
    { title: 'Australian Style Potato Salad', description: 'This is a recipe that I found on the inmamaskitchen website, posted by Margaret Walker, which I am posting here for the Zaar World Tour event.  It appealed to me because it is very similar to the potato salad recipe that my mom made for our summertime picnics and potluck gatherings. There is a note ', cuisine: 'American', difficulty: 'Easy', time: 45, moods: ["Quick", "Festive", "Light"], diets: [], steps: ["Gently boil potatoes until a skewer will penetrate to the centre. Turn off heat, pour off water and fill the pot with cold water. Leave until potatoes are quite cold. Lift from water and peel off outer skin of potatoes.  Chop potatoes into even sized cubes and place into a bowl with onion, parsley a", "In small bowl mix together the mustard and mayonnaise. Add to potatoes with chopped eggs, and desired amount of salt and pepper.  Mix gently to combine.", "Refrigerate until ready to serve."], ingredients: ["large potatoes cool water", "onion", "fresh parsley", "fresh cilantro chopped", "deli mustard", "low - fat mayonnaise", "hard - boiled eggs chopped", "salt pepper"] },
    { title: 'Simply Oven Baked Pork Chops or Chicken and Rice II', description: 'This is an updated version of DH\\\\\'s bachelor days recipe, that I posted in 2005. When I first met him, the only spices he owned was Tony\\\\\'s, garlic salt and salt and pepper. This is the recipe that has evolved from the original. It\\\\\'s still a basic recipe...just a lot more flavor. As wit', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Comfort", "Quick"], diets: [], steps: ["Season pork chops with pepper, seasoning salt and garlic powder.", "In a skillet, saut\u00e9 onions in butter and oil until limp.", "Remove onions to a 2 quart casserole.", "Quick sear pork chops in same skillet.", "Remove chops to a platter.", "De-glaze pan with a little chicken broth and add to casserole."], ingredients: ["pork chops chicken thighs", "canola oil", "cream mushroom soup", "sodium chicken broth", "white rice", "onion coarse chop", "seasoning", "garlic powder"] },
    { title: 'Tomato and Sour Cream Tea Sandwiches', description: 'These delicious sandwiches are a bit different than normal tomato sandwiches.  I love the extra flavour that the sourcream/cheese mixture gives and the oregano really adds a nice flavour as well.', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick", "Light", "Healthy"], diets: [], steps: ["Combine the cream cheese, sour cream and oregano in a small bowl and mix well.  Season with salt and pepper.", "Trim the crusts from the bread.  Spread the cream cheese mixture on the bread slices.  Arrange the tomatoes on 1/2 the bread slices.  Top with the remaining bread slices.", "Cut each sandwich into 3 equal strips."], ingredients: ["cream cheese", "sour cream", "oregano chopped", "salt pepper", "white bread", "tomatoes"] },
    { title: 'Chocolate Waffles', description: 'Chocolate Waffles', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick", "Festive", "Healthy"], diets: [], steps: ["Mix together and put in waffle maker."], ingredients: ["cocoa powder", "whole milk", "chocolate chips", "baking powder"] },
    { title: 'Ranch Bean Soup', description: 'This is so easy and is liked by kids very well. This was printed in the news paper here in Texas. If you do not like Ranch beans you will not want to try this.', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Festive", "Comfort"], diets: ["Low-Carb"], steps: ["Brown the hamburger, I use ground serloin because it has better flavor.", "I brown it in the big stew pot because there is no need to dirty more pans.", "Open all the cans and add to browned meat.", "Let simmer about 20 minute until well heated."], ingredients: ["sirloin", "ranch style beans", "chopped tomatoes", "minestrone soup", "beef broth", "rotel"] },
    { title: 'Ginger Pineapple Jello Mold', description: 'This is lovely with a nice ham dinner.  Don\\\\\'t use fresh pineapple or fresh ginger - the enzymes will prevent the gelatin from setting.  And for a summer variation:  I added one heaping cup of blueberries to the mix when I added the pineapple (left out the ground ginger), yummy!  **and ingredien', cuisine: 'American', difficulty: 'Medium', time: 60, moods: ["Festive", "Healthy", "Light"], diets: ["Low-Fat", "Low-Sodium"], steps: ["Drain pineapple, reserving juice in a measuring cup.", "Stir boiling water into gelatin in large bowl at least 2 minutes until completely dissolved.", "Add ginger ale to the reserved pineapple juice making about 1 to 1 1/4 cup of liquid.  Stir the ground ginger into this liquid.", "Stir the reserved pineapple juice, ginger ale &amp; ginger into the jello.", "Refrigerate about 1 1/4 hours or until slightly thickened (consistency of unbeaten egg whites).", "Stir in pineapple (&amp; blueberries if doing summer variation!).  Pour into a 5-cup mold."], ingredients: ["crushed pineapple", "boiling water", "lime gelatin", "ginger ale", "ginger", "fresh blueberries"] },
    { title: 'Black-Eyed Pea Spread', description: 'This is something a little different for you.  Chopped spinach, black-eyed peas, sour cream, mayonnaise, soup mix, water chestnuts, and garlic powder all mixed up for a Southern tasting spread on pumpernickel or rye party bread.  It doesn\\\\\'t get much more Southern than this!', cuisine: 'American', difficulty: 'Easy', time: 15, moods: ["Quick", "Festive"], diets: [], steps: ["Combine all ingredients except brea;  mix well.  (You could mix this in a food processor if you want a creamier texture.).", "Spread mixture on bread slices."], ingredients: ["frozen chopped spinach", "black - eyed peas", "sliced water chestnuts", "sour cream", "mayonnaise", "dry vegetable soup", "garlic powder", "pumpernickel cocktail bread rye cocktail bread"] },
    { title: 'Pastel De Matzo Y Naranja ( Matzo and Orange Cake)', description: 'This recipe is posted by request.  I found this recipe in the local paper.  The article discussed fusing different cultures during Passover.  Times are guesstimates and do not include cool time.', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Festive", "Healthy"], diets: [], steps: ["Preheat oven to 350\u00b0F.", "Grease 10 or 11-inch springform pan.", "Beat egg whites until stiff with formed peaks, taking care to not overbeat.", "In separate bowl, combine 2 C matzo meal, sugar, oil, walnuts, egg yolks, orange juice and zest of 1 orange.", "Mix well.", "Carefully fold in egg whites, taking care to not overmix."], ingredients: ["matzo meal", "matzo meal", "vegetable oil", "chopped walnuts chopped pecans", "orange juice oranges", "walnuts", "orange marmalade", "orange zest"] },
    { title: 'Gg\\\'s Mom\\\'s Shrimp Macaroni Salad', description: 'What can I say--one of my favorite salads growing up.', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Festive", "Light", "Quick"], diets: [], steps: ["Cook macaroni in salted water until al dente; drain well.", "Combine all the remaining ingredients.", "Fold the macaroni into the mixture.", "Cover and chill at least 3 hours before serving."], ingredients: ["macaroni", "onion", "green bell pepper chopped", "celery", "mayonnaise", "sweet pickle relish", "ketchup", "white wine vinegar"] },
    { title: 'Easy Iced Cappuccino - Sugar Free', description: 'I have not tried this recipe. I got this recipe from Splenda. I plan to use decaff coffee.', cuisine: 'American', difficulty: 'Easy', time: 15, moods: ["Quick"], diets: [], steps: ["In sealable jar, combine instant coffee, SPLENDA\u00ae Granulated Sweetener, and warm water.", "Cover the jar and shake until it is foamy.", "Pour into a glass full of ice. Fill the glass with milk.", "Adjust to taste if necessary."], ingredients: ["instant coffee granules", "warm water", "cold milk"] },
    { title: 'Unfried Refried Beans', description: 'This is a healthier version than most refried bean recipes. You can make this vegetarian by using all water.And the best part of all it cooks in the crockpot! This is adapted from  allrecipes.com', cuisine: 'American', difficulty: 'Medium', time: 60, moods: ["Festive", "Healthy"], diets: ["Low-Fat", "Vegan", "Vegetarian", "Low-Carb"], steps: ["Place the onion, rinsed beans, jalapeno, garlic, salt, pepper, and cumin into a slow cooker.", "Pour in the water and stir to combine. Cook on High for 8 hours, adding more water as needed.", "Note: if more than 1 cup of water has evaporated during cooking, then the temperature is too high.", "Once the beans have cooked, strain them, and reserve the liquid. Mash the beans with a potato masher, adding the reserved water as needed to attain desired consistency."], ingredients: ["onion", "pinto beans", "fresh jalapeno pepper", "minced garlic", "fresh ground black pepper", "cumin", "water water broth"] },
    { title: 'Chicken Noodle Soup With Parsnips and Dill', description: 'Lots of carrots and parsnips give old-favorite chicken noodle soup a sweet savor. To balance this effect, use the optional parsley, which is just slightly bitter - or maybe cilantro', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Healthy", "Comfort"], diets: ["Low-Fat", "Low-Carb"], steps: ["In a large pot, combine the broth, onion, carrots, parsnips, salt, and pepper and bring to a simmer. Add the chicken breasts to the pot and simmer until just done, about 10 minutes. Remove the chicken; bring the soup back to a simmer. When the chicken breasts are cool enough to handle, cut them into", "Meanwhile, stir the noodles into the soup. Simmer until the vegetables are tender and the noodles are done, about 5 minutes. Return the chicken pieces to the pot and then stir in the dill and the parsley.", "Variations: *Skip the parsnips and raise the number of carrots to eight. *Add one diced turnip to the mix.", "*Use bone-in chicken breasts and cook them for an additional ten minutes. The extra time in the pot will give the soup even more flavor.", "Recipe reprinted by permission of Food and Wine. All rights reserved."], ingredients: ["low sodium chicken broth", "onion", "carrots", "parsnips butternut squash", "fresh ground black pepper", "boneless skinless chicken breast", "egg noodles", "chopped fresh dill"] },
    { title: 'Cheesy 5-Spice Potatoes', description: 'This recipe is easy, quick, and can be modified for any sort of dietary restriction.  It makes a great side for a barbecue or any meat dish.', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick", "Healthy"], diets: ["Low-Fat", "Low-Sodium"], steps: ["Preheat oven to 425 degrees.", "Pre-cook potatoes until fork tender.  Potatoes can be skinned or left with the skin on.  If left with skins on, be sure to wash the potatoes well. They can be microwaved or boiled. Microwaving is the quickest and it does not sacrifice the taste or texture of the dish.", "Cut hot potatoes into large pieces (about 1 to 2 inch pieces).", "Place potatoes chunks into large bowl.  Add Olive oil, grated cheese, parsley flakes, chili powder, garlic powder, salt (to taste), and a few dashes of black pepper.  Toss potatoes in mixture to coat evenly.  (You can use less or more of each ingredient to your liking!).", "Place potatoes in a foil-lined greased glass baking dish.", "Sprinkle shredded cheese on top of potatoes."], ingredients: ["olive oil", "freshly grated romano cheese parmesan cheese", "parsley flakes", "chili powder", "garlic powder", "shredded sharp cheddar cheese", "shredded mozzarella cheese"] },
    { title: 'Apple and Mint Couscous', description: 'I had mint, apple juice, cider and a taste for something a little autumnal. This recipe was the result. I have not seen one quite like it before, though I am sure others have done it. Depending on your couscous, you may need more liquid, to let it stand longer, or you may prefer a little more butter', cuisine: 'Middle Eastern', difficulty: 'Easy', time: 15, moods: ["Quick", "Healthy"], diets: ["Vegan", "Vegetarian"], steps: ["Pour apple juice and cider into a pot, add salt and bring to the boil.", "Remove from the heat and pour in the couscous.", "Stir, cover tightly and leave for 3 minutes.", "Chop the butter into small pieces and add, or add the oil.", "Add the sultanas or raisins.", "Return to a low heat and stir with a fork, breaking up the lumps and fluffing the grains."], ingredients: ["apple juice", "apple cider", "salt", "nut oil butter", "sultanas raisins", "walnut", "spring onions red onion", "fresh mint chopped"] },
    { title: 'The Perfect Pot and Cup of English Tea!', description: 'The perfect pot of English tea leads to the perfect cup of English tea! I know this is NOT a recipe, but it is amazing how many people do not know how to make a PROPER POT of tea! We always make a pot of tea at home - even if there is only one of us here, we just use a smaller pot! I also prefer loo', cuisine: 'French', difficulty: 'Easy', time: 15, moods: ["Quick", "Festive", "Healthy"], diets: ["Vegetarian"], steps: ["Only use freshly drawn cold water, ensure that kettles or water boilers are de-scaled regularly and that teapots are spotlessly clean.", "Teapots should be warmed with hot water, which is then poured away.", "Use the recommended number of tea bags or one teaspoon of loose tea per cup, AND one teaspoon for the pot. (For one person use a 10oz tea pot, for two persons a 20oz tea pot is recommended.).", "Water should always be freshly boiled and boiling when added to tea.", "Leave to brew for 3-5 minutes before serving. Stir before serving.", "Pour a little milk into each cup before pouring the tea through a strainer if necessary, and sweeten with sugar as required."], ingredients: ["grey tea ceylon tea", "granulated sugar", "sugar cube", "lemon slice"] },
    { title: 'Asian Catfish Wraps', description: 'From Cooking Light. If catfish nuggets are not available, buy fillets and cut them into bite-sized pieces. Per serving: 344 calories, 10.4 g fat, 22.8 g protein, 37.8 g carb, 3.7 g fiber, 54 mg cholesterol.', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Light", "Comfort"], diets: [], steps: ["Heat 1/2 teaspoon oil in a large nonstick skillet over med-high heat.", "Add in catfish; stir/saute 3 minutes or until done; remove from pan.", "Add 1/2 teaspoon oil to pan; add in cabbage and next 5 ingredients; stir/saute 2 minutes or until carrots are crisp-tender.", "Stir in catfish nuggets, hoisin, and chili garlic sauce; cook 1 minute or until heated through.", "Remove from heat.", "Divided catfish mixture among tortillas; roll-up burrito-style and eat immediately."], ingredients: ["dark sesame oil", "catfish nuggets", "sliced napa cabbage", "sliced shiitake mushroom caps", "shredded carrot", "sliced green onion", "minced fresh ginger", "minced garlic"] },
    { title: 'Simple Vegetable Curry', description: 'Simple indeed, but also healthy and flavorful!  Courtesy of *Everyday Food.*', cuisine: 'Japanese', difficulty: 'Easy', time: 45, moods: ["Quick", "Healthy"], diets: ["Vegetarian"], steps: ["In a medium saucepan, heat 1 teaspoon oil over medium-high.  Add mustard seeds and half the onion and cook, stirring often, until onion is soft, 3 minutes.  Add rice and stir to combine.  Add 1-1/2 cups water, season with salt and pepper, and bring to a boil.  Cover and reduce to a simmer; cook unti", "Meanwhile, in a large Dutch oven or heavy pot, heat 2 teaspoons oil over medium-high.  Add remaining onion and cook, stirring often, until soft, 3 minutes.  Add curry paste and stir until fragrant, about 1 minute.  Stir in coconut milk and 1 cup water and bring to a boil.  Add sweet potato and cauli", "Stir chickpeas into curry and increase heat to high.  Simmer rapidly until liquid reduces slightly, 2 minutes.  Serve curry over rice with cilantro."], ingredients: ["vegetable oil", "brown mustard seeds", "yellow onion", "long white rice", "salt", "ground pepper", "red curry paste", "unsweetened coconut milk"] },
    { title: 'Prawn (Shrimp) Pakoras', description: 'Great nibbles with a glass of champagne', cuisine: 'Japanese', difficulty: 'Easy', time: 30, moods: ["Quick", "Festive", "Light"], diets: [], steps: ["Pulse prawns in food processor-they need to just come together not turn into a paste!", "Combine the prawns and remaining ingredients except the oil.", "Using a tablespoon, measure out approximately 30 balls.", "Using damp hands, roll each portion into a ball; place on a plate, cover with cling film until ready to use.", "Heat the oil in a wok or heavy based frypan.", "Fry 6-8 balls at a time until golden brown all over."], ingredients: ["raw prawns", "red onion", "fresh coriander chopped", "tomatoes", "garlic clove minced", "minced ginger", "red chili pepper", "besan flour chick pea flour"] },
    { title: 'Sausage Kabobs', description: 'From an unknown source. Prep time includes marinating time.', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Comfort", "Quick", "Healthy"], diets: [], steps: ["Place sausages, onions, mushrooms, and zucchini in a 2 quart bowl.", "Mix remaining ingredients, pour over sausage and vegetables.", "Cover and refrigerate, stirring occasionally, at least 1 hour but  not longer than 24.", "To serve: About 20 minutes before serving, drain sausage and vegetables, reserving the marinade.", "Alternate sausage and vegetables on 4 skewers.", "Set oven to broil."], ingredients: ["kielbasa", "white pearl onions", "medium mushrooms", "medium zucchini", "orange marmalade", "vegetable oil", "soy sauce", "ginger"] },
    { title: 'Delicious Veggie &amp; Herb Ravioli Soup', description: 'I received this wonderful recipe from my sister.  I love that the only preparation needed is to chop up some garlic and herbs.  I really like flavor of this soup\\\\\'s base as it is seasoned with garlic, herbs, tomatoes and chicken.  This is a great meal to make when time is short.  Lastly, I do no', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Festive", "Light"], diets: [], steps: ["Cover bottom of pan with olive oil.", "Add garlic, herbs, and mushrooms.", "Cook until mushrooms are mostly limp.", "Add all ingredients through red peppers.", "Bring to a boil.", "Add chicken and simmer for 20 minutes."], ingredients: ["olive oil", "garlic cloves minced", "fresh rosemary chopped", "fresh thyme chopped", "sliced mushrooms", "tomato sauce", "stewed tomatoes", "chicken broth"] },
    { title: 'Fruit Salad', description: 'fat free, fresh, let it refridgerate at least 3 hours so it is really cold', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick", "Festive"], diets: [], steps: ["Combine all ingrediants.", "Refridgerate."], ingredients: ["vanilla sugar free instant pudding mix", "buttermilk", "shredded coconut"] },
    { title: 'Corned Beef-Onion Sandwich Filling (Betty Crocker)', description: 'From Betty Crocker\\\\\'s Cookbook, 1974.', cuisine: 'American', difficulty: 'Easy', time: 15, moods: ["Quick", "Light"], diets: [], steps: ["Stir together all ingredients until well mixed.  Serve on favorite sandwich bread."], ingredients: ["cooked corned beef chopped", "mayonnaise", "celery minced", "onion minced", "prepared mustard"] },
    { title: 'Heart Healthy Strawberry Banana Shake', description: 'If you’re like me and love milkshakes but have had a heart attack and must follow a low fat heart healthy diet, you do not have to be denied any longer.  Here is a shake that’s tasty and satisfying, but is also low fat, low calorie and has loads of potassium to help flush cholesterol from your body.', cuisine: 'American', difficulty: 'Easy', time: 15, moods: ["Quick", "Healthy"], diets: ["Low-Fat", "Low-Sodium"], steps: ["In a blender add 4 Ice cubes and crush using fastest speed available (if you do not have a blender capable of crushing Ice, place cubes in a plastic bag and pre crush with a meat mallet or bottom of a pan first).", "Add remaining ingredients.", "Blend until smooth.", "Pour into 12 oz glass.", "Garnish with Fresh or Thawed Frozen Strawberries (optional)."], ingredients: ["fat strawberry yogurt", "banana", "ice cubes", "skim milk"] },
    { title: 'Blackened Tilapia Seafood Chowder #5FIX', description: '5-Ingredient Fix Contest Entry.  A delicious, quick and easy fish chowder.', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick", "Festive", "Comfort"], diets: ["Nut-Free"], steps: ["1. Rinse the fish filets and shake off excess water. Place the seasoning in a dish and press both sides of the fillets into the seasoning. Allow to rest.", "2. Add the clam juice and the Simply Potatoes Diced Potatoes with Onion to a 2 quart saucepan and bring to a simmer.", "3. Brown the filets in a non-stick skillet for 3 minutes per side. Remove them from the skillet and set aside.", "5. Add the half &amp; half to the potato mixture. Heat thoroughly but do not boil. Use a slotted spoon to crush some of the potatoes against the bottom and sides. This will thicken the chowder.", "6. When the chowder thickens, add the fish. Adjust the seasoning by adding more Cajun seafood seasoning or more half &amp; half as needed."], ingredients: ["tilapia fillet", "seafood seasoning magic seafood seasoning", "clam juice", "potatoes potatoes onion"] },
    { title: 'Everything Cookies', description: 'A delicious cookie with a healthy alternative of applesauce instead of butter and oil.', cuisine: 'American', difficulty: 'Easy', time: 120, moods: ["Festive", "Healthy", "Quick"], diets: [], steps: ["Mix all ingredients together and drop onto light greased cookie sheet.  Bake for 12 minutes at 350."], ingredients: ["applesauce", "brown sugar", "white sugar", "oats", "sweetened coconut", "vanilla", "whole wheat flour", "tartar"] },
    { title: 'Ham Balls', description: '(I was given this recipe a few years ago).   It is one everyone will ask for. I took it once to a Birthday Party and was asked for the recipe by at least 5 people including the host. These can be served for dinner on rice or taken to parties and kept warm in a crockpot until serving. They can also b', cuisine: 'American', difficulty: 'Easy', time: 120, moods: ["Festive", "Comfort", "Quick"], diets: [], steps: ["(3 batches of sauce is best when filling a crockpot with a double batch of balls) Ham Balls: Mix all together, gradually adding milk at the end to moisten enough to form balls.", "Bake balls on a cookie sheet for 20 minutes at 350 degrees, drain fat and cool.", "Sauce: Mix togther, heat and simmer 10 minutes until well blended."], ingredients: ["ground ham ham steak", "ground pork", "crushed cracker crumb", "green pepper", "onion", "brown sugar", "dry mustard", "molasses"] },
    { title: 'Tequila Grilled Chicken', description: 'One of our favorite ways to make chicken on the grill! Delicious! Prep time equals marinating time.', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Comfort"], diets: [], steps: ["Rinse chicken and pat dry.", "Arrange in a shallow nonreactive dish.", "Pour mixture of broth, olive oil, tequila, green onions, garlic, lime juice, chili powder, cilantro, salt, cumin and coriander over chicken, turning to coat.", "Marinate, covered with plastic wrap, in refrigerator for 2-3 hours, turning occasionally.", "Drain and discard marinade.", "Grill chicken over medium-hot coals for 4-5 minutes per side or until cooked through."], ingredients: ["boneless skinless chicken breast", "chicken broth", "olive oil", "tequila", "minced green onion", "cloves garlic", "lime juice", "chili powder"] },
    { title: 'Basic Biscotti', description: 'This isn\\\\\'t anything fancy, just a basic biscotti.', cuisine: 'French', difficulty: 'Medium', time: 45, moods: ["Quick", "Healthy", "Festive"], diets: ["Low-Sodium"], steps: ["PREHEAT OVEN TO 350 degrees F.", "Spread almonds on a baking sheet and toast them in oven until lightly golden.", "Let cool.", "Coarsely chop half the nuts.", "Butter 2 large baking sheets.", "Mix flour, sugar, salt and baking soda."], ingredients: ["almonds", "granulated sugar", "baking soda"] },
    { title: 'Sondie\\\'s Hot Clam Dip', description: 'I got this recipe from my boyfriends sister.  I have no idea where she got it.  It is a wonderful appetizer.', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick"], diets: [], steps: ["Put Ritz crackers in a baking dish.", "Mix rest of ingredients and add to crackers.", "Stir just a little.", "Bake at 350 degrees for 1/2 hour.", "Use crackers, celery, etc. to dip."], ingredients: ["minced clams", "diced onion", "minced garlic", "soft margarine", "grated cheddar cheese", "crackers"] },
    { title: 'Black Beans (Excellent over White Rice)', description: 'This is my twist on Goya\\\\\'s standard recipe for black beans.  This is absolutely delicious served over white rice.', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Healthy"], diets: ["Vegetarian"], steps: ["Heat oil in medium saucepan over medium heat.", "Add chopped onion and chopped pepper.", "Saute until golden brown and tender, about 8-10 minutes, stirring often to prevent burning.", "Add minced garlic and saute for one minute.  Do not burn garlic.", "Stir in black beans, water and oregano.", "In a cup, mix Sazon Goya with red wine until well-combined."], ingredients: ["olive oil", "onion", "green bell peppers cubanelle pepper", "garlic clove minced", "black beans", "oregano", "sazon goya seasoning annatto", "red wine"] },
    { title: 'Favorite Enchilada Casserole', description: 'The woman that worked for my mother gave us this recipe', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Comfort", "Healthy"], diets: [], steps: ["375 Brown ground beef, drain add onion cumin, chili powder, pepper, salt, garlic, and water Simmer 10 min.", "uncovered Pour 1/2 cup taco sauce into casserole dish.", "arrange 1/2 tortillas to cover dish Pour 1/2c taco sauce over tortillas.", "Spoon in beef mix Top with sour cream sprinkle 1/2 cheese Spread remaining tortillas overlaping add taco sause remaining cheese on top let sit in fridge for 24 hours cook 1 hour 375."], ingredients: ["ground beef", "cumin", "chili powder", "taco sauce", "chopped onion", "cloves garlic", "broth", "corn tortillas"] },
    { title: 'Monterey Jack Crispy Wafers', description: 'This is so simple and an incredibly good crunchy, savory treat. You can also use hot peppered Jack cheese for another taste altogether. Great as an appetizer or served with soup.', cuisine: 'American', difficulty: 'Easy', time: 15, moods: ["Quick", "Healthy"], diets: ["Low-Carb"], steps: ["Cut cheese into l/4 inch slices.", "Space cheese 3 inches apart on a non-stick cookie sheet.", "Sprinkle with garlic powder, to taste.", "Bake 5-10 minutes at 400 degrees F depending on your oven (Watch these closely; Do not overbake).", "Remove immediately and let cool.", "Store in an airtight container."], ingredients: ["monterey jack cheese", "garlic powder"] },
    { title: 'Texas Cranberry Jalapeno Bread', description: 'This recipe is similar to a contest winning recipe featured by our local electrical coop. Sounds crazy, but this bread is addictive!', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Comfort"], diets: [], steps: ["Preheat oven to 350.", "In a large bowl, mix dry ingredients (flour through cranberries).", "In a medium bowl, mix eggs, juice, vanilla, jelly, and butter.", "Make a well in center of dry ingredients.", "Fold wet ingredients into dry and mix only until ingredients are combined.", "Pour into 2 well greased loaf pans."], ingredients: ["flour", "light brown sugar", "baking soda", "baking powder", "black pepper", "cumin", "chopped pecans", "cranberries chopped craisins"] },
    { title: 'Orange Cake', description: 'Deliciously moist', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Festive", "Healthy"], diets: ["Low-Sodium"], steps: ["Boil the oranges for 30 minutes.  Allow to cool.", "Blend the oranges in a food processor.", "Add eggs and blend.", "Add other ingredients and pulse until well blended.", "Pour into a springform cake tin lines with baking paper.", "Bake for 50 minutes at 180&amp;deg;C."], ingredients: ["almond meal", "vanilla extract", "baking powder"] },
    { title: 'Caramel Marshmallow Bars', description: 'Prepare these for your next bake sale.', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Festive"], diets: [], steps: ["Preheat oven to 350*.", "For crumb mixture, in small mixer bowl, combine flour, graham cracker crumbs, sugar, butter and salt.", "Beat at low speed, scraping bowl often until mixture is crumbly, 1 to 2 minutes.", "Stir in nuts.", "Reserve 3/4 cup crumb mixture.", "Press remaining crumb mixture onto bottom of greased and floured 9-inch square baking pan."], ingredients: ["graham cracker crumbs", "butter margarine", "chopped salted peanuts", "caramel ice cream", "salted peanuts", "miniature marshmallow", "milk chocolate chips"] },
    { title: 'Roasted Filet of Beef', description: 'From Carla Hall\\\\\'s Cooking With Love', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Comfort"], diets: [], steps: ["Remove excess fat, chain (the tough narrow muscle running along the tenderloin), and silverskin from the beef, then cut in half crosswise to form two shorter roasts.  Tie both pieces in 1 inch intervals with kitchen twine.", "In a medium bowl, stir together the mustard, olive oil, garlic, herbs and pepper until smooth.  Sprinkle half the salt over the beef, then slather with the mustard mixture.  Place the beef in a plastic bag and refrigerate for at least 3 hours or up to overnight.", "Let the beef stand at room temperature for 1 hour before you start cooking.  Preheat the oven to 450\u00b0F  Place a rack in a roasting pan.", "Wipe excess marinade off the beef and discard.  Sprinkle the remaining salt over the beef.  Heat 2 tablespoons of the canola oil in a large skillet over medium high heat.  Add one of the beef pieces and turn to sear on all sides until well browned.  Transfer to a roasting pan and repeat with the oth", "Place the pan in the oven and roast until the internal temperature registers 125 F for medium rare, about 20 minutes.  Check the beef after 15 minutes just to be sure.", "Remove from the oven and transfer to a cutting board.  Let rest for 15 minutes before slicing."], ingredients: ["beef tenderloin", "dijon mustard", "virgin olive oil", "garlic cloves minced", "chopped fresh flat - leaf parsley", "chopped fresh thyme", "chopped fresh rosemary leaf", "fresh ground black pepper"] },
    { title: 'Pasta Chicken in Creamy Parsley Sauce', description: 'This is a quick dish to make and everyone should love it. The flavours are lovely and delicate.', cuisine: 'French', difficulty: 'Easy', time: 30, moods: ["Quick", "Comfort", "Healthy"], diets: ["Low-Sodium"], steps: ["Cook the oil and lemon rind in a saucepan over a medium heat for 4 minutes.", "Stir in th ginger, sugar and 1/4 tsp of the salt and cook the mixture for 3 minutes more, stirring frequently.", "Pour in the stock and bring the mixture to the boil; cook it until only about 4 fl oz of liquid remains - 5-7 minutes.", "Cook the pasta in 3 litres of boiling water with 1 1/2 tsp of salt.", "Start testing the pasta after 10 minutes and cook until it is al dente.", "While the pasta is cooking, melt the butter in a large, heavy base frying pan over a medium heat."], ingredients: ["linguine shells other pastas shells", "safflower oil", "lemon rind", "chopped fresh gingerroot juice", "unsalted chicken stock", "unsalted butter", "boneless skinned chicken breasts", "shallots"] },
    { title: 'Annetta\\\'s Hot Fudge Sauce', description: 'From The Dine and Dish food blog.  The blogger says, "This hot fudge sauce is something that you will randomly crave at 2:00 in the morning and you won\\\\\'t be able to get it out of your head until you have a bowl of it in front of you...and yes...it is supposed to go on ice cream, but some people', cuisine: 'American', difficulty: 'Easy', time: 15, moods: ["Quick", "Healthy"], diets: ["Low-Sodium"], steps: ["Combine all ingredients and cook over medium heat until it reaches a full rolling boil.", "Continue to boil for one minute and remove from heat.  Serve."], ingredients: ["cocoa", "evaporated milk"] },
    { title: 'Cranberry-Kissed Sweet Potatoes', description: 'I found this in the Chicago Tribune and plan on adding it to my Thanksgiving menu. It originally comes from Wisconsin cranberry grower Judie Harkner.', cuisine: 'American', difficulty: 'Easy', time: 45, moods: ["Quick", "Festive", "Healthy"], diets: ["Vegetarian"], steps: ["Combine sweet potatoes, orange juice and butter in a large microwave-safe bowl; cover with plastic wrap and heat on high (100 percent power), stirring occasionally, 12 minutes.", "Stir in cranberries and brown sugar; cover and heat on high until potatoes are tender and cranberries burst, about 5 minutes.", "Toss mixture with orange zest; stir in almonds if desired."], ingredients: ["sweet potatoes", "orange juice", "butter", "fresh cranberries", "brown sugar", "toasted slivered almonds"] },
    { title: 'Sweet Potato Souffl&eacute;', description: 'I was in NC before coming to Alexandria and the folks down there love this and so does my family! It was given to me by a lady named Ann Napoleon. Real southern and real good! Great for Thanksgiving!', cuisine: 'American', difficulty: 'Easy', time: 45, moods: ["Quick", "Festive", "Healthy"], diets: [], steps: ["Boil sweet potatoes until tender. When cool enough, remove skin. Beat sweet potatoes with electric mixer in bowl until creamy. Add egg, vanilla, margarine, sugar and cinnamon.  Place in glass 9x11 baking dish. Cover with aluminum foil and refrigerate over night.  Combine remaining ingredients for to"], ingredients: ["sweet potatoes", "vanilla", "margarine", "cinnamon", "melted margarine", "brown sugar", "chopped pecans"] },
    { title: 'Zucchini Cakes', description: 'from Cuisine at Home December 2007. Serve with Diavolo Sauce. "in this season of non-stop eating, this vegetable centered dinner is a welcome change of pace"', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick", "Comfort", "Healthy"], diets: ["Vegetarian"], steps: ["Strain zucchini and onion in a salad spinner to remove excess moisture.", "Transfer to a large bowl and stir in the panko.", "Whisk eggs, salt and baking powder together in a small bowl then stir into zucchini mixture.", "Heat 2T oil in a nonstick skillet over medium.  When hot drop mounds of batter into thepan using a 1/3-cup measure.", "Fry cakes until golden, then carefully flip and cook until golden on the other side, about 4 minutes per side.", "Transfer to a paper towel-lined plae and keep warm; fry remaining cakes in remaining oil."], ingredients: ["zucchini", "onion", "panko breadcrumbs", "baking powder", "olive oil", "parmesan cheese grated", "fresh parsley sprigs"] },
    { title: 'Soft-Baked Oatmeal Cookies', description: 'Don\\\\\'t let the lack of stars fool you!  I accidentally forgot to add a cup of white sugar but the recipe has now been corrected.  So sorry!!These cookies are great for shipping. They stay soft and they taste great!  I sent them to my nephew in Iraq and he and his buddies devoured them in a sitti', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Festive", "Healthy"], diets: [], steps: ["Preheat oven to 350 degrees.", "In a small bowl, combine eggs, raisins, and vanilla.  Let stand one hour in refrigerator.", "In a large bowl, cream sugars and shortening.", "Stir in egg mixture.", "In a separate bowl, mix together, flour, baking soda, salt, and cinnamon.  Add to creamed mixture.", "Add oats and walnuts."], ingredients: ["raisins", "vanilla", "brown sugar", "white sugar", "baking soda", "cinnamon", "oats", "walnuts chopped"] },
    { title: 'Economical Casserole', description: 'It is cheap and easy to make. You can incorporate any vegetables that are either in season or that you and your family like. For larger servings use a roasting pan with lid.', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Comfort", "Healthy"], diets: ["Low-Carb"], steps: ["Place in a large casserole dish in this order: Peeled and thinly sliced potatoes, sliced carrots, sliced onions, peas and rice.", "Arrange one layer (only) of sausages on top and if desirable sprinkle with salt and pepper.", "Combine soup and water and pour over the sausages.", "Cover.", "Bake in a moderate oven for 1 hour.", "Remove lid and continue baking for 15 minutes."], ingredients: ["medium potatoes", "onions", "carrots", "frozen peas", "grated cheese", "water", "sausage", "uncooked rice"] },
    { title: 'Spicy Lentils With Mushrooms', description: '"Labhia aur khumbi" - modified from Madhur Jaffrey\\\\\'s Indian Cooking (I think). (Originally used black-eyed beans, 6T oil and 250g mushrooms.)', cuisine: 'Japanese', difficulty: 'Medium', time: 120, moods: ["Healthy", "Comfort"], diets: ["Low-Fat", "Vegan", "Vegetarian"], steps: ["Gently fry onion, cumin seeds, cinnamon stick, garlic, &amp; mushrooms in oil.", "Add remaining ingredients, except for salt and fresh coriander.", "Simmer for about an hour.", "Add salt and pepper.", "Remove cinnamon stick.", "Garnish with fresh coriander."], ingredients: ["large onion", "cumin seed", "cinnamon sticks", "garlic cloves", "mushrooms", "chopped tomatoes", "brown lentils", "water"] },
    { title: 'Roasted Potatoes in Olive Oil and Herbs', description: 'For my 46th birthday my husband treated me to a one-evening cooking course. It must have been one of the most enjoyable evenings I\\\\\'ve ever had. This recipe is from that course. It was a meat-laden course, but these potatoes served as the perfect foil to the meal.', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Festive", "Healthy"], diets: ["Vegan", "Vegetarian", "Low-Sodium"], steps: ["Preheat the oven to 250 degrees centigrade.", "Do not peel the potatoes.  Cook them in boiling water until soft.  Cool until the potatoes are comfortable to hold in your hand.", "Halve the cooked potatoes and score the undersides in a crisscross pattern.  Transfer them to a large bowl.", "Add the olive oil and fresh herbs to the bowl.  Mix well until the potatoes are all coated.", "Place the potatoes cut side up in a roasting pan and roast in the oven for 30 minutes."], ingredients: ["potato", "olive oil", "garlic cloves", "salt", "coarse ground black pepper", "rosemary", "oregano"] },
    { title: 'Tandoori Chicken', description: 'Enjoy!', cuisine: 'Japanese', difficulty: 'Medium', time: 60, moods: ["Light", "Comfort", "Quick"], diets: [], steps: ["Place the yoghurt, oil, onions, garlic, ginger and lemon juice and all the spices in a bowl and mix well.", "Spread over and around the skewers and marinate chicken for 24 hours turning a couple of times.", "Cook chicken skewers suspended over the coals in a hot kettle BBQ (or BBQ with a lid).", "After around 5 minutes when the chicken is well browned, turn the chicken over to cook on the other side.", "This may depend on the your oven heat.", "Replace the lid and cook for another 5 minutes or so until the chicken flesh is just set."], ingredients: ["chicken thighs chicken breasts", "olive oil", "medium onion chopped", "garlic cloves", "grated gingerroot", "lemon juice", "tomato paste", "saffron"] },
    { title: 'Indian Texas Casserole #RSC', description: 'Ready, Set, Cook!  Reynolds Wrap Contest Entry.  My family loves Indian food, but we live an hour from the nearest Indian restaurant. Texas is not very close to India, but we do what we can! Quick and easy, spicy!', cuisine: 'Indian', difficulty: 'Medium', time: 45, moods: ["Quick", "Festive", "Comfort"], diets: [], steps: ["One large casserole dish (9x13).", "One sheet of heavy duty Reynolds Wrap \u2013 enough to line the entire pan and enough to cover the top when ingredients go inches.", "Preheat oven to 350. Line the casserole dish with the Reynolds Wrap. Brown ground beef in a saucepan, breaking it up as you go. No need for any additional oil or shortening, just  put the beef in the pan and cook on medium heat until browned. While it is browning: Peel and then dice the large potato", "Stir gently, just to incorporate the spices and distribute all the ingredients more or less evenly, and taste the broth you get. Adjust flavor to your liking (salt, spiciness). Cover with the flap of Reynolds Wrap. It does not have to be sealed, just covered.  Slide carefully into the oven on the mi", "When your casserole is ready, remove carefully from the oven. In a small to medium bowl, put your sour cream, water and flour. Whisk it with a fork until smooth- about 20 seconds. Stir it into your still bubbling casserole. It will thicken the sauce and incorporate all the flavors.", "Best part, other than the flavor, is that if you did it right, the Reynolds Wrap means no clean up of the casserole dish!"], ingredients: ["russet potatoes", "black beans", "ground beef", "cherry tomatoes", "corn", "water", "chicken bouillon granules", "hot curry powder"] },
    { title: 'Ba-Nana\\\'s Bread', description: 'My favorite banana bread, I like to use unbleached flour and sugar but you could use which ever you choose.  Also, this recipe makes about six 8 inch loaves...several people want one when I make them so have to make enough for everyone.', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Comfort"], diets: [], steps: ["Heat oven to 350.", "Spray six 8 inch loaf pans with cooking spray containing flour.", "Sift flour, salt, and baking soda in a large bowl.", "In a separate bowl, mix together the butter and sugar until smooth, mix in vanilla extract until blended.", "Stir in bananas, eggs, and pecan pieces.", "Mix liquid and dry mixtures together."], ingredients: ["flour", "sea salt", "baking soda", "creamy butter", "cane sugar", "pure vanilla", "mashed bananas", "pecan pieces"] },
    { title: 'Healthy, Delicious Breakfast for One!', description: 'Quick and nutritious breakfast or snack.  Note: omit salt or replace with sugar if watching sodium intake.', cuisine: 'American', difficulty: 'Easy', time: 15, moods: ["Quick"], diets: [], steps: ["Toast english muffin, and place muffin halves face-up in a bowl.  Spoon cold yogurt on top of muffin halves.", "Meanwhile, chop apple, and put chopped apple and dates in a microwave-safe container.  Cover with water, sprinkle with salt, and microwave on high for 1 minute.  Stir, and microwave for 1 more minute.  Remove from heat.", "Pour microwaved contents over yogurt and muffins.  Let sit for 1-2 minutes, and dig in with a fork or spoon!", "Optional--can use flavored yogurts, and/or top with fresh berries or honey, etc."], ingredients: ["whole wheat", "fat - free yogurt", "apple", "dates chopped"] },
    { title: 'Aioli Dressing (South Beach Diet Phase 1)', description: 'from newest book. Haven\\\\\'t tried.', cuisine: 'American', difficulty: 'Easy', time: 15, moods: ["Quick", "Light"], diets: [], steps: ["Mix garlic with salt. Stir into mayonaisse. Whisk in half and half, lemon juice and and dijon. Season with salt and pepper to taste."], ingredients: ["garlic cloves", "salt", "low - fat mayonnaise", "fat", "fresh lemon juice", "dijon mustard", "fresh ground"] },
    { title: 'Leg of Lamb (Crusted Herbed With Roasted Garlic Sauce)', description: 'I took a recipe from The Plaza Hotel in New York & I made several changes & modifications.', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Festive", "Comfort", "Healthy"], diets: [], steps: ["In a roasting pan with very hot extra-virgin olive oil, sear the lamb, fat side down first, until golden.", "Then turn lamb over and sear the other side.", "Remove from heat and allow to rest for 5 minutes.", "Brush the mustard onto both sides of the seared lamb.", "Season with salt and pepper.", "Mix all of the herbs together."], ingredients: ["lamb", "virgin olive oil", "dijon mustard", "salt fresh ground pepper", "fresh thyme leave", "fresh rosemary leaf", "fresh sage leaf", "fresh flat - leaf parsley"] },
    { title: 'Chicken Chardonnay', description: 'Based this off of a chicken marsala recipe and made the rest up.  Very tasty.', cuisine: 'French', difficulty: 'Medium', time: 45, moods: ["Quick", "Festive", "Comfort"], diets: [], steps: ["Cut up all Chicken Breasts into bite sized cubes.", "melt 3 tablespoons of the butter in a large skillet.", "mix together the flour and the salt and pepper meant for the batter.", "Carefully coat all chicken cubes and brown in skillet.", "Remove and place in a shallow dish and cover (this keeps juices in).", "melt down the rest of the butter."], ingredients: ["boneless chicken breasts", "flour", "pressed garlic cloves", "thyme", "white wine chardonnay", "swanson chicken broth"] },
    { title: 'Melting in the Mouth Spinach & Potato Curry', description: 'Spinach never tasted like this ever before !!!! A must try !!!', cuisine: 'Japanese', difficulty: 'Easy', time: 30, moods: ["Quick", "Festive", "Healthy"], diets: ["Vegetarian"], steps: ["Heat oil in a heavy-bottomed pan.", "Add fennel seeds.", "Let them crackle.", "Add onion, green chillies, garlic, ginger paste and saut\u00e9 till it turns pinkish brown.", "Add salt, turmeric and black pepper powder.", "Saut\u00e9 for 3-4 seconds and add tomato puree."], ingredients: ["spinach", "big potatoes", "tomato puree", "onion paste", "garlic paste", "ginger paste", "chopped green chilies", "black pepper"] },
    { title: 'Sunburst Salad', description: 'Fantastic recipe from a cookbook I\\\\\'m editing. It\\\\\'s technically a slaw because of the cabbage, but it\\\\\'s nothing like slaw.', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick", "Festive", "Light"], diets: [], steps: ["For the salad, combine cabbage, carrots, onion and bell peppers in a bowl; set aside.", "For the dressing, combine oil, vinegar, dill weed, parsley, lemon juice, mustard, garlic, salt and black pepper in a food processor and process until well mixed. Toss salad with dressing and avocado and mix well."], ingredients: ["red cabbage", "carrot", "red onion", "orange bell pepper", "yellow bell pepper", "red bell pepper", "avocado", "olive oil"] },
    { title: 'Creamy Chocolate Frosting', description: 'My mother has made this recipe for years.  I don\\\\\'t know where it came from, but it is really easy and so much better than frosting from a can.', cuisine: 'American', difficulty: 'Easy', time: 45, moods: ["Quick", "Festive", "Healthy"], diets: [], steps: ["Melt butter in small sauce pan.  Add chocolate and stir constantly over very low heat until melted.", "Pour into a small mixing bowl.  Add the remaining ingredients.  Beat until well blended.", "Chill until spreading consistancy."], ingredients: ["baking chocolate", "powdered sugar", "milk", "vanilla"] },
    { title: 'Baked Chicken Supreme  T-R-L', description: 'I\\\\\'m always on the lookout for easy chicken recipes. I found this one when I was searching for a recipe by the same name, but different! Time does not include 2 hrs of marinating.', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Festive", "Comfort", "Quick"], diets: ["Low-Carb"], steps: ["In a marinating bowl, combine sour cream, lemon juice, Worcestershire sauce, celery salt, paprika.", "Add chicken and marinate for 2 hours.", "Preheat oven at 350\u00baF.", "Remove chicken from marinade.", "Roll chicken in bread crumbs.", "Melt the butter and drizzle over chicken."], ingredients: ["skinless chicken breasts", "sour cream", "lemon juice", "worcestershire sauce", "celery salt", "paprika", "breadcrumbs chicken"] },
    { title: 'Perfect Boneless Beef Roasts', description: 'This easy cooking method allows you to cook PERFECTLY tender boneless beef roasts (from rare to medium-well) of almost any size, as long as the roast is at least 2-1/2 to 3-inches thick.  I\\\\\'ve used this method for 30+ years, and find it\\\\\'s a lifesaver when I\\\\\'m having company and want a', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick", "Festive", "Healthy"], diets: ["Low-Sodium", "Low-Carb"], steps: ["NOTE:  The success of this recipe will depend upon how accurate the temperature of your oven is and how will it retains heat.  Adjust cooking time +/- according to your individual oven.", "IMPORTANT: Determine the EXACT weight of the roast from the meat wrapper.  Weight will determine how long to cook the roast.  If you have a probe meat thermometer with an alarm, I recommend using it.", "Preheat oven to 500 degrees.", "Cut all visible fat from the outside of the meat. Rub the entire outside of the roast with salt, pepper, or seasonings of your choice, such as thyme, garlic powder, etc.  (If using a probe thermometer insert it into center of the meat.  Set the temperature to your desired degree of doneness and set ", "Place roast in roasting pan and bake according to the following Cooking Chart:", "RARE - 3 minutes per pound."], ingredients: ["balsamic vinegar", "beef broth", "cornstarch"] },
    { title: 'Chorizo Garbage Plate', description: 'I love this Mexican breakfast! It\\\\\'s spicy, it\\\\\'s juicy, it\\\\\'s savory!', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick", "Festive", "Comfort"], diets: [], steps: ["Preheat flat grill or a nonstick skillet over medium-high heat.", "Add the vegetable oil, potatoes, diced onion, green pepper, jalapeno pepper, if using, and.", "chorizo. Mix together slightly. Cook for 4 to 8 minutes, flipping once. Add the tomato and eggs. Mix together and cook for another 2 to 3 minutes, flipping over once. Add cheese and cook until slightly melted. Mix hash together to distribute cheese and tomatoes throughout.", "Serve with toast or tortillas."], ingredients: ["vegetable oil", "shredded potatoes hash browns", "diced onion", "green pepper", "diced jalapeno pepper", "ground chorizo sausage", "diced tomatoes", "shredded cheddar cheese"] },
    { title: 'Moist and Delicious Banana Bread', description: 'This is my favorite recipe for banana bread, its adapted from a Martha Stewart recipe. It is easy to make, and its sooooo scrumptious!', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Festive"], diets: [], steps: ["Cream butter and sugars until white and fluffy.", "Add the eggs and mix until incorporated.", "Add all the dry ingredients and mix until just combined.", "Add bananas, sour cream, and vanilla; mix to combine.", "Stir in nuts, and pour into prepared pan.", "Bake at 350 for 1 hour to 1 hour 10 mins."], ingredients: ["butter", "brown sugar", "granulated sugar", "baking soda", "nutmeg", "cinnamon", "mashed banana", "vanilla"] },
    { title: 'Hummus Bi Tahina Chickpea Spread with Sesame Seed Paste', description: 'I found this great recipe on Food Channel', cuisine: 'Japanese', difficulty: 'Easy', time: 15, moods: ["Quick", "Festive", "Healthy"], diets: ["Vegetarian"], steps: ["In a food processor, fitted with a metal blade, combine the chickpeas, lemon juice, tahini paste, and garlic.", "Process until smooth.", "With the machine running, add the olive oil, a little at a time.", "Season with salt and pepper.", "Spoon the humus in the center of a large platter.", "Drizzle the hummus with olive oil."], ingredients: ["canned chick - peas", "lemon juice", "tahini paste", "olive oil", "ground black pepper", "olive oil", "kalamata olive", "fresh pita bread"] },
    { title: 'Low-Sodium Cabbage Soup Diet Recipe All Fresh', description: 'The Cabbage Diet Soup is a long time known great soup. However, recently, I have been trying to keep the sodium down in all my cooking to keep the blood pressure in check. When I looked at how much salt was in this recipe the way it was made, I realized that I could cut it down dramatically. But, wo', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Comfort", "Quick"], diets: [], steps: ["Blanch tomatoes by putting them in a pan with about half an inch of water in the bottom.", "Cook over medium heat until skins split.", "Place in a strainer and run under cold water, skin the tomatoes. and set aside.", "Chop all the vegetables into bite sized pieces.", "Saut\u00e9 the onions, peppers, celery and carrots in your soup pot along with the spices (including the beef bouillon) until slightly soft.", "Add cabbage and continue stirring until the cabbage wilts down."], ingredients: ["large tomatoes", "onion", "green peppers", "medium zucchini", "jalapeno peppers", "carrots", "fresh mushrooms", "celery"] },
    { title: 'Aunt Esther\\\'s Bread Pudding', description: 'A delicious, and easy-to-make bread pudding that will remind you of yesteryear... came from my very dear departed Aunt Esther.', cuisine: 'American', difficulty: 'Easy', time: 45, moods: ["Quick", "Festive"], diets: [], steps: ["Heat oven to 350 degrees. Place bread crumbs in 1-1/2 quart baking dish. Scald 1/4 cup butter in 2 cups milk. Blend in all remaining ingredients (the scalded milk/butter mixture, the sugar, the eggs, cinnamon and raisins) in the baking dish. Place baking dish in pan of hot water (with water 1 inch) "], ingredients: ["soft breadcrumbs soft bread cubes", "milk", "cinnamon", "raisins"] },
    { title: 'Cheesy Chicken &amp; Pierogie Casserole', description: 'I\\\\\'m can\\\\\'t remember where I found this recipe but we\\\\\'ve been making it for a few years.  DH & kids woof it down like candy and there are never any leftovers!', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Comfort"], diets: [], steps: ["season chicken with salt &amp; pepper to taste then cook chicken breasts in  pan, cube &amp; set aside.", "saute diced onion in the butter in chicken pan.", "cook spinach (I microwave it.) until thawed.", "cook pierogies according to package.", "mix chicken, onions, spinach &amp; soup together in same pan as before.", "spray large (9x13) casserole dish with oil."], ingredients: ["mrs potato cheddar pierogies", "onion", "frozen boneless chicken breasts", "spinach", "mushroom soup", "shredded cheddar cheese", "salt pepper"] },
    { title: 'Pat\\\'s Coney Sauce No. 15', description: 'My top coney sauce. Enjoy!', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Festive", "Quick", "Healthy"], diets: ["Low-Carb"], steps: ["Brown the burger and the sausage in a covered pot. Break it up while stirring.", "Drain the grease and discard it.", "Return the drained burger/sausage blend to cooking pot and add all other ingredients, EXCEPT for the grape jelly if you elect to use it. Bring to a boil, then immediately reduce heat to a simmer (covered) for 90 minutes, stirring frequently. Add the grape jelly (OPTIONAL) in the last five minutes of", "If it needs thinned at any point, just add a little additional chicken stock.", "Serve on hot dogs with tangy mustard, finely diced onions on steamed hot dog buns.", "NOTE: I use the cheaper grade hot dogs to grind up such as the ones that include chicken and pork. Beef franks do not impart much flavor. Also, I prefer this sauce without the jelly but that is a personal taste issue -- you can decide at the last minute since that is when any jelly gets added, or yo"], ingredients: ["italian sausages", "hot dogs", "white onion", "green bell pepper", "vegetable juice", "chicken stock", "ketchup", "yellow mustard"] },
    { title: 'Mamaw Betty\\\'s Barbecue Sauce', description: 'Our Mamaw Betty has made this for as long as anyone can remember. It\\\\\'s simple. I think that\\\\\'s why we like it so well. My kids love it on EVERYTHING.', cuisine: 'American', difficulty: 'Easy', time: 15, moods: ["Quick", "Healthy"], diets: ["Low-Fat"], steps: ["Mix all ingredients together in a medium saucepan.", "Simmer over low heat for 10 minutes, stirring occasionally.", "Remove from heat and let cool. Store in refrigerator. (I pour mine into a pint jar.)."], ingredients: ["ketchup", "black pepper", "light brown sugar", "vinegar", "frank  s red hot sauce"] },
    { title: 'Peanut Butter Bow Wow Cookies ( for Doggies)', description: 'We have a beautiful golden retriever named, Scout.  He is our joy!  I make these for him and he loves for it!  I even cut them out with a dog bone cookie cutter!', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick", "Festive", "Healthy"], diets: [], steps: ["In a large bowel, place all ingredients;.", "Stir until well mixed.", "Place mixture on floured surface and knead.", "Roll out dough to 1/4-inch thick.", "Cut into shapes of your choice.", "Place 1-inch apart on an ungreased baking sheet."], ingredients: ["whole wheat flour", "soy flour", "granulated sugar", "baking powder", "garlic salt", "peanut butter", "milk"] },
    { title: 'Fish House Cole Slaw', description: 'This is a vinegar base slaw. Great make ahead dish. Plus it\\\\\'s a safer slaw to take to a hot summer cook-out than your mayo base slaw. Also, it will keep for well over a week in the refrigerator.', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Healthy", "Light"], diets: ["Vegetarian", "Low-Sodium"], steps: ["Combine oil, sugar, vinegar and salt.", "Bring to a rapid boil.", "Slowly pour hot mixture over cabbage, peppers, onions and carrots.", "DO NOT STIR.", "Cover and let stand one hour, then refrigerate 24 hours.", "Stir and serve."], ingredients: ["small cabbage shredded", "sweet bell pepper", "onion", "carrots", "vegetable oil", "white vinegar"] },
    { title: 'Meaty Stuffed Onions', description: 'I got this recipe from a Taste Of Home magazine and haven\\\\\'t tried it yet. Posted for safe keeping.', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Comfort", "Healthy"], diets: [], steps: ["Peel onions and cut 1/2 inch off tops and bottoms. Place onions in a large sauce pan. Cover with boiling water. Cook until tender, about 20 minutes; drain. Cool slightly. Carefully remove inside layers of onion, separating into eight individual shells (refrigerate remaining onion for another use). D", "IN a skillet, cook beef and sausage over medium heat until no longer pink; drain.", "Add spinach, cook and stir for 2 minutes.", "Remove from the heat; stir in the remaining ingredients. Spoon into the onion shells.", "Place in greased 13 x 9 x 2 inch baking pan.", "Bake, uncovered, at 350 degrees for 15-20 minutes or until heated through and lightly browned."], ingredients: ["sweet onions", "ground beef", "pork sausage", "frozen chopped spinach", "stale bread", "beef broth", "parmesan cheese", "fresh parsley minced"] },
    { title: 'Spicy Bolivian Chicken', description: 'I don\\\\\'t know if this is authentic or not, and I haven\\\\\'t tried it yet (but will soon), but it sounds good. When I was in Bolivia they used peanuts in a lot of dishes that we ate, though I never had the chance to eat a chicken dish with peanuts.It says to serve with rice, but I think serving', cuisine: 'American', difficulty: 'Easy', time: 45, moods: ["Quick", "Healthy", "Comfort"], diets: ["Low-Carb"], steps: ["Season chicken with salt and pepper. In a large frying pan, heat oil over medium heat. Add chicken strips and saut\u00e9, stirring, for 3 minutes, until chicken turns opaque. Remove chicken and set aside.", "Add onions, bell peppers, and garlic to pan. Saut\u00e9 3 minutes, until onions are tender. Stir in hot pepper. Add broth and peanut butter. Simmer, stirring occasionally, for 10 minutes.", "Stir in chicken, peas, and bread crumbs. Cook 5 to 10 minutes, stirring occasionally, until sauce is thickened and mixture is heated through. Serve over rice."], ingredients: ["boneless skinless chicken breasts", "salt freshly ground black pepper", "vegetable oil", "large onions", "red bell peppers", "garlic cloves", "crushed red pepper flakes", "chicken broth"] },
    { title: 'Vegan Penne and Broccoli With Creamy Chickpea Sauce', description: 'This recipe is from One Dish Vegan by Robin Robertson. So many quick and easy recipes. Serving amount is a guess, since there was none given. This looks yummy so putting here for safekeeping.', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick", "Festive", "Healthy"], diets: ["Vegan", "Vegetarian"], steps: ["Heat the oil or water in a small skillet over medium heat. Add the garlic and cook until softened, about 1 minute. Remove from the heat and reserve.", "Cook the penne in a large pot of salted boiling water, stirring occasionally, until it is al dente(about 8 minutes). About 5 minutes before pasta is done cooking, add the broccoli. drain the cooked pasta and broccoli well and return to pot.", "While the pasta is cooking, combine the chickpeas and reserved garlic in a food processor. Add the broth, lemon juice, nutritional yeast, paprika, oregano, basil, pepper and salt to taste. Process until smooth.", "Pour the sauce over the pasta and broccoli and toss gently to combine. Serve hot."], ingredients: ["olive oil", "garlic cloves chopped", "cooked penne pasta", "broccoli florets", "chickpeas", "warm vegetable broth", "fresh squeezed lemon juice", "nutritional yeast mellow white miso"] },
    { title: 'Rolo Stuffed Ritz Crackers', description: 'These may, also, be partially dipped or completely coated in melted chocolate.  Note:  There are about 55 Rolo candies per bag.  Adjust recipe accordingly.', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick", "Festive"], diets: [], steps: ["Preheat oven to 325 degrees.", "Place Ritz cracker face-side down on a baking sheet. Top with an unwrapped Rolo.", "Bake for 3-5 minutes, until chocolate is soft and not melted. This takes only 3-5 minutes.  Top Rolo with another Ritz cracker.  Cool completely."], ingredients: ["crackers", "rolo chocolates"] },
    { title: 'Broccoli Bisque (WW)', description: 'From Slim Ways Quick Meals.', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick", "Healthy", "Comfort"], diets: ["Low-Fat", "Low-Sodium", "Low-Carb"], steps: ["In large saucepan, combine chopped broccoli, broth, onion, lemon juice, garlic, pepper and 1 cup water; bring to a boil.", "Reduce heat to medium; cook, covered, 12-15 minutes, until broccoli is tender, adding more water, 1 tablespoon at a time, if liquid begins to evaporate.", "Transfer broccoli mixture to food processor; puree until smooth.", "Return broccoli mixture to saucepan; stir in milk.", "Cook over low heat, stirring frequently, until hot (do not boil).", "Just before serving, ladle soup evenly into 4 soup bowls; garnish each portion with broccoli florets if desired."], ingredients: ["broccoli chopped", "sodium chicken broth", "medium onion chopped", "fresh lemon juice", "garlic clove minced", "ground black pepper", "skim milk", "broccoli floret"] },
    { title: 'Cabbage Au Gratin', description: 'This recipe is from "Any Blonde Can Cook."', cuisine: 'American', difficulty: 'Medium', time: 60, moods: ["Festive", "Quick"], diets: [], steps: ["Put cabbage in 9x13 baking dish.", "Combine next 3 ingredients in saucepan until thick.", "Pour mixture over cabbage.", "Top with breadcrumbs and cheese.", "Bake at 350 degrees for 30-45 minutes."], ingredients: ["cabbage chopped", "milk", "breadcrumbs", "cheddar cheese shredded"] },
    { title: 'Peach-Sour Cream Coffee Cake', description: 'I use fresh peaches when in season or fresh peaches that I have put up in the freezer. YUM!', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Festive", "Healthy", "Comfort"], diets: [], steps: ["Mix together streusel ingredients and set aside.", "In a mixing bowl, cream shortening and sugar until fluffy.", "Beat in eggs.", "Mix together dry ingredients; add to creamed mixture alternately with sour cream and vanilla.", "Beat until smooth.", "Pour half the batter into a 9-inch springform pan."], ingredients: ["chopped pecans", "brown sugar", "cinnamon", "butter flavor crisco", "baking powder", "baking soda", "sour cream", "vanilla"] },
    { title: 'Billy\\\'s Spaghetti Aglio e Olio for One or Two', description: 'Not your traditional Aglio e Olio. It has anchovies, almonds and lots of garlic If you don\\\\\'t like anchovies leave them out If you don\\\\\'t like garlic What\\\\\'s the matter you', cuisine: 'French', difficulty: 'Easy', time: 30, moods: ["Quick", "Comfort"], diets: [], steps: ["Cook spaghetti in a large pot of boiling salted water, stirring occasionally, until al dente; drain, reserving   cup pasta cooking liquid.", "Pour the olive oil into a cold skillet and sprinkle the sliced garlic over the surface. Cook over medium heat to slowly toast garlic, about 3 minutes.", "Add the anchovy fillets and cook over a low heat for another 3 minutes. Be careful that the garlic does not burn! If you must take the pan off the heat do!", "Add the olives, half the parsley, and the red pepper flakes and cook for another minute. The anchovy fillets will be pretty much dissolved by now   that s good!", "Add the drained spaghetti and half the almonds to the pan and gently mix it all together. If it seems too dry add some pasta water a little at a time.", "Pour the spaghetti mixture into a bowl and sprinkle the remaining almonds and parsley on top."], ingredients: ["spaghetti", "olive oil", "garlic cloves", "anchovy fillets", "green olives chopped", "fresh parsley", "red pepper flakes", "sliced almonds chopped"] },
    { title: 'Italian Meatballs', description: 'These are the meatballs my grandma used to make. They take a while, but it\\\\\'s worth it. They\\\\\'re great for parties. Serve in a crockpot; it will keep the meatballs warm. Don’t forget to provide guests with something to grab the meatballs with, such as toothpicks or miniature forks!', cuisine: 'French', difficulty: 'Medium', time: 120, moods: ["Comfort", "Healthy"], diets: ["Low-Carb"], steps: ["Combine all meatball ingredients.", "Form meatball mixture into 1 inch balls.", "Brown meatballs in skillet.", "Combine and mix sauce ingredients.", "Place meatballs in sauce, and let simmer for a minimum of \u00bd an hour."], ingredients: ["salt pepper", "italian hot sausage", "ground beef", "saltine crackers", "onion", "tomato sauce", "tabasco sauce", "garlic salt"] },
    { title: 'Oven Loaded Turkey Melts', description: 'This is a delicious recipe to use up any leftover turkey from the holidays! You can also make this using deli-sliced turkey. I have use provolone cheese in place of the mozza cheese. You can prepare these melts hours in advance, cover with plastic wrap and refrigerate until ready to bake.', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Festive", "Light"], diets: [], steps: ["In a bowl stir together the avacado with mayonnaise and garlic until well combined; season lightly with salt and pepper to taste.", "Divide and spread the mixture onto one side of the 4 bread slices.", "Top evenly with turkey slices, 1-2 tomato slices, 1-2 onion slices/rings, 2-3 bacon slices and lastly the mozza cheese slices (1 or 2 slices).", "Top with remaining bread slices.", "Carefully spread soft butter onto the outside of each sandwich.", "Place the buttered sandwiches on a baking sheet, then place a second baking sheet on top of the sandwiches."], ingredients: ["ripe avocados", "mayonnaise", "garlic powder fresh minced garlic", "pepper", "thick white bread whole wheat bread", "sliced turkey breast", "tomatoes", "red onion rings"] },
    { title: 'Algeo Family Applesauce Cookies', description: 'From the September 2008 Relish magazine.', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick", "Festive"], diets: [], steps: ["Preheat oven to 375.", "Combine shortening, brown sugar, and egg.  Stir well.", "Stir in applesauce.", "Combine dry ingredients, add to shortening mixture, and stir well.", "Fold in raisins and nuts.", "Drop by tablespoons onto a greased baking sheet."], ingredients: ["brown sugar", "applesauce", "all - purpose flour", "baking soda", "cinnamon", "cloves", "raisins", "chopped walnuts"] },
    { title: 'Easy French Dip', description: 'This is so incredibly easy and SO tasty! Just let it cook all day while you\\\\\'re working and you\\\\\'ll walk into a wonderful smelling house with dinner done!', cuisine: 'American', difficulty: 'Medium', time: 60, moods: ["Comfort", "Quick", "Healthy"], diets: [], steps: ["Place the roast and soups in your crockpot.", "Cook on low 6-8 hours.", "Remove roast and shred with fork and knife.", "Place shredded beef on roll/bread and if desired, top with shredded cheese.", "If you choose to top with cheese, put in toaster oven for a couple of minutes- just until cheese is melted.", "Reserve small portions of the wonderful juice in the crockpot for dipping!"], ingredients: ["roast", "french onion soup", "beef", "baguette italian roll", "mozzarella cheese shredded"] },
    { title: 'Moroccan Spiced Green Olives', description: 'A great addition to a buffet table or for an appetizer party.  Cook time is refrigeration time.', cuisine: 'African', difficulty: 'Medium', time: 60, moods: ["Healthy"], diets: ["Vegan", "Vegetarian", "Low-Carb"], steps: ["Heat first 8 ingredients in a  skillet over medium heat until fragrant, about 2 minutes.  Remove from heat and add olives; toss to coat.", "Stir in remaining ingredients.", "Refrigerate in an airtight container for at least 4 hours or up to 3 weeks.  The longer they marinate, the better they taste.", "Drain and serve at room temperature."], ingredients: ["cumin seeds", "fennel seeds", "coriander seeds", "cardamom", "red pepper flakes", "nutmeg", "cinnamon", "olive oil"] },
    { title: 'The Healthiest Bran Muffins You\\\'ll Ever Eat', description: 'I\\\\\'ve looked all over for inspiration! When my mother was in the hospital for by-pass surgery, I picked up a handout for heart healthy bran muffins. It became the basis for this recipe, but I\\\\\'ve added a number of very healthy additions. Customize this as you wish: choose different nuts, add', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick"], diets: [], steps: ["Preheat oven to 350\u00ba F. Line muffin tins with paper muffin cups.", "In a large mixing bowl, combine all the dry ingredients, including nuts and fruits.", "In a small mixing bowl, combine all the wet ingredients (milk, eggs, vanilla and oil).", "Make a well in the center of the dry ingredients and add the wet ingredients. Mix only until the dry ingredients are moistened.", "Fill the muffin cups about 2/3 full and bake for 15-20 minutes or until a toothpick inserted into the center comes out dry."], ingredients: ["oat", "wheat germ", "flax seed", "whole wheat flour", "gluten", "baking soda", "baking powder", "cinnamon"] },
    { title: 'Peanutty Stir-Fry', description: 'This was one of 4 recipes in Parenting magazine based on the precooked meatball.  I haven\\\\\'t tried this one yet, but the one i did try was great!', cuisine: 'Japanese', difficulty: 'Easy', time: 15, moods: ["Quick", "Comfort", "Healthy"], diets: [], steps: ["Cook noodles according to package directions and keep warm.", "Combine meatballs and broth in large skillet; bring to boil, reduce heat, and simmer for 5 minutes, stirring occasionally.", "Add vegetables; return to boil, then reduce to simmer, stirring occasionally.  After 5 minutes, or when vegetables are crisp-tender, add peanut-sauce, peanut butter, brown sugar, and cornstarch mixture; simmer for another minute, stirring, until slightly thickened.  Serve over noodles with additiona"], ingredients: ["cellophane noodles asian", "precooked meatballs", "reduced fat free beef broth", "frozen asian style vegetables", "peanut sauce", "peanut butter", "brown sugar", "cornstarch cold water"] },
    { title: 'Ham and Cheese Pies', description: 'This is an adopted recipe that I have not yet tried.  When I do, I will make comments or adjustments.', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick"], diets: [], steps: ["Combines all ingredients.", "Roll out puff pastry and spread with ingredients.", "Bake at 375 for 20 minutes until golden.", "Serve while hot."], ingredients: ["puff pastry", "ham", "cheddar cheese", "chives", "parmesan cheese"] },
    { title: 'Rocket and Broad Bean Potatoes', description: 'Baked potatoes stuffed with broad beans, rocket (or baby spinach leaves), tangy blue cheese, garlic and basil; and if it takes your fancy, topped with chopped bacon!  Adapted from a recipe on some \\\\\'Good for You\\\\\' cards from International Masters: a series focussing on health and nutrition. ', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Festive", "Healthy", "Light"], diets: ["Low-Fat", "Vegetarian", "Low-Sodium", "Gluten-Free"], steps: ["Preheat the oven to 220\u00b0C/425\u00b0-450\u00b0F/gas mark 7-8.", "Scrub the potato skins until they are clean and prick all over with a fork; sit the whole potatoes directly in the centre rack of the oven and cook for 1 hour and 15 minutes, or until very tender; remove the potatoes from the oven and allow them to cool for 10 minutes.", "Put the rocket (or baby spinach leaves), broad beans, blue cheese, garlic and basil in a food processor and pulse a few times or until it is roughly chopped and still chunky.", "Cut a deep cross in the top of each potato and gently open the potato using a knif or small spoon; spoon the rocket and broad bean mixture into the centre of each potato; sprinkle the chopped bacon (if using) on top, dividing it evenly between the four potatoes, and return the potatoes to the oven f", "NOTE: If using the bacon, you may like to half cook it in a pan before adding it to the potatoes."], ingredients: ["large potatoes", "baby spinach leaves", "frozen broad bean", "garlic cloves minced garlic", "fresh basil", "bacon fat"] },
    { title: 'Healthy, Vegan and Terrific Strawberry Pancakes', description: 'I found this recipe in the 2009 Vegetarian Journal (Issue One). I just made it this morning and it makes light, fluffy, melt-in-your-mouth delicious pancakes. Silly me for using boxed mixes all these years! I\\\\\'m sure you could substitute cow\\\\\'s milk if you don\\\\\'t have soymilk.', cuisine: 'American', difficulty: 'Easy', time: 15, moods: ["Quick", "Healthy"], diets: ["Vegan", "Vegetarian"], steps: ["Blend together dry ingredients.", "Add chopped strawberries and stir until coated.", "Make a well in the middle and add soymilk and oil.", "Blend well, but do not beat.", "Add more flour or soymilk if needed for the right consistency of the batter.", "Pour enough batter on a medium-hot griddle and flip when the edges look dry.  Keep in a warm oven until ready to serve."], ingredients: ["flour", "baking powder", "cinnamon", "fresh strawberries chopped", "canola oil"] },
    { title: 'Solo Poached Lemon Chicken and Vegetables', description: 'This is a toss and forget meal. The small amount of olive oil, and remembering to place the chicken on the bottom, will ensure that the meat is tender and moist. Any large frozen vegetable will work, but remember, Cooking is a Creative Sport.', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Comfort", "Healthy"], diets: [], steps: ["Preheat an oven to 400 degrees.", "Coat the chicken with the salt, pepper, and olive oil.", "Place the thawed chicken breast in the bottom of a 1 1/2 quart baking dish.", "Place the frozen vegetables on top of the chicken.", "Pour the juice from one lemon on last.", "Cover and bake for 30 minutes."], ingredients: ["boneless skinless chicken breast", "frozen vegetables caulflower broccoli carrots", "lemon", "black pepper", "olive oil"] },
    { title: 'Cauliflower &amp; Beet Soup', description: 'A really yummy and healthful blend of two of my favourite vegetables.  This soup is a beautiful bright purple colour and velvety smooth.  You may wish to make extra vegetables so you can enjoy them oven roasted - it\\\\\'s hard to put them all into the soup!  Can garnish with a dollop of sour cream ', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Comfort", "Healthy"], diets: ["Vegan", "Vegetarian"], steps: ["Preheat oven to 425 degrees.  Line a cookie sheet with parchment.", "Peel and slice the beets and onion.  Slice the cauliflower.", "Gather vegetables in a bowl and sprinkle with olive oil and salt and pepper to taste.  Toss together then lay out on the parchment.", "Oven roast the vegetables for 30 minutes or until tender.", "In a large sauce pot, heat the vegetable broth.  Add in the cooked vegetables then immersion blend until completely smooth."], ingredients: ["medium beets", "cauliflower", "medium onion", "olive oil", "vegetable broth"] },
    { title: 'Ruffle-Edged Pasta with Cauliflower and Parsley Sauce', description: 'A great way to get your vegetables. This is a good work night meal; it\\\\\'s simple, delicious and quick. You could make it even easier by purchasing chopped olives and a precut, prewashed vegetable mix from the produce section. Since the parsley gets put into the blender you don\\\\\'t need to be ', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick", "Comfort", "Healthy"], diets: ["Vegetarian"], steps: ["Put a large pot of salted water on to boil for the pasta.", "Puree parsley and oil in blender.", "Steam cauliflower for 5 minutes or until just tender.", "Add pasta to boiling water and cook until al dente; drain.", "Pour pasta back into pot and toss with the parsley sauce, cauliflower, olives and salt and pepper to taste."], ingredients: ["flat leaf parsley", "olive oil", "cauliflower", "pasta pasta", "pimento stuffed olive olive tapenade", "salt pepper"] },
    { title: 'Boston Brown Bread', description: 'This brown bread is easily mixed and fun to make in coffee cans since it is steamed instead of baked.', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Healthy"], diets: [], steps: ["Mix together milk and vinegar.", "Let mixture set at room temp for 15 minutes to allow the milk to sour.", "In a seperate bowl, spoon mix dry ingredients together.", "Add molasses and raisins to the milk.", "Add liquid mixture to dry ingredients.", "Beat until blended."], ingredients: ["milk", "vinegar", "cornmeal", "rye flour", "whole wheat flour", "baking soda", "molasses", "raisins"] },
    { title: 'Crustless Quiche Muffins', description: 'I got this recipe from a friend of mine and they are delicious!!!  I had never had quiche before and we loved these.  They are great for appetizers or even for a meal.  I hope you enjoy them as much as we do!!!', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Festive"], diets: [], steps: ["Preheat oven to 375 degrees.", "Spray muffin tins w/ cooking spray.", "Fry up the bacon (cooked crispy &amp; crumbled).  You can use the bacon grease to sautee the vegetables.", "Sautee onion and peppers, then add asparagus, then mushrooms and last of all the spinach.  All must be soft, but not overdone.", "Beat eggs until fluffy and add the cream, garlic salt, pepper and Italian seasonings.", "Add cheese and bacon; mix well with the eggs."], ingredients: ["heavy cream", "pecorino romano cheese parmesan asiago feta", "shredded cheddar cheese mexican blend", "garlic salt", "pepper", "italian seasoning", "red onion", "asparagus"] },
    { title: 'Bread Pudding', description: 'Mom\\\\\'s recipe. Delicious!!!! I am posting a Vanilla Sauce (Recipe #16132) to go with this. Enjoy!', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Festive", "Healthy", "Comfort"], diets: [], steps: ["Cover raisins with brandy or water.", "Set aside.", "Melt butter or margarine.", "Break up bread, set aside.", "Combine brown sugar, cinnamon, allspice.", "Reserve 3 tablespoons of this mixture for topping."], ingredients: ["raisins", "brandy water", "butter margarine", "dry bread", "brown sugar", "cinnamon", "vanilla", "milk scald"] },
    { title: 'Easy Chocolate Ice Cream', description: 'This recipe came in the booklet with my ice cream machine.  It\\\\\'s easy to make and delicious -- nice and chocolatey!', cuisine: 'American', difficulty: 'Easy', time: 45, moods: ["Quick", "Festive", "Healthy"], diets: ["Low-Sodium"], steps: ["Place cocoa and sugars in a bowl and combine well.  Add the whole milk and mix with a mixer until cocoa and sugars are dissolved ~ 1 to 2 minutes.  Stir in the heavy cream and vanilla.  If not freezing immediately, cover and refrigerate until ready to use.", "Turn on ice cream machine and pour mixture into freezer bowl.  Let the machine mix until thickened ~ about 25-35 minutes.  The ice cream will be soft and creamy.  If you like firmer ice cream, transfer ice cream to an airtight container and freeze for approximately 2 hours.  Remove from the freezer "], ingredients: ["unsweetened cocoa powder", "brown sugar", "whole milk", "cream", "vanilla"] },
    { title: 'Apple Cake With Warm Caramel Pecan Sauce', description: 'I just tried this and thought I\\\\\'d share.  The sauce takes this over the top.', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Festive", "Healthy"], diets: [], steps: ["Cream butter and sugar and add eggs.  Add flour, spices, soda, salt and vanilla.", "Mix for one minute. Mix in apples and nuts.", "Pour into a 9-inch spare pan and bake for 40-45 min at 350*.", "For Sauce:.", "Melt butter in saucepan; add nuts and cook, stirring over medium-high heat until toasted, about 3 minute.", "Add brown sugar and cream and cook, stirring, until sauce boils."], ingredients: ["nutmeg", "baking soda", "vanilla", "tart apples", "pecans chopped", "pecans chopped", "brown sugar", "whipping cream"] },
    { title: 'Summer Trifle', description: 'I got this recipe from "The Mike and Matty Show" -- does anyone remember it (vintage 1994). It is very easy and very yummy! Prep time includes chilling time.', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Festive", "Healthy"], diets: [], steps: ["Cut pound cake loaf in half lengthwise and then in 1/2-inch slices.", "Line sides and bottom of clear bowl with a layer of pound cake.", "Spoon in 1/2 pudding, 1/2 bananas, 1/2 cherries, 1/2 peaches and 1/2 strawberries.", "Mix aromatic bitters with pineapple juice; sprinkle half of juice over fruit.", "Put in another layer of pound cake and remaining pudding, bananas, cherries, peaches and strawberries.", "Fold yogurt into whipped cream."], ingredients: ["instant vanilla pudding", "cake", "banana", "peach", "maraschino cherry", "fresh strawberries", "pineapple juice", "aromatic bitters"] },
    { title: 'When in Rome Alfredo Pie', description: 'Ready, Set, Cook! Special Edition Contest Entry: This is a Alfredo sauce with lots of veggies and spices. Poured into a Hash brown crust. the best part is most of the cooking is done in the microwave. This recipe is fast and easy to put together on a busy night and fairly healthy.  I found a recipe ', cuisine: 'French', difficulty: 'Medium', time: 45, moods: ["Quick", "Festive", "Comfort"], diets: ["Vegetarian"], steps: ["Beat 2 eggs,1/2 teaspoons salt,1/4 teaspoons black pepper, and 1 teaspoon extra virgin olive oil together  in a bowl. Stir in the Simply Potatoe hash browns and 1/2 cup asiago cheese.Spred the potato mixtue in the bottom and up the sides of  a sprayed  9 inch, deep dish pie plate. Microwave for 5 mi", "In a 10 inch skillet heat 1 tablespoon extra virgin olive oil over medium high heat. Saute the mushrooms, green onions, and garlic for 10 minutes. Add in the wine and cook 3 more minutes. Remove from the heat and stir in the artichokes, spinach, alfredo sauce, 2 beaten eggs, cayenne, Italian seasoni", "Pour the mixture into the potato crust and cover with plastic wrap. Microwave on high for 6 minutes. Uncover and sprinkle the paprika and rest of the asiago over the top. Microwave on high for 5 more minutes, uncovered.", "Let set for 15 minutes. Spread the diced tomatoes over the top and serve."], ingredients: ["virgin olive oil", "black pepper", "potatoes reg shredded hash", "asiago cheese shredded", "virgin olive oil", "baby portabella mushrooms", "green onion", "minced garlic cloves"] },
    { title: 'Momma\\\'s 5 - Cup Fruit Salad', description: 'A wonderful mixture of fruit and sour cream that is absolutely delicious.Best of all...simple to make!', cuisine: 'American', difficulty: 'Easy', time: 15, moods: ["Quick", "Festive", "Healthy"], diets: ["Low-Sodium"], steps: ["Mix marshmallows, coconut, oranges, pineapple, and sour cream together in a bowl.", "Cover and refrigerate until flavors blend, 5 to 6 hours."], ingredients: ["miniature marshmallow", "pineapple tidbits", "mandarin section", "shredded coconut", "sour cream", "pecan", "cherries"] },
    { title: 'Chocolate Tofu Pudding', description: 'this came in my email described as "Intense, heavenly chocolate is all you\\\\\'ll think about when you taste this dessert, though it\\\\\'s packed with all the good things found in tofu. Make sure the tofu is smooth before adding the chocolate mixture." this keeps refrigerated for up to 2 days.', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Festive", "Healthy"], diets: ["Vegetarian"], steps: ["Puree tofu in a food processor, scraping down the sides as needed, until completely smooth.", "Combine chocolate and cocoa in a medium bowl.", "Add boiling water and stir with a wooden spoon until the chocolate has melted and the mixture is smooth.", "Stir in vanilla and orange zest.", "Mix in splenda, a little at a time, until smooth.", "Add the chocolate mixture to the processor; puree until smooth and well blended, scraping down the sides as needed."], ingredients: ["lowfat silken tofu", "bittersweet chocolate", "unsweetened cocoa powder", "boiling water", "vanilla", "orange zest", "splenda sugar substitute"] },
    { title: 'Woman\\\'s World Breakfast Cookie Bar', description: 'Very dense, chewy, and not too sweet filling breakfast bar, portable and easy after the first mix and bake.', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Festive", "Healthy"], diets: [], steps: ["Mix all ingredients except egg whites and flour and soda together in a large bowl.", "Sift the flour and soda together and add to the bowl.", "Beat the egg whites foamy and stir in well.", "It will take quite an effort to mix it all together well.", "Put into a parchment lined jelly roll pan and pat down as evenly as possible.", "Keep your hands moistened while you do this."], ingredients: ["date sugar date sugar", "rice syrup agave syrup water", "oats", "natural bran oat bran", "prune puree", "canola oil", "vanilla", "cocoa powder"] },
    { title: 'Peas and Prosciutto', description: 'Have you ever eaten at a nice Italian restaurant and had peas served with your meal?  These peas taste very similar to what I have experienced in a nice Italian restaurant.', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick"], diets: [], steps: ["Heat oil in large saute pan. Add 1 clove garlic and cook for a few minutes just to flavor the oil. Discard the garlic.", "Add onion and saute 3 minutes.", "Stir in prosciutto and saute for 3 more minutes.", "Add peas, broth, salt, and pepper. Cook another 5 minutes.", "Strain off liquid and serve."], ingredients: ["flavored olive oil", "chopped onion", "prosciutto", "cans peas small sweet peas", "chicken broth"] },
    { title: 'Black Bean Quesadillas', description: 'These are a simple appetizer.', cuisine: 'Mexican', difficulty: 'Easy', time: 30, moods: ["Quick", "Healthy"], diets: [], steps: ["In a bowl, mash the drianed and rinsed beans.", "Add salsa and mix together.", "Place 1/2 of the tortillas on a baking sheet.", "Put equal amounts of bean mixture on each tortilla.", "Put equal amounts of shredded cheese on top of beans.", "Cover with remaining tortillas."], ingredients: ["black beans", "salsa", "tortillas", "cheddar cheese shredded"] },
    { title: 'Peach and Ginger Salsa', description: 'A lovely fresh salsa recipe from my Australian/Mexican cookbook.', cuisine: 'American', difficulty: 'Easy', time: 15, moods: ["Quick", "Festive", "Healthy"], diets: ["Low-Fat", "Vegan", "Vegetarian", "Low-Sodium"], steps: ["Combine all ingredients and mix gently.", "Serve immediately."], ingredients: ["ripe peaches", "grated fresh ginger", "sliced green onions", "chopped fresh coriander", "lime juice"] },
    { title: 'Easy GingerSnap Cookies!', description: 'I found this in a adorable vintage neighborhood cookbook collection, it is so simple,almost too easy! 8)', cuisine: 'American', difficulty: 'Easy', time: 15, moods: ["Quick", "Festive", "Healthy"], diets: [], steps: ["Pretheat oven to 425.", "Grease a baking sheet.", "Heat molasses in saucepan, until it boils.", "Put the butter into large mixing bowl, combine hot molasses.", "Sift together salt, baking soda and flour  .", "Blend in ginger."], ingredients: ["molasses", "ginger", "baking soda"] },
    { title: 'BBQ Pineapple Slices', description: 'These slices are so good you could serve them as dessert but I love them with BBQ ham steak', cuisine: 'American', difficulty: 'Easy', time: 15, moods: ["Quick", "Festive", "Healthy"], diets: ["Low-Fat", "Low-Sodium", "Gluten-Free"], steps: ["Mix all the ingredients except the pineapple.", "Have the BBQ hot&amp; ready.", "Grill both sides of the pineapple for 3 minutes each side until lightly browned Brush the slices with the the sauce (be generous) on both sides while you are BBQing the slices Serve warm."], ingredients: ["pineapple", "lime juice", "brown sugar", "honey mustard", "cumin", "cayenne"] },
    { title: 'Spiced Ham and Lentil Soup', description: 'I was just playing with soup and it turned out fantastic. I wasn\\\\\'t able to keep enough around to freeze any, so next time I\\\\\'m doubling the recipe.', cuisine: 'American', difficulty: 'Easy', time: 120, moods: ["Festive", "Comfort", "Quick"], diets: [], steps: ["Mix all ingredients. Bring to a boil.", "Lower heat to simmer and let cook for about 2 hours, or until lentils are soft."], ingredients: ["water", "beef broth", "lentils", "ham", "red onion", "roasted peppers diced chili peppers", "carrot", "molasses"] },
    { title: 'Rocket, Ricotta and Potato Frittata', description: 'a Women\\\\\'s Weekly recipe', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick", "Festive", "Light"], diets: ["Low-Carb"], steps: ["Fry bacon till crisp and browned.", "Stir in potato and chopped rocket.", "Whisk eggs, parmesan and cream together in jug.", "Season to taste.", "Pour over potato mixture.", "Cook on medium  for 6 - 8 minutes till almost set."], ingredients: ["bacon", "potatoes", "parmesan cheese", "ricotta cheese"] },
    { title: 'Grandma\\\'s Old Fashioned Coffee Cake', description: 'This is another of our', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Light", "Healthy"], diets: [], steps: ["Mix oil, buttermilk, egg and vanilla.", "Add flour, sugar, soda, cocoa and salt.", "Mix all together well and add coffee.", "Pour into lightly greased and floured 8X13X2 sheet pan (I have made it in a bundt pan too).", "bake 350F degrees for 30 minutes."], ingredients: ["oil", "buttermilk", "vanilla", "flour", "baking soda", "cocoa", "boiling coffee"] },
    { title: 'Oregano Carrots', description: 'I love these carrots. This is a great side dish recipe.', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Healthy", "Quick"], diets: ["Low-Sodium", "Low-Carb"], steps: ["Wash and peel carrots.", "Slice carrots 1/4 inch thick.", "Make one layer of carrots, butter and oregano.", "Repeat.", "Add two Tablespoons of water.", "Cook for one hour at 350 degrees."], ingredients: ["sliced carrot", "margarine", "dried oregano"] },
    { title: 'Spanish-Style Grilled Vegetables With Breadcrumb Picada', description: 'This recipe is from the July 2007 issue of Bon Appétit.  Picada is a Spanish flavoring made with garlic, herbs, and ground nuts.In this recipe, the breadcrumbs replace the nuts. Posted for Spain - ZWT #5.  This will serve 6-8 people as a side dish or 4 as the main of a vegetarian meal.', cuisine: 'Spanish', difficulty: 'Medium', time: 45, moods: ["Quick"], diets: [], steps: ["Prepare grill to medium heat.", "Arrange vegetables on baking sheets and brush with oil. Sprinkle with salt and pepper to taste.", "Grill peppers, skin side down and without turning, until blackened and blistered, moving occasionally for even cooking, about 10 minutes. Enclose in plastic bag. Let stand until skins loosen, about 30 minutes.", "Grill eggplants and zucchini until charred and tender, turning and rearranging for even browning, 5 to 6 minutes.", "Place on foil lined baking sheet. Peel peppers. Transfer to sheet with eggplants and zucchini.  Keep veggies warm.", "Heat 3 tablespoons olive oil in medium skillet over medium heat. Add garlic and crushed red pepper; stir until fragrant, about 30 seconds."], ingredients: ["red bell peppers", "japanese eggplants", "green zucchini", "virgin olive oil", "virgin olive oil", "garlic cloves", "crushed red pepper", "panko breadcrumbs japanese breadcrumbs"] },
    { title: 'Sauerkraut Rye Bread (Sugar Free)', description: 'Practically a meal by itself, this bread sounds packed with both taste and texture. Cannot wait to try this for a reuben sandwich. Start the "sponge" anywhere from 6 to 18 hours before you plan to make the bread. Found on the www.ILovePickles.com web site. Times are a guess-timate and do not include', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Healthy"], diets: ["Low-Fat"], steps: ["SPONGE (6-18 hours in advance): In a large bowl, mix 2 cups of rye flour, yeast and 1 1/2 cups of water until smooth.", "Cover with plastic wrap and let stand at room temperature for at least 6 but no more than 18 hours (the mixture rises and falls as it ferments but should appear as a soft doughy mass when ready).", "Add sauerkraut, 1/2 cup warm water, shortening, caraway seeds, salt and 1 cup of rye flour; mix well with wooden spoon.", "Gradually stir in 3 cups of the unbleached flour to make a stiff dough (the dough will be quite sticky at first, becoming smoother and more elastic as flour is added in next steps).", "Turn dough out onto floured surface and knead for 10 minutes, adding enough of the remaining flour to keep dough from sticking.", "Knead until smooth, elastic and no longer sticky."], ingredients: ["whole rye flour", "active yeast", "warm water", "sauerkraut", "warm water", "vegetable shortening", "caraway", "whole rye flour"] },
    { title: 'Spinach, Ricotta and Tofu (Optional) Stuffed Shells (Oamc)', description: 'These are delicious!  I created this recipe because I wanted shells that were a little healthier than what was already posted.    Use only Ricotta or (or only tofu) if preferred, doubling the quantity.       This makes a LOT of shells (around 30).  If you half it, just use one large egg or two small', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Healthy"], diets: ["Vegetarian"], steps: ["Cook pasta shells according to box directions, drain and rinse with cool water.  Set aside.", "Sautee onions and garlic over medium, stirring occasionally, until onions are translucent (careful not to burn garlic).  Take off of heat and allow to cool off a bit.", "Mash together spinach, tofu, Ricotta cheese, 1 cup Parmesan cheese, eggs, onions and garlic, s&amp;p and nutmeg.", "Fill shells generously, about a heaping tablespoon each.  You can modify as you go.", "***TO FREEZE:*** Put shells on a baking sheet so that they are not touching.  Freeze uncovered for about 20 minutes, then toss into a freezer bag.  This way they will not stick together.", "To bake shells right away: Preheat oven to 350.  Spread a few tablespoons spaghetti sauce on the bottom of a large casserole.  Put shells in, filling-side up.  Top with remaining sauce and parmesan cheese.  Cook covered for 30 minutes and uncovered for 5 or 10 minutes."], ingredients: ["jumbo pasta shells shells", "frozen chopped spinach", "firm tofu", "skim ricotta cheese", "shredded parmesan cheese", "small onions medium onion", "garlic cloves minced", "ground"] },
    { title: 'Pizza Perfection', description: 'We make our own pizzas once a week and LOVE them! Sometimes we\\\\\'ll buy a plain frozen cheese pizza (Orv\\\\\'s is my favorite), other times we\\\\\'ll roll our own dough (usually Chef  Boyardee or the generic version). In either case we pile on the spices and vegetables and sinfully indulge. The', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick", "Comfort"], diets: [], steps: ["Thinly slice garlic, slice mushrooms, shred carrot, chop peppers and spinach, and slice olives. Apply spices to pizza, place mushrooms over pizza. Apply remaining vegetables and bake at 425 degrees for 10 - 12 minutes until crust is golden brown. Serve with additional pizza sauce for dipping if desi"], ingredients: ["frozen cheese pizzas crust", "garlic cloves", "spinach", "carrot", "red pepper", "yellow pepper", "mushrooms", "black olives"] },
    { title: 'Thai Duck Salad (Yum Phet)', description: 'This is a recipe that I learned when I attended a cooking class at the Oriental Hotel in Thailand last year. Most Ingredients can be found in any Asian market. We love salads for dinner on any summer day, especially if it is hot.', cuisine: 'Japanese', difficulty: 'Easy', time: 30, moods: ["Quick", "Festive", "Light"], diets: [], steps: ["In a large bowl, squeeze the juice of the limes.", "Add fish sauce and Chili Paste. Wisk until Chili Paste dissolves in sauce.", "Add sugar and red chili powder. Mix well for 1 minute.", "Add duck, red Onion, green Onions, cilantro leaves. Mix well until all ingredients are covered.", "Optionally, add tomatoes and cucumber and mix well.", "On a plate, place the lettuce so they form a bed."], ingredients: ["chinese barbecued duck deboned fat", "red onion", "sprigs green onions", "cilantro leaves", "chili paste soya oil", "red chili powder", "fish sauce", "green limes"] },
    { title: 'Slow Cooker Cranberry Relish', description: 'This is a simple and delicious fresh cranberry relish for the slow cooker from Southern Food.  I have not made it yet, but wanted to stash it away for the holidays.', cuisine: 'American', difficulty: 'Easy', time: 120, moods: ["Festive", "Healthy", "Quick"], diets: ["Low-Fat", "Low-Sodium"], steps: ["Zest the oranges. Cut off the remaining outer peel and pith and discard. Cut the peeled orange sections into small chunks and add to the slow cooker along with cranberries, sugar, cinnamon, and zest. Add water. Cover and cook on HIGH for about 2 hours."], ingredients: ["cranberries", "cinnamon"] },
    { title: 'Easy Baked Potatoes on the Grill', description: 'A GREAT way to have baked potatoes in the summer without heating up the kitchen with the oven. Use whatever dried herbs you wish in place of salt. I use a garlic herb mixture or Mrs. Dash.', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Healthy"], diets: ["Low-Fat"], steps: ["Heat grill to 350. Set up grill for in direct cooking.", "Rub each potato with olive oil.", "Put salt on wax paper or zip lock bag. Coat each potato with salt.", "Arrange potatoes in a cast iron pan.", "Place on in direct side of grill.", "Turn over half way through cooking time."], ingredients: ["potatoes", "kosher", "olive oil"] },
    { title: 'Cowboy Rice and Beans', description: 'Better Homes and Gardens', cuisine: 'American', difficulty: 'Medium', time: 60, moods: ["Comfort"], diets: [], steps: ["In a 5 to 6 quart slow cooker, combine chili beans in gravy, butter beams, black beans, onion, bell peppers, and jalapeno pepper; stir in barbecue sauce and broth.", "Cover and cook on LOW for 5-6 hours or on HIGH for 2 1/2-3 hours.", "If using LOW setting, now turn to HIGH setting; stir in uncooked rice.", "Cover and cook about 30 minutes more or until rice is tender.", "Taste and adjust with salt and pepper, if needed."], ingredients: ["chili beans chili gravy", "butter beans", "black beans", "chopped onion", "chopped green bell pepper", "chopped red bell pepper", "fresh jalapeno pepper", "barbecue sauce"] },
    { title: 'Barbecue Flavored Beef Squares', description: 'This makes a pizza-like dish, only with barbecue sauce. A quick, simple, tasty dish for a family supper--a definite kid-pleaser. A 9 1/2-oz package of biscuits gives a relatively thin crust. Use a 16 oz package of biscuits if you want a thicker crust. Update: It may be tempting to substitute ground ', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick", "Comfort", "Healthy"], diets: ["Low-Carb"], steps: ["Coat a skillet with cooking spray and heat the beef and onion in a skillet until the beef is brown and the onion is soft.", "Drain off the fat and return the skillet to the stove.", "Stir in barbecue sauce and hot pepper sauce; simmer while preparing crust.", "Separate dough into 10 biscuits, place in and ungreased 13 X 9-inch pan, and press together over the bottom to form a crust.", "Spread the meat mixture over dough.", "Sprinkle with the cheddar cheese."], ingredients: ["spray", "ground beef", "chopped onion", "barbecue sauce", "hot pepper sauce tabasco texas pete", "flaky refrigerated biscuits", "grated cheddar cheese american cheese velveeta"] },
    { title: 'Rick\\\'s Lemon Chicken', description: 'I\\\\\'ve been cooking this about 25 years. Add Mediteranian oregano if you want greek chicken.', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Comfort", "Quick", "Healthy"], diets: ["Low-Sodium", "Low-Carb"], steps: ["Preheat oven to 375\u00b0F.", "Place chicken and potatoes in baking pan.", "Top with lemon juice and butter, salt and pepper.", "Bake uncovered for 1 to 1 1/2 hour or until potatoes are fork tender and chicken runs clear."], ingredients: ["potatoes", "lemons juice", "ground black pepper"] },
    { title: 'Carrot and Parsley Omelet', description: 'This Tunisia omelet is spicy. This is an example of a mahkouda, which contains eggs within eggs.Country: Tunisia - ZWT9From: Mediterranean Harvest: Vegetarian Recipes from the World\\\\\'s Healthiest Cuisine,  By Martha Rose Shulman', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Healthy"], diets: ["Vegetarian"], steps: ["Preheat oven to broil.", "Steam or cook carrots in boiling salt water until tender.  About 20 minutes to get carrots tender.", "Mash with fork or using a food processor, coarsely puree. Stir in ground caraway seeds, harissa, garlic, add salt and pepper to taste. Mix well.", "In a medium bowl beat fresh eggs with a 1/2 teaspoon salt. Stir in carrot mixture, hard cooked eggs and parsley.", "Over medium heat, heat olive oil in a 10 inch oven proof non-stick skillet.  Drop a bit of egg mixture in to skillet, if it sizzles, pan is hot enough to add egg mixture.  Let cook 4 to 5 minutes, until it has set on the bottom and starts setting on top of the egg mixture.", "Put in broil and broil for 3 to 4 minutes. It should be lightly brown and fluffy."], ingredients: ["carrot", "caraway seed", "garlic cloves minced", "pepper", "eggs", "eggs", "fresh flat - leaf parsley", "virgin olive oil"] },
    { title: 'Jamaican Coconut Snapper', description: 'A lovely easy to make fried fish dish.', cuisine: 'American', difficulty: 'Easy', time: 15, moods: ["Quick", "Healthy"], diets: [], steps: ["Season the snapper with the salt and pepper.", "In a bowl, mix eggs, 1 1/4 cups of flour, baking powder and beer.", "On one plate put the remainder of the flour and on another plate place the coconut.", "Lightly coat snapper in flour, then dip the snapper into the beer batter, lastly heavily coat the fish in the coconut and set aside.", "Once every piece of snapper is coated in coconut, heat a frying pan with the oil and fry the fish until the coconut becomes golden brown.", "Drain the snapper on paper towels and enjoy."], ingredients: ["red snapper fillets", "white flour", "beer", "baking powder", "fresh coconut", "vegetable oil", "salt pepper"] },
    { title: 'Asparagus and Parmesan Cream Pastry', description: 'This recipe was a side dish winner in the Real Women of Philadelphia 2010. After trying it, I know why. It is delicious.', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Festive"], diets: [], steps: ["Preheat oven to 400 degrees F; remove pastry dough from freezer and let thaw for 10 minutes.", "While dough is thawing, wash and trim asparagus so it is 1 1/2 inches shorter than width of pastry sheet.", "In medium bowl, combine cream cheese, grated Parmesan, chopped basil leaves and lemon juice; set aside.", "Unfold dough onto a baking sheet sprayed with cooking spray; cut into 4 equal rectangles.", "Separate slightly; spread cream cheese mixture onto each of the pastry rectangles, alternating directions, not quite to each edge.", "Press four asparagus spears onto each rectangle, alternating direction."], ingredients: ["puff pastry", "fresh asparagus spear", "cream cheese", "parmesan cheese", "fresh basil leaves chopped", "fresh lemon juice", "sea salt", "olive oil"] },
    { title: 'Cheese Grits Souffle', description: 'A creamy, savory recipe that will make you sit up and say "WOW!".', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Comfort"], diets: [], steps: ["In a 2 quart saucepan, put grits, salt, broth and butter.  Bring to a boil, stirring often.  Reduce heat and let simmer for 5 minutes.  Add in cheese and stir until melted.  Remove from heat and set aside.", "In a medium bowl, whisk 2 eggs.  Add in hot sauce, seasoning salt, paprika and worcestershire sauce.  Mix well.", "VERY SLOWLY, whisk 1 cup of grits mixture into the egg mixture.  You must do this slowly or the heat from the grits will cause the eggs to scramble.  Once the cup is whisked in, add the remaining grits mixture and blend well.", "Pour mixture into a well-greased 2 quart baking dish.", "Bake for 1 hour at 350 degrees.  Allow to cool for about 10 minutes before serving."], ingredients: ["grits", "chicken broth", "grated cheddar cheese", "hot sauce", "seasoning", "paprika", "worcestershire sauce"] },
    { title: 'Sensational Shrimp Spread', description: 'This stuff is really good on crackers. I don\\\\\'t like shrimp but I love this stuff.', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick", "Healthy"], diets: [], steps: ["In medium bowl, combine cream cheese and miracle whip; mix well.", "Stir in remaining ingredients.", "Cover; refrigerate 2-3 hours for flavors to blend.", "Serve with crackers."], ingredients: ["cream cheese", "baby shrimp", "minced onion", "worcestershire sauce", "salt", "black pepper"] },
    { title: 'Veggi Chili', description: 'Hearty and spicy, thrifty and vegan too.', cuisine: 'American', difficulty: 'Easy', time: 120, moods: ["Festive", "Comfort", "Quick"], diets: ["Vegan", "Vegetarian"], steps: ["In a large pot, sautee onions in oil until transluscent. Add mushrooms, and sautee until softened. Add tomatoes, beans, corn, and spices. Simmer for one hour, minimum. Better if simmered up to 2 hrs (covered) on low heat."], ingredients: ["diced tomatoes", "red kidney beans", "mushroom", "jalapeno pepper minced", "onion", "chili powder", "cumin powder", "black pepper"] },
    { title: 'Healthy Nut Bars', description: 'From The Cook and the Chef ABC TV series starring Aussies Maggie Beer and Simon Bryant. This recipe belongs to Simon.This recipe had all of us drooling and my kids begging me to make this.', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Festive", "Healthy"], diets: ["Vegetarian"], steps: ["Lightly warm all the ingredients.", "Mix all other ingredients together in a bowl except the honey, golden syrup, tahini and the LSA.", "Add the honey, syrup, tahini and mix well together.", "Add 1/3 cup of the LSA and as much more to 1/2 cup as required to bind the mixture together then spread onto a tray lined with baking paper.", "Spread evenly and allow to set (20 mins in the fridge should do it). Warming the honey/golden syrup a little enables them to combine more easily and the LSA helps to bind the mixture.", "Cut into bars and eat just as they are or coat in chocolate."], ingredients: ["puffed rice cereal rolled oats", "sesame seeds", "shredded coconut flaked coconut", "toasted hazelnuts", "dried apricot", "dried figs dates", "slivered almonds", "pepitas"] },
    { title: 'Christmas Brunch Casserole', description: 'This is some kind of good.  Perfect to bring to potlucks too. Make it the night before to save on some work the day of. Since it makes more than a 13 x 9 pan holds, I make a disposable loaf pan full too (and bring along with me in secret) and give it to the person who loves this brunch the most!  I ', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Festive", "Quick", "Comfort"], diets: [], steps: ["In a heavy bottomed skillet, brown Sausage, stirring until it crumbles (or after cooking and draining pulse in food processor until the texture you want). Remove sausage to drain on a paper towel lined bowl and remove all but 3 TB of drippings from pan.", "Heat pan on high, scraping bits from bottom.  When hot, add 2 TB butter, sliced mushrooms, 1/2 cup green pepper and onion and reduce heat to medium-high.  Cook about 5-6 minutes or until mushrooms and onions start to caramelize.  Stir and scrape bottom of pan frequently. During last minute of cookin", "Preheat oven to 350 degrees F.", "Place hashbrowns in a lightly greased 3 qt (9x13x2 inch) baking dish and a loaf pan.  Layer cooked sausage, cheese &amp; the sauted veggie mix evenly over hashbrowns in each pan, and --", "Whisk to combine eggs (or substitute),all spices and milk in a large bowl.  Pour egg mixture over all else in pans. Finally, sprinkle with parmesan cheese last.", "Bake in a 350 degree oven for 50 minutes or until golden.  Rotate and switch pans on racks for even browning. The loaf pan may finish cooking in 40 minutes or so."], ingredients: ["pork sausage", "onion", "sliced mushrooms", "chopped green pepper", "frozen hash brown potatoes", "shredded reduced - fat cheddar cheese", "salt", "white pepper"] },
    { title: 'Homestyle Pot Roast', description: 'Tender, beefy pot roast made in the slow cooker.', cuisine: 'American', difficulty: 'Easy', time: 60, moods: ["Comfort", "Quick"], diets: [], steps: ["Combine meat, tomatoes with their liquid and the seasoning in slow cooker. Cover with lid.", "Cook on LOW 8 hours (or on HIGH 4 hours)."], ingredients: ["boneless beef chuck", "hunt  stewed tomatoes", "beef stew seasoning"] },
    { title: 'Aioli--style Potatoes', description: 'I found this recipe on the back of my potato bag and they are so good!  I used Klamath Pearl Potatoes that I bought at Trader Joe\\\\\'s but you could use any very small potatoes.', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Festive", "Healthy"], diets: ["Low-Sodium"], steps: ["Halve potatoes and set aside.", "In a large bowl, combine the next seven ingredients (olive oil to salt and pepper).  Whisk to combine well.", "Add potatoes and toss.", "Place potatoes in a roasting pan, uncovered, and roast at 350\u00ba for 35-40 minutes, stirring often, or until potatoes are tender.", "Garnish potatoes with Parmesan and parsley."], ingredients: ["new potatoes", "olive oil", "butter", "mayonnaise", "fresh garlic minced", "chopped fresh parsley", "chopped fresh basil", "salt pepper"] },
    { title: 'Black Bean and Corn Salad', description: 'I got this recipe recently from a friend who served it with King Ranch casserole. Everyone loved it and the eight of us finished it off at that meal! It\\\\\'s very tasty, easy to make, and is a colorful salad that goes well with any Mexican-themed menu or grilled meat.  Prep time does not include c', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick", "Healthy", "Light"], diets: ["Low-Fat", "Low-Sodium"], steps: ["Bring first seven ingredients (vinegars through the garlic) to a boil; reduce heat and simmer 2 minutes, or until sugar is dissolved.", "Combine remaining ingredients in a serving bowl.", "Pour dressing over and stir to combine everything well.", "Cover and chill at least one hour before serving."], ingredients: ["balsamic vinegar", "cider vinegar", "brown sugar", "lime juice", "cumin", "garlic clove minced", "frozen corn kernels", "bell pepper"] },
    { title: 'Butter Chicken', description: 'This recipe came from a recipe booklet insert in one of my magazines.  Delicious.', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Comfort"], diets: [], steps: ["Heat 1 tbsp (15 ml) oil in a large saucepan over medium-high heat.  Cook chicken until lightly browned, about 10 minutes.  Remove chicken and set aside.", "Heat remaining oil in a large saucepan over medium-high heat.  Saute onion, garlic and ginger until soft and fragrant.  Stir in butter, lemon juice and spices.  Cook, stirring for 1 minute.  Add tomato sauce, cooking for 2 minutes, stirring frequently.  Stir in milk and yogurt.  Reduce heat and simm", "Add reserved chicken to sauce and bring sauce to a boil.  Reduce heat to low and simmer for 15 minutes until sauce has thickened and chicken is cooked through.", "Taste and adjust seasonings as necessary."], ingredients: ["vegetable oil", "chicken thigh", "onion", "garlic cloves", "ginger", "lemon juice", "garam masala", "cumin"] },
    { title: 'Mincemeat Cobbler', description: 'While searching for a particular recipe I came across this one for mincemeat cobbler that my Mom gave me about 20 or so years ago. I served it this past Christmas along with 2 other desserts and everyone commented on how good it tasted. So try it, and let me know what you think.', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Healthy", "Festive"], diets: [], steps: ["Preheat oven to 400 degrees.", "Mix together the mincemeat, apples, 2 tablespoons sugar, nutmeg&amp; melted butter.", "Blend together and spread on the bottom of a baking dish.", "Sift the flour, baking powder, salt&amp; 1 tablespoon sugar.", "Cut in the shortening.", "Add the milk and beaten egg."], ingredients: ["mincemeat", "chopped apple", "white sugar", "nutmeg", "melted butter", "flour", "baking powder", "milk"] },
    { title: 'Baby Food - Eggplant Dip', description: '10-12 months', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Healthy", "Quick"], diets: ["Low-Sodium", "Low-Carb"], steps: ["Pre-heat the oven to 400 deg F, 200 deg Celsius.", "Bake the eggplant in a baking dish for one hour, then cool.", "Halve the eggplant and scoop out the flesh, then chop well.", "Meanwhile, saute the onion in the oil over a medium heat, stirring often, until very soft (10 mins).", "Add the garlic ,if using,and saute for a further minute, then add the tomato puree and cook for one more minute.", "Stir in the eggplant and cook until the dip has thickened."], ingredients: ["eggplant", "olive oil", "onion minced", "garlic clove", "tomato puree"] },
    { title: 'Cheesy Sloppy Joes', description: 'This is from the new Weight Watchers cook book SHORTCUTS.  It has become a family favorite.  According to the book the Nutrituon Facts are  PER SERViNG (1 sloppy joe): 207 Cal, 4 g Fat, 1 g Sat Fat, 0 g Trans Fat, 21 mg Chol, 1,018 mg Sod, 26 g Carb, 5 g Fib, 19 g Prot, 260 mg Calc. POINTS value: 4.', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick", "Light", "Comfort"], diets: [], steps: ["Heat a large nonstick skillet over medium-high heat.", "Add the beef and cook until browned, 4-5 minutes, stirring with a spoon to break it up.", "Discard any drippings.", "Stir in the mixed vegetables, 1 1/3 cups water, the tomato paste, and seasoning mix; bring to a boil.", "Reduce the heat and simmer, stirring, until thickened, about 10 minutes.", "Meanwhile, preheat the broiler."], ingredients: ["ground beef fat", "frozen mixed vegetables", "tomato paste", "sloppy joe seasoning mix", "whole wheat hamburger buns", "fat - free cheddar cheese"] },
    { title: 'Jambalaya With Shrimp', description: 'This Creole rice dish is a quick, lower fat version of an old favorite. There\\\\\'s a lot of room for creativity here.', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Healthy", "Comfort"], diets: ["Low-Fat"], steps: ["In a large saucepan, melt butter over low heat.", "Stir in flour until smooth.", "Stir in onions, garlic, and ham; cook and stir until onion is soft.", "Stir in tomatoes, and cook for 5 minutes. Mix in oregano or basil, rice, and broth.", "Cover, and simmer until just a little liquid remains.", "Add shrimp, and stir to evenly distribute."], ingredients: ["all", "onions chopped", "garlic clove minced", "cooked ham", "diced tomatoes", "dried oregano", "white rice", "hot chicken broth"] },
    { title: 'Basic Marinade', description: 'I have not tried this recipe. I got this recipe from Cornell Cooperative Extension. This is enough marinade for 1 pound of meat.', cuisine: 'American', difficulty: 'Easy', time: 15, moods: ["Quick", "Healthy"], diets: ["Low-Fat", "Low-Sodium", "Low-Carb"], steps: ["Combine ingredients in a glass or stainless steel bowl.", "Add meat, cover and put in refrigerator. Marinade cubed meat for 2-3 hours. Marinate large pieces of meat longer.", "If you plan to use the marinade after removing the meat, be sure to cook it throughly to kill harmful bacteria."], ingredients: ["lemon juice", "vinegar", "soy sauce"] },
    { title: 'Herbed Chicken With Spring Vegetables', description: 'A delicious, hearty meal, and pretty healthy, too! Please rate and review. :)Courtesy Giada De Laurentiis.', cuisine: 'American', difficulty: 'Medium', time: 45, moods: ["Quick", "Festive", "Comfort"], diets: [], steps: ["Preheat the oven to 375 degrees F.", "In a small bowl combine the thyme, parsley, garlic, fennel seeds, red pepper flakes, and a pinch of salt and pepper. Stir to combine. Place the chicken pieces on a work surface. Gently loosen the skin of the chicken and push the herb mixture under the skin. Season the chicken all over with salt and ", "Warm the olive oil in a large skillet over medium-high heat. Place the chicken in the pan, skin side down, when the oil is hot. Cook until the skin is crispy and golden, about 5 minutes. Turn the chicken and cook the same way on the other side. Turn the heat off the pan and reserve. Transfer the chi", "Meanwhile return the same pan to medium heat. Add 1 tablespoon of the butter. When the butter has melted add the cipollini onions and carrots. Sprinkle with salt and pepper. Cook until tender and golden in places, about 7 minutes. Add the chicken broth and scrape any brown bits off the bottom of the", "Remove the chicken from the oven. Spoon the vegetables onto a serving platter along with the chicken. Spoon the sauce over the chicken. Serve immediately."], ingredients: ["chopped fresh thyme", "chopped fresh parsley", "garlic cloves minced", "fennel seed", "red pepper flakes", "salt", "ground black pepper", "boneless skin chicken"] },
    { title: 'Salt and Vinegar Potato Salad', description: 'If you love salt and vinegar potato chips you are gonna love this recipe. The Old Bay gives it that little extra. From Gourmet magazine. Cook time includes marinating time.', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Healthy"], diets: [], steps: ["Toss together onion, 2 Tbs. vinegar, and 1/2 teaspoons salt in a bowl. Marinate at room temperature, tossing occasionally, until slightly softened and pink, about 45 minute.", "Cover potatoes with salted cold water in a 5 quart pot, then simmer, uncovered, until just tender, 15-20 minute.", "While potatoes cook, whisk together 2 teaspoons Old Bay seasoning with sugar, remaining 1 1/2 teaspoons salt, and 1/2 cup vinegar in a small bowl.", "Drain potatoes in a colander, and when cool enough to handle but still warm, peel and cut into 1/2-inch wide wedges.", "Toss warm potatoes with vinegar mixture in a large bowl. Add onion mixture and oil, tossing to combine.", "Add more Old Bay if needed, and serve warm or at room temperature."], ingredients: ["red onion", "cider vinegar", "cider vinegar", "yellow fleshed potatoes yukon", "seasoning", "olive oil"] },
    { title: 'Banana Split Smoothie', description: 'I have not tried this recipe. I got it from a recipe chat board.', cuisine: 'American', difficulty: 'Easy', time: 15, moods: ["Quick"], diets: [], steps: ["Pour milk into the blender first.", "Add cocoa and then fruit. Put cover on and blend until smooth."], ingredients: ["nonfat milk", "frozen bananas", "pineapple", "frozen strawberries", "sweetened cocoa powder"] },
    { title: 'Kiwi, Berries and Yogurt Parfait With Toasted Coconut', description: 'Cat Cora\\\\\'s recipe from Parade Magazine.  Sounds lovely!', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick", "Festive"], diets: [], steps: ["In a martini glass (or other festive vessel), spoon a dollop of the yogurt into the base of the glass, then top with a sprinkling of graham crackers, a layer of diced fruit, then a few berries. Then start again with the yogurt, continuing the pattern until the glass is filled. Garnish by sprinkling "], ingredients: ["yogurt vanilla", "graham cracker", "tropical fruit kiwi", "blackberry raspberries strawberries blueberries", "shredded coconut"] },
    { title: 'Honey Soy Salmon', description: 'The sweet honey and the salty/sharp soy sauce are the perfect counterparts to the oily salmon.', cuisine: 'Japanese', difficulty: 'Easy', time: 45, moods: ["Quick", "Healthy", "Comfort"], diets: ["Low-Carb"], steps: ["Whisk scallion, soy sauce, vinegar, honey and ginger in a medium bowl until the honey is dissolved. Place salmon in a zip-top plastic bag, add 3 tablespoons of the sauce and refrigerate; let marinate for 15 minutes, turning at least once. Reserve the remaining sauce.", "Preheat broiler. Line a small baking pan with foil and coat with cooking spray. Transfer the salmon to the pan, skin-side down. (Discard the marinade in the bag.) Broil the salmon 4 to 6 inches from the heat source until cooked through, 6 to 10 minutes. Drizzle with the reserved sauce and garnish wi"], ingredients: ["scallion", "sodium soy sauce", "rice vinegar", "minced fresh ginger", "salmon fillet", "toasted sesame seeds"] },
    { title: 'Watermelon Ice', description: 'This is a recipe to use with a Pampered Chef Ice Shaver.  Such a great recipe for the summer time!  Enjoy :)', cuisine: 'American', difficulty: 'Medium', time: 120, moods: ["Festive", "Healthy", "Quick"], diets: ["Low-Fat", "Low-Sodium"], steps: ["Place cubed melon in a bowl and mash with a potato masher (your mixture should still have small bits of fruit in it).", "Juice your lemon to measure 3-4 tbs of juice.", "Add lemon juice and sugar to the melon mixture; mix well.", "Divide fruit mixture evenly among 3 Ice Shaver tubs; freeze until firm.", "To serve, remove frozen mixture from tubs; shave using your ice shaver."], ingredients: ["cubed seedless watermelon", "lemon"] },
    { title: 'Spanish Spareribs', description: 'Entered for safe-keeping. From Margaret Murray, Lindsey, Ohio, as submitted to BH&G.', cuisine: 'Spanish', difficulty: 'Medium', time: 120, moods: ["Festive", "Comfort", "Quick"], diets: [], steps: ["In Dutch oven, brown sausage.  Remove and drain off fat.", "In same pan, brown ribs, half at a time; remove.", "Add bacon, onion, and garlic; cook until bacon is crisp and onion is tender.", "Return meats to pan.", "Add undrained tomatoes, beef broth, olives, and parsley.", "Cover and simmer 1 hour or until ribs are tender.  Remove meat; keep warm."], ingredients: ["pork sausage links", "meaty pork spareribs", "bacon slices", "onion", "garlic clove minced", "canned tomatoes", "condensed beef broth", "pimento - stuffed green olives"] },
    { title: 'Blackened Portobello Mushroom Salad', description: 'A SPEEDY cajun themed main-dish salad.  Recipe from Cooking Light, May 1998.  It is very highly rated on their website.  After making this recipe, I have to say I was pleased.  I marinated my mushrooms for about 30 minutes and they had great flavor.  I used Emeril Essence (left over from another rec', cuisine: 'American', difficulty: 'Easy', time: 15, moods: ["Quick", "Festive", "Comfort"], diets: ["Vegetarian"], steps: ["Combine first 7 ingredients in a large zip-top plastic bag. Add mushrooms to bag; seal. Marinate 10 minutes, turning occasionally. Remove mushrooms from bag, reserving marinade.", "Sprinkle mushrooms with Cajun seasoning. Heat 2 teaspoons oil in a large nonstick skillet coated with cooking spray over medium-high heat until hot. Add mushrooms; cook 2 minutes on each side or until very brown. Cool; cut mushrooms diagonally into thin slices.", "Arrange 4 cups salad greens on each of 4 plates. Top each with mushroom slices, 2 tomato wedges, and onion rings. Sprinkle each with 1/4 cup beans and 1 tablespoon blue cheese. Drizzle the reserved marinade evenly over salads."], ingredients: ["red wine vinegar", "balsamic vinegar", "tomato juice", "olive oil", "dijon mustard", "stone ground mustard", "fresh coarse ground black pepper", "portobello mushroom caps"] },
    { title: 'Paradise Crab Dip Wontons', description: 'This sounds so good, from Sandra Lee.', cuisine: 'American', difficulty: 'Easy', time: 30, moods: ["Quick", "Festive", "Healthy"], diets: [], steps: ["Mix crabmeat, cream cheese, steak sauce, and garlic powder together in a medium bowl.", "Place 1 1/2 teaspoons of crab mixture in the center of each wonton wrapper.", "Moisten the edges of the wrapper with water; fold in half diagonally and press edges to seal.", "Repeat with remaining filling and wonton wrappers.", "Heat 1/4-inch oil in a large skillet over medium-high heat.", "When oil is hot (around 350 degrees F), carefully add the wontons, in batches as necessary, and fry until lightly browned, about 1 to 2 minutes on each side."], ingredients: ["can crabmeat shells", "cream cheese", "steak sauce", "garlic powder", "oil"] },
  ]

  // Cuisine-specific food images (curated Unsplash photos)
  const cuisineImages: Record<string, string[]> = {
    'American': [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
      'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
      'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800',
      'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800',
      'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800',
      'https://images.unsplash.com/photo-1576402187878-974f67f3f5ed?w=800',
      'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800',
      'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800',
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800',
      'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=800',
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
      'https://images.unsplash.com/photo-1547592180-85f173990554?w=800',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
      'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800',
      'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800',
    ],
    'Italian': [
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
      'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800',
      'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800',
      'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=800',
      'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=800',
      'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=800',
      'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800',
      'https://images.unsplash.com/photo-1598866594042-8c11f76ec668?w=800',
      'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800',
      'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=800',
      'https://images.unsplash.com/photo-1628268909376-e8c44bb3153f?w=800',
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800',
      'https://images.unsplash.com/photo-1606502281004-f86613ecb9b4?w=800',
      'https://images.unsplash.com/photo-1599789197514-47270cd526b4?w=800',
    ],
    'Indian': [
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
      'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800',
      'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800',
      'https://images.unsplash.com/photo-1567337710282-00832b415979?w=800',
      'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800',
      'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800',
      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800',
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800',
      'https://images.unsplash.com/photo-1545247181-516773cae754?w=800',
      'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800',
      'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=800',
      'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800',
      'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800',
      'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800',
      'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800',
    ],
    'Japanese': [
      'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800',
      'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800',
      'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800',
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
      'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=800',
      'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=800',
      'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800',
      'https://images.unsplash.com/photo-1618841557871-b4664fbf0cb3?w=800',
      'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800',
      'https://images.unsplash.com/photo-1619860860774-1e2e17343432?w=800',
      'https://images.unsplash.com/photo-1562436260-3905ea3834c5?w=800',
      'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800',
      'https://images.unsplash.com/photo-1583224994076-7207dc8f4078?w=800',
      'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=800',
      'https://images.unsplash.com/photo-1555126634-323283e090fa?w=800',
    ],
    'Mexican': [
      'https://images.unsplash.com/photo-1534352956036-cd81e27dd615?w=800',
      'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800',
      'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800',
      'https://images.unsplash.com/photo-1582234372722-50d7ccc30ebd?w=800',
      'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=800',
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
      'https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=800',
      'https://images.unsplash.com/photo-1564767609424-270455a16ded?w=800',
      'https://images.unsplash.com/photo-1625167171931-5fa51e0ad230?w=800',
      'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?w=800',
      'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=800',
      'https://images.unsplash.com/photo-1640719028782-8230f1bdc56e?w=800',
      'https://images.unsplash.com/photo-1586511925558-a4c6376fe65f?w=800',
      'https://images.unsplash.com/photo-1624300629298-e9209cd1ba68?w=800',
      'https://images.unsplash.com/photo-1587116861219-230ac19df55c?w=800',
    ],
    'French': [
      'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800',
      'https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?w=800',
      'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=800',
      'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
      'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=800',
      'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=800',
      'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
      'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800',
      'https://images.unsplash.com/photo-1519676867240-f03562e64571?w=800',
      'https://images.unsplash.com/photo-1608855238293-a8853e7f7c98?w=800',
      'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=800',
      'https://images.unsplash.com/photo-1579372786545-d24232daf58c?w=800',
      'https://images.unsplash.com/photo-1506459225024-1428097a7e18?w=800',
    ],
    'Middle Eastern': [
      'https://images.unsplash.com/photo-1547424850-28ac6f960583?w=800',
      'https://images.unsplash.com/photo-1529543544277-c7a78804e2c0?w=800',
      'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=800',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1544681280-d773c68b8557?w=800',
      'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800',
      'https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?w=800',
      'https://images.unsplash.com/photo-1590379492966-e076d8f84c2d?w=800',
      'https://images.unsplash.com/photo-1540914124281-342587941389?w=800',
      'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=800',
    ],
    'African': [
      'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800',
      'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800',
      'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800',
      'https://images.unsplash.com/photo-1506354666786-959d6d497f1a?w=800',
      'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800',
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800',
      'https://images.unsplash.com/photo-1517244683847-7456b63c5969?w=800',
      'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=800',
      'https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=800',
      'https://images.unsplash.com/photo-1543353071-10c8ba85a904?w=800',
    ],
    'Spanish': [
      'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800',
      'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=800',
      'https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?w=800',
      'https://images.unsplash.com/photo-1600335895229-6e75511892c8?w=800',
      'https://images.unsplash.com/photo-1558030006-450675393462?w=800',
      'https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=800',
      'https://images.unsplash.com/photo-1623961990059-28356e226a77?w=800',
      'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=800',
      'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    ],
  }
  // Track per-cuisine image index for even distribution
  const cuisineImgIdx: Record<string, number> = {}

  const recipes: { recipe_id: number }[] = []
  const usesData: { recipe_id: number; ingredient_id: number; quantity: number; unit: string }[] = []

  // ─────────────────────────────────────────────────────────────────────────────
  // CUSTOM IMAGE URLs FOR CSV RECIPES
  // Replace '' with your own image URL for any recipe.
  // Leave as '' to use the cuisine-matched fallback image automatically.
  // Each line shows: [index] Recipe Title (Cuisine)
  // ─────────────────────────────────────────────────────────────────────────────
  const csvRecipeImages: string[] = [
    'https://images.unsplash.com/photo-1536599605152-4965498713b1?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Q2hlcnJ5JTIwU3RyZXVzZWwlMjBDb2JibGVyfGVufDB8fDB8fHww',  // [0]   Cherry Streusel Cobbler (American)
    'https://images.unsplash.com/photo-1622220736031-714bcc9f96b0?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8VW5zdHVmZmVkJTIwQ2FiYmFnZSUyMFJvbGxzfGVufDB8fDB8fHww',  // [1]   Unstuffed Cabbage Rolls (American)
    'https://images.unsplash.com/photo-1770908811367-e1232962e81b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8TGF6eSUyMExhc2FnbmF8ZW58MHx8MHx8fDA%3D',  // [2]   Lazy Lasagna (French)
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkdFK81Pc9S1M6IdN5WGmR57_eHYUAF0PPtA&s',  // [3]   Fall Harvest Cake (American)
    'https://cdn.apartmenttherapy.info/image/upload/f_jpg,q_auto:eco,c_fill,g_auto,w_1500,ar_1:1/k%2FPhoto%2FSeries%2F2021-05-how-to-grill-potatoes%2F2021-05-12_ATK1383',  // [4]   Grilled Potatoes (American)
    'https://www.joyfulhealthyeats.com/wp-content/uploads/2019/11/Best-Spinach-Salad-with-Apple-Pecans-and-Gorgonzola-Cheese-web-6.jpg',  // [5]   Spinach Pecans and Gorgonzola Salad (American)
    'https://palm.southbeachdiet.com/wp-content/uploads/2018/09/stuffed-peppers.jpg',  // [6]   South Beach Stuffed Bell Peppers (American)
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvbnTRc8EP9QFlBubriMRn3Vb0wjay0Y2Lwg&s',  // [7]   Australian Style Potato Salad (American)
    'https://images.openai.com/static-rsc-4/_9hcazMxo8uCsxnPdVawAYnWVW0JWi0ZFfsDcBW8p2VzzLueDKlXnRtPy_Ra7WU80pqzW9p-jW3LiFzgbf7SUiW10kcq-7up0Kjjs-DIQhQiweVtltSbsp4X34v4Xt1x6ff7YIHOBsQAtOlQN-BMJmAAKqELMO_eTCpl_JdbkoRYpu46RsRpXD2h4C-5An92?purpose=fullsize',  // [8]   Simply Oven Baked Pork Chops or Chicken and Rice II (American)
    'https://images.openai.com/static-rsc-4/DES6QV-DPcsSmvGruOzUub1vpYxNJJPeHbi2RDIj9lUROCe_BWBVKObQzA70swjDNTHC6FfPVrcpVNgGIBYtiPxnEe_6mdogqfZsQspHjHOSKDs7vfSD3g4GSwbnYXBriRv50USueprjhZl2zOsyPLwd3ZE6x-y-xDx8MAlF-WLxsraChIHFq6dvydQwS5x-?purpose=fullsize',  // [9]   Tomato and Sour Cream Tea Sandwiches (American)
    'https://images.openai.com/static-rsc-4/jax-cmmvt-nwtML5IStnENsx-JWjtGKkWeK9FnRdx7nP5Si8-L5aYc-T0qDa1QTlFSo6tbDKGrN58FxZ09-7sJ2CNlsWIz3sJG-yxYUPwluPVV7VbNSa77uD_WOBDLO5R8BLDgp7g28y6YGLPANJu2ZM2-n6LEkLSEo-EY4S9iQ9Ub6t_fZ5k7ZAeRe7GmU1?purpose=fullsize',  // [10]  Chocolate Waffles (American)
    'https://images.openai.com/static-rsc-4/5XYHS8TRkmfi2j89EWq3OdJmIbhT0mNxnyX7OyIwOdfnd9hbIN7PLCziysqW3rIeEnKEEgYC2UslWMypFiCE0gIZwF98ypf6yMyk7vHPJPVqGgay7yA7OifWLjwVIoJEd3_vTVdOBOyzodLWrhHbxhF8MsFU5y556XuwFFSeVH_Y1x-066126Hax-1FUIbQ1?purpose=inline',  // [11]  Ranch Bean Soup (American)
    'https://images.openai.com/static-rsc-4/OSjkkdnNG4U77ruGgIPo46IZcoJULcN5R9rWPRbDL9rYC_NmofWWWeNiZvzeNm96sTgknPPivhOsU3oFyon4NhGaEpuSqR-qWM0hsKbYvOwNaxKMj4w-NfjYtPKROyf0JSOaLUdpBXlGm5MvjB5QGvjVsBKxhBD0m9GQ6o440vlGfiy4axuJc3OB5p1p2DZS?purpose=fullsize',  // [12]  Ginger Pineapple Jello Mold (American)
    'https://images.openai.com/static-rsc-4/-Fp5KUEsqS-k0HX6wsX8E_J8M4yaxs-aZ-DjN-7RdmpD4NZYiosFAMHI9rltIv8NP6WbKdU9_ozkHSrM37A5szkSTps0_0OYSkK9hVf8YUVn6oDEW301dsbPCGa_gLcYRkXWRsVAIvczokuDt0jmfayfdiFFSGWgw2VNDDmHbqWQ_CJk-zmofiRLwCZMbxld?purpose=fullsize',  // [13]  Black-Eyed Pea Spread (American)
    'https://images.openai.com/static-rsc-4/y-R6VWOu0KiiTbiL9hMSpsUtwFreEzMreVaYo-o1hB__LXdyL_xiRDv0u8hcs4gvD-FtUd34ghhTpv9mwWpwAun_sAPfbi9uonjaHtXySDOiPjOwGj53KKF7j8f0PDMvYcv4nUN40bFZeiuFA5NcV0j8Oz9JAou2gIFcuJ5vI0EqWh8hiYvgSfNb4vrU81v-?purpose=fullsize',  // [14]  Pastel De Matzo Y Naranja (American)
    'https://images.openai.com/static-rsc-4/ezS6X6VtCnL_J3mIbLsIoxbprGFqpZU3gPgw3juO-A5jJ4ijvILuOgcs4MR1Ch5WoqvZWuxHy4qLpPC6-KeELDSkjHIiSqREl5vWowPWW-zotc7fOqxiAVhGi6OuuK_kQpXkQuoa7gwQrfdHWaLzsFygKmB7JEibuNkvqJgog_rOXMt-09Swsj8umjkGv48z?purpose=fullsize',  // [15]  Gg's Mom's Shrimp Macaroni Salad (American)
    'https://images.openai.com/static-rsc-4/i_7JWOzneiw-DY1szwRNX871MvzIS-e7HKBUEwj5u07WHam4gh7FYl6VycWF9r7fjTtX2SfKotV5FwtJZI8svoNT26awODi30yPABnBLNgb4-DO5f5ZI1Zwjbnmo9i9yy0WJsUa2tCgSPWW-wfb5XvsMV-FHzRJjCqxCfebNipNv2Vjoa8EYs4WeBWqT0Tmq?purpose=fullsize',  // [16]  Easy Iced Cappuccino - Sugar Free (American)
    'https://images.openai.com/static-rsc-4/7QZtL-t6UbfE_qglbl1Cw_sZWMLAKfmOjp4OFSiMq5b06FL0VBzqMfXbb8K6yw5LbHAEtBIDfVuVWrZGY3QyVm6mTGHrNnlYsJBEG2BxkHVZBf9W-7colupZ8KlzLdLqbh9CnqovxWNZWbvIPclU9qfNJq_kMzqf2zy1diLroWCw2QKcqa2ueaCbNjCG6TK3?purpose=fullsize',  // [17]  Unfried Refried Beans (American)
    'https://images.openai.com/static-rsc-4/0qYYB_qYqDeRK-a3k5GNhZiY4z0tQIEkh0C8QB0QTxvOytk3RhH_mEY5eyRrKm8ZN0DhzOW9CDumls389B2pVZyiTWjivrQe7A-muFh-Fse2hVtAjIM_JK5_uxrWIBjLVAspUwQzPRfd2tU_NGlo2CzBNGWkx7WzEy83-sr2XnNtbZnDVKs7J5L_TCxSeqo_?purpose=fullsize',  // [18]  Chicken Noodle Soup With Parsnips and Dill (American)
    'https://images.openai.com/static-rsc-4/ZqOs3OeyCOd0hmPwvj_tpTpOFde3U8SAmcmhumI_COG4UWNhFwP8VHsGaRYJP7ugmLt0abMkQAWucCgDrfQ96dapnZ40pxnP42rIvgVkDBYHIpN25CW2q9EDj52Hk7qdpZEm6n4fmMGpx_M9BcDYwD1qAGZxmEHYNOGyThppI89QlVueyyUInsbggLZUud-w?purpose=fullsize',  // [19]  Cheesy 5-Spice Potatoes (American)
    'https://images.openai.com/static-rsc-4/4zjsevUV1STYMhzZU-3Z_eU0XZShjKwjiKyANbhu-e2fwLQZUUtFOWBRg3KpZyBxmvqCuBDcyo6HvD5ZK7Sww21Ak_0-saZd0mbVbsb3NzwQgYSPmDPT6cjN1egcMGBT9hoaIoFxyex411mjdAnKav1AgQBSx3dlvxOvwbwMJkzLsrUAo4B1_upa6C2FsMhk?purpose=fullsize',  // [20]  Apple and Mint Couscous (Middle Eastern)
    'https://images.unsplash.com/photo-1523906630133-f6934a1ab2b9?w=800',  // [21] English Tea (teapot & cup)
    'https://images.unsplash.com/photo-1604908177073-4c6a1f3b6c6a?w=800',  // [22] Fish Wraps
    'https://images.unsplash.com/photo-1605478580704-3c8d9e6f0c1d?w=800',  // [23] Vegetable Curry
    'https://images.unsplash.com/photo-1625944525903-7c5c8b2e6f3e?w=800',  // [24] Shrimp Pakoras
    'https://images.unsplash.com/photo-1598514982841-9c9a5c2b9c3f?w=800',  // [25] Sausage Kabobs
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=800',  // [26] Ravioli Soup
    'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800',  // [27] Fruit Salad
    'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=800',  // [28] Corned Beef Sandwich
    'https://images.unsplash.com/photo-1577801592657-1b3f1d6d8c5e?w=800',  // [29] Strawberry Banana Shake
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',  // [30] Seafood Chowder
    'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800',  // [31] Cookies
    'https://images.unsplash.com/photo-1604908176997-4316c288032d?w=800',  // [32] Meatballs (Ham Balls similar)
    'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800',  // [33] Grilled Chicken
    'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=800',  // [34] Biscotti
    'https://images.unsplash.com/photo-1604908177522-040d6e8b5c3e?w=800',  // [35] Clam Dip
    'https://images.unsplash.com/photo-1584270354949-1f8c5b6c7d2e?w=800',  // [36] Black Beans & Rice
    'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=800',  // [37] Enchilada Casserole
    'https://images.unsplash.com/photo-1585238342028-4c1d6c3e9b2e?w=800',  // [38] Cheese Crackers
    'https://images.unsplash.com/photo-1605478524562-3c8d9e6f0c2a?w=800',  // [39] Cranberry Bread
    'https://images.unsplash.com/photo-1603532648955-039310d9ed75?w=800',  // [40] Orange Cake
    'https://images.unsplash.com/photo-1605478900060-0f0b0b6d8c2b?w=800',  // [41] Caramel Marshmallow Bars
    'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800',  // [42] Roasted Filet of Beef
    'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=800',  // [43] Creamy Chicken Pasta
    'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=800',  // [44] Hot Fudge Sauce
    'https://images.unsplash.com/photo-1604908554165-6d3c7a3a5c2e?w=800',  // [45] Sweet Potatoes with Cranberry
    'https://images.unsplash.com/photo-1605478579997-3c8d9e6f0c1f?w=800',  // [46] Sweet Potato Soufflé
    'https://images.unsplash.com/photo-1625944525533-473d6f2b6e3f?w=800',  // [47] Zucchini Cakes
    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800',  // [48] Soft Oatmeal Cookies
    'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=800',  // [49] Casserole Dish
    'https://images.unsplash.com/photo-1605478580704-3c8d9e6f0c1d?w=800',  // [50] Lentils with Mushrooms
    'https://images.unsplash.com/photo-1505253213348-cd54c7b1f6f7?w=800',  // [51] Roasted Potatoes Herbs
    'https://images.unsplash.com/photo-1604908177522-040d6e8b5c3e?w=800',  // [52] Tandoori Chicken
    'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=800',  // [53] Indian Casserole
    'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=800',  // [54] Banana Bread
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',  // [55] Healthy Breakfast Bowl
    'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800',  // [56] Aioli Sauce
    'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800',  // [57] Herb Crusted Lamb
    'https://images.unsplash.com/photo-1604908177073-4c6a1f3b6c6a?w=800',  // [58] Chicken in Wine Sauce
    'https://images.unsplash.com/photo-1605478580704-3c8d9e6f0c1d?w=800',  // [59] Spinach Potato Curry
    'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800',   // [60] Fresh Salad Bowl
    'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800',  // [61] Chocolate Frosting
    'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800',  // [62] Baked Chicken
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',  // [63] Beef Roast
    'https://images.unsplash.com/photo-1606756790138-261d2b21cd8a?w=800',  // [64] Loaded Plate (Garbage Plate style)
    'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=800',  // [65] Banana Bread
    'https://images.unsplash.com/photo-1604908554075-0875f3f2c3c5?w=800',  // [66] Hummus
    'https://images.unsplash.com/photo-1604908177073-4c6a1f3b6c6a?w=800',  // [67] Cabbage Soup
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',  // [68] Bread Pudding
    'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=800',  // [69] Chicken Casserole
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800',  // [70] Hot Dog Sauce (Coney style)
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800',  // [71] BBQ Sauce
    'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800',  // [72] Peanut Butter Cookies
    'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=800',  // [73] Coleslaw
    'https://images.unsplash.com/photo-1604908176997-4316c288032d?w=800',  // [74] Stuffed Onions (meat-based)
    'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800',  // [75] Spicy Chicken
    'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=800',  // [76] Vegan Penne Broccoli
    'https://images.unsplash.com/photo-1585238342028-4c1d6c3e9b2e?w=800',  // [77] Chocolate Crackers
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=800',  // [78] Broccoli Soup
    'https://images.unsplash.com/photo-1605478900060-0f0b0b6d8c2b?w=800',  // [79] Baked Cabbage (Gratin style)
    'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800',   // [80] Coffee Cake
    'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800',  // [81] Spaghetti Aglio e Olio
    'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800',  // [82] Meatballs
    'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800',  // [83] Turkey Melt Sandwich
    'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=800',  // [84] Applesauce Cookies
    'https://images.unsplash.com/photo-1558030006-450675393462?w=800',  // [85] French Dip Sandwich
    'https://images.unsplash.com/photo-1613145993486-4e1d9f2cbb18?w=800',  // [86] Spiced Olives
    'https://images.unsplash.com/photo-1589308078056-fc7c7d4d9c4f?w=800',  // [87] Bran Muffins
    'https://images.unsplash.com/photo-1512058564366-c9e3e0465c1b?w=800',  // [88] Stir Fry
    'https://images.unsplash.com/photo-1604908554075-0875f3f2c3c5?w=800',  // [89] Ham Cheese Pie
    'https://images.unsplash.com/photo-1505253216365-9c2c9a1c3f2c?w=800',  // [90] Potato Salad Greens
    'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800',  // [91] Vegan Pancakes
    'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800',  // [92] Lemon Chicken
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=800',  // [93] Beet Soup
    'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=800',  // [94] Pasta Cauliflower
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',  // [95] Brown Bread
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800',  // [96] Quiche Muffins
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',  // [97] Bread Pudding
    'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=800',  // [98] Chocolate Ice Cream
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800',  // [99] Apple Cake Caramel
    'https://images.unsplash.com/photo-1599785209707-28d1d7d5a3c5?w=800',  // [100] Trifle
    'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800',  // [101] Alfredo Pie
    'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800',  // [102] Fruit Salad
    'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=800',  // [103] Chocolate Pudding
    'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=800',  // [104] Breakfast Cookie Bars
    'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800',  // [105] Peas Prosciutto
    'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=800',  // [106] Quesadilla
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800',  // [107] Peach Salsa
    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800',  // [108] Ginger Cookies
    'https://images.unsplash.com/photo-1598514982841-9c9a5c2b9c3f?w=800',  // [109] Grilled Pineapple
    'https://images.unsplash.com/photo-1604908177073-4c6a1f3b6c6a?w=800',  // [110] Lentil Soup
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800',  // [111] Frittata
    'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800',  // [112] Coffee Cake
    'https://images.unsplash.com/photo-1582515073490-dc0d3e0f8c2d?w=800',  // [113] Carrots
    'https://images.unsplash.com/photo-1543352634-873c3d3f5a6e?w=800',  // [114] Grilled Vegetables
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',  // [115] Rye Bread
    'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=800',  // [116] Stuffed Pasta
    'https://images.unsplash.com/photo-1548365328-9f547fb0953b?w=800',  // [117] Pizza
    'https://images.unsplash.com/photo-1604908177073-4c6a1f3b6c6a?w=800',  // [118] Duck Salad
    'https://images.unsplash.com/photo-1576402187878-974f70c890a5?w=800',  // [119] Cranberry Relish
    'https://images.unsplash.com/photo-1505253213348-cd54c7b1f6f7?w=800',  // [120] Baked Potatoes
    'https://images.unsplash.com/photo-1605478580704-3c8d9e6f0c1d?w=800',  // [121] Rice Beans
    'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800',  // [122] Beef Squares
    'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800',  // [123] Lemon Chicken
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800',  // [124] Omelet
    'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800',  // [125] Coconut Fish
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800',  // [126] Pastry
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800',  // [127] Souffle
    'https://images.unsplash.com/photo-1604908554075-0875f3f2c3c5?w=800',  // [128] Shrimp Spread
    'https://images.unsplash.com/photo-1605478580704-3c8d9e6f0c1d?w=800',  // [129] Veg Chili
    'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800',  // [130] Nut Bars
    'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=800',  // [131] Breakfast Casserole
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',  // [132] Pot Roast
    'https://images.unsplash.com/photo-1505253213348-cd54c7b1f6f7?w=800',  // [133] Potatoes Aioli
    'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800',  // [134] Bean Corn Salad
    'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800',  // [135] Butter Chicken
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800',  // [136] Cobbler
    'https://images.unsplash.com/photo-1604908554075-0875f3f2c3c5?w=800',  // [137] Eggplant Dip
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800',  // [138] Sloppy Joes
    'https://images.unsplash.com/photo-1605478580704-3c8d9e6f0c1d?w=800',  // [139] Jambalaya
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800',  // [140] Marinade
    'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800',  // [141] Herb Chicken
    'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=800',  // [142] Potato Salad
    'https://images.unsplash.com/photo-1577801592657-1b3f1d6d8c5e?w=800',  // [143] Banana Smoothie
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800',  // [144] Yogurt Parfait
    'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800',  // [145] Salmon
    'https://images.unsplash.com/photo-1560717845-968823efbee1?w=800',  // [146] Watermelon Ice
    'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800',  // [147] Spareribs
    'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800',  // [148] Mushroom Salad
    'https://images.unsplash.com/photo-1604908554075-0875f3f2c3c5?w=800'   // [149] Crab Wontons
  ]

  for (let i = 0; i < csvRecipes.length; i++) {
    const r = csvRecipes[i]
    const chefIdx = i % users.length
    const cuisineObj = cuisineMap[r.cuisine] || cuisineMap['American']

    const recipe = await prisma.recipe.create({
      data: {
        title: r.title,
        description: r.description,
        estimated_time: r.time,
        difficulty_level: r.difficulty,
        user_id: users[chefIdx].user_id,
        is_public: true,
        cuisine_id: cuisineObj.cuisine_id,
      }
    })
    recipes.push(recipe)

    // Moods
    const moodData = r.moods
      .filter((m: string) => moodMap[m])
      .map((m: string) => ({ recipe_id: recipe.recipe_id, mood_id: moodMap[m].mood_id }))
    if (moodData.length > 0) {
      await prisma.fITS.createMany({ data: moodData })
    }

    // Diets
    const dietData = r.diets
      .filter((d: string) => dietMap[d])
      .map((d: string) => ({ recipe_id: recipe.recipe_id, restriction_id: dietMap[d].restriction_id }))
    if (dietData.length > 0) {
      await prisma.fITS_DIET.createMany({ data: dietData })
    }

    // Steps
    const stepData = r.steps.map((s: string, idx: number) => ({
      recipe_id: recipe.recipe_id,
      step_number: idx + 1,
      instruction: s,
    }))
    if (stepData.length > 0) {
      await prisma.recipe_Step.createMany({ data: stepData })
    }

    // Image (use custom URL if provided, otherwise pick from cuisine-specific set)
    const imgArr = cuisineImages[r.cuisine] || cuisineImages['American']
    if (!cuisineImgIdx[r.cuisine]) cuisineImgIdx[r.cuisine] = 0
    const fallbackUrl = imgArr[cuisineImgIdx[r.cuisine] % imgArr.length]
    cuisineImgIdx[r.cuisine]++
    const imageUrl = csvRecipeImages[i] !== '' ? csvRecipeImages[i] : fallbackUrl
    await prisma.recipe_Image.create({
      data: {
        recipe_id: recipe.recipe_id,
        image_order: 1,
        is_primary: true,
        image_url: imageUrl,
      }
    })

    // Ingredients (USES)
    const units = ['g', 'ml', 'tsp', 'tbsp', 'cup', 'whole', 'pinch']
    for (const ingName of r.ingredients) {
      const ingObj = ingredientMap[ingName.toLowerCase()]
      if (ingObj) {
        usesData.push({
          recipe_id: recipe.recipe_id,
          ingredient_id: ingObj.ingredient_id,
          quantity: Math.floor(Math.random() * 400) + 1,
          unit: units[Math.floor(Math.random() * units.length)],
        })
      }
    }

    if (i % 50 === 0) console.log(`  ... seeded ${i + 1}/${csvRecipes.length} recipes`)
  }

  // Bulk create USES
  if (usesData.length > 0) {
    // De-duplicate (same recipe_id + ingredient_id)
    const seen = new Set<string>()
    const uniqueUses = usesData.filter(u => {
      const key = `${u.recipe_id}-${u.ingredient_id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    await prisma.uSES.createMany({ data: uniqueUses })
    console.log(`✓ Created ${uniqueUses.length} ingredient uses`)
  }
  console.log(`✓ Created ${recipes.length} recipes from CSV data`)

  // ══════════════════════════════════════════════════════════════════════════════
  // ── ORIGINAL HAND-CRAFTED RECIPES (restored) ──────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  // ── Original Curated Ingredients (100) ────────────────────────────────────────
  const origIngredientData = [
    { name: 'Tomato', tag: 'High' }, { name: 'Basil', tag: 'Medium' },
    { name: 'Dry Pasta', tag: 'High' }, { name: 'Gluten-Free Pasta', tag: 'Low' },
    { name: 'Chicken Breast', tag: 'High' }, { name: 'White Rice', tag: 'High' },
    { name: 'Garlic', tag: 'High' }, { name: 'Onion', tag: 'High' },
    { name: 'Coconut Milk', tag: 'Medium' }, { name: 'Curry Powder', tag: 'Medium' },
    { name: 'Salmon Fillet', tag: 'Medium' }, { name: 'Soy Sauce', tag: 'High' },
    { name: 'Flour Tortilla', tag: 'High' }, { name: 'Avocado', tag: 'Medium' },
    { name: 'Lime', tag: 'High' }, { name: 'Cheddar Cheese', tag: 'High' },
    { name: 'Egg', tag: 'High' }, { name: 'Butter', tag: 'High' },
    { name: 'All-Purpose Flour', tag: 'High' }, { name: 'Honey', tag: 'Medium' },
    { name: 'Olive Oil', tag: 'High' }, { name: 'Parmesan', tag: 'Medium' },
    { name: 'Mozzarella', tag: 'High' }, { name: 'Oregano', tag: 'Medium' },
    { name: 'Chili Flakes', tag: 'High' }, { name: 'Shrimp', tag: 'Medium' },
    { name: 'Lemon', tag: 'High' }, { name: 'Parsley', tag: 'Medium' },
    { name: 'White Wine', tag: 'Medium' }, { name: 'Heavy Cream', tag: 'Medium' },
    { name: 'Ginger', tag: 'Medium' }, { name: 'Turmeric', tag: 'Medium' },
    { name: 'Cumin', tag: 'Medium' }, { name: 'Coriander', tag: 'Medium' },
    { name: 'Garam Masala', tag: 'Medium' }, { name: 'Tofu', tag: 'High' },
    { name: 'Spinach', tag: 'High' }, { name: 'Bell Pepper', tag: 'High' },
    { name: 'Sweet Potato', tag: 'High' }, { name: 'Quinoa', tag: 'Medium' },
    { name: 'Black Beans', tag: 'High' }, { name: 'Cilantro', tag: 'High' },
    { name: 'Jalapeno', tag: 'Medium' }, { name: 'Cumin Seeds', tag: 'Medium' },
    { name: 'Sour Cream', tag: 'High' }, { name: 'Miso Paste', tag: 'Medium' },
    { name: 'Nori Sheets', tag: 'Medium' }, { name: 'Sesame Oil', tag: 'Medium' },
    { name: 'Mirin', tag: 'Medium' }, { name: 'Dashi Stock', tag: 'Medium' },
    { name: 'Beef Sirloin', tag: 'Medium' }, { name: 'Thyme', tag: 'Medium' },
    { name: 'Rosemary', tag: 'Medium' }, { name: 'Dijon Mustard', tag: 'Medium' },
    { name: 'Gruyere Cheese', tag: 'Low' }, { name: 'Lamb Shoulder', tag: 'Low' },
    { name: 'Fresh Mint', tag: 'Medium' }, { name: 'Greek Yogurt', tag: 'High' },
    { name: 'Saffron', tag: 'Low' }, { name: 'Cardamom', tag: 'Low' },
    { name: 'Almond Milk', tag: 'High' }, { name: 'Cashews', tag: 'Medium' },
    { name: 'Walnuts', tag: 'Medium' }, { name: 'Pecans', tag: 'Medium' },
    { name: 'Pine Nuts', tag: 'Low' }, { name: 'Breadcrumbs', tag: 'High' },
    { name: 'Panko', tag: 'Medium' }, { name: 'Cornstarch', tag: 'High' },
    { name: 'Baking Powder', tag: 'High' }, { name: 'Baking Soda', tag: 'High' },
    { name: 'Vanilla Extract', tag: 'Medium' }, { name: 'Cocoa Powder', tag: 'Medium' },
    { name: 'Dark Chocolate', tag: 'Medium' }, { name: 'Brown Sugar', tag: 'High' },
    { name: 'Maple Syrup', tag: 'Medium' }, { name: 'Apple Cider Vinegar', tag: 'High' },
    { name: 'Rice Vinegar', tag: 'Medium' }, { name: 'Balsamic Vinegar', tag: 'Medium' },
    { name: 'Fish Sauce', tag: 'Medium' }, { name: 'Oyster Sauce', tag: 'Medium' },
    { name: 'Sriracha', tag: 'High' }, { name: 'Gochujang', tag: 'Low' },
    { name: 'Harissa', tag: 'Low' }, { name: 'Smoked Paprika', tag: 'Medium' },
    { name: 'Cinnamon', tag: 'High' }, { name: 'Nutmeg', tag: 'Medium' },
    { name: 'Cloves', tag: 'Medium' }, { name: 'Bay Leaves', tag: 'High' },
    { name: 'Fennel Seeds', tag: 'Medium' }, { name: 'Mustard Seeds', tag: 'Medium' },
    { name: 'Fenugreek', tag: 'Low' }, { name: 'Star Anise', tag: 'Low' },
    { name: 'Lemongrass', tag: 'Low' }, { name: 'Galangal', tag: 'Low' },
    { name: 'Kaffir Lime Leaves', tag: 'Low' }, { name: 'Coconut Flour', tag: 'Medium' },
    { name: 'Almond Flour', tag: 'Medium' }, { name: 'Tapioca Flour', tag: 'Medium' },
    { name: 'Chickpea Flour', tag: 'Medium' }, { name: 'Nutritional Yeast', tag: 'Medium' },
    { name: 'Tempeh', tag: 'Medium' }, { name: 'Seitan', tag: 'Low' },
    { name: 'Edamame', tag: 'Medium' }, { name: 'Lentils', tag: 'High' },
    { name: 'Kidney Beans', tag: 'High' }, { name: 'Zucchini', tag: 'High' },
    { name: 'Eggplant', tag: 'High' }, { name: 'Cauliflower', tag: 'High' },
    { name: 'Broccoli', tag: 'High' }, { name: 'Mushrooms', tag: 'High' },
    { name: 'Cherry Tomatoes', tag: 'High' }, { name: 'Sun-Dried Tomatoes', tag: 'Medium' },
    { name: 'Artichoke Hearts', tag: 'Medium' }, { name: 'Capers', tag: 'Medium' },
    { name: 'Kalamata Olives', tag: 'Medium' }, { name: 'Anchovies', tag: 'Low' },
    { name: 'Tuna', tag: 'Medium' }, { name: 'Cod Fillet', tag: 'Medium' },
    { name: 'Scallops', tag: 'Low' }, { name: 'Crab Meat', tag: 'Low' },
    { name: 'Pork Belly', tag: 'Medium' }, { name: 'Chorizo', tag: 'Medium' },
    { name: 'Prosciutto', tag: 'Low' }, { name: 'Bacon', tag: 'High' },
    { name: 'Italian Sausage', tag: 'Medium' }, { name: 'Feta Cheese', tag: 'Medium' },
    { name: 'Goat Cheese', tag: 'Medium' }, { name: 'Ricotta', tag: 'Medium' },
    { name: 'Mascarpone', tag: 'Low' }, { name: 'Cream Cheese', tag: 'High' },
    { name: 'Coconut Oil', tag: 'High' }, { name: 'Ghee', tag: 'Medium' },
    { name: 'Lard', tag: 'Medium' }, { name: 'Peanut Oil', tag: 'High' },
    { name: 'Vegetable Oil', tag: 'High' },
  ]

  const origIng: Record<string, { ingredient_id: number }> = {}
  for (const ing of origIngredientData) {
    try {
      const created = await prisma.ingredient.create({
        data: { ingredient_name: ing.name, availability_tag: ing.tag }
      })
      origIng[ing.name] = created
    } catch {
      // Already exists from CSV data, look it up
      const existing = await prisma.ingredient.findFirst({ where: { ingredient_name: ing.name } })
      if (existing) origIng[ing.name] = { ingredient_id: existing.ingredient_id }
    }
  }
  console.log(`✓ Created/found ${Object.keys(origIng).length} curated ingredients`)

  // ── Ingredient Substitutes (120) ────────────────────────────────────────────
  const subPairs: [string, string, string, number, string][] = [
    // ── Grains & Pasta ──────────────────────────────────────────────────────
    ['Dry Pasta', 'Gluten-Free Pasta', 'Gluten intolerance', 0.95, 'GF pasta is a 1:1 substitute for boiled pasta dishes.'],
    ['Dry Pasta', 'Zucchini', 'Low-carb alternative', 0.60, 'Spiralized zucchini (zoodles) replaces pasta for a lighter dish.'],
    ['White Rice', 'Quinoa', 'Healthier grain alternative', 0.85, 'Quinoa provides more protein and a nuttier flavor.'],
    ['White Rice', 'Cauliflower', 'Low-carb alternative', 0.70, 'Riced cauliflower mimics the texture of rice with fewer carbs.'],
    ['White Rice', 'Lentils', 'High-protein grain alternative', 0.55, 'Cooked lentils add protein and fiber as a rice replacement.'],
    ['White Rice', 'Sweet Potato', 'Whole food carb alternative', 0.50, 'Diced sweet potato provides complex carbs and natural sweetness.'],
    ['Breadcrumbs', 'Panko', 'Crunchier coating', 0.90, 'Panko provides a lighter, crispier coating than regular breadcrumbs.'],
    ['Breadcrumbs', 'Almond Flour', 'Gluten-free coating', 0.70, 'Almond flour creates a nutty, gluten-free breading.'],

    // ── Flours ───────────────────────────────────────────────────────────────
    ['All-Purpose Flour', 'Almond Flour', 'Gluten-free baking', 0.75, 'Almond flour works well in most baking at a 1:1 ratio.'],
    ['All-Purpose Flour', 'Coconut Flour', 'Gluten-free baking', 0.60, 'Use 1/4 cup coconut flour per 1 cup regular flour.'],
    ['All-Purpose Flour', 'Chickpea Flour', 'High-protein alternative', 0.65, 'Chickpea flour works well for savory dishes and batters.'],
    ['All-Purpose Flour', 'Tapioca Flour', 'Thickening alternative', 0.55, 'Tapioca flour is excellent for thickening sauces and soups.'],
    ['Cornstarch', 'Tapioca Flour', 'Thickening agent', 0.80, 'Tapioca flour thickens similarly but gives a glossier finish.'],
    ['Cornstarch', 'All-Purpose Flour', 'Basic thickener', 0.70, 'Use 2 tbsp flour per 1 tbsp cornstarch for thickening.'],
    ['Almond Flour', 'Coconut Flour', 'Nut-free GF baking', 0.55, 'Use 1/3 the amount of coconut flour compared to almond flour.'],
    ['Chickpea Flour', 'All-Purpose Flour', 'Standard substitute', 0.70, 'Regular flour works 1:1 but loses the protein boost.'],

    // ── Fats & Oils ──────────────────────────────────────────────────────────
    ['Butter', 'Coconut Oil', 'Dairy-free alternative', 0.85, 'Coconut oil can replace butter 1:1 in most baking.'],
    ['Butter', 'Ghee', 'Lactose-free alternative', 0.95, 'Ghee is clarified butter with milk solids removed.'],
    ['Butter', 'Olive Oil', 'Heart-healthy fat', 0.70, 'Use 3/4 cup olive oil per 1 cup butter. Best for savory dishes.'],
    ['Olive Oil', 'Vegetable Oil', 'Neutral oil alternative', 0.85, 'Vegetable oil is more neutral in flavor. Use 1:1.'],
    ['Olive Oil', 'Coconut Oil', 'Tropical oil alternative', 0.65, 'Coconut oil adds a subtle sweetness. Best for baking and Asian dishes.'],
    ['Olive Oil', 'Ghee', 'High-heat cooking fat', 0.70, 'Ghee has a higher smoke point and adds buttery richness.'],
    ['Sesame Oil', 'Peanut Oil', 'Asian cooking oil', 0.60, 'Peanut oil works for high-heat cooking but lacks sesame flavor.'],
    ['Sesame Oil', 'Olive Oil', 'Milder oil alternative', 0.45, 'Olive oil lacks the nutty depth but works in a pinch.'],
    ['Coconut Oil', 'Vegetable Oil', 'Neutral substitute', 0.75, 'Vegetable oil is a neutral 1:1 swap without coconut flavor.'],
    ['Ghee', 'Butter', 'Standard dairy fat', 0.90, 'Butter works 1:1 but contains milk solids (not lactose-free).'],
    ['Lard', 'Butter', 'Baking fat alternative', 0.75, 'Butter provides similar richness with a different flavor profile.'],
    ['Lard', 'Coconut Oil', 'Plant-based fat', 0.65, 'Coconut oil can replace lard 1:1 in pastry and frying.'],
    ['Peanut Oil', 'Vegetable Oil', 'Nut-free cooking oil', 0.85, 'Vegetable oil is a safe, neutral alternative for nut allergies.'],

    // ── Dairy & Cheese ───────────────────────────────────────────────────────
    ['Heavy Cream', 'Coconut Milk', 'Dairy-free cream alternative', 0.80, 'Full-fat coconut milk works well in curries and soups.'],
    ['Heavy Cream', 'Cashews', 'Vegan cream alternative', 0.75, 'Soaked and blended cashews create a rich, creamy base.'],
    ['Heavy Cream', 'Almond Milk', 'Lower-fat alternative', 0.55, 'Almond milk is thinner but works in soups and sauces.'],
    ['Heavy Cream', 'Greek Yogurt', 'Tangy cream replacement', 0.65, 'Greek yogurt adds protein and tang. Best for sauces, not whipping.'],
    ['Sour Cream', 'Greek Yogurt', 'Healthier alternative', 0.90, 'Greek yogurt is a tangy, protein-rich substitute.'],
    ['Sour Cream', 'Cream Cheese', 'Richer substitute', 0.60, 'Cream cheese is thicker and richer. Thin with milk if needed.'],
    ['Parmesan', 'Nutritional Yeast', 'Vegan cheese alternative', 0.70, 'Nutritional yeast provides a similar umami, cheesy flavor.'],
    ['Parmesan', 'Feta Cheese', 'Salty cheese alternative', 0.55, 'Feta is crumbly and tangier, works as a topping.'],
    ['Parmesan', 'Ricotta', 'Mild cheese alternative', 0.45, 'Ricotta is creamy, not sharp—better for fillings than grating.'],
    ['Mozzarella', 'Feta Cheese', 'Different cheese profile', 0.60, 'Feta provides a tangier, saltier alternative.'],
    ['Mozzarella', 'Ricotta', 'Soft cheese alternative', 0.55, 'Ricotta offers creaminess but does not melt the same way.'],
    ['Mozzarella', 'Goat Cheese', 'Tangy substitute', 0.50, 'Goat cheese melts differently but adds distinctive tang.'],
    ['Cheddar Cheese', 'Gruyere Cheese', 'Nuttier cheese alternative', 0.75, 'Gruyère melts beautifully and has a complex, nutty flavor.'],
    ['Cheddar Cheese', 'Goat Cheese', 'Sharper flavor alternative', 0.55, 'Goat cheese is tangier and earthy; use in similar quantities.'],
    ['Feta Cheese', 'Goat Cheese', 'Crumbly cheese alternative', 0.80, 'Goat cheese has a similar crumbly texture and tangy flavor.'],
    ['Feta Cheese', 'Ricotta', 'Milder cheese alternative', 0.55, 'Ricotta is much milder and creamier than feta.'],
    ['Gruyere Cheese', 'Cheddar Cheese', 'Budget-friendly alternative', 0.70, 'Sharp cheddar can mimic Gruyère in melted dishes.'],
    ['Ricotta', 'Cream Cheese', 'Richer alternative', 0.70, 'Cream cheese is denser but works in lasagna and dips.'],
    ['Mascarpone', 'Cream Cheese', 'Common substitute', 0.80, 'Cream cheese is tangier; blend with cream for closer match.'],
    ['Cream Cheese', 'Greek Yogurt', 'Lighter alternative', 0.60, 'Greek yogurt is lighter and tangier; good for dips and spreads.'],
    ['Greek Yogurt', 'Coconut Milk', 'Dairy-free yogurt alternative', 0.50, 'Thick coconut cream can replace yogurt in marinades and sauces.'],

    // ── Proteins ─────────────────────────────────────────────────────────────
    ['Chicken Breast', 'Tofu', 'Plant-based protein', 0.75, 'Extra-firm tofu can replace chicken in stir-fries and curries.'],
    ['Chicken Breast', 'Tempeh', 'Plant-based protein', 0.70, 'Tempeh has a firmer, nuttier texture than tofu.'],
    ['Chicken Breast', 'Seitan', 'Wheat-based meat alternative', 0.65, 'Seitan has a chewy, meat-like texture. Not for gluten-free diets.'],
    ['Tofu', 'Tempeh', 'Firmer soy option', 0.80, 'Tempeh has a nuttier, firmer texture and more protein.'],
    ['Tofu', 'Seitan', 'Different plant protein', 0.55, 'Seitan is chewier and more meat-like but contains gluten.'],
    ['Tofu', 'Edamame', 'Whole soy alternative', 0.50, 'Edamame keeps its shape well in salads and bowls.'],
    ['Tempeh', 'Mushrooms', 'Whole food alternative', 0.55, 'Mushrooms provide umami and meaty texture without soy.'],
    ['Beef Sirloin', 'Lamb Shoulder', 'Alternative red meat', 0.70, 'Lamb provides a richer, gamier flavor.'],
    ['Beef Sirloin', 'Mushrooms', 'Plant-based umami', 0.60, 'Portobello mushrooms provide meaty texture and umami.'],
    ['Beef Sirloin', 'Tofu', 'Vegan protein alternative', 0.45, 'Marinated extra-firm tofu can work in stir-fries and kebabs.'],
    ['Lamb Shoulder', 'Beef Sirloin', 'Common red meat swap', 0.70, 'Beef is milder and more widely available.'],
    ['Pork Belly', 'Bacon', 'Cured pork alternative', 0.75, 'Bacon is pre-cured and thinner; adjust cooking time.'],
    ['Pork Belly', 'Tofu', 'Vegan belly alternative', 0.40, 'Pressed and marinated tofu slabs can mimic texture when baked.'],
    ['Bacon', 'Prosciutto', 'Italian cured meat', 0.65, 'Prosciutto is unsmoked and thinner; crisp in a pan for similar use.'],
    ['Bacon', 'Chorizo', 'Spiced pork alternative', 0.55, 'Chorizo adds smoky heat but has a different texture.'],
    ['Chorizo', 'Italian Sausage', 'Sausage alternative', 0.70, 'Italian sausage is milder; add paprika and chili for closer match.'],
    ['Prosciutto', 'Bacon', 'Smoked pork alternative', 0.65, 'Bacon is smokier and fattier; cook crispy for appetizers.'],

    // ── Seafood ──────────────────────────────────────────────────────────────
    ['Shrimp', 'Tofu', 'Plant-based seafood alternative', 0.55, 'Firm tofu cut into strips mimics shrimp texture.'],
    ['Shrimp', 'Scallops', 'Shellfish alternative', 0.70, 'Scallops are sweeter; adjust cooking time (sear quickly).'],
    ['Salmon Fillet', 'Tuna', 'Alternative fish', 0.65, 'Tuna is a leaner alternative. Adjust cooking time.'],
    ['Salmon Fillet', 'Cod Fillet', 'Milder fish alternative', 0.60, 'Cod is milder and flakier; needs more seasoning.'],
    ['Tuna', 'Salmon Fillet', 'Fattier fish alternative', 0.65, 'Salmon is richer and fattier; works well grilled or baked.'],
    ['Tuna', 'Cod Fillet', 'White fish alternative', 0.60, 'Cod is milder and flakier than tuna.'],
    ['Cod Fillet', 'Salmon Fillet', 'Rich fish alternative', 0.55, 'Salmon is stronger in flavor; reduce other seasonings.'],
    ['Scallops', 'Shrimp', 'Affordable shellfish', 0.70, 'Shrimp is more affordable and widely available.'],
    ['Crab Meat', 'Shrimp', 'Shellfish alternative', 0.60, 'Chopped shrimp can replace crab in dips and cakes.'],
    ['Anchovies', 'Capers', 'Salty umami alternative', 0.55, 'Capers provide brininess without the fishiness.'],

    // ── Beans & Legumes ──────────────────────────────────────────────────────
    ['Black Beans', 'Kidney Beans', 'Bean alternative', 0.85, 'Kidney beans are slightly larger and firmer.'],
    ['Black Beans', 'Lentils', 'Legume alternative', 0.70, 'Lentils cook faster and have a softer texture.'],
    ['Black Beans', 'Edamame', 'Higher-protein bean swap', 0.55, 'Edamame adds a green, fresh flavor to bowls and salads.'],
    ['Kidney Beans', 'Black Beans', 'Bean alternative', 0.85, 'Black beans are smaller and slightly creamier.'],
    ['Kidney Beans', 'Lentils', 'Quicker-cooking legume', 0.65, 'Lentils cook much faster and work well in stews.'],
    ['Lentils', 'Black Beans', 'Bean alternative', 0.65, 'Black beans hold their shape better in chili and tacos.'],

    // ── Vegetables ───────────────────────────────────────────────────────────
    ['Spinach', 'Broccoli', 'Green vegetable alternative', 0.60, 'Broccoli provides a firmer texture and stronger flavor.'],
    ['Spinach', 'Zucchini', 'Mild green substitute', 0.55, 'Zucchini is milder; dice or spiralize for different uses.'],
    ['Bell Pepper', 'Zucchini', 'Vegetable alternative', 0.65, 'Zucchini has a milder flavor and softer texture.'],
    ['Bell Pepper', 'Eggplant', 'Roasting vegetable swap', 0.50, 'Eggplant is softer and more absorbent; adds meatiness.'],
    ['Tomato', 'Cherry Tomatoes', 'Tomato variety', 0.90, 'Cherry tomatoes are sweeter. Use 1.5x the amount.'],
    ['Tomato', 'Sun-Dried Tomatoes', 'Concentrated tomato flavor', 0.60, 'Sun-dried tomatoes are intensely flavored; use less and rehydrate.'],
    ['Cherry Tomatoes', 'Sun-Dried Tomatoes', 'Intense flavor swap', 0.50, 'Sun-dried are much more concentrated; use sparingly.'],
    ['Zucchini', 'Eggplant', 'Summer squash swap', 0.70, 'Eggplant is denser and more absorbent; great for grilling.'],
    ['Eggplant', 'Mushrooms', 'Meaty veggie swap', 0.65, 'Mushrooms provide similar umami and meatiness.'],
    ['Cauliflower', 'Broccoli', 'Cruciferous vegetable swap', 0.80, 'Broccoli has a stronger flavor but similar texture when steamed.'],
    ['Broccoli', 'Cauliflower', 'Milder cruciferous swap', 0.80, 'Cauliflower is milder and blends more easily into sauces.'],
    ['Sweet Potato', 'Cauliflower', 'Low-carb root swap', 0.55, 'Cauliflower mash can replace sweet potato for fewer carbs.'],
    ['Mushrooms', 'Eggplant', 'Meaty vegetable alternative', 0.65, 'Eggplant absorbs flavors well and has a meaty bite.'],
    ['Mushrooms', 'Tofu', 'Plant protein alternative', 0.50, 'Tofu lacks the umami but can be seasoned to compensate.'],

    // ── Herbs ────────────────────────────────────────────────────────────────
    ['Basil', 'Oregano', 'Italian herb alternative', 0.60, 'Oregano is more pungent. Use half the amount.'],
    ['Basil', 'Cilantro', 'Fresh herb swap', 0.45, 'Cilantro has a very different flavor; best for Asian and Mexican dishes.'],
    ['Basil', 'Fresh Mint', 'Fresh herb swap', 0.40, 'Mint is much more cooling; works in Thai and Vietnamese dishes.'],
    ['Parsley', 'Cilantro', 'Fresh herb alternative', 0.65, 'Cilantro is more pungent; use less for garnishing.'],
    ['Cilantro', 'Parsley', 'Milder herb alternative', 0.65, 'Parsley is milder and lacks the citrusy notes.'],
    ['Thyme', 'Rosemary', 'Woody herb swap', 0.70, 'Rosemary is stronger and more piney; use less.'],
    ['Rosemary', 'Thyme', 'Milder woody herb', 0.70, 'Thyme is more delicate and versatile.'],
    ['Fresh Mint', 'Basil', 'Aromatic herb swap', 0.45, 'Basil lacks the cooling effect but adds sweetness.'],
    ['Oregano', 'Thyme', 'Mediterranean herb swap', 0.65, 'Thyme is milder and less earthy than oregano.'],

    // ── Spices ───────────────────────────────────────────────────────────────
    ['Chili Flakes', 'Sriracha', 'Heat alternative', 0.70, 'Sriracha adds heat plus garlic flavor.'],
    ['Chili Flakes', 'Gochujang', 'Korean heat paste', 0.55, 'Gochujang is sweeter and more complex. Mix with oil.'],
    ['Smoked Paprika', 'Chili Flakes', 'Heat substitute', 0.55, 'Chili flakes provide heat but lack the smoky depth.'],
    ['Smoked Paprika', 'Harissa', 'Smoky-spicy swap', 0.60, 'Harissa is a paste with similar smokiness plus extra complexity.'],
    ['Cumin', 'Coriander', 'Warm spice swap', 0.60, 'Coriander is lighter and more citrusy than earthy cumin.'],
    ['Cumin', 'Cumin Seeds', 'Whole vs ground', 0.90, 'Toast and grind cumin seeds for a fresher flavor.'],
    ['Garam Masala', 'Curry Powder', 'Indian spice blend swap', 0.65, 'Curry powder is milder; add extra cinnamon and cloves.'],
    ['Curry Powder', 'Garam Masala', 'Warmer spice blend', 0.65, 'Garam masala is more aromatic; add turmeric separately.'],
    ['Turmeric', 'Saffron', 'Color and flavor', 0.40, 'Saffron is more complex but can replicate the golden color.'],
    ['Cinnamon', 'Nutmeg', 'Warm baking spice swap', 0.60, 'Nutmeg is more pungent; use half the amount.'],
    ['Nutmeg', 'Cinnamon', 'Sweet spice alternative', 0.60, 'Cinnamon is sweeter and less sharp.'],
    ['Cardamom', 'Cinnamon', 'Warm spice substitute', 0.45, 'Cinnamon lacks the floral notes but adds similar warmth.'],
    ['Star Anise', 'Fennel Seeds', 'Anise flavor substitute', 0.55, 'Fennel seeds provide milder anise notes.'],
    ['Fennel Seeds', 'Cumin Seeds', 'Aromatic seed swap', 0.50, 'Cumin seeds are earthier; lacks the licorice note.'],
    ['Mustard Seeds', 'Dijon Mustard', 'Prepared mustard swap', 0.55, '1 tsp mustard seeds ≈ 1 tbsp Dijon. Toast seeds first.'],

    // ── Sauces & Condiments ──────────────────────────────────────────────────
    ['Soy Sauce', 'Fish Sauce', 'Asian sauce swap', 0.55, 'Fish sauce is fishier and more pungent; use less.'],
    ['Fish Sauce', 'Soy Sauce', 'Umami alternative', 0.65, 'Soy sauce provides umami but lacks the fishy depth.'],
    ['Oyster Sauce', 'Soy Sauce', 'Simpler sauce alternative', 0.55, 'Soy sauce is thinner; add a pinch of sugar for sweetness.'],
    ['Oyster Sauce', 'Fish Sauce', 'Asian condiment swap', 0.50, 'Fish sauce is thinner and fishier; adjust quantity down.'],
    ['Sriracha', 'Gochujang', 'Korean hot sauce swap', 0.60, 'Gochujang is thicker and sweeter with fermented depth.'],
    ['Sriracha', 'Harissa', 'North African heat swap', 0.55, 'Harissa adds smoky depth alongside the heat.'],
    ['Gochujang', 'Sriracha', 'Thinner hot sauce', 0.60, 'Sriracha is thinner and more garlicky.'],
    ['Harissa', 'Sriracha', 'Simpler hot sauce', 0.50, 'Sriracha lacks the smoky depth but provides clean heat.'],
    ['Miso Paste', 'Soy Sauce', 'Umami seasoning', 0.55, 'Soy sauce is thinner; use less for similar salt and umami.'],
    ['Dijon Mustard', 'Mustard Seeds', 'Whole seed alternative', 0.55, 'Toast and grind mustard seeds for a rustic Dijon replacement.'],
    ['Mirin', 'Rice Vinegar', 'Japanese seasoning', 0.60, 'Rice vinegar + sugar mimics mirin.'],

    // ── Sweeteners ───────────────────────────────────────────────────────────
    ['Honey', 'Maple Syrup', 'Vegan sweetener', 0.85, 'Maple syrup is a 1:1 substitute for honey.'],
    ['Honey', 'Brown Sugar', 'Pantry sweetener swap', 0.65, 'Use 3/4 cup brown sugar + 1/4 cup water per 1 cup honey.'],
    ['Brown Sugar', 'Honey', 'Natural sweetener', 0.75, 'Use 3/4 cup honey per 1 cup brown sugar.'],
    ['Brown Sugar', 'Maple Syrup', 'Liquid sweetener swap', 0.70, 'Use 2/3 cup maple syrup per 1 cup brown sugar; reduce other liquids.'],
    ['Maple Syrup', 'Honey', 'Non-vegan sweetener', 0.85, 'Honey is a 1:1 swap but is not vegan.'],

    // ── Vinegars ─────────────────────────────────────────────────────────────
    ['Apple Cider Vinegar', 'Balsamic Vinegar', 'Flavor profile shift', 0.65, 'Balsamic is sweeter and darker.'],
    ['Apple Cider Vinegar', 'Rice Vinegar', 'Milder vinegar swap', 0.75, 'Rice vinegar is milder and less fruity.'],
    ['Balsamic Vinegar', 'Apple Cider Vinegar', 'Lighter vinegar swap', 0.65, 'ACV is lighter; add a pinch of sugar for sweetness.'],
    ['Balsamic Vinegar', 'Rice Vinegar', 'Asian vinegar swap', 0.50, 'Rice vinegar is much milder; add soy sauce for depth.'],
    ['Rice Vinegar', 'Apple Cider Vinegar', 'Fruity vinegar swap', 0.70, 'ACV is slightly stronger; use a bit less.'],

    // ── Citrus ───────────────────────────────────────────────────────────────
    ['Lime', 'Lemon', 'Citrus alternative', 0.90, 'Lemon juice can replace lime juice 1:1.'],
    ['Lemon', 'Lime', 'Citrus alternative', 0.90, 'Lime juice can replace lemon juice 1:1.'],
    ['Lemon', 'Apple Cider Vinegar', 'Acidic substitute', 0.50, 'ACV provides acidity without citrus flavor. Use half the amount.'],

    // ── Nuts ─────────────────────────────────────────────────────────────────
    ['Pine Nuts', 'Walnuts', 'Budget-friendly alternative', 0.70, 'Walnuts are more affordable and provide similar richness.'],
    ['Pine Nuts', 'Cashews', 'Creamy nut alternative', 0.65, 'Cashews are creamier and milder than pine nuts.'],
    ['Cashews', 'Pecans', 'Nut alternative', 0.65, 'Pecans are softer and sweeter.'],
    ['Cashews', 'Walnuts', 'More robust nut swap', 0.60, 'Walnuts are slightly bitter and more textured.'],
    ['Walnuts', 'Pecans', 'Sweeter nut alternative', 0.75, 'Pecans are milder and sweeter; great in baking.'],
    ['Pecans', 'Walnuts', 'Budget nut alternative', 0.75, 'Walnuts have a similar shape and slightly more bitterness.'],

    // ── Baking ───────────────────────────────────────────────────────────────
    ['Egg', 'Cornstarch', 'Binding alternative', 0.65, '2 tbsp cornstarch + 2 tbsp water = 1 egg for binding.'],
    ['Vanilla Extract', 'Almond Flour', 'Flavoring shift', 0.30, 'Almond flour adds nutty flavor but is not a direct flavor extract swap.'],
    ['Cocoa Powder', 'Dark Chocolate', 'Richer chocolate flavor', 0.70, 'Melt and substitute 3 tbsp cocoa + 1 tbsp fat per 1 oz dark chocolate.'],
    ['Dark Chocolate', 'Cocoa Powder', 'Baking cocoa swap', 0.70, 'Use 3 tbsp cocoa + 1 tbsp butter per 1 oz dark chocolate.'],
    ['Baking Powder', 'Baking Soda', 'Leavening swap', 0.50, 'Use 1/4 tsp baking soda per 1 tsp baking powder; add acid (lemon juice).'],
    ['Baking Soda', 'Baking Powder', 'Leavening swap', 0.50, 'Use 3x baking powder per 1x baking soda; omit acid from recipe.'],

    // ── Specialty & Thai Ingredients ─────────────────────────────────────────
    ['Lemongrass', 'Lemon', 'Citrus substitute', 0.45, 'Lemon zest mimics the citrusy notes but lacks the herbal depth.'],
    ['Galangal', 'Ginger', 'Root spice swap', 0.60, 'Ginger is more widely available; galangal is sharper and more piney.'],
    ['Kaffir Lime Leaves', 'Lime', 'Citrus leaf substitute', 0.40, 'Lime zest mimics some of the flavor but lacks the aromatic leaves.'],
    ['Dashi Stock', 'Miso Paste', 'Japanese base flavor', 0.50, 'Dissolve miso in hot water for a quick dashi-like base.'],
    ['Nori Sheets', 'Spinach', 'Green wrap alternative', 0.30, 'Blanched spinach leaves can wrap rice but lack the sea flavor.'],
    ['Saffron', 'Turmeric', 'Budget color alternative', 0.40, 'Turmeric provides golden color but a very different flavor.'],
    ['Fenugreek', 'Mustard Seeds', 'Bitter spice swap', 0.45, 'Mustard seeds add bite but lack the maple-like fenugreek flavor.'],
  ]

  let subCount = 0
  for (const [orig, sub, reason, score, explanation] of subPairs) {
    if (origIng[orig] && origIng[sub]) {
      try {
        await prisma.sUBSTITUTES.create({
          data: {
            original_ingredient_id: origIng[orig].ingredient_id,
            substitute_ingredient_id: origIng[sub].ingredient_id,
            reason, confidence_score: score, explanation,
          }
        })
        subCount++
      } catch { /* skip duplicates */ }
    }
  }
  console.log(`✓ Created ${subCount} ingredient substitutes`)

  // ── Original Hand-Crafted Recipes (65) ──────────────────────────────────────
  const italian = cuisineMap['Italian'], indian = cuisineMap['Indian'],
    japanese = cuisineMap['Japanese'], mexican = cuisineMap['Mexican'],
    french = cuisineMap['French']
  const comfort = moodMap['Comfort'], adventurous = moodMap['Adventurous'],
    quick = moodMap['Quick'], healthy = moodMap['Healthy'],
    festive = moodMap['Festive'], light = moodMap['Light']
  const vegan = dietMap['Vegan'], glutenFree = dietMap['Gluten-Free'],
    keto = dietMap['Keto'], vegetarian = dietMap['Vegetarian'],
    dairyFree = dietMap['Dairy-Free'], nut_free = dietMap['Nut-Free'],
    halal = dietMap['Halal'], lowCarb = dietMap['Low-Carb']

  const origRecipeData = [
    { title: 'Classic Tomato Basil Pasta', description: 'A simple Italian weeknight staple with fresh tomatoes and fragrant basil.', time: 20, diff: 'Easy', userIdx: 0, moods: [comfort, quick], cuisine: italian, diets: [vegan, vegetarian, dairyFree, nut_free] },
    { title: 'Chicken Tikka Masala', description: 'Tender chicken in a rich, creamy tomato-based curry sauce.', time: 45, diff: 'Medium', userIdx: 2, moods: [comfort, adventurous], cuisine: indian, diets: [halal, glutenFree] },
    { title: 'Salmon Teriyaki Bowl', description: 'Glazed salmon over steamed rice with a sweet soy teriyaki sauce.', time: 30, diff: 'Easy', userIdx: 3, moods: [healthy, quick], cuisine: japanese, diets: [dairyFree, nut_free, halal] },
    { title: 'Street Tacos Al Pastor', description: 'Authentic Mexican tacos with marinated pork and fresh salsa.', time: 60, diff: 'Hard', userIdx: 6, moods: [festive, adventurous], cuisine: mexican, diets: [dairyFree, nut_free] },
    { title: 'French Croissants', description: 'Flaky, buttery croissants made from scratch using laminated dough.', time: 240, diff: 'Hard', userIdx: 4, moods: [festive, comfort], cuisine: french, diets: [vegetarian, nut_free] },
    { title: 'Miso Ramen', description: 'Rich miso broth with noodles, soft egg, and chashu pork.', time: 90, diff: 'Hard', userIdx: 3, moods: [comfort, adventurous], cuisine: japanese, diets: [nut_free] },
    { title: 'Avocado Toast Deluxe', description: 'Smashed avocado with lime, chili flakes and poached egg on sourdough.', time: 10, diff: 'Easy', userIdx: 1, moods: [quick, healthy, light], cuisine: mexican, diets: [vegetarian, dairyFree, nut_free] },
    { title: 'Vegetable Curry', description: 'Aromatic Indian vegetable curry with coconut milk and curry powder.', time: 35, diff: 'Medium', userIdx: 8, moods: [healthy, comfort], cuisine: indian, diets: [vegan, vegetarian, dairyFree, glutenFree, halal] },
    { title: 'Garlic Butter Shrimp Pasta', description: 'Linguine tossed in garlic butter with jumbo shrimp and parsley.', time: 25, diff: 'Medium', userIdx: 0, moods: [comfort, festive], cuisine: italian, diets: [nut_free, halal] },
    { title: 'Keto Egg Bowl', description: 'Low-carb breakfast bowl with fried eggs, avocado and cheddar cheese.', time: 15, diff: 'Easy', userIdx: 7, moods: [quick, healthy], cuisine: french, diets: [vegetarian, keto, lowCarb, glutenFree, nut_free] },
    { title: 'Honey Garlic Chicken', description: 'Pan-seared chicken thighs glazed in a sticky honey-garlic sauce.', time: 35, diff: 'Medium', userIdx: 5, moods: [comfort, quick], cuisine: japanese, diets: [dairyFree, nut_free, halal] },
    { title: 'French Onion Soup', description: 'Classic caramelized onion soup topped with melted Gruyère and a crouton.', time: 70, diff: 'Medium', userIdx: 9, moods: [comfort, festive], cuisine: french, diets: [vegetarian, nut_free] },
    { title: 'Mango Coconut Curry', description: 'Tropical Thai-inspired curry with sweet mango and coconut milk.', time: 40, diff: 'Medium', userIdx: 2, moods: [adventurous, light], cuisine: indian, diets: [vegan, vegetarian, dairyFree, glutenFree, nut_free, halal] },
    { title: 'Sushi Hand Rolls', description: 'Simple temaki hand rolls with salmon, avocado and sushi rice.', time: 30, diff: 'Medium', userIdx: 3, moods: [festive, adventurous], cuisine: japanese, diets: [dairyFree, glutenFree, nut_free, halal] },
    { title: 'Lemon Herb Roasted Chicken', description: 'Whole roasted chicken infused with lemon and fresh herbs.', time: 90, diff: 'Easy', userIdx: 5, moods: [comfort, festive], cuisine: french, diets: [glutenFree, dairyFree, nut_free, lowCarb, keto, halal] },
    { title: 'Margherita Pizza', description: 'Classic Neapolitan pizza with San Marzano tomatoes, fresh mozzarella and basil.', time: 30, diff: 'Medium', userIdx: 0, moods: [comfort, festive], cuisine: italian, diets: [vegetarian, nut_free] },
    { title: 'Carbonara', description: 'Authentic Roman pasta with eggs, pecorino, guanciale and black pepper.', time: 25, diff: 'Medium', userIdx: 0, moods: [comfort, quick], cuisine: italian, diets: [nut_free] },
    { title: 'Risotto alla Milanese', description: 'Creamy saffron-infused risotto, a Milanese classic.', time: 40, diff: 'Medium', userIdx: 9, moods: [comfort, festive], cuisine: italian, diets: [glutenFree, vegetarian, nut_free] },
    { title: 'Penne Arrabbiata', description: 'Spicy tomato sauce with garlic and chili flakes over penne.', time: 20, diff: 'Easy', userIdx: 0, moods: [quick, adventurous], cuisine: italian, diets: [vegan, vegetarian, dairyFree, nut_free] },
    { title: 'Lasagna Bolognese', description: 'Layers of pasta, rich meat ragù, béchamel and parmesan.', time: 120, diff: 'Hard', userIdx: 0, moods: [comfort, festive], cuisine: italian, diets: [nut_free] },
    { title: 'Bruschetta', description: 'Toasted bread topped with fresh tomatoes, garlic, basil and olive oil.', time: 15, diff: 'Easy', userIdx: 0, moods: [quick, light], cuisine: italian, diets: [vegan, vegetarian, dairyFree, nut_free] },
    { title: 'Pesto Genovese', description: 'Fresh basil pesto with pine nuts, garlic, parmesan and olive oil.', time: 15, diff: 'Easy', userIdx: 0, moods: [quick, healthy], cuisine: italian, diets: [vegetarian, nut_free] },
    { title: 'Osso Buco', description: 'Braised veal shanks in a rich vegetable and wine sauce.', time: 150, diff: 'Hard', userIdx: 9, moods: [festive, comfort], cuisine: italian, diets: [glutenFree, dairyFree, nut_free] },
    { title: 'Caprese Salad', description: 'Fresh mozzarella, ripe tomatoes and basil drizzled with olive oil.', time: 10, diff: 'Easy', userIdx: 1, moods: [light, healthy], cuisine: italian, diets: [vegetarian, glutenFree, keto, lowCarb, nut_free] },
    { title: 'Tiramisu', description: 'Classic Italian dessert with espresso-soaked ladyfingers and mascarpone.', time: 45, diff: 'Medium', userIdx: 4, moods: [festive, comfort], cuisine: italian, diets: [vegetarian, nut_free] },
    { title: 'Butter Chicken', description: 'Tender chicken in a velvety tomato-butter sauce with aromatic spices.', time: 50, diff: 'Medium', userIdx: 2, moods: [comfort, festive], cuisine: indian, diets: [glutenFree, nut_free] },
    { title: 'Palak Paneer', description: 'Creamy spinach curry with homemade paneer cheese cubes.', time: 40, diff: 'Medium', userIdx: 2, moods: [healthy, comfort], cuisine: indian, diets: [vegetarian, glutenFree, nut_free] },
    { title: 'Biryani', description: 'Fragrant basmati rice layered with spiced meat and saffron.', time: 90, diff: 'Hard', userIdx: 8, moods: [festive, adventurous], cuisine: indian, diets: [halal, glutenFree, dairyFree] },
    { title: 'Chana Masala', description: 'Spicy chickpea curry with tomatoes, ginger and warming spices.', time: 35, diff: 'Easy', userIdx: 1, moods: [quick, healthy], cuisine: indian, diets: [vegan, vegetarian, dairyFree, glutenFree, nut_free, halal] },
    { title: 'Tandoori Chicken', description: 'Yogurt-marinated chicken roasted with bold tandoori spices.', time: 60, diff: 'Medium', userIdx: 5, moods: [festive, adventurous], cuisine: indian, diets: [glutenFree, lowCarb, keto, halal] },
    { title: 'Dal Tadka', description: 'Yellow lentils tempered with cumin, garlic and ghee.', time: 30, diff: 'Easy', userIdx: 8, moods: [comfort, quick], cuisine: indian, diets: [vegan, vegetarian, glutenFree, dairyFree, nut_free, halal] },
    { title: 'Samosas', description: 'Crispy pastry pockets filled with spiced potatoes and peas.', time: 60, diff: 'Medium', userIdx: 2, moods: [festive, adventurous], cuisine: indian, diets: [vegan, vegetarian, dairyFree, nut_free] },
    { title: 'Naan Bread', description: 'Soft, pillowy Indian flatbread baked until golden.', time: 30, diff: 'Medium', userIdx: 4, moods: [comfort], cuisine: indian, diets: [vegetarian, nut_free] },
    { title: 'Lamb Rogan Josh', description: 'Slow-cooked lamb in a rich Kashmiri spice gravy.', time: 120, diff: 'Hard', userIdx: 8, moods: [festive, comfort], cuisine: indian, diets: [glutenFree, dairyFree, nut_free, halal] },
    { title: 'Aloo Gobi', description: 'Dry curry of potatoes and cauliflower with turmeric and cumin.', time: 30, diff: 'Easy', userIdx: 1, moods: [healthy, quick], cuisine: indian, diets: [vegan, vegetarian, dairyFree, glutenFree, nut_free, halal, lowCarb, keto] },
    { title: 'Chicken Katsu Curry', description: 'Crispy breaded chicken cutlet served with Japanese curry sauce.', time: 45, diff: 'Medium', userIdx: 3, moods: [comfort, festive], cuisine: japanese, diets: [dairyFree, nut_free] },
    { title: 'Gyoza', description: 'Pan-fried pork and vegetable dumplings with dipping sauce.', time: 60, diff: 'Medium', userIdx: 3, moods: [festive, adventurous], cuisine: japanese, diets: [dairyFree] },
    { title: 'Tonkotsu Ramen', description: 'Rich pork bone broth ramen with chashu, egg and nori.', time: 180, diff: 'Hard', userIdx: 3, moods: [comfort, adventurous], cuisine: japanese, diets: [dairyFree, nut_free] },
    { title: 'Tempura Vegetables', description: 'Light and crispy battered vegetables served with tentsuyu sauce.', time: 30, diff: 'Medium', userIdx: 3, moods: [light, festive], cuisine: japanese, diets: [vegetarian, dairyFree] },
    { title: 'Okonomiyaki', description: 'Savory Japanese pancake with cabbage, toppings and okonomiyaki sauce.', time: 30, diff: 'Medium', userIdx: 3, moods: [festive, adventurous], cuisine: japanese, diets: [dairyFree, nut_free] },
    { title: 'Edamame', description: 'Steamed young soybeans sprinkled with sea salt.', time: 10, diff: 'Easy', userIdx: 1, moods: [quick, healthy, light], cuisine: japanese, diets: [vegan, vegetarian, dairyFree, glutenFree, nut_free, keto, lowCarb, halal] },
    { title: 'Yakitori', description: 'Grilled chicken skewers glazed with sweet-savory tare sauce.', time: 30, diff: 'Easy', userIdx: 5, moods: [festive, quick], cuisine: japanese, diets: [dairyFree, nut_free, glutenFree] },
    { title: 'Matcha Cheesecake', description: 'Light and fluffy Japanese cotton cheesecake with matcha.', time: 90, diff: 'Hard', userIdx: 4, moods: [festive, comfort], cuisine: japanese, diets: [vegetarian, nut_free] },
    { title: 'Onigiri', description: 'Japanese rice balls filled with salmon and wrapped in nori.', time: 20, diff: 'Easy', userIdx: 3, moods: [quick, light], cuisine: japanese, diets: [dairyFree, nut_free] },
    { title: 'Udon Noodle Soup', description: 'Thick wheat noodles in a hot dashi broth with toppings.', time: 30, diff: 'Easy', userIdx: 3, moods: [comfort, quick], cuisine: japanese, diets: [dairyFree, nut_free] },
    { title: 'Enchiladas Verdes', description: 'Corn tortillas filled with chicken and topped with tangy green salsa.', time: 50, diff: 'Medium', userIdx: 6, moods: [comfort, festive], cuisine: mexican, diets: [glutenFree, nut_free] },
    { title: 'Guacamole', description: 'Fresh avocado dip with lime, cilantro, onion and jalapeño.', time: 10, diff: 'Easy', userIdx: 6, moods: [quick, light], cuisine: mexican, diets: [vegan, vegetarian, dairyFree, glutenFree, nut_free, keto, lowCarb, halal] },
    { title: 'Quesadillas', description: 'Grilled tortillas stuffed with melted cheese and your choice of fillings.', time: 15, diff: 'Easy', userIdx: 6, moods: [quick, comfort], cuisine: mexican, diets: [vegetarian, nut_free] },
    { title: 'Pozole', description: 'Traditional Mexican hominy soup with pork and red chili broth.', time: 120, diff: 'Hard', userIdx: 6, moods: [festive, comfort], cuisine: mexican, diets: [glutenFree, dairyFree, nut_free] },
    { title: 'Churros', description: 'Crispy fried dough pastry rolled in cinnamon sugar.', time: 30, diff: 'Medium', userIdx: 4, moods: [festive, comfort], cuisine: mexican, diets: [vegetarian, nut_free] },
    { title: 'Elote (Street Corn)', description: 'Grilled corn on the cob with mayo, cotija cheese and chili powder.', time: 15, diff: 'Easy', userIdx: 6, moods: [quick, festive], cuisine: mexican, diets: [vegetarian, glutenFree, nut_free] },
    { title: 'Tamales', description: 'Steamed masa dough filled with seasoned meat, wrapped in corn husks.', time: 150, diff: 'Hard', userIdx: 6, moods: [festive, adventurous], cuisine: mexican, diets: [glutenFree, dairyFree, nut_free] },
    { title: 'Black Bean Tacos', description: 'Seasoned black beans in corn tortillas with fresh toppings.', time: 20, diff: 'Easy', userIdx: 1, moods: [quick, healthy], cuisine: mexican, diets: [vegan, vegetarian, dairyFree, glutenFree, nut_free, halal] },
    { title: 'Ceviche', description: 'Fresh fish cured in citrus juices with tomatoes, onion and cilantro.', time: 25, diff: 'Medium', userIdx: 7, moods: [light, healthy], cuisine: mexican, diets: [glutenFree, dairyFree, nut_free, lowCarb, keto] },
    { title: 'Mole Poblano', description: 'Complex chili-chocolate sauce served over chicken.', time: 180, diff: 'Hard', userIdx: 8, moods: [festive, adventurous], cuisine: mexican, diets: [glutenFree, dairyFree, nut_free] },
    { title: 'Coq au Vin', description: 'Chicken braised in red wine with mushrooms, bacon and pearl onions.', time: 120, diff: 'Hard', userIdx: 9, moods: [comfort, festive], cuisine: french, diets: [glutenFree, dairyFree, nut_free] },
    { title: 'Ratatouille', description: 'Provençal stewed vegetables with herbs de Provence.', time: 60, diff: 'Medium', userIdx: 1, moods: [healthy, light], cuisine: french, diets: [vegan, vegetarian, dairyFree, glutenFree, nut_free, halal] },
    { title: 'Crème Brûlée', description: 'Rich vanilla custard with a caramelized sugar crust.', time: 60, diff: 'Medium', userIdx: 4, moods: [festive, comfort], cuisine: french, diets: [vegetarian, glutenFree, nut_free] },
    { title: 'Beef Bourguignon', description: 'Slow-braised beef in Burgundy wine with carrots and mushrooms.', time: 180, diff: 'Hard', userIdx: 9, moods: [comfort, festive], cuisine: french, diets: [glutenFree, dairyFree, nut_free] },
    { title: 'Quiche Lorraine', description: 'Savory tart with bacon, cheese and creamy egg custard.', time: 60, diff: 'Medium', userIdx: 4, moods: [comfort, festive], cuisine: french, diets: [nut_free] },
    { title: 'Niçoise Salad', description: 'Tuna, green beans, eggs, olives and potatoes with vinaigrette.', time: 25, diff: 'Easy', userIdx: 7, moods: [healthy, light], cuisine: french, diets: [glutenFree, dairyFree, nut_free] },
    { title: 'Croque Monsieur', description: 'Grilled ham and cheese sandwich with béchamel sauce.', time: 20, diff: 'Easy', userIdx: 9, moods: [quick, comfort], cuisine: french, diets: [nut_free] },
    { title: 'Bouillabaisse', description: 'Traditional Provençal fish stew with saffron and rouille.', time: 90, diff: 'Hard', userIdx: 7, moods: [festive, adventurous], cuisine: french, diets: [glutenFree, dairyFree, nut_free] },
    { title: 'Macarons', description: 'Delicate French almond meringue cookies with ganache filling.', time: 120, diff: 'Hard', userIdx: 4, moods: [festive, adventurous], cuisine: french, diets: [glutenFree, vegetarian, nut_free] },
    { title: 'Soupe à l\'Oignon Gratinée', description: 'Deeply flavored onion soup with toasted bread and melted cheese.', time: 75, diff: 'Medium', userIdx: 9, moods: [comfort, festive], cuisine: french, diets: [vegetarian, nut_free] },
  ]

  const origRecipeImages = [
    'https://www.southernliving.com/thmb/QvacOweW0h5jwaq9PHVNF9T9SAQ%3D/1500x0/filters%3Ano_upscale%28%29%3Amax_bytes%28150000%29%3Astrip_icc%28%29/27901_SUPT_TomBasil_Tomato-Basil-Pasta_100-b0d8a3b38cdb414ba6fc4c49e407caca.jpg',
    'https://www.recipetineats.com/tachyon/2018/04/Chicken-Tikka-Masala_0-SQ.jpg',
    'https://images.squarespace-cdn.com/content/v1/5ed666a6924cd0017d343b01/1593466332546-0FAWQJ5DT3ZMVIRO9H38/bite-me-more-apple-teriyaki-salmon-rice-bowl-recipe.jpg',
    'https://culinarybackstreets.s3.us-east-2.amazonaws.com/culinarybackstreets/uploads/CB_CDMX_Pastor_AR_top.jpg',
    'https://d2vbr83hnyiux1.cloudfront.net/image/975050285728/image_atp7qrie9p53l3b07mc9sg3q76/-FWEBP',
    'https://images.squarespace-cdn.com/content/v1/543dc236e4b0fffb45747ede/1468362338384-44ZLQXQ82J3DTRBY2TMU/image-asset.jpeg',
    'https://i.pinimg.com/736x/12/a7/ec/12a7eca2596695d2185a884f6ca2daed.jpg',
    'https://www.sbfoods-worldwide.com/recipes/eaq25q0000001bar-img/7_ColorfulvegeCurry_recipe.jpg',
    'https://media.hellofresh.com/q_100%2Cw_3840%2Cf_auto%2Cc_limit%2Cfl_lossy/recipes/image/garlic-butter-shrimp-scampi-9604b5c4.jpg',
    'https://ucarecdn.com/a562b1ce-47bc-42b8-8a0c-c05bee7bf7e4/',
    'https://del.h-cdn.co/assets/16/19/1600x1200/sd-aspect-1463087916-delish-sticky-honey-garlic-chicken.jpg',
    'https://www.onceuponachef.com/images/2019/02/french-onion-soup-1.jpg',
    'https://img.taste.com.au/K6hHHVrQ/taste/2024/12/healthy-chicken-breast-coconut-mango-curry-4-205852-1.jpg',
    'https://www.extraingredient.com/uploads/image-recipe-temaki-sushi-handrolls.jpg',
    'https://www.foodandwine.com/thmb/t9YqzGbmH-huAbV6xitCQs0-G4s%3D/1500x0/filters%3Ano_upscale%28%29%3Amax_bytes%28150000%29%3Astrip_icc%28%29/FAW-recipes-herb-and-lemon-roasted-chicken-hero-c4ba0aec56884683be482c47b1e1df11.jpg',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800',
    'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800',
    'https://safrescobaldistatic.blob.core.windows.net/media/2022/11/RISOTTO-ALLA-MILANESE.jpg',
    'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800',
    'https://assets.bonappetit.com/photos/656f48d75b552734225041ba/4%3A3/w_4172%2Ch_3129%2Cc_limit/20231120-WEB-Lasanga-6422.jpg',
    'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=800',
    'https://images.unsplash.com/photo-1599789197514-47270cd526b4?w=800',
    'https://images.unsplash.com/photo-1628268909376-e8c44bb3153f?w=800',
    'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=800',
    'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800',
    'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800',
    'https://www.recipetineats.com/uploads/2021/02/Indian-Palak-Paneer_4.jpg',
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800',
    'https://www.simplyrecipes.com/thmb/aD9M_iRHKbJ8cV2pn5zjOJBhCkI%3D/1500x0/filters%3Ano_upscale%28%29%3Amax_bytes%28150000%29%3Astrip_icc%28%29/__opt__aboutcom__coeus__resources__content_migration__simply_recipes__uploads__2019__05__Chana-Masala-LEAD-1-4b116e9ae8924d458a2758615a5e05a1.jpg',
    'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800',
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800',
    'https://www.recipetineats.com/uploads/2021/02/Naan_1-1.jpg',
    'https://images.unsplash.com/photo-1545247181-516773cae754?w=800',
    'https://images.unsplash.com/photo-1567337710282-00832b415979?w=800',
    'https://www.sushijunction.com/cdn/shop/products/Chicken-Curry.jpg?v=1520005585',
    'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800',
    'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=800',
    'https://www.thespruceeats.com/thmb/2h5LUE8WIiveyBjMzTk2_272XdI%3D/1500x0/filters%3Ano_upscale%28%29%3Amax_bytes%28150000%29%3Astrip_icc%28%29/tempura-batter-recipe-2031529-step-06-dbe3cee5fd0e4dce93eec2e96297cf48.jpg',
    'https://images.unsplash.com/photo-1619860860774-1e2e17343432?w=800',
    'https://www.bhg.com/thmb/UjbEcHMkG_2Ab1EwiFCz5roJmh0%3D/2000x0/filters%3Ano_upscale%28%29%3Astrip_icc%28%29/recipes-how-to-cooking-basics-how-to-cook-edamame-04-67af81d469994e7091e6135de04149ab.jpg',
    'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800',
    'https://images.getrecipekit.com/20250812152413-matcha-20cheesecake-20recipe.webp?class=16x9',
    'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800',
    'https://images.unsplash.com/photo-1618841557871-b4664fbf0cb3?w=800',
    'https://images.unsplash.com/photo-1534352956036-cd81e27dd615?w=800',
    'https://cdn.foodfaithfitness.com/uploads/2024/10/Chunky-Guacamole-Recipe-A_FFF_Chunky-Guacamole_Featured_1.jpg',
    'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800',
    'https://images.unsplash.com/photo-1582234372722-50d7ccc30ebd?w=800',
    'https://www.recipetineats.com/uploads/2016/08/Churros_9.jpg',
    'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800',
    'https://img.sndimg.com/food/image/upload/q_92%2Cfl_progressive%2Cw_1200%2Cc_scale/v1/img/recipes/17/00/23/Mq92FgsOQYuAUcSQ7DNG_MEXICAN_TAMALES_V_f.jpg',
    'https://assets.wsimgs.com/wsimgs/ab/images/dp/recipe/202545/0011/img177l.jpg',
    'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=800',
    'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800',
    'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800',
    'https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?w=800',
    'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=800',
    'https://images.squarespace-cdn.com/content/v1/568e8fe6b204d5cbecd5c77e/1761493929185-D9DBMQJI8BO644QC3HJH/Beef%2BBourguignon-7451.jpg',
    'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800',
    'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=800',
    'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=800',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
  ]

  const origRecipes: { recipe_id: number }[] = []
  for (let i = 0; i < origRecipeData.length; i++) {
    const r = origRecipeData[i]
    const recipe = await prisma.recipe.create({
      data: {
        title: r.title, description: r.description,
        estimated_time: r.time, difficulty_level: r.diff,
        user_id: users[r.userIdx].user_id, is_public: true,
        cuisine_id: r.cuisine.cuisine_id,
      }
    })
    await prisma.fITS.createMany({
      data: r.moods.map(m => ({ recipe_id: recipe.recipe_id, mood_id: m.mood_id }))
    })
    await prisma.fITS_DIET.createMany({
      data: r.diets.map(d => ({ recipe_id: recipe.recipe_id, restriction_id: d.restriction_id }))
    })
    const stepsToUse = customSteps[r.title] || [
      `Prepare all ingredients for ${r.title}. Chop, dice, and measure everything needed.`,
      `Cook the main components following the recipe technique. Apply heat appropriately.`,
      `Plate beautifully and season to taste. Serve immediately and enjoy!`
    ]

    await prisma.recipe_Step.createMany({
      data: stepsToUse.map((stepText: string, idx: number) => ({
        recipe_id: recipe.recipe_id, 
        step_number: idx + 1, 
        instruction: stepText
      }))
    })
    await prisma.recipe_Image.create({
      data: {
        recipe_id: recipe.recipe_id, image_order: 1, is_primary: true,
        image_url: origRecipeImages[i]
      }
    })
    origRecipes.push(recipe)
    recipes.push(recipe) // Add to main recipes array too
  }
  console.log(`✓ Created ${origRecipes.length} original hand-crafted recipes`)

  // ── Original Ingredient USES ────────────────────────────────────────────────
  const origUsesData = [
    { rIdx: 0, ing: 'Dry Pasta', qty: 200, unit: 'g' },
    { rIdx: 0, ing: 'Tomato', qty: 3, unit: 'whole' },
    { rIdx: 0, ing: 'Basil', qty: 10, unit: 'leaves' },
    { rIdx: 0, ing: 'Garlic', qty: 2, unit: 'cloves' },
    { rIdx: 1, ing: 'Chicken Breast', qty: 500, unit: 'g' },
    { rIdx: 1, ing: 'Coconut Milk', qty: 400, unit: 'ml' },
    { rIdx: 1, ing: 'Curry Powder', qty: 2, unit: 'tbsp' },
    { rIdx: 1, ing: 'Garlic', qty: 4, unit: 'cloves' },
    { rIdx: 2, ing: 'Salmon Fillet', qty: 300, unit: 'g' },
    { rIdx: 2, ing: 'White Rice', qty: 200, unit: 'g' },
    { rIdx: 2, ing: 'Soy Sauce', qty: 3, unit: 'tbsp' },
    { rIdx: 3, ing: 'Flour Tortilla', qty: 8, unit: 'pieces' },
    { rIdx: 3, ing: 'Avocado', qty: 2, unit: 'whole' },
    { rIdx: 3, ing: 'Lime', qty: 2, unit: 'whole' },
    { rIdx: 3, ing: 'Onion', qty: 1, unit: 'whole' },
    { rIdx: 4, ing: 'All-Purpose Flour', qty: 500, unit: 'g' },
    { rIdx: 4, ing: 'Butter', qty: 250, unit: 'g' },
    { rIdx: 4, ing: 'Egg', qty: 2, unit: 'whole' },
    { rIdx: 6, ing: 'Avocado', qty: 1, unit: 'whole' },
    { rIdx: 6, ing: 'Egg', qty: 1, unit: 'whole' },
    { rIdx: 6, ing: 'Lime', qty: 0.5, unit: 'whole' },
    { rIdx: 9, ing: 'Egg', qty: 3, unit: 'whole' },
    { rIdx: 9, ing: 'Avocado', qty: 1, unit: 'whole' },
    { rIdx: 9, ing: 'Cheddar Cheese', qty: 50, unit: 'g' },
    { rIdx: 10, ing: 'Chicken Breast', qty: 500, unit: 'g' },
    { rIdx: 10, ing: 'Honey', qty: 3, unit: 'tbsp' },
    { rIdx: 10, ing: 'Garlic', qty: 3, unit: 'cloves' },
    { rIdx: 10, ing: 'Soy Sauce', qty: 2, unit: 'tbsp' },
    { rIdx: 15, ing: 'All-Purpose Flour', qty: 300, unit: 'g' },
    { rIdx: 15, ing: 'Mozzarella', qty: 200, unit: 'g' },
    { rIdx: 15, ing: 'Tomato', qty: 4, unit: 'whole' },
    { rIdx: 15, ing: 'Basil', qty: 8, unit: 'leaves' },
    { rIdx: 15, ing: 'Olive Oil', qty: 2, unit: 'tbsp' },
    { rIdx: 16, ing: 'Dry Pasta', qty: 400, unit: 'g' },
    { rIdx: 16, ing: 'Egg', qty: 4, unit: 'whole' },
    { rIdx: 16, ing: 'Parmesan', qty: 100, unit: 'g' },
    { rIdx: 16, ing: 'Garlic', qty: 3, unit: 'cloves' },
    { rIdx: 17, ing: 'White Rice', qty: 300, unit: 'g' },
    { rIdx: 17, ing: 'Butter', qty: 50, unit: 'g' },
    { rIdx: 17, ing: 'Parmesan', qty: 80, unit: 'g' },
    { rIdx: 17, ing: 'Onion', qty: 1, unit: 'whole' },
    { rIdx: 18, ing: 'Dry Pasta', qty: 350, unit: 'g' },
    { rIdx: 18, ing: 'Tomato', qty: 5, unit: 'whole' },
    { rIdx: 18, ing: 'Garlic', qty: 4, unit: 'cloves' },
    { rIdx: 18, ing: 'Chili Flakes', qty: 1, unit: 'tsp' },
    { rIdx: 19, ing: 'Dry Pasta', qty: 500, unit: 'g' },
    { rIdx: 19, ing: 'Mozzarella', qty: 300, unit: 'g' },
    { rIdx: 19, ing: 'Parmesan', qty: 100, unit: 'g' },
    { rIdx: 19, ing: 'Tomato', qty: 6, unit: 'whole' },
    { rIdx: 20, ing: 'Tomato', qty: 4, unit: 'whole' },
    { rIdx: 20, ing: 'Basil', qty: 12, unit: 'leaves' },
    { rIdx: 20, ing: 'Garlic', qty: 2, unit: 'cloves' },
    { rIdx: 20, ing: 'Olive Oil', qty: 3, unit: 'tbsp' },
    { rIdx: 21, ing: 'Basil', qty: 50, unit: 'leaves' },
    { rIdx: 21, ing: 'Parmesan', qty: 50, unit: 'g' },
    { rIdx: 21, ing: 'Garlic', qty: 2, unit: 'cloves' },
    { rIdx: 21, ing: 'Olive Oil', qty: 100, unit: 'ml' },
    { rIdx: 23, ing: 'Mozzarella', qty: 250, unit: 'g' },
    { rIdx: 23, ing: 'Tomato', qty: 3, unit: 'whole' },
    { rIdx: 23, ing: 'Basil', qty: 10, unit: 'leaves' },
    { rIdx: 23, ing: 'Olive Oil', qty: 2, unit: 'tbsp' },
    { rIdx: 25, ing: 'Chicken Breast', qty: 600, unit: 'g' },
    { rIdx: 25, ing: 'Tomato', qty: 4, unit: 'whole' },
    { rIdx: 25, ing: 'Butter', qty: 50, unit: 'g' },
    { rIdx: 25, ing: 'Heavy Cream', qty: 100, unit: 'ml' },
    { rIdx: 26, ing: 'Spinach', qty: 400, unit: 'g' },
    { rIdx: 26, ing: 'Garlic', qty: 3, unit: 'cloves' },
    { rIdx: 26, ing: 'Ginger', qty: 1, unit: 'tbsp' },
    { rIdx: 26, ing: 'Cumin', qty: 1, unit: 'tsp' },
    { rIdx: 27, ing: 'White Rice', qty: 500, unit: 'g' },
    { rIdx: 27, ing: 'Chicken Breast', qty: 500, unit: 'g' },
    { rIdx: 27, ing: 'Onion', qty: 3, unit: 'whole' },
    { rIdx: 27, ing: 'Greek Yogurt', qty: 200, unit: 'ml' },
    { rIdx: 28, ing: 'Onion', qty: 2, unit: 'whole' },
    { rIdx: 28, ing: 'Tomato', qty: 3, unit: 'whole' },
    { rIdx: 28, ing: 'Cumin', qty: 1, unit: 'tsp' },
    { rIdx: 28, ing: 'Ginger', qty: 1, unit: 'tbsp' },
    { rIdx: 29, ing: 'Chicken Breast', qty: 800, unit: 'g' },
    { rIdx: 29, ing: 'Greek Yogurt', qty: 200, unit: 'ml' },
    { rIdx: 29, ing: 'Lemon', qty: 2, unit: 'whole' },
    { rIdx: 29, ing: 'Garlic', qty: 4, unit: 'cloves' },
    { rIdx: 30, ing: 'Onion', qty: 1, unit: 'whole' },
    { rIdx: 30, ing: 'Garlic', qty: 3, unit: 'cloves' },
    { rIdx: 30, ing: 'Cumin Seeds', qty: 1, unit: 'tsp' },
    { rIdx: 30, ing: 'Turmeric', qty: 0.5, unit: 'tsp' },
    { rIdx: 34, ing: 'Onion', qty: 1, unit: 'whole' },
    { rIdx: 34, ing: 'Turmeric', qty: 1, unit: 'tsp' },
    { rIdx: 34, ing: 'Cumin', qty: 1, unit: 'tsp' },
    { rIdx: 34, ing: 'Ginger', qty: 1, unit: 'tbsp' },
    { rIdx: 35, ing: 'Chicken Breast', qty: 400, unit: 'g' },
    { rIdx: 35, ing: 'White Rice', qty: 200, unit: 'g' },
    { rIdx: 35, ing: 'Egg', qty: 2, unit: 'whole' },
    { rIdx: 35, ing: 'All-Purpose Flour', qty: 100, unit: 'g' },
    { rIdx: 36, ing: 'Chicken Breast', qty: 300, unit: 'g' },
    { rIdx: 36, ing: 'Garlic', qty: 3, unit: 'cloves' },
    { rIdx: 36, ing: 'Ginger', qty: 1, unit: 'tbsp' },
    { rIdx: 36, ing: 'Soy Sauce', qty: 2, unit: 'tbsp' },
    { rIdx: 37, ing: 'Garlic', qty: 6, unit: 'cloves' },
    { rIdx: 37, ing: 'Ginger', qty: 2, unit: 'tbsp' },
    { rIdx: 37, ing: 'Soy Sauce', qty: 3, unit: 'tbsp' },
    { rIdx: 37, ing: 'Egg', qty: 4, unit: 'whole' },
    { rIdx: 38, ing: 'All-Purpose Flour', qty: 150, unit: 'g' },
    { rIdx: 38, ing: 'Egg', qty: 1, unit: 'whole' },
    { rIdx: 38, ing: 'Sweet Potato', qty: 2, unit: 'whole' },
    { rIdx: 38, ing: 'Bell Pepper', qty: 2, unit: 'whole' },
    { rIdx: 41, ing: 'Chicken Breast', qty: 500, unit: 'g' },
    { rIdx: 41, ing: 'Soy Sauce', qty: 3, unit: 'tbsp' },
    { rIdx: 41, ing: 'Ginger', qty: 1, unit: 'tbsp' },
    { rIdx: 41, ing: 'Garlic', qty: 2, unit: 'cloves' },
    { rIdx: 43, ing: 'White Rice', qty: 300, unit: 'g' },
    { rIdx: 43, ing: 'Salmon Fillet', qty: 150, unit: 'g' },
    { rIdx: 43, ing: 'Nori Sheets', qty: 4, unit: 'sheets' },
    { rIdx: 43, ing: 'Sesame Oil', qty: 1, unit: 'tsp' },
    { rIdx: 44, ing: 'Onion', qty: 1, unit: 'whole' },
    { rIdx: 44, ing: 'Soy Sauce', qty: 2, unit: 'tbsp' },
    { rIdx: 44, ing: 'Ginger', qty: 1, unit: 'tbsp' },
    { rIdx: 44, ing: 'Spinach', qty: 100, unit: 'g' },
    { rIdx: 45, ing: 'Chicken Breast', qty: 400, unit: 'g' },
    { rIdx: 45, ing: 'Flour Tortilla', qty: 10, unit: 'pieces' },
    { rIdx: 45, ing: 'Cheddar Cheese', qty: 200, unit: 'g' },
    { rIdx: 45, ing: 'Sour Cream', qty: 100, unit: 'ml' },
    { rIdx: 46, ing: 'Avocado', qty: 3, unit: 'whole' },
    { rIdx: 46, ing: 'Lime', qty: 2, unit: 'whole' },
    { rIdx: 46, ing: 'Cilantro', qty: 3, unit: 'tbsp' },
    { rIdx: 46, ing: 'Jalapeno', qty: 1, unit: 'whole' },
    { rIdx: 47, ing: 'Flour Tortilla', qty: 4, unit: 'pieces' },
    { rIdx: 47, ing: 'Cheddar Cheese', qty: 150, unit: 'g' },
    { rIdx: 47, ing: 'Bell Pepper', qty: 1, unit: 'whole' },
    { rIdx: 47, ing: 'Onion', qty: 0.5, unit: 'whole' },
    { rIdx: 52, ing: 'Black Beans', qty: 400, unit: 'g' },
    { rIdx: 52, ing: 'Flour Tortilla', qty: 8, unit: 'pieces' },
    { rIdx: 52, ing: 'Avocado', qty: 1, unit: 'whole' },
    { rIdx: 52, ing: 'Cilantro', qty: 2, unit: 'tbsp' },
    { rIdx: 53, ing: 'Lime', qty: 6, unit: 'whole' },
    { rIdx: 53, ing: 'Tomato', qty: 2, unit: 'whole' },
    { rIdx: 53, ing: 'Onion', qty: 1, unit: 'whole' },
    { rIdx: 53, ing: 'Cilantro', qty: 3, unit: 'tbsp' },
    { rIdx: 56, ing: 'Tomato', qty: 4, unit: 'whole' },
    { rIdx: 56, ing: 'Bell Pepper', qty: 2, unit: 'whole' },
    { rIdx: 56, ing: 'Onion', qty: 1, unit: 'whole' },
    { rIdx: 56, ing: 'Garlic', qty: 3, unit: 'cloves' },
    { rIdx: 57, ing: 'Heavy Cream', qty: 500, unit: 'ml' },
    { rIdx: 57, ing: 'Egg', qty: 5, unit: 'whole' },
    { rIdx: 57, ing: 'Honey', qty: 3, unit: 'tbsp' },
    { rIdx: 57, ing: 'Butter', qty: 1, unit: 'tbsp' },
    { rIdx: 60, ing: 'Egg', qty: 4, unit: 'whole' },
    { rIdx: 60, ing: 'Lemon', qty: 2, unit: 'whole' },
    { rIdx: 60, ing: 'Olive Oil', qty: 3, unit: 'tbsp' },
    { rIdx: 60, ing: 'Spinach', qty: 100, unit: 'g' },
    { rIdx: 61, ing: 'All-Purpose Flour', qty: 2, unit: 'tbsp' },
    { rIdx: 61, ing: 'Butter', qty: 3, unit: 'tbsp' },
    { rIdx: 61, ing: 'Heavy Cream', qty: 100, unit: 'ml' },
    { rIdx: 61, ing: 'Cheddar Cheese', qty: 100, unit: 'g' },
    { rIdx: 7, ing: 'Quinoa', qty: 200, unit: 'g' },
    { rIdx: 7, ing: 'Coconut Milk', qty: 200, unit: 'ml' },
    { rIdx: 7, ing: 'Spinach', qty: 100, unit: 'g' },
    { rIdx: 7, ing: 'Sweet Potato', qty: 2, unit: 'whole' },

    // ── Missing recipes filled in ─────────────────────────────────────────────

    // 5 – Miso Ramen
    { rIdx: 5, ing: 'Miso Paste', qty: 3, unit: 'tbsp' },
    { rIdx: 5, ing: 'Egg', qty: 2, unit: 'whole' },
    { rIdx: 5, ing: 'Garlic', qty: 4, unit: 'cloves' },
    { rIdx: 5, ing: 'Ginger', qty: 1, unit: 'tbsp' },
    { rIdx: 5, ing: 'Soy Sauce', qty: 2, unit: 'tbsp' },
    { rIdx: 5, ing: 'Sesame Oil', qty: 1, unit: 'tsp' },

    // 8 – Garlic Butter Shrimp Pasta
    { rIdx: 8, ing: 'Shrimp', qty: 400, unit: 'g' },
    { rIdx: 8, ing: 'Dry Pasta', qty: 300, unit: 'g' },
    { rIdx: 8, ing: 'Butter', qty: 50, unit: 'g' },
    { rIdx: 8, ing: 'Garlic', qty: 6, unit: 'cloves' },
    { rIdx: 8, ing: 'Parsley', qty: 3, unit: 'tbsp' },
    { rIdx: 8, ing: 'Lemon', qty: 1, unit: 'whole' },

    // 11 – French Onion Soup
    { rIdx: 11, ing: 'Onion', qty: 5, unit: 'whole' },
    { rIdx: 11, ing: 'Butter', qty: 40, unit: 'g' },
    { rIdx: 11, ing: 'Gruyere Cheese', qty: 150, unit: 'g' },
    { rIdx: 11, ing: 'White Wine', qty: 100, unit: 'ml' },
    { rIdx: 11, ing: 'Thyme', qty: 1, unit: 'tsp' },

    // 12 – Mango Coconut Curry
    { rIdx: 12, ing: 'Coconut Milk', qty: 400, unit: 'ml' },
    { rIdx: 12, ing: 'Curry Powder', qty: 2, unit: 'tbsp' },
    { rIdx: 12, ing: 'Onion', qty: 1, unit: 'whole' },
    { rIdx: 12, ing: 'Ginger', qty: 1, unit: 'tbsp' },
    { rIdx: 12, ing: 'Lime', qty: 1, unit: 'whole' },

    // 13 – Sushi Hand Rolls
    { rIdx: 13, ing: 'White Rice', qty: 300, unit: 'g' },
    { rIdx: 13, ing: 'Salmon Fillet', qty: 200, unit: 'g' },
    { rIdx: 13, ing: 'Avocado', qty: 1, unit: 'whole' },
    { rIdx: 13, ing: 'Nori Sheets', qty: 6, unit: 'sheets' },
    { rIdx: 13, ing: 'Rice Vinegar', qty: 2, unit: 'tbsp' },
    { rIdx: 13, ing: 'Sesame Oil', qty: 1, unit: 'tsp' },

    // 14 – Lemon Herb Roasted Chicken
    { rIdx: 14, ing: 'Chicken Breast', qty: 1200, unit: 'g' },
    { rIdx: 14, ing: 'Lemon', qty: 2, unit: 'whole' },
    { rIdx: 14, ing: 'Rosemary', qty: 2, unit: 'tbsp' },
    { rIdx: 14, ing: 'Thyme', qty: 1, unit: 'tbsp' },
    { rIdx: 14, ing: 'Garlic', qty: 6, unit: 'cloves' },
    { rIdx: 14, ing: 'Olive Oil', qty: 3, unit: 'tbsp' },

    // 22 – Osso Buco
    { rIdx: 22, ing: 'Beef Sirloin', qty: 800, unit: 'g' },
    { rIdx: 22, ing: 'Tomato', qty: 4, unit: 'whole' },
    { rIdx: 22, ing: 'Onion', qty: 2, unit: 'whole' },
    { rIdx: 22, ing: 'White Wine', qty: 200, unit: 'ml' },
    { rIdx: 22, ing: 'Garlic', qty: 3, unit: 'cloves' },
    { rIdx: 22, ing: 'Bay Leaves', qty: 2, unit: 'whole' },

    // 24 – Tiramisu
    { rIdx: 24, ing: 'Mascarpone', qty: 250, unit: 'g' },
    { rIdx: 24, ing: 'Egg', qty: 4, unit: 'whole' },
    { rIdx: 24, ing: 'Brown Sugar', qty: 80, unit: 'g' },
    { rIdx: 24, ing: 'Cocoa Powder', qty: 2, unit: 'tbsp' },
    { rIdx: 24, ing: 'Vanilla Extract', qty: 1, unit: 'tsp' },

    // 31 – Samosas
    { rIdx: 31, ing: 'All-Purpose Flour', qty: 200, unit: 'g' },
    { rIdx: 31, ing: 'Sweet Potato', qty: 3, unit: 'whole' },
    { rIdx: 31, ing: 'Cumin Seeds', qty: 1, unit: 'tsp' },
    { rIdx: 31, ing: 'Garam Masala', qty: 1, unit: 'tsp' },
    { rIdx: 31, ing: 'Ginger', qty: 1, unit: 'tbsp' },
    { rIdx: 31, ing: 'Vegetable Oil', qty: 500, unit: 'ml' },

    // 32 – Naan Bread
    { rIdx: 32, ing: 'All-Purpose Flour', qty: 300, unit: 'g' },
    { rIdx: 32, ing: 'Greek Yogurt', qty: 100, unit: 'ml' },
    { rIdx: 32, ing: 'Baking Powder', qty: 1, unit: 'tsp' },
    { rIdx: 32, ing: 'Garlic', qty: 3, unit: 'cloves' },
    { rIdx: 32, ing: 'Butter', qty: 30, unit: 'g' },

    // 33 – Lamb Rogan Josh
    { rIdx: 33, ing: 'Lamb Shoulder', qty: 800, unit: 'g' },
    { rIdx: 33, ing: 'Onion', qty: 3, unit: 'whole' },
    { rIdx: 33, ing: 'Tomato', qty: 4, unit: 'whole' },
    { rIdx: 33, ing: 'Garam Masala', qty: 2, unit: 'tsp' },
    { rIdx: 33, ing: 'Ginger', qty: 2, unit: 'tbsp' },
    { rIdx: 33, ing: 'Garlic', qty: 5, unit: 'cloves' },

    // 39 – Okonomiyaki
    { rIdx: 39, ing: 'All-Purpose Flour', qty: 100, unit: 'g' },
    { rIdx: 39, ing: 'Egg', qty: 2, unit: 'whole' },
    { rIdx: 39, ing: 'Soy Sauce', qty: 2, unit: 'tbsp' },
    { rIdx: 39, ing: 'Ginger', qty: 1, unit: 'tsp' },
    { rIdx: 39, ing: 'Sesame Oil', qty: 1, unit: 'tbsp' },

    // 40 – Edamame
    { rIdx: 40, ing: 'Edamame', qty: 400, unit: 'g' },
    { rIdx: 40, ing: 'Sesame Oil', qty: 1, unit: 'tsp' },
    { rIdx: 40, ing: 'Garlic', qty: 2, unit: 'cloves' },

    // 42 – Matcha Cheesecake
    { rIdx: 42, ing: 'Cream Cheese', qty: 400, unit: 'g' },
    { rIdx: 42, ing: 'Egg', qty: 3, unit: 'whole' },
    { rIdx: 42, ing: 'Brown Sugar', qty: 100, unit: 'g' },
    { rIdx: 42, ing: 'Heavy Cream', qty: 100, unit: 'ml' },
    { rIdx: 42, ing: 'Butter', qty: 50, unit: 'g' },

    // 48 – Pozole
    { rIdx: 48, ing: 'Pork Belly', qty: 500, unit: 'g' },
    { rIdx: 48, ing: 'Onion', qty: 2, unit: 'whole' },
    { rIdx: 48, ing: 'Garlic', qty: 5, unit: 'cloves' },
    { rIdx: 48, ing: 'Oregano', qty: 1, unit: 'tbsp' },
    { rIdx: 48, ing: 'Lime', qty: 2, unit: 'whole' },
    { rIdx: 48, ing: 'Chili Flakes', qty: 2, unit: 'tsp' },

    // 49 – Churros
    { rIdx: 49, ing: 'All-Purpose Flour', qty: 150, unit: 'g' },
    { rIdx: 49, ing: 'Butter', qty: 60, unit: 'g' },
    { rIdx: 49, ing: 'Egg', qty: 2, unit: 'whole' },
    { rIdx: 49, ing: 'Brown Sugar', qty: 50, unit: 'g' },
    { rIdx: 49, ing: 'Cinnamon', qty: 2, unit: 'tsp' },
    { rIdx: 49, ing: 'Vegetable Oil', qty: 500, unit: 'ml' },

    // 50 – Elote (Street Corn)
    { rIdx: 50, ing: 'Butter', qty: 30, unit: 'g' },
    { rIdx: 50, ing: 'Lime', qty: 2, unit: 'whole' },
    { rIdx: 50, ing: 'Chili Flakes', qty: 1, unit: 'tsp' },
    { rIdx: 50, ing: 'Cilantro', qty: 2, unit: 'tbsp' },

    // 51 – Tamales
    { rIdx: 51, ing: 'Chicken Breast', qty: 500, unit: 'g' },
    { rIdx: 51, ing: 'Lard', qty: 150, unit: 'g' },
    { rIdx: 51, ing: 'Cumin', qty: 1, unit: 'tsp' },
    { rIdx: 51, ing: 'Chili Flakes', qty: 2, unit: 'tsp' },
    { rIdx: 51, ing: 'Garlic', qty: 3, unit: 'cloves' },
    { rIdx: 51, ing: 'Onion', qty: 1, unit: 'whole' },

    // 54 – Mole Poblano
    { rIdx: 54, ing: 'Chicken Breast', qty: 600, unit: 'g' },
    { rIdx: 54, ing: 'Dark Chocolate', qty: 50, unit: 'g' },
    { rIdx: 54, ing: 'Chili Flakes', qty: 3, unit: 'tsp' },
    { rIdx: 54, ing: 'Onion', qty: 2, unit: 'whole' },
    { rIdx: 54, ing: 'Garlic', qty: 4, unit: 'cloves' },
    { rIdx: 54, ing: 'Cumin', qty: 1, unit: 'tsp' },
    { rIdx: 54, ing: 'Cinnamon', qty: 0.5, unit: 'tsp' },

    // 55 – Coq au Vin
    { rIdx: 55, ing: 'Chicken Breast', qty: 800, unit: 'g' },
    { rIdx: 55, ing: 'Bacon', qty: 100, unit: 'g' },
    { rIdx: 55, ing: 'Mushrooms', qty: 200, unit: 'g' },
    { rIdx: 55, ing: 'Onion', qty: 3, unit: 'whole' },
    { rIdx: 55, ing: 'Garlic', qty: 4, unit: 'cloves' },
    { rIdx: 55, ing: 'Thyme', qty: 1, unit: 'tbsp' },
    { rIdx: 55, ing: 'Bay Leaves', qty: 2, unit: 'whole' },

    // 58 – Beef Bourguignon
    { rIdx: 58, ing: 'Beef Sirloin', qty: 1000, unit: 'g' },
    { rIdx: 58, ing: 'Bacon', qty: 150, unit: 'g' },
    { rIdx: 58, ing: 'Mushrooms', qty: 250, unit: 'g' },
    { rIdx: 58, ing: 'Onion', qty: 3, unit: 'whole' },
    { rIdx: 58, ing: 'Garlic', qty: 4, unit: 'cloves' },
    { rIdx: 58, ing: 'Tomato', qty: 2, unit: 'whole' },
    { rIdx: 58, ing: 'Thyme', qty: 1, unit: 'tbsp' },
    { rIdx: 58, ing: 'Bay Leaves', qty: 2, unit: 'whole' },

    // 59 – Quiche Lorraine
    { rIdx: 59, ing: 'All-Purpose Flour', qty: 200, unit: 'g' },
    { rIdx: 59, ing: 'Butter', qty: 100, unit: 'g' },
    { rIdx: 59, ing: 'Egg', qty: 4, unit: 'whole' },
    { rIdx: 59, ing: 'Heavy Cream', qty: 200, unit: 'ml' },
    { rIdx: 59, ing: 'Bacon', qty: 150, unit: 'g' },
    { rIdx: 59, ing: 'Gruyere Cheese', qty: 100, unit: 'g' },

    // 62 – Bouillabaisse
    { rIdx: 62, ing: 'Cod Fillet', qty: 300, unit: 'g' },
    { rIdx: 62, ing: 'Shrimp', qty: 200, unit: 'g' },
    { rIdx: 62, ing: 'Tomato', qty: 4, unit: 'whole' },
    { rIdx: 62, ing: 'Onion', qty: 2, unit: 'whole' },
    { rIdx: 62, ing: 'Garlic', qty: 4, unit: 'cloves' },
    { rIdx: 62, ing: 'Saffron', qty: 0.5, unit: 'tsp' },
    { rIdx: 62, ing: 'Olive Oil', qty: 3, unit: 'tbsp' },

    // 63 – Macarons
    { rIdx: 63, ing: 'Almond Flour', qty: 150, unit: 'g' },
    { rIdx: 63, ing: 'Egg', qty: 3, unit: 'whole' },
    { rIdx: 63, ing: 'Brown Sugar', qty: 150, unit: 'g' },
    { rIdx: 63, ing: 'Vanilla Extract', qty: 1, unit: 'tsp' },
    { rIdx: 63, ing: 'Heavy Cream', qty: 50, unit: 'ml' },

    // 64 – Soupe à l'Oignon Gratinée
    { rIdx: 64, ing: 'Onion', qty: 6, unit: 'whole' },
    { rIdx: 64, ing: 'Butter', qty: 50, unit: 'g' },
    { rIdx: 64, ing: 'Gruyere Cheese', qty: 200, unit: 'g' },
    { rIdx: 64, ing: 'White Wine', qty: 150, unit: 'ml' },
    { rIdx: 64, ing: 'Thyme', qty: 1, unit: 'tsp' },
    { rIdx: 64, ing: 'Bay Leaves', qty: 2, unit: 'whole' },
  ]

  const origUsesBulk: { recipe_id: number; ingredient_id: number; quantity: number; unit: string }[] = []
  for (const u of origUsesData) {
    const ingObj = origIng[u.ing]
    if (ingObj && origRecipes[u.rIdx]) {
      origUsesBulk.push({
        recipe_id: origRecipes[u.rIdx].recipe_id,
        ingredient_id: ingObj.ingredient_id,
        quantity: u.qty,
        unit: u.unit,
      })
    }
  }
  if (origUsesBulk.length > 0) {
    await prisma.uSES.createMany({ data: origUsesBulk })
  }
  console.log(`✓ Created ${origUsesBulk.length} original ingredient uses`)

  // ── Boards ───────────────────────────────────────────────────────────────────
  const boardNames = [
    'Weekend Dinners', 'Quick Lunches', 'Meal Prep Sundays', 'Date Night Recipes',
    'Healthy Eats', 'Comfort Classics', 'Party Hits', 'World Flavors',
    'Budget Friendly', 'Holiday Specials',
  ]
  const boards = []
  for (let i = 0; i < boardNames.length; i++) {
    const b = await prisma.board.create({
      data: {
        board_name: boardNames[i],
        visibility: i % 3 === 2 ? 'private' : 'public',
        user_id: users[i % users.length].user_id,
      }
    })
    boards.push(b)
  }
  console.log(`✓ Created ${boards.length} boards`)

  // ── Saves ────────────────────────────────────────────────────────────────────
  const savesData = []
  for (let b = 0; b < boards.length; b++) {
    for (let r = 0; r < 5; r++) {
      const recipeIdx = (b * 7 + r * 13) % recipes.length
      savesData.push({
        board_id: boards[b].board_id,
        recipe_id: recipes[recipeIdx].recipe_id,
      })
    }
  }
  // De-duplicate saves
  const seenSaves = new Set<string>()
  const uniqueSaves = savesData.filter(s => {
    const key = `${s.board_id}-${s.recipe_id}`
    if (seenSaves.has(key)) return false
    seenSaves.add(key)
    return true
  })
  await prisma.sAVES.createMany({ data: uniqueSaves })
  console.log(`✓ Created ${uniqueSaves.length} board saves`)

  // Spread activity over the last 90 days (deterministic, so every seed run
  // produces the same timeline for the analytics page)
  const daysAgo = (n: number) => new Date(Date.now() - n * 864e5 - ((n * 7919) % 864e5))

  // ── Cooking Logs ─────────────────────────────────────────────────────────────
  // Users in the same group (u % 5) cook from a shared set of recipes, so the
  // "people who cooked this also cooked" recommendation has overlap to find.
  const cookData = []
  for (let u = 0; u < users.length; u++) {
    const logCount = 3 + (u % 4)
    for (let r = 0; r < logCount; r++) {
      const recipeIdx = r === 0
        ? (u * 11) % recipes.length
        : ((u % 5) * 6 + r * 3) % Math.min(30, recipes.length)
      cookData.push({
        user_id: users[u].user_id,
        recipe_id: recipes[recipeIdx].recipe_id,
        cooked_at: daysAgo((u * 17 + r * 9) % 90),
      })
    }
  }
  await prisma.cooking_Log.createMany({ data: cookData })
  console.log(`✓ Created ${cookData.length} cooking logs`)

  // ── View Logs ────────────────────────────────────────────────────────────────
  const viewData = []
  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < 40; j++) {
      // squaring skews views toward recent days, giving the timeline an upward trend
      const age = Math.floor(90 * (((i * 40 + j) * 37) % 100 / 100) ** 2)
      viewData.push({
        user_id: users[i].user_id,
        recipe_id: recipes[(i + j * 7) % recipes.length].recipe_id,
        viewed_at: daysAgo(age),
      })
    }
  }
  await prisma.recipe_View_Log.createMany({ data: viewData })
  console.log(`✓ Created ${viewData.length} view logs`)

  // ── Reviews ──────────────────────────────────────────────────────────────────
  const reviewComments = [
    'Absolutely delicious! Will make again.',
    'A bit too salty for my taste, but great technique.',
    'Perfect weeknight dinner.',
    'Restaurant quality at home!',
    'My family loved this.',
    'Great flavors, but the timing was off for me.',
    'Simple yet so satisfying.',
    'The best recipe I\'ve tried on this platform.',
    'Good, but I\'d add more spice next time.',
    'Followed exactly and it turned out perfect.',
    'A new staple in our household.',
    'Impressive presentation, easy to follow.',
    'Not my favorite, but well written.',
    'Outstanding! The substitutes helped a lot.',
    'Comfort food at its finest.',
    'Kids approved! Making it every week now.',
    'The secret is in the seasoning — nailed it.',
    'Took me back to my grandmother\'s kitchen.',
    'Paired with wine and it was chef\'s kiss.',
    'Would be perfect with a little more garlic.',
    null, null, null,
  ]

  let reviewCount = 0
  for (let r = 0; r < Math.min(recipes.length, 120); r++) {
    const reviewerCount = 2 + (r % 4)
    for (let u = 0; u < reviewerCount; u++) {
      const userId = users[(r + u + 1) % users.length].user_id
      const recipeId = recipes[r].recipe_id
      const rating = Math.max(1, Math.min(5, 3 + ((r + u * 3) % 5) - 1))
      const comment = reviewComments[(r + u * 7) % reviewComments.length] ?? null

      try {
        await prisma.review.create({
          data: { user_id: userId, recipe_id: recipeId, rating, comment, created_at: daysAgo((r * 7 + u * 11) % 90) }
        })
        reviewCount++
      } catch {
        // Skip duplicate user+recipe combos
      }
    }
  }
  console.log(`✓ Created ${reviewCount} reviews`)

  // ── Analytics ───────────────────────────────────────────────────────────────
  await prisma.$executeRaw`REFRESH MATERIALIZED VIEW "Recipe_Popularity"`
  console.log('✓ Refreshed Recipe_Popularity materialized view')

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n✅ FlavorForge database seeded successfully!')
  console.log(`   • ${users.length} chefs`)
  console.log(`   • ${recipes.length} recipes (from real CSV data)`)
  console.log(`   • ${reviewCount} reviews`)
  console.log(`   • ${Object.keys(ingredientMap).length} ingredients`)
  console.log(`   • ${cuisineNames.length} cuisines, ${dietNames.length} dietary restrictions, ${moodNames.length} moods`)
  console.log(`   • ${boards.length} boards, cooking logs, and view logs populated`)
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
