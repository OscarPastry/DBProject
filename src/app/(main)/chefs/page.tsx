import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Eye, Flame, ChefHat, Search } from 'lucide-react'

export default async function ChefsPage(props: { searchParams: Promise<{ search?: string }> }) {
  const searchParams = await props.searchParams
  const query = searchParams.search || ''

  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { profile: { display_name: { contains: query, mode: 'insensitive' } } },
            { profile: { bio: { contains: query, mode: 'insensitive' } } },
          ],
        }
      : {},
    include: {
      profile: true,
      recipes: { select: { recipe_id: true, title: true }, orderBy: { created_at: 'desc' }, take: 3 },
      _count: { select: { recipes: true, cooking_logs: true, taste_signals: true } },
    },
    orderBy: { created_at: 'desc' },
  })

  // Views received on each chef's recipes, in one grouped query
  const viewRows = await prisma.$queryRaw<{ user_id: number; views: number }[]>`
    SELECT r.user_id, COUNT(*)::int AS views
    FROM "Recipe_View_Log" v
    JOIN "Recipe" r ON r.recipe_id = v.recipe_id
    GROUP BY r.user_id
  `
  const viewsByUser = new Map(viewRows.map(r => [r.user_id, r.views]))

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* Header */}
      <section className="border-b-[6px] border-[var(--border)] pb-6">
        <div className="flex justify-between items-end flex-wrap gap-4">
          <div>
            <p className="font-mono text-xs uppercase font-black text-[var(--fg-dim)] mb-1">User Table · ALL_CHEFS</p>
            <h1 className="font-headline font-black text-6xl uppercase tracking-tighter leading-[0.85] text-[var(--fg)]">
              Our<br />
              <span className="bg-[var(--yellow)] px-2 border-[3px] border-[var(--border)] text-black">Chefs</span>
            </h1>
          </div>
          <div className="text-right">
            <p className="font-mono font-black text-xl uppercase text-[var(--fg)]">CHEF_ROSTER</p>
            <p className="font-mono text-sm uppercase text-[var(--fg-muted)]">{users.length} Registered</p>
          </div>
        </div>

        {/* Search */}
        <form className="mt-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--fg-ghost)]" />
            <input
              name="search"
              type="text"
              defaultValue={query}
              placeholder="Search chefs by name, username, or bio..."
              className="w-full bg-[var(--input-bg)] border-[3px] border-[var(--border)] font-mono text-sm pl-12 pr-4 py-3 focus:outline-none focus:ring-0 uppercase placeholder:text-[var(--fg-ghost)] placeholder:normal-case text-[var(--fg)]"
            />
          </div>
          <div className="mt-2 flex justify-end">
            <button type="submit" className="brutalist-btn bg-[var(--fg)] text-[var(--yellow)] px-6 py-2 text-xs">
              Search
            </button>
            {query && (
              <Link href="/chefs" className="brutalist-btn bg-[var(--bg-card)] text-[var(--fg)] px-4 py-2 text-xs ml-2">
                Clear
              </Link>
            )}
          </div>
        </form>
      </section>

      {/* Chef Grid */}
      {users.length === 0 ? (
        <div className="brutalist-card p-16 text-center">
          <p className="font-mono uppercase text-[var(--fg-muted)]">No chefs found.</p>
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {users.map((user, i) => {
            const initials = (user.profile?.display_name || user.username).charAt(0).toUpperCase()
            const stripeColors = ['#ffe500', '#b71422', '#363cff', '#000']
            const stripe = stripeColors[i % stripeColors.length]

            return (
              <Link key={user.user_id} href={`/profile/${user.username}`} className="group block">
                <div className="brutalist-card brutalist-shadow-hover flex flex-col h-full">
                  {/* Color stripe */}
                  <div className="h-4 border-b-[3px] border-[var(--border)]" style={{ background: stripe }} />

                  {/* Avatar + Name */}
                  <div className="p-6 flex items-start gap-4 border-b-[3px] border-[var(--border)]">
                    {user.profile?.profile_image_url ? (
                      <div className="w-16 h-16 shrink-0 border-[3px] border-[var(--border)] overflow-hidden bg-[var(--bg-muted)]">
                        <Image src={user.profile.profile_image_url} alt={user.profile.display_name || user.username}
                          width={64} height={64} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 shrink-0 border-[3px] border-[var(--border)] flex items-center justify-center font-headline font-black text-3xl bg-[var(--yellow)] text-black group-hover:bg-[var(--blue)] group-hover:text-white transition-colors">
                        {initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[10px] uppercase text-[var(--fg-dim)] font-black">@{user.username}</p>
                      <h2 className="font-headline font-black text-2xl uppercase tracking-tighter leading-none truncate text-[var(--fg)]">
                        {user.profile?.display_name || user.username}
                      </h2>
                      {user.profile?.bio && (
                        <p className="font-body text-sm text-[var(--fg-muted)] mt-1 line-clamp-2">{user.profile.bio}</p>
                      )}
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-4 border-b-[3px] border-[var(--border)]">
                    {[
                      { Icon: BookOpen, value: user._count.recipes, label: 'Recipes' },
                      { Icon: Eye, value: viewsByUser.get(user.user_id) ?? 0, label: 'Views' },
                      { Icon: Flame, value: user._count.cooking_logs, label: 'Cooked' },
                      { Icon: ChefHat, value: user._count.taste_signals, label: 'Signals' },
                    ].map(({ Icon, value, label }, j) => (
                      <div key={label}
                        className={`p-4 flex flex-col items-center text-center ${j < 3 ? 'border-r-[3px] border-[var(--border)]' : ''}`}>
                        <Icon className="w-4 h-4 mb-1 text-[var(--fg-dim)]" />
                        <div className="font-headline font-black text-2xl text-[var(--fg)]">{value}</div>
                        <div className="font-mono text-[8px] uppercase text-[var(--fg-dim)]">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Recent recipes preview */}
                  {user.recipes.length > 0 && (
                    <div className="p-4 flex-1">
                      <p className="font-mono text-[10px] font-black uppercase text-[var(--fg-dim)] mb-2">Recent Recipes</p>
                      <div className="space-y-1">
                        {user.recipes.map(r => (
                          <div key={r.recipe_id}
                            className="font-mono text-xs uppercase text-[var(--fg-muted)] truncate group-hover:text-[var(--fg)]">
                            → {r.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="px-6 py-3 bg-[var(--bg-muted)] border-t-[3px] border-[var(--border)] flex justify-between items-center">
                    <span className="font-mono text-[10px] uppercase text-[var(--fg-dim)]">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </span>
                    <span className="font-mono text-[10px] font-black uppercase text-[var(--blue)]">
                      View Profile →
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </section>
      )}
    </div>
  )
}
