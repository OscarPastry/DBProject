
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Clock, ChefHat, CheckCircle2, AlertTriangle } from 'lucide-react'
import { getSession } from '@/lib/auth'
import Image from 'next/image'
import FindNearbyButton from '@/components/FindNearbyButton'
import ReviewSection from '@/components/ReviewSection'
import { saveToBoard } from '@/app/actions'
import { alsoCooked } from '@/lib/queries'
import Link from 'next/link'

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const recipeId = parseInt(resolvedParams.id, 10)
  if (isNaN(recipeId)) return notFound()

  const recipe = await prisma.recipe.findUnique({
    where: { recipe_id: recipeId },
    include: {
      user: { include: { profile: true } },
      images: { orderBy: { image_order: 'asc' } },
      steps: { orderBy: { step_number: 'asc' } },
      ingredients: {
        include: {
          ingredient: {
            include: {
              AsOriginal: {
                where: { confidence_score: { gt: 0.6 } },
                include: { substitute: true }
              }
            }
          }
        }
      },
      moods: { include: { mood: true } },
      diets: { include: { restriction: true } },
      cuisine: true,
      reviews: {
        include: { user: { include: { profile: true } } },
        orderBy: { created_at: 'desc' }
      }
    }
  })

  if (!recipe) return notFound()

  const session = await getSession()
  const myBoards = session?.userId
    ? await prisma.board.findMany({
        where: { user_id: session.userId },
        select: { board_id: true, board_name: true, recipes: { where: { recipe_id: recipeId }, select: { recipe_id: true } } },
        orderBy: { board_name: 'asc' },
      })
    : []
  const unsavedBoards = myBoards.filter(b => b.recipes.length === 0)

  const related = await alsoCooked(prisma, recipeId)
  const relatedRows = related.length === 0 ? [] : await prisma.recipe.findMany({
    where: { recipe_id: { in: related.map(r => r.recipe_id) } },
    select: { recipe_id: true, title: true, images: { where: { is_primary: true }, take: 1 } },
  })
  const relatedById = new Map(relatedRows.map(r => [r.recipe_id, r]))
  if (session?.userId) {
    try {
      await prisma.recipe_View_Log.create({ data: { user_id: session.userId, recipe_id: recipeId } })
    } catch {}
  }

  // Compute review stats
  const totalReviews = recipe.reviews.length
  const averageRating = totalReviews > 0
    ? recipe.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0
  const distribution = [0, 0, 0, 0, 0, 0] // index 1-5
  recipe.reviews.forEach(r => { distribution[r.rating]++ })

  const existingUserReview = session?.userId
    ? recipe.reviews.find(r => r.user_id === session.userId) ?? null
    : null

  const reviewsData = recipe.reviews.map(r => ({
    review_id: r.review_id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at.toISOString(),
    user: {
      username: r.user.username,
      profile: r.user.profile ? { display_name: r.user.profile.display_name } : null
    }
  }))

  const existingReviewData = existingUserReview ? {
    review_id: existingUserReview.review_id,
    rating: existingUserReview.rating,
    comment: existingUserReview.comment,
    created_at: existingUserReview.created_at.toISOString(),
    user: {
      username: existingUserReview.user.username,
      profile: existingUserReview.user.profile ? { display_name: existingUserReview.user.profile.display_name } : null
    }
  } : null

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 pb-20 space-y-10">
      {/* Hero section */}
      <div className="brutalist-card overflow-hidden">
        <div className="h-4 bg-[var(--yellow)] border-b-[3px] border-[var(--border)]" />
        <div className="relative h-80 border-b-[3px] border-[var(--border)] overflow-hidden">
          {recipe.images[0] ? (
            <Image src={recipe.images[0].image_url} alt={recipe.title} width={1000} height={400} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[var(--bg-muted)]">
              <ChefHat className="w-16 h-16 text-[var(--fg-ghost)]" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8 w-full">
            <div className="flex justify-between items-end">
              <div>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {recipe.cuisine && (
                    <span className="font-mono text-[10px] font-black uppercase bg-[var(--blue)] text-white border-2 border-[var(--border)] px-2 py-0.5">
                      {recipe.cuisine.cuisine_name}
                    </span>
                  )}
                  {recipe.diets.map(d => (
                    <span key={d.restriction_id} className="font-mono text-[10px] font-black uppercase bg-white text-black border-2 border-black px-2 py-0.5">
                      {d.restriction.restriction_name}
                    </span>
                  ))}
                </div>
                <h1 className="font-headline font-black text-5xl md:text-6xl leading-none uppercase tracking-tighter text-white">
                  {recipe.title}
                </h1>
              </div>
              
              {/* Rating badge */}
              {totalReviews > 0 && (
                <div className="hidden md:block brutalist-card bg-[var(--yellow)] p-3 text-center border-[3px]">
                   <p className="font-mono text-[10px] font-black uppercase leading-tight text-black">Avg Rating</p>
                   <p className="font-headline font-black text-2xl uppercase tracking-tighter text-black">
                      {averageRating.toFixed(1)}★
                   </p>
                   <p className="font-mono text-[9px] text-black/60 uppercase">{totalReviews} reviews</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 p-6 border-b-[3px] border-[var(--border)] bg-[var(--bg-muted)]">
          <div className="flex items-center gap-2 font-mono font-black text-sm uppercase text-[var(--fg)]">
            <Clock className="w-4 h-4" /> {recipe.estimated_time} MINUTES
          </div>
          <div className="flex items-center gap-2 font-mono font-black text-sm uppercase text-[var(--fg)]">
            <AlertTriangle className="w-4 h-4" /> {recipe.difficulty_level}
          </div>
          {recipe.cuisine && (
            <FindNearbyButton cuisine={recipe.cuisine.cuisine_name} recipeTitle={recipe.title} />
          )}
          {unsavedBoards.length > 0 && (
            <form action={saveToBoard} className="flex items-center gap-2">
              <input type="hidden" name="recipeId" value={recipeId} />
              <select name="boardId" aria-label="Board"
                className="border-[2px] border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg)] px-2 py-1.5 font-mono text-xs uppercase">
                {unsavedBoards.map(b => <option key={b.board_id} value={b.board_id}>{b.board_name}</option>)}
              </select>
              <button type="submit" className="brutalist-btn bg-[var(--fg)] text-[var(--yellow)] px-3 py-1.5 text-xs">
                Save to Board
              </button>
            </form>
          )}
          {myBoards.length > 0 && unsavedBoards.length === 0 && (
            <span className="font-mono text-xs uppercase text-[var(--fg-muted)]">Saved to all your boards</span>
          )}
          <div className="ml-auto font-mono text-sm uppercase text-[var(--fg-muted)]">
            By <span className="text-[var(--fg)] font-bold">{recipe.user.profile?.display_name || recipe.user.username}</span>
          </div>
        </div>

        <div className="p-6">
          <p className="font-body text-lg text-[var(--fg-muted)]">{recipe.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Ingredients */}
        <div className="brutalist-card">
          <div className="p-5 border-b-[3px] border-[var(--border)] bg-[var(--fg)] flex items-center justify-between">
            <h2 className="font-headline font-black text-xl uppercase tracking-tighter text-[var(--yellow)]">Ingredients</h2>
          </div>
          <div className="p-5 space-y-4">
            {recipe.ingredients.map(usage => (
              <div key={usage.ingredient_id} className="border-b-[2px] border-[var(--border)] pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-sm uppercase text-[var(--fg)]">{usage.ingredient.ingredient_name}</span>
                  <span className="font-mono text-xs bg-[var(--yellow)] border-2 border-[var(--border)] px-2 py-0.5 font-black text-black">
                    {usage.quantity} {usage.unit}
                  </span>
                </div>
                {usage.ingredient.AsOriginal.filter(s => s.confidence_score > 0.6).length > 0 && (
                  <div className="mt-3 border-[2px] border-[var(--border)] p-3 bg-[var(--bg-muted)]">
                    <p className="font-mono text-[10px] font-black uppercase mb-2 text-[var(--fg-muted)]">Substitutes →</p>
                    {usage.ingredient.AsOriginal.filter(s => s.confidence_score > 0.6).map(sub => (
                      <div key={sub.substitute_ingredient_id} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-mono font-bold text-xs text-[var(--blue)]">{sub.substitute.ingredient_name}</span>
                          <span className="font-mono text-[10px] font-black text-[var(--fg-muted)]">
                            {Math.round(sub.confidence_score * 100)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-[var(--bg)] border border-[var(--border)]">
                          <div
                            className="h-full bg-[var(--blue)]"
                            style={{ width: `${sub.confidence_score * 100}%` }}
                          />
                        </div>
                        <p className="font-body text-[10px] text-[var(--fg-muted)]">{sub.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="md:col-span-2 brutalist-card">
          <div className="p-5 border-b-[3px] border-[var(--border)] bg-[var(--fg)] flex items-center justify-between">
            <h2 className="font-headline font-black text-xl uppercase tracking-tighter text-[var(--yellow)]">Instructions</h2>
            <form action={async () => {
              'use server'
              const { prisma } = await import('@/lib/prisma')
              const m = await import('@/lib/auth')
              const s = await m.getSession()
              if (s?.userId) {
                try {
                  await prisma.cooking_Log.create({ data: { user_id: s.userId, recipe_id: recipeId } })
                } catch {
                  // Already logged or user not found
                }
              }
            }}>
              <button type="submit" className="brutalist-btn bg-[var(--yellow)] text-black px-4 py-2 text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Log as Cooked
              </button>
            </form>
          </div>

          <div className="p-6 space-y-6">
            {recipe.steps.map(step => (
              <div key={step.step_number} className="flex gap-4 group">
                <div className="w-10 h-10 shrink-0 border-[3px] border-[var(--border)] bg-[var(--yellow)] flex items-center justify-center font-mono font-black text-sm text-black">
                  {step.step_number}
                </div>
                <div className="flex-1 border-b-[2px] border-[var(--border)] pb-6 last:border-0 last:pb-0 pt-1">
                  <p className="font-body text-base text-[var(--fg-muted)] leading-relaxed">{step.instruction}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* People who cooked this also cooked */}
      {related.length > 0 && (
        <div className="brutalist-card">
          <div className="p-5 border-b-[3px] border-[var(--border)] bg-[var(--fg)] flex items-center justify-between">
            <h2 className="font-headline font-black text-xl uppercase tracking-tighter text-[var(--yellow)]">Cooks Also Made</h2>
            <span className="font-mono text-[10px] uppercase text-[var(--bg)] opacity-50">Cooking_Log self-join</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4">
            {related.map((rel, i) => {
              const r = relatedById.get(rel.recipe_id)
              if (!r) return null
              return (
                <Link key={rel.recipe_id} href={`/recipe/${rel.recipe_id}`}
                  className={`group block p-4 hover:bg-[var(--yellow)] hover:text-black ${i > 0 ? 'md:border-l-[3px] border-[var(--border)]' : ''}`}>
                  <div className="h-24 mb-3 overflow-hidden border-[2px] border-[var(--border)] bg-[var(--bg-muted)]">
                    {r.images[0] ? (
                      <Image src={r.images[0].image_url} alt={r.title} width={300} height={200} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ChefHat className="w-6 h-6 text-[var(--fg-ghost)]" /></div>
                    )}
                  </div>
                  <p className="font-headline font-extrabold text-sm uppercase tracking-tighter leading-tight line-clamp-2 text-[var(--fg)] group-hover:text-black">{r.title}</p>
                  <p className="font-mono text-[9px] uppercase text-[var(--fg-dim)] mt-1 group-hover:text-black">
                    {rel.shared_cooks} {rel.shared_cooks === 1 ? 'cook' : 'cooks'} in common
                  </p>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <ReviewSection
        recipeId={recipeId}
        reviews={reviewsData}
        averageRating={averageRating}
        totalReviews={totalReviews}
        distribution={distribution}
        currentUserId={session?.userId ?? null}
        existingUserReview={existingReviewData}
      />
    </div>
  )
}
