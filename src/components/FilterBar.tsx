'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Filter, X } from 'lucide-react'

export default function FilterBar({ cuisines, moods, searchParams, activeFilters }: {
  cuisines: { cuisine_name: string }[]
  moods: { mood_name: string }[]
  searchParams: Record<string, string>
  activeFilters: { key: string; value: string }[]
}) {
  const [isOpen, setIsOpen] = useState(false)

  const buildUrl = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    params.delete('page')
    if (params.get(key) === value) params.delete(key)
    else params.set(key, value)
    return `/${params.toString() ? '?' + params.toString() : ''}`
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 flex-wrap">
        {activeFilters.map(f => (
          <Link key={f.key} href={buildUrl(f.key, f.value)}
            className="flex items-center gap-1 font-mono text-[10px] font-black uppercase bg-[var(--fg)] text-[var(--yellow)] border-2 border-[var(--border)] px-3 py-1.5">
            {f.key}: {f.value}
            <X className="w-3 h-3" />
          </Link>
        ))}
        <button onClick={() => setIsOpen(!isOpen)}
          className={`brutalist-btn flex items-center gap-2 px-4 py-2 text-xs ${isOpen ? 'bg-[var(--yellow)] text-black' : 'bg-[var(--fg)] text-[var(--yellow)]'}`}>
          <Filter className="w-4 h-4" />
          Filters
          {activeFilters.length > 0 && (
            <span className="bg-[var(--red)] text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full">
              {activeFilters.length}
            </span>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 brutalist-card overflow-hidden">
          <div className="h-3 bg-[var(--yellow)] border-b-[3px] border-[var(--border)]" />
          <div className="p-6 space-y-5">
            <div>
              <label className="block font-mono font-black text-xs uppercase mb-2 text-[var(--fg-muted)]">Difficulty</label>
              <div className="flex gap-2 flex-wrap">
                {['Easy', 'Medium', 'Hard'].map(d => (
                  <Link key={d} href={buildUrl('difficulty', d)}
                    className={`brutalist-btn px-4 py-1.5 text-xs ${searchParams.difficulty === d ? 'bg-[var(--yellow)] text-black' : 'bg-[var(--bg-card)] text-[var(--fg)]'}`}>
                    {d}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-mono font-black text-xs uppercase mb-2 text-[var(--fg-muted)]">Cuisine</label>
              <div className="flex gap-2 flex-wrap">
                {cuisines.map(c => (
                  <Link key={c.cuisine_name} href={buildUrl('cuisine', c.cuisine_name)}
                    className={`brutalist-btn px-4 py-1.5 text-xs ${searchParams.cuisine === c.cuisine_name ? 'bg-[var(--blue)] text-white' : 'bg-[var(--bg-card)] text-[var(--fg)]'}`}>
                    {c.cuisine_name}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-mono font-black text-xs uppercase mb-2 text-[var(--fg-muted)]">Mood</label>
              <div className="flex gap-2 flex-wrap">
                {moods.map(m => (
                  <Link key={m.mood_name} href={buildUrl('mood', m.mood_name)}
                    className={`brutalist-btn px-4 py-1.5 text-xs ${searchParams.mood === m.mood_name ? 'bg-[var(--red)] text-white' : 'bg-[var(--bg-card)] text-[var(--fg)]'}`}>
                    {m.mood_name}
                  </Link>
                ))}
              </div>
            </div>

            {activeFilters.length > 0 && (
              <div className="pt-3 border-t-[2px] border-[var(--border)]">
                <Link href="/" className="brutalist-btn bg-[var(--fg)] text-[var(--yellow)] px-4 py-2 text-xs">
                  Clear All Filters
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
