
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { Globe, Lock, ChefHat, X } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { createBoard, removeFromBoard } from '@/app/actions'

const STRIPES = ['#ffe500', '#363cff', '#b71422', '#000', '#ffe500', '#363cff']

export default async function BoardsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  // Public boards from everyone, plus the viewer's own private ones
  const boards = await prisma.board.findMany({
    where: { OR: [{ visibility: 'public' }, { user_id: session.userId }] },
    include: {
      user: { include: { profile: true } },
      recipes: {
        include: {
          recipe: { include: { images: { where: { is_primary: true }, take: 1 } } }
        }
      }
    },
    orderBy: { board_id: 'desc' }
  })

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      <section className="border-b-[6px] border-[var(--border)] pb-6 flex justify-between items-end">
        <div>
          <p className="font-mono text-xs uppercase font-black text-[var(--fg-dim)] mb-1">Pinterest-style · SAVES Table</p>
          <h1 className="font-headline font-black text-6xl uppercase tracking-tighter leading-[0.85] text-[var(--fg)]">
            Recipe<br />Boards
          </h1>
        </div>
        <details className="relative">
          <summary className="brutalist-btn bg-[var(--yellow)] text-black px-6 py-3 text-sm cursor-pointer list-none">
            + New Board
          </summary>
          <form action={createBoard}
            className="absolute right-0 mt-2 z-10 w-72 brutalist-card p-4 space-y-3 bg-[var(--bg-card)]">
            <input name="board_name" required maxLength={80} placeholder="Board name"
              className="w-full border-[2px] border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] px-3 py-2 font-mono text-xs" />
            <select name="visibility" defaultValue="private"
              className="w-full border-[2px] border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] px-3 py-2 font-mono text-xs uppercase">
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
            <button type="submit" className="brutalist-btn bg-[var(--fg)] text-[var(--yellow)] px-4 py-2 text-xs w-full">
              Create
            </button>
          </form>
        </details>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {boards.map((board, i) => {
          const stripe = STRIPES[i % STRIPES.length]
          const previews = board.recipes.slice(0, 4)
          return (
            <div key={board.board_id} className="brutalist-card brutalist-shadow-hover flex flex-col">
              <div className="h-4 border-b-[3px] border-[var(--border)]" style={{ background: stripe }} />

              {/* Mosaic preview */}
              <div className="grid grid-cols-2 gap-0 h-40 border-b-[3px] border-[var(--border)]">
                {[0,1,2,3].map(j => (
                  <div key={j} className={`relative overflow-hidden bg-[var(--bg-muted)] ${j === 1 || j === 3 ? 'border-l-[2px] border-[var(--border)]' : ''} ${j === 2 || j === 3 ? 'border-t-[2px] border-[var(--border)]' : ''}`}>
                    {previews[j]?.recipe.images[0] ? (
                      <Image src={previews[j].recipe.images[0].image_url} alt="Recipe image" width={300} height={300}
                        className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ChefHat className="w-5 h-5 text-[var(--fg-ghost)]" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between">
                  <h2 className="font-headline font-black text-2xl uppercase tracking-tighter leading-none text-[var(--fg)]">{board.board_name}</h2>
                  {board.visibility === 'public'
                    ? <Globe className="w-4 h-4 shrink-0 text-green-700 mt-1" />
                    : <Lock className="w-4 h-4 shrink-0 text-[var(--fg-dim)] mt-1" />}
                </div>
                <p className="font-mono text-[10px] uppercase text-[var(--fg-muted)] mt-1">
                  By {board.user.profile?.display_name || board.user.username}
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <span className="db-tag">{board.recipes.length} Saved</span>
                  <span className={`db-tag ${board.visibility === 'public' ? 'bg-[var(--yellow)] text-black' : ''}`}>{board.visibility}</span>
                </div>

                {board.recipes.length > 0 && (
                  <div className="mt-4 pt-4 border-t-[2px] border-[var(--border)] space-y-1">
                    {board.recipes.slice(0, 3).map(save => (
                      <div key={save.recipe_id} className="flex items-center gap-1">
                        <Link href={`/recipe/${save.recipe_id}`}
                          className="flex-1 min-w-0 block font-mono text-xs uppercase text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--yellow)] hover:text-black px-1 transition-none truncate">
                          → {save.recipe.title}
                        </Link>
                        {board.user_id === session.userId && (
                          <form action={removeFromBoard}>
                            <input type="hidden" name="boardId" value={board.board_id} />
                            <input type="hidden" name="recipeId" value={save.recipe_id} />
                            <button type="submit" aria-label={`Remove ${save.recipe.title}`}
                              className="p-0.5 text-[var(--fg-dim)] hover:text-[var(--red)]">
                              <X className="w-3 h-3" />
                            </button>
                          </form>
                        )}
                      </div>
                    ))}
                    {board.recipes.length > 3 && (
                      <p className="font-mono text-[10px] text-[var(--fg-ghost)] uppercase">+{board.recipes.length - 3} more...</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
