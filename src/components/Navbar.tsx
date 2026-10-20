import Link from 'next/link'
import { Plus, Search, User, LogOut } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { logout } from '@/app/actions'

export default async function Navbar() {
  const session = await getSession()

  return (
    <header className="fixed top-0 w-full z-50 bg-[var(--bg)] border-b-[3px] border-[var(--border)] flex justify-between items-center px-6 h-20"
      style={{ boxShadow: '4px 4px 0px 0px var(--shadow)' }}>
      
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-8">
        <Link href="/" className="font-headline font-black text-2xl uppercase tracking-tighter text-[var(--fg)] hover:text-[var(--blue)] transition-none">
          FlavorForge
        </Link>
        <nav className="hidden xl:flex gap-0 items-center">
          <Link href="/"
            className="text-[var(--fg-muted)] font-mono font-medium text-sm uppercase hover:bg-[var(--yellow)] hover:text-black px-3 py-1 transition-none border-r border-[var(--border-muted)]">
            Recipes
          </Link>
          <Link href="/boards"
            className="text-[var(--fg-muted)] font-mono font-medium text-sm uppercase hover:bg-[var(--yellow)] hover:text-black px-3 py-1 transition-none border-r border-[var(--border-muted)]">
            Boards
          </Link>
          <Link href="/chefs"
            className="text-[var(--fg-muted)] font-mono font-medium text-sm uppercase hover:bg-[var(--yellow)] hover:text-black px-3 py-1 transition-none border-r border-[var(--border-muted)]">
            Chefs
          </Link>
          <Link href="/pantry"
            className="text-[var(--fg-muted)] font-mono font-medium text-sm uppercase hover:bg-[var(--yellow)] hover:text-black px-3 py-1 transition-none border-r border-[var(--border-muted)]">
            Pantry
          </Link>
          <Link href="/analytics"
            className="text-[var(--fg-muted)] font-mono font-medium text-sm uppercase hover:bg-[var(--yellow)] hover:text-black px-3 py-1 transition-none border-r border-[var(--border-muted)]">
            Analytics
          </Link>
          <Link href="/admin/ingredients"
            className="text-[var(--fg-muted)] font-mono font-medium text-sm uppercase hover:bg-[var(--yellow)] hover:text-black px-3 py-1 transition-none">
            Ingredients
          </Link>
        </nav>
      </div>

      {/* Middle: Functional Search */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
        <form action="/" method="GET" className="w-full flex">
          <div className="relative w-full brutalist-card flex items-center bg-[var(--bg-muted)]">
            <Search className="absolute left-3 w-4 h-4 text-[var(--fg-ghost)]" />
            <input 
              name="search"
              type="text" 
              placeholder="SEARCH RECIPES..." 
              className="w-full bg-transparent border-none focus:ring-0 font-mono text-[10px] uppercase pl-10 pr-4 py-2 text-[var(--fg)] placeholder:text-[var(--fg-ghost)]"
            />
          </div>
        </form>
      </div>

      {/* Right: CTA & Auth */}
      <div className="flex items-center gap-3">
        {session ? (
          <>
            <Link href="/create-recipe"
              className="hidden sm:flex items-center gap-2 brutalist-btn bg-[var(--bg-card)] text-[var(--fg)] px-4 py-2 text-xs">
              <Plus className="w-3 h-3" /> New Experiment
            </Link>
            <Link href={`/profile/${session.username}`}
              className="brutalist-btn bg-[var(--bg-card)] text-[var(--fg)] px-4 py-2 text-xs flex items-center gap-2 hover:bg-[var(--blue)] hover:text-white">
              <User className="w-3 h-3" /> {session.username}
            </Link>
            <form action={logout}>
              <button type="submit" className="brutalist-btn bg-[var(--fg)] text-[var(--bg)] px-3 py-2 text-xs hover:opacity-80">
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login"
              className="brutalist-btn bg-[var(--bg-card)] text-[var(--fg)] px-5 py-2 text-xs uppercase font-black">
              Login
            </Link>
            <Link href="/register"
              className="brutalist-btn bg-[var(--fg)] text-[var(--bg)] px-5 py-2 text-xs uppercase font-black">
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
