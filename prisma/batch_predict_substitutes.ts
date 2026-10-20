import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

// Setup Prisma with the adapter
const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// One row of substitution_pairs.json
type SubstitutionPair = { ingredient: string; substitution: string | null }

// Define the schema for the AI model output
const substituteSchema = z.object({
  substitutes: z.array(
    z.object({
      target_ingredient: z.string().describe("The name of the substitute ingredient from our database."),
      reason: z.string().describe("A short phrase explaining the substitution reason (e.g., 'Dairy-free alternative')."),
      confidence_score: z.number().min(0).max(1).describe("A float between 0.0 and 1.0 indicating confidence."),
      explanation: z.string().describe("1-2 sentences explaining why this is a good culinary substitute.")
    })
  )
})

async function main() {
  console.log('🤖 AI Substitution Batch Predictor Started')

  // Load substitution pairs JSON dataset
  const jsonPath = path.join(__dirname, '../substitution_pairs.json')
  const rawData = fs.readFileSync(jsonPath, 'utf-8')
  const allPairs = JSON.parse(rawData) as SubstitutionPair[]

  console.log(`Loaded ${allPairs.length} raw pairs from substitution_pairs.json`)

  // Get all ingredients from our existing DB
  const ingredientsInDb = await prisma.ingredient.findMany()
  const dbIngredientsLower = ingredientsInDb.map(i => i.ingredient_name.toLowerCase())
  const nameToId = new Map(ingredientsInDb.map(i => [i.ingredient_name.toLowerCase(), i.ingredient_id]))

  console.log(`Found ${ingredientsInDb.length} ingredients in the database.`)

  let processedCount = 0
  let matchedCount = 0

  // We loop over our local DB ingredients
  for (const dbIngredient of ingredientsInDb) {
    const targetName = dbIngredient.ingredient_name.toLowerCase()

    // Find candidates for this ingredient in the JSON dataset
    // And ensure the substitution exists in our DB too
    const candidates = allPairs
      .filter(p => p.ingredient.toLowerCase() === targetName && p.substitution)
      .map(p => p.substitution!.toLowerCase())
      .filter(sub => dbIngredientsLower.includes(sub))

    const uniqueCandidates = [...new Set(candidates)]

    if (uniqueCandidates.length === 0) continue

    console.log(`\nPredicting substitutes for: [${dbIngredient.ingredient_name}] -> Found candidates: ${uniqueCandidates.join(', ')}`)

    // Call Gemini using the Vercel AI SDK
    try {
      const { object } = await generateObject({
        model: google('gemini-2.5-pro'), 
        schema: substituteSchema,
        prompt: `
        You are a culinary expert AI.
        Find the best 1 to 2 culinary substitutes for "${dbIngredient.ingredient_name}".
        
        You may ONLY pick from these available candidate ingredients we found in our dataset:
        ${uniqueCandidates.join(', ')}
        
        Prioritize the closest matches by culinary similarity (taste, texture, cooking behavior).
        Format the response with the exact target_ingredient names from the list above, a short reason, 
        a confidence_score (0.0 to 1.0), and a 1-2 sentence explanation.
        `
      })

      // Insert into database
      for (const sub of object.substitutes) {
        const substituteId = nameToId.get(sub.target_ingredient.toLowerCase())
        if (substituteId && substituteId !== dbIngredient.ingredient_id) {
          try {
            await prisma.sUBSTITUTES.upsert({
              where: {
                original_ingredient_id_substitute_ingredient_id: {
                  original_ingredient_id: dbIngredient.ingredient_id,
                  substitute_ingredient_id: substituteId
                }
              },
              update: {
                reason: sub.reason,
                confidence_score: sub.confidence_score,
                explanation: sub.explanation
              },
              create: {
                original_ingredient_id: dbIngredient.ingredient_id,
                substitute_ingredient_id: substituteId,
                reason: sub.reason,
                confidence_score: sub.confidence_score,
                explanation: sub.explanation
              }
            })
            console.log(`  ✅ Added: ${sub.target_ingredient} (Confidence: ${sub.confidence_score})`)
            matchedCount++
          } catch (e) {
            console.error(`  ❌ Error inserting: ${sub.target_ingredient}`, e instanceof Error ? e.message : e)
          }
        }
      }

      processedCount++
      
      // Artificial delay to avoid rate limits (2 requests per minute free tier? We'll pause for 3s to be safe, assuming paid/higher tier)
      await new Promise(r => setTimeout(r, 2000))

    } catch (e) {
      console.error(`Error generating prediction for ${dbIngredient.ingredient_name}:`, e instanceof Error ? e.message : e)
    }
  }

  console.log(`\n🎉 Prediction Batch Complete! Processed ${processedCount} ingredients, inserted ${matchedCount} substitute pairs.`)
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
