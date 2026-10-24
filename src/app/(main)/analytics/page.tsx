import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { refreshAnalytics } from '@/app/actions'
import { viewsTimeline, topPerCuisine, chefLeaderboard, cuisineShare, popularityRefreshedAt } from '@/lib/queries'
import { ViewsTimeline, CuisineShareBars } from './AnalyticsCharts'

export default async function AnalyticsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [timeline, top, chefs, share, refreshedAt, totals] = await Promise.all([
    viewsTimeline(prisma, 90),
    topPerCuisine(prisma, 3),
    chefLeaderboard(prisma, 10),
    cuisineShare(prisma),
    popularityRefreshedAt(prisma),
    prisma.$queryRaw<{ cooks: number; reviews: number; avg_rating: number }[]>`
      SELECT (SELECT COUNT(*) FROM "Cooking_Log" WHERE cooked_at >= CURRENT_DATE - 89)::int AS cooks,
             (SELECT COUNT(*) FROM "Review" WHERE created_at >= CURRENT_DATE - 89)::int     AS reviews,
             COALESCE((SELECT AVG(rating) FROM "Review"), 0)::float8                       AS avg_rating
    `,
  ])

  const totalViews = timeline.at(-1)?.running_total ?? 0
  const byCuisine = Object.entries(Object.groupBy(top, r => r.cuisine_name))

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      <section className="border-b-[6px] border-[var(--border)] pb-6 flex justify-between items-end flex-wrap gap-4">
        <div>
          <p className="font-mono text-xs uppercase font-black text-[var(--fg-dim)] mb-1">Window functions · Materialized view</p>
          <h1 className="font-headline font-black text-6xl uppercase tracking-tighter leading-[0.85] text-[var(--fg)]">
            Analytics
          </h1>
        </div>
        <form action={refreshAnalytics} className="text-right space-y-1">
          <button type="submit" className="brutalist-btn bg-[var(--yellow)] text-black px-4 py-2 text-xs flex items-center gap-2 ml-auto">
            <RefreshCw className="w-3 h-3" /> Refresh view
          </button>
          <p className="font-mono text-[10px] uppercase text-[var(--fg-dim)]">
            Recipe_Popularity as of {refreshedAt ? new Date(refreshedAt).toLocaleString() : 'never'}
          </p>
        </form>
      </section>

      {/* Headline figures: the last 90 days */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Recipe views', value: totalViews.toLocaleString() },
          { label: 'Meals cooked', value: totals[0].cooks.toLocaleString() },
          { label: 'Reviews written', value: totals[0].reviews.toLocaleString() },
          { label: 'Average rating', value: `${totals[0].avg_rating.toFixed(2)} / 5` },
        ].map(t => (
          <div key={t.label} className="brutalist-card p-5">
            <p className="font-mono text-[10px] uppercase text-[var(--fg-muted)]">{t.label}</p>
            <p className="font-headline font-bold text-3xl text-[var(--fg)] mt-1">{t.value}</p>
            <p className="font-mono text-[9px] uppercase text-[var(--fg-dim)] mt-1">Last 90 days{t.label === 'Average rating' ? ' (all time)' : ''}</p>
          </div>
        ))}
      </section>

      <section className="brutalist-card p-6 space-y-4">
        <div>
          <h2 className="font-headline font-black text-2xl uppercase tracking-tighter text-[var(--fg)]">Recipe views, last 90 days</h2>
          <p className="font-mono text-[10px] uppercase text-[var(--fg-dim)]">generate_series · AVG() OVER (ROWS 6 PRECEDING) · SUM() OVER (ORDER BY day)</p>
        </div>
        <ViewsTimeline data={timeline} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="brutalist-card p-6 space-y-4">
          <div>
            <h2 className="font-headline font-black text-2xl uppercase tracking-tighter text-[var(--fg)]">Recipes by cuisine</h2>
            <p className="font-mono text-[10px] uppercase text-[var(--fg-dim)]">COUNT / SUM(COUNT) OVER () · running share</p>
          </div>
          <CuisineShareBars data={share} />
        </section>

        <section className="brutalist-card overflow-hidden">
          <div className="p-6 pb-4">
            <h2 className="font-headline font-black text-2xl uppercase tracking-tighter text-[var(--fg)]">Chef leaderboard</h2>
            <p className="font-mono text-[10px] uppercase text-[var(--fg-dim)]">DENSE_RANK() · NTILE(4) over total popularity</p>
          </div>
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[var(--fg)] text-[var(--yellow)] uppercase">
              <tr><th className="p-3">#</th><th className="p-3">Chef</th><th className="p-3 text-right">Recipes</th><th className="p-3 text-right">Popularity</th><th className="p-3 text-right">Quartile</th></tr>
            </thead>
            <tbody>
              {chefs.map(c => (
                <tr key={c.username} className="border-t-[2px] border-[var(--border)]">
                  <td className="p-3 font-black">{c.rank}</td>
                  <td className="p-3"><Link href={`/profile/${c.username}`} className="hover:bg-[var(--yellow)] hover:text-black">{c.display_name || c.username}</Link></td>
                  <td className="p-3 text-right tabular-nums">{c.recipes}</td>
                  <td className="p-3 text-right tabular-nums">{c.popularity}</td>
                  <td className="p-3 text-right">Q{c.quartile}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="font-headline font-black text-2xl uppercase tracking-tighter text-[var(--fg)]">Top 3 in each cuisine</h2>
          <p className="font-mono text-[10px] uppercase text-[var(--fg-dim)]">RANK() OVER (PARTITION BY cuisine ORDER BY popularity DESC) · popularity = views + 5×cooks + 3×saves + 2×reviews</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {byCuisine.map(([cuisine, rows]) => (
            <div key={cuisine} className="brutalist-card">
              <div className="px-4 py-3 border-b-[3px] border-[var(--border)] bg-[var(--fg)] font-headline font-black uppercase tracking-tighter text-[var(--yellow)]">{cuisine}</div>
              <ol className="divide-y-[2px] divide-[var(--border)]">
                {rows!.map(r => (
                  <li key={r.recipe_id}>
                    <Link href={`/recipe/${r.recipe_id}`} className="flex items-center gap-3 p-3 hover:bg-[var(--yellow)] hover:text-black">
                      <span className="w-7 h-7 shrink-0 border-[2px] border-[var(--border)] flex items-center justify-center font-mono font-black text-xs">{r.rank}</span>
                      <span className="flex-1 min-w-0 font-mono text-xs uppercase truncate">{r.title}</span>
                      <span className="font-mono text-[10px] text-[var(--fg-muted)] tabular-nums whitespace-nowrap">{r.popularity} pts · {r.views}v {r.cooks}c</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
