import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { pantryMatches } from '@/lib/queries'

const MAX_RESULTS = 60

export async function POST(request: NextRequest) {
  const body = await request.json() as { ingredientIds?: unknown }
  const ingredientIds = Array.isArray(body.ingredientIds)
    ? body.ingredientIds.filter((id): id is number => Number.isInteger(id))
    : []

  if (ingredientIds.length === 0) {
    return NextResponse.json({ recipes: [] })
  }

  const scored = await pantryMatches(prisma, ingredientIds, MAX_RESULTS)

  const recipes = await prisma.recipe.findMany({
    where: { recipe_id: { in: scored.map(s => s.recipe_id) } },
    include: {
      images: { where: { is_primary: true }, take: 1 },
      cuisine: true,
      moods: { include: { mood: true } },
      ingredients: { include: { ingredient: true } },
      user: { include: { profile: true } },
    }
  })
  const byId = new Map(recipes.map(r => [r.recipe_id, r]))
  const selected = new Set(ingredientIds)

  const results = scored.flatMap(({ recipe_id, total, matched }) => {
    const recipe = byId.get(recipe_id)
    if (!recipe) return []
    return [{
      recipe_id,
      title: recipe.title,
      description: recipe.description,
      estimated_time: recipe.estimated_time,
      difficulty_level: recipe.difficulty_level,
      image_url: recipe.images[0]?.image_url || null,
      cuisine_name: recipe.cuisine?.cuisine_name || null,
      chef_name: recipe.user.profile?.display_name || recipe.user.username,
      moods: recipe.moods.map(m => m.mood.mood_name),
      totalIngredients: total,
      matchedCount: matched,
      matchPercentage: Math.round((matched / total) * 100),
      matchedNames: recipe.ingredients.filter(u => selected.has(u.ingredient_id)).map(u => u.ingredient.ingredient_name),
      missingNames: recipe.ingredients.filter(u => !selected.has(u.ingredient_id)).map(u => u.ingredient.ingredient_name),
    }]
  })

  return NextResponse.json({ recipes: results })
}
