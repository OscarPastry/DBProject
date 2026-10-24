'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react'

export default function OnboardingClient({ cuisines, restrictions }: {
  cuisines: string[]
  restrictions: string[]
}) {
  const [step, setStep] = useState(0)
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([])
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([])
  const [complete, setComplete] = useState(false)
  const router = useRouter()

  const toggleCuisine = (c: string) =>
    setSelectedCuisines(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  const toggleRestriction = (r: string) =>
    setSelectedRestrictions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])

  const [loading, setLoading] = useState(false)

  const handleFinish = async () => {
    setLoading(true)
    const { saveOnboarding } = await import('@/app/actions')
    const result = await saveOnboarding(selectedCuisines, selectedRestrictions)
    if (result?.success) {
      setComplete(true)
    }
    setLoading(false)
  }

  if (complete) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 space-y-6">
        <div className="brutalist-card overflow-hidden">
          <div className="h-4 bg-[var(--yellow)] border-b-[3px] border-[var(--border)]" />
          <div className="p-10 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-600" />
            <h1 className="font-headline font-black text-5xl uppercase tracking-tighter text-[var(--fg)]">Setup<br />Complete!</h1>
            <p className="font-body text-[var(--fg-muted)] text-lg">Your taste profile has been synchronized with the database.</p>
            
            <div className="border-[3px] border-[var(--border)] p-4 bg-[var(--bg-muted)] text-left mt-6 space-y-2">
              <p className="font-mono text-[10px] uppercase font-black text-[var(--fg-dim)]">Relational Operations Executed:</p>
              <div className="space-y-1">
                <code className="font-mono text-[10px] block text-blue-700">UPSERT User_Onboarding (v2.1)</code>
                <code className="font-mono text-[10px] block text-blue-700">DELETE + INSERT SELECTS ({selectedCuisines.length} ranks)</code>
                <code className="font-mono text-[10px] block text-green-700">DELETE + INSERT FOLLOWS ({selectedRestrictions.length} restrictions)</code>
              </div>
            </div>

            <div className="pt-6">
                <button 
                  onClick={() => router.push('/')}
                  className="w-full brutalist-btn bg-[var(--fg)] text-[var(--yellow)] py-4 text-sm uppercase">
                    Launch Discovery Feed →
                </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <div className="border-b-[6px] border-[var(--border)] pb-6">
        <p className="font-mono text-xs uppercase text-[var(--fg-dim)] font-black mb-1">
          User_Onboarding · SELECTS · FOLLOWS Tables
        </p>
        <h1 className="font-headline font-black text-6xl uppercase tracking-tighter leading-[0.85] text-[var(--fg)]">
          Taste<br />Setup
        </h1>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between font-mono text-xs uppercase">
          <span className="font-black text-[var(--fg)]">Step {step + 1} / 2</span>
          <span className="text-[var(--fg-dim)]">{step === 0 ? 'Cuisine Preferences' : 'Dietary Restrictions'}</span>
        </div>
        <div className="h-3 border-[3px] border-[var(--border)] bg-[var(--bg-muted)]">
          <div className="h-full bg-[var(--fg)] transition-all duration-300" style={{ width: `${((step + 1) / 2) * 100}%` }} />
        </div>
      </div>

      <div className="brutalist-card overflow-hidden">
        <div className="h-4 border-b-[3px] border-[var(--border)]" style={{ background: step === 0 ? 'var(--yellow)' : 'var(--blue)' }} />

        <div className="p-8 space-y-6">
          {step === 0 ? (
            <>
              <div>
                <h2 className="font-headline font-black text-3xl uppercase tracking-tighter text-[var(--fg)]">Select Cuisines</h2>
                <p className="font-mono text-xs text-[var(--fg-muted)] uppercase mt-1">Order of selection = preference_rank in SELECTS</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {cuisines.map(c => {
                  const rank = selectedCuisines.indexOf(c)
                  const selected = rank !== -1
                  return (
                    <button key={c} onClick={() => toggleCuisine(c)}
                      className={`relative p-5 text-left font-headline font-black text-2xl uppercase tracking-tighter border-[3px] border-[var(--border)] transition-none
                        ${selected ? 'bg-[var(--yellow)] text-black' : 'bg-[var(--bg-card)] text-[var(--fg-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--fg)]'}`}
                      style={selected ? { boxShadow: '4px 4px 0 0 var(--shadow)' } : {}}>
                      {selected && (
                        <span className="absolute top-2 right-2 w-6 h-6 border-2 border-[var(--border)] bg-[var(--fg)] text-[var(--yellow)] font-mono text-xs font-black flex items-center justify-center">
                          {rank + 1}
                        </span>
                      )}
                      {c}
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <div>
                <h2 className="font-headline font-black text-3xl uppercase tracking-tighter text-[var(--fg)]">Dietary Needs</h2>
                <p className="font-mono text-xs text-[var(--fg-muted)] uppercase mt-1">Inserts into FOLLOWS junction table</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {restrictions.map(r => {
                  const selected = selectedRestrictions.includes(r)
                  return (
                    <button key={r} onClick={() => toggleRestriction(r)}
                      className={`p-4 text-left font-mono font-black text-sm uppercase border-[3px] border-[var(--border)] transition-none
                        ${selected ? 'bg-[var(--fg)] text-[var(--yellow)]' : 'bg-[var(--bg-card)] text-[var(--fg-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--fg)]'}`}>
                      {selected ? '✓ ' : ''}{r}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Nav buttons */}
        <div className="flex justify-between border-t-[3px] border-[var(--border)]">
          <button onClick={() => router.push('/')}
            className="brutalist-btn bg-[var(--bg-card)] text-[var(--fg-dim)] px-6 py-4 text-sm border-0 flex items-center gap-2 hover:text-[var(--fg)]">
            Skip
          </button>
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)}
              className="brutalist-btn bg-[var(--bg-card)] text-[var(--fg)] px-6 py-4 text-sm border-0 border-r-[3px] border-t-0 border-b-0 border-[var(--border)] flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}
          {step < 1 ? (
            <button onClick={() => setStep(s => s + 1)}
              className="brutalist-btn bg-[var(--fg)] text-[var(--yellow)] px-6 py-4 text-sm border-0 border-l-[3px] border-t-0 border-b-0 flex items-center gap-2 ml-auto">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleFinish}
              disabled={loading}
              className="brutalist-btn bg-[var(--yellow)] text-black px-8 py-4 text-sm border-0 border-l-[3px] border-t-0 border-b-0 flex items-center gap-2 font-headline font-black text-lg uppercase ml-auto disabled:opacity-50">
              <CheckCircle2 className="w-5 h-5" /> 
              {loading ? 'Archiving...' : 'Finish Protocol'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
