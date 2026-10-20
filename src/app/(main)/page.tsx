import { prisma } from '@/lib/prisma'
import { feedPage, ratingStats, forYou } from '@/lib/queries'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, ChefHat, Star, Sparkles } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import FilterBar from '@/components/FilterBar'

const STRIPE_COLORS = ['#ffe500', '#b71422', '#363cff', '#000']
const PAGE_SIZE = 24

export default async function Home(props: { searchParams: Promise<Record<string, string>> }) {
  const searchParams = await props.searchParams
  const session = await getSession()
  if (!session) redirect('/login')
  const query = (searchParams.search || '').trim()
  const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1)

  const [cuisines, moods] = await Promise.all([
    prisma.cuisine.findMany({ orderBy: { cuisine_name: 'asc' } }),
    prisma.mood.findMany({ orderBy: { mood_name: 'asc' } }),
  ])

  const activeCuisine = searchParams.cuisine || ''
  const activeMood = searchParams.mood || ''
  const difficulty = searchParams.difficulty || null
  const cuisineId = cuisines.find(c => c.cuisine_name === activeCuisine)?.cuisine_id ?? null
  const moodId = moods.find(m => m.mood_name === activeMood)?.mood_id ?? null

  const { ids, total: totalMatches } = await feedPage(prisma, {
    userId: session.userId, difficulty, cuisineId, moodId, search: query, page, pageSize: PAGE_SIZE,
  })
  const totalPages = Math.max(1, Math.ceil(totalMatches / PAGE_SIZE))

  const [rows, stats] = await Promise.all([
    prisma.recipe.findMany({
      where: { recipe_id: { in: ids } },
      include: {
        images: { where: { is_primary: true }, take: 1 },
        moods: { include: { mood: true } },
        user: { include: { profile: true } },
        cuisine: true,
      }
    }),
    ratingStats(prisma, ids),
  ])

  // "For you" only on the plain first page, where it doesn't compete with filters
  const showForYou = page === 1 && !query && !difficulty && !cuisineId && !moodId
  const picks = showForYou ? await forYou(prisma, session.userId) : []
  const pickRows = picks.length === 0 ? [] : await prisma.recipe.findMany({
    where: { recipe_id: { in: picks.map(p => p.recipe_id) } },
    select: { recipe_id: true, title: true, estimated_time: true, images: { where: { is_primary: true }, take: 1 } },
  })
  const pickById = new Map(pickRows.map(r => [r.recipe_id, r]))

  // findMany ignores the SQL order, so restore it
  const byId = new Map(rows.map(r => [r.recipe_id, r]))
  const recipes = ids.flatMap(id => byId.get(id) ?? [])
  const statsById = new Map(stats.map(s => [s.recipe_id, s]))

  const activeFilters = [
    ...(searchParams.difficulty ? [{ key: 'difficulty', value: searchParams.difficulty }] : []),
    ...(activeCuisine ? [{ key: 'cuisine', value: activeCuisine }] : []),
    ...(activeMood ? [{ key: 'mood', value: activeMood }] : []),
  ]

  const pageUrl = (n: number) => {
    const params = new URLSearchParams(searchParams)
    if (n === 1) params.delete('page')
    else params.set('page', String(n))
    return `/${params.toString() ? '?' + params.toString() : ''}`
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      <section className="border-b-[6px] border-[var(--border)] pb-6">
        <div className="flex justify-between items-end">
          <div>
            <p className="font-mono text-xs uppercase font-black text-[var(--blue)] mb-2">
              {session ? `// PERSONALIZED_FEED_FOR_${session.username.toUpperCase()}` : '// GLOBAL_RESEARCH_FEED'}
            </p>
            <h1 className="font-headline font-black text-6xl lg:text-8xl tracking-tighter uppercase leading-[0.85] text-[var(--fg)]">
              The Daily<br />
              <span style={{ color: 'var(--blue)' }}>Extraction</span>
            </h1>
          </div>
          <div className="text-right hidden sm:block">
            <p className="font-mono font-black text-xl uppercase text-[var(--fg)]">RECIPE_FEED</p>
            <p className="font-mono text-sm uppercase text-[var(--fg-muted)]">{totalMatches} Matches Found</p>
            {session && <p className="font-mono text-[9px] uppercase text-[#22c55e] font-black">Preferences Synchronized ✓</p>}
          </div>
        </div>

        <FilterBar cuisines={cuisines} moods={moods} searchParams={searchParams} activeFilters={activeFilters} />
      </section>

      {picks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <h2 className="font-headline font-black text-3xl uppercase tracking-tighter text-[var(--fg)] flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[var(--blue)]" /> For You
            </h2>
            <p className="font-mono text-[10px] uppercase text-[var(--fg-dim)]">From your taste signals · User_Taste_Signal</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {picks.map(pick => {
              const r = pickById.get(pick.recipe_id)
              if (!r) return null
              return (
                <Link key={pick.recipe_id} href={`/recipe/${pick.recipe_id}`} className="group block">
                  <div className="brutalist-card brutalist-shadow-hover h-full flex flex-col">
                    <div className="relative h-28 overflow-hidden border-b-[3px] border-[var(--border)] bg-[var(--bg-muted)]">
                      {r.images[0] ? (
                        <Image src={r.images[0].image_url} alt={r.title} width={300} height={200}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ChefHat className="w-8 h-8 text-[var(--fg-ghost)]" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col flex-1 gap-2">
                      <h3 className="font-headline font-extrabold text-sm leading-tight uppercase tracking-tighter text-[var(--fg)] line-clamp-2">{r.title}</h3>
                      <p className="mt-auto font-mono text-[9px] uppercase text-[var(--blue)] font-black">Because you like {pick.cuisine_name}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {recipes.length === 0 ? (
        <div className="brutalist-card p-16 text-center">
          <p className="font-mono uppercase text-[var(--fg-muted)]">No experiments found.</p>
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {recipes.map((recipe, i: number) => {
            const stripe = STRIPE_COLORS[i % STRIPE_COLORS.length]
            const stats = statsById.get(recipe.recipe_id)
            const avgRating = stats?.avg_rating ?? 0
            const reviewCount = stats?.review_count ?? 0
            return (
              <Link key={recipe.recipe_id} href={`/recipe/${recipe.recipe_id}`}
                className="group block">
                <div className="brutalist-card brutalist-shadow-hover flex flex-col h-full">
                  <div className="h-4 border-b-[3px] border-[var(--border)]" style={{ background: stripe }} />

                  <div className="relative h-56 overflow-hidden border-b-[3px] border-[var(--border)]">
                    {recipe.images[0] ? (
                      <Image src={recipe.images[0].image_url} alt={recipe.title} width={800} height={600}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[var(--bg-muted)]">
                        <ChefHat className="w-12 h-12 text-[var(--fg-ghost)]" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-[var(--bg-card)] border-2 border-[var(--border)] font-mono font-black text-[10px] px-2 py-1 uppercase text-[var(--fg)]">
                      #{String(recipe.recipe_id).padStart(4, '0')}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-headline font-extrabold text-2xl leading-none uppercase tracking-tighter mb-4 text-[var(--fg)]">
                      {recipe.title}
                    </h3>
                    
                    <div className="flex gap-2 flex-wrap mb-4">
                      <span className="db-tag">Difficulty: {recipe.difficulty_level}</span>
                      <span className="db-tag">Time: {recipe.estimated_time}m</span>
                      {recipe.cuisine && (
                        <span className="db-tag bg-[var(--blue)] text-white border-[var(--blue)]">{recipe.cuisine.cuisine_name}</span>
                      )}
                    </div>

                    {/* Star rating */}
                    {avgRating > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={12}
                              className={s <= Math.round(avgRating)
                                ? 'fill-[var(--yellow)] text-[var(--yellow)]'
                                : 'fill-none text-[var(--fg-ghost)]'
                              }
                            />
                          ))}
                        </div>
                        <span className="font-mono text-[10px] font-black text-[var(--fg-dim)]">
                          {avgRating.toFixed(1)} ({reviewCount})
                        </span>
                      </div>
                    )}

                    <div className="flex gap-1 flex-wrap mb-4">
                      {recipe.moods.slice(0, 3).map((m) => (
                        <span key={m.mood_id}
                          className="font-mono text-[10px] font-bold uppercase border border-[var(--border)] px-2 py-0.5 text-[var(--fg-dim)]">
                          {m.mood.mood_name}
                        </span>
                      ))}
                    </div>

                    <p className="font-body text-sm text-[var(--fg-muted)] line-clamp-2 mb-6 flex-1">{recipe.description}</p>

                    <div className="flex items-center justify-between mt-auto border-t-[2px] border-[var(--border)] pt-3">
                      <span className="font-mono text-xs uppercase text-[var(--fg-muted)] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {recipe.estimated_time} min
                      </span>
                      <span className="font-mono text-xs uppercase text-[var(--fg-muted)]">
                        {recipe.user.profile?.display_name || recipe.user.username}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </section>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-4 font-mono text-xs uppercase">
          {page > 1 ? (
            <Link href={pageUrl(page - 1)} className="brutalist-btn bg-[var(--bg-card)] text-[var(--fg)] px-4 py-2">← Prev</Link>
          ) : <span className="px-4 py-2 text-[var(--fg-ghost)]">← Prev</span>}
          <span className="font-black text-[var(--fg)]">Page {page} / {totalPages}</span>
          {page < totalPages ? (
            <Link href={pageUrl(page + 1)} className="brutalist-btn bg-[var(--bg-card)] text-[var(--fg)] px-4 py-2">Next →</Link>
          ) : <span className="px-4 py-2 text-[var(--fg-ghost)]">Next →</span>}
        </nav>
      )}
    </div>
  )
}
