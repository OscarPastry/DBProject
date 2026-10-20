
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Eye, Flame, ChefHat, Clock } from 'lucide-react'
import { getSession } from '@/lib/auth'
import EditProfileButton from '@/components/EditProfileButton'

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const session = await getSession()

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      profile: true,
      recipes: { include: { images: { where: { is_primary: true }, take: 1 } } },
      cooking_logs: {
        include: { recipe: { include: { images: { where: { is_primary: true }, take: 1 } } } },
        orderBy: { cooked_at: 'desc' }, take: 10
      },
      taste_signals: { orderBy: { weight: 'desc' } },
    }
  })
  if (!user) return notFound()

  const totalViews = await prisma.recipe_View_Log.count({ where: { recipe: { user_id: user.user_id } } })
  const maxWeight = Math.max(...user.taste_signals.map(s => s.weight), 1)

  const isOwnProfile = session?.username === username

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
      {/* Profile hero */}
      <div className="brutalist-card overflow-hidden">
        <div className="h-4 bg-[var(--fg)] border-b-[3px] border-[var(--border)]" />
        <div className="p-8 flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar */}
          {user.profile?.profile_image_url ? (
            <div className="w-20 h-20 shrink-0 border-[3px] border-[var(--border)] overflow-hidden bg-[var(--bg-muted)]">
              <Image src={user.profile.profile_image_url} alt={user.profile.display_name || username}
                width={80} height={80} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-20 h-20 shrink-0 border-[3px] border-[var(--border)] flex items-center justify-center font-headline font-black text-4xl bg-[var(--yellow)] text-black">
              {(user.profile?.display_name || user.username).charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase text-[var(--fg-dim)] font-black">Profile</p>
                <h1 className="font-headline font-black text-4xl uppercase tracking-tighter leading-none text-[var(--fg)]">
                  {user.profile?.display_name || user.username}
                </h1>
                <p className="font-mono text-sm text-[var(--fg-muted)] mt-1">@{user.username}</p>
                {user.profile?.bio && <p className="font-body text-base text-[var(--fg-muted)] mt-3">{user.profile.bio}</p>}
              </div>
              {isOwnProfile && (
                <EditProfileButton />
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-t-[3px] border-[var(--border)]">
          {[
            { Icon: BookOpen, value: user.recipes.length, label: 'Recipes' },
            { Icon: Eye, value: totalViews, label: 'Views' },
            { Icon: Flame, value: user.cooking_logs.length, label: 'Cooked' },
            { Icon: ChefHat, value: user.taste_signals.length, label: 'Signals' },
          ].map(({ Icon, value, label }, i) => (
            <div key={label}
              className={`p-6 flex flex-col items-center text-center ${i < 3 ? 'border-r-[3px] border-[var(--border)]' : ''} ${i >= 2 ? 'border-t-[3px] md:border-t-0 border-[var(--border)]' : ''}`}>
              <Icon className="w-5 h-5 mb-2 text-[var(--fg)]" />
              <div className="font-headline font-black text-4xl text-[var(--fg)]">{value}</div>
              <div className="font-mono text-[10px] uppercase text-[var(--fg-dim)] mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Taste Signal Profile */}
        {user.taste_signals.length > 0 && (
          <div className="brutalist-card">
            <div className="px-6 py-4 border-b-[3px] border-[var(--border)] bg-[var(--fg)]">
              <h2 className="font-headline font-black text-xl uppercase tracking-tighter text-[var(--yellow)]">Taste Signal Profile</h2>
              <p className="font-mono text-[10px] text-[var(--bg)] opacity-40 uppercase mt-0.5">User_Taste_Signal table</p>
            </div>
            <div className="p-6 space-y-5">
              {user.taste_signals.map(signal => (
                <div key={signal.signal_id}>
                  <div className="flex justify-between font-mono text-xs uppercase mb-1.5">
                    <span className="font-bold text-[var(--fg)]">{signal.signal_type.replaceAll('_', ' ')}</span>
                    <span className="bg-[var(--yellow)] border border-[var(--border)] px-2 font-black text-black">{(signal.weight * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-4 border-[2px] border-[var(--border)] bg-[var(--bg-muted)]">
                    <div className="h-full bg-[var(--fg)]"
                      style={{ width: `${(signal.weight / maxWeight) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cooking Log */}
        {user.cooking_logs.length > 0 && (
          <div className="brutalist-card">
            <div className="px-6 py-4 border-b-[3px] border-[var(--border)] bg-[var(--fg)]">
              <h2 className="font-headline font-black text-xl uppercase tracking-tighter text-[var(--yellow)]">Cooking Log</h2>
              <p className="font-mono text-[10px] text-[var(--bg)] opacity-40 uppercase mt-0.5">Cooking_Log join Recipe</p>
            </div>
            <div className="divide-y-[2px] divide-[var(--border)]">
              {user.cooking_logs.map(log => (
                <Link key={log.log_id} href={`/recipe/${log.recipe_id}`}
                  className="flex items-center gap-4 p-4 hover:bg-[var(--yellow)] hover:text-black transition-none group">
                  <div className="w-12 h-12 border-[2px] border-[var(--border)] overflow-hidden shrink-0 bg-[var(--bg-muted)]">
                    {log.recipe.images[0]
                      ? <Image src={log.recipe.images[0].image_url} alt={log.recipe.title} width={100} height={100} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><ChefHat className="w-4 h-4 text-[var(--fg-ghost)]" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-bold text-xs uppercase truncate text-[var(--fg)]">{log.recipe.title}</p>
                    <p className="font-mono text-[10px] text-[var(--fg-dim)] flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {new Date(log.cooked_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-[var(--fg-ghost)] group-hover:text-black">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User's Recipes */}
      {user.recipes.length > 0 && (
        <div>
          <div className="border-b-[4px] border-[var(--border)] pb-3 mb-6">
            <h2 className="font-headline font-black text-3xl uppercase tracking-tighter text-[var(--fg)]">
              Recipes by <span className="bg-[var(--yellow)] px-2 border-x-[3px] border-[var(--border)] text-black">{user.profile?.display_name || user.username}</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {user.recipes.map(recipe => (
              <Link key={recipe.recipe_id} href={`/recipe/${recipe.recipe_id}`}
                className="brutalist-card brutalist-shadow-hover group">
                <div className="h-3 bg-[var(--yellow)] border-b-[3px] border-[var(--border)]" />
                <div className="aspect-video border-b-[3px] border-[var(--border)] overflow-hidden bg-[var(--bg-muted)]">
                  {recipe.images[0]
                    ? <Image src={recipe.images[0].image_url} alt={recipe.title} width={600} height={400} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center"><ChefHat className="w-8 h-8 text-[var(--fg-ghost)]" /></div>}
                </div>
                <div className="p-4">
                  <h3 className="font-headline font-black text-lg uppercase tracking-tighter leading-none text-[var(--fg)]">{recipe.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
