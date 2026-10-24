'use client'

import { useRef, useState } from 'react'

// Two series of the same measure, one hue family (validated: CVD ΔE 15.7, normal ΔE 21.9).
// The light bar step is under 3:1 against the page, so a data table ships with the chart.
const BAR = '#8a8eff'
const LINE = '#363cff'
const GRID = 'rgba(0, 0, 0, 0.1)'

type Day = { day: string; views: number; avg_7d: number; running_total: number }
type Share = { cuisine_name: string; recipes: number; share: number; cumulative_share: number }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const shortDate = (iso: string) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${Number(iso.slice(8, 10))}`

function niceMax(v: number) {
  if (v <= 0) return 1
  const step = Math.pow(10, Math.floor(Math.log10(v)))
  for (const m of [1, 2, 2.5, 5, 10]) if (m * step >= v) return m * step
  return 10 * step
}

/** Daily views (bars) with the 7-day moving average (line); crosshair tooltip on hover. */
export function ViewsTimeline({ data }: { data: Day[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const W = 800, H = 260, padL = 36, padR = 56, padT = 12, padB = 28
  const plotW = W - padL - padR, plotH = H - padT - padB
  const yMax = niceMax(Math.max(...data.map(d => d.views), 1))
  const band = plotW / data.length
  const barW = Math.min(24, Math.max(1, band - 2))
  const x = (i: number) => padL + i * band + band / 2
  const y = (v: number) => padT + plotH - (v / yMax) * plotH
  const ticks = [0, yMax / 2, yMax]
  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(d.avg_7d).toFixed(1)}`).join('')
  const last = data[data.length - 1]

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current!.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    const i = Math.round((px - padL - band / 2) / band)
    setHover(Math.max(0, Math.min(data.length - 1, i)))
  }

  // rounded data-end (top), square at the baseline
  const bar = (cx: number, v: number) => {
    const x0 = cx - barW / 2, y0 = y(v), h = padT + plotH - y0
    if (h <= 0) return ''
    const r = Math.min(4, barW / 2, h)
    return `M${x0} ${padT + plotH}V${y0 + r}Q${x0} ${y0} ${x0 + r} ${y0}H${x0 + barW - r}Q${x0 + barW} ${y0} ${x0 + barW} ${y0 + r}V${padT + plotH}Z`
  }

  const h = hover !== null ? data[hover] : null

  return (
    <div className="space-y-3">
      <div className="flex gap-5 font-mono text-[10px] uppercase text-[var(--fg-muted)]">
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: BAR }} /> Daily views</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-[2px]" style={{ background: LINE }} /> 7-day average</span>
      </div>
      <div className="relative">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto touch-none" role="img"
          aria-label="Daily recipe views over the last 90 days with a 7-day moving average"
          onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          {ticks.map(t => (
            <g key={t}>
              <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" />
              <text x={padL - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="rgba(0,0,0,0.5)" fontFamily="var(--font-mono)">{t}</text>
            </g>
          ))}
          {data.map((d, i) => i % 15 === 0 && (
            <text key={d.day} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="rgba(0,0,0,0.5)" fontFamily="var(--font-mono)">{shortDate(d.day)}</text>
          ))}
          {data.map((d, i) => <path key={d.day} d={bar(x(i), d.views)} fill={BAR} opacity={hover === null || hover === i ? 1 : 0.55} />)}
          <path d={linePath} fill="none" stroke={LINE} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={x(data.length - 1)} cy={y(last.avg_7d)} r="4" fill={LINE} stroke="var(--bg)" strokeWidth="2" />
          <text x={x(data.length - 1) + 8} y={y(last.avg_7d) + 4} fontSize="12" fontWeight="600" fill="#000" fontFamily="var(--font-mono)">{last.avg_7d.toFixed(1)}</text>
          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + plotH} stroke="rgba(0,0,0,0.35)" strokeWidth="1" />
          )}
        </svg>
        {h && hover !== null && (
          <div className="pointer-events-none absolute top-2 z-10 border-[2px] border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 font-mono text-[11px] shadow-[3px_3px_0_0_#000]"
            style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > data.length / 2 ? 'calc(-100% - 10px)' : '10px'})` }}>
            <div className="text-[var(--fg-muted)] uppercase mb-1">{shortDate(h.day)}</div>
            <div className="flex items-center gap-2"><span className="inline-block w-3 h-[2px]" style={{ background: BAR }} /><b>{h.views}</b> views</div>
            <div className="flex items-center gap-2"><span className="inline-block w-3 h-[2px]" style={{ background: LINE }} /><b>{h.avg_7d.toFixed(1)}</b> 7-day avg</div>
            <div className="text-[var(--fg-muted)] mt-1">{h.running_total} total so far</div>
          </div>
        )}
      </div>
      <details className="font-mono text-xs">
        <summary className="cursor-pointer uppercase text-[var(--fg-muted)]">Show data table</summary>
        <div className="max-h-64 overflow-auto mt-2 border-[2px] border-[var(--border)]">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-[var(--fg)] text-[var(--yellow)]">
              <tr><th className="p-2">Day</th><th className="p-2 text-right">Views</th><th className="p-2 text-right">7-day avg</th><th className="p-2 text-right">Running total</th></tr>
            </thead>
            <tbody>
              {[...data].reverse().map(d => (
                <tr key={d.day} className="border-t border-[var(--border-muted)]">
                  <td className="p-2">{d.day}</td><td className="p-2 text-right tabular-nums">{d.views}</td>
                  <td className="p-2 text-right tabular-nums">{d.avg_7d.toFixed(2)}</td><td className="p-2 text-right tabular-nums">{d.running_total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

/** Recipes per cuisine as horizontal bars; hover/focus shows share and cumulative share. */
export function CuisineShareBars({ data }: { data: Share[] }) {
  const [hover, setHover] = useState<string | null>(null)
  const max = Math.max(...data.map(d => d.recipes), 1)

  return (
    <div className="space-y-2">
      {data.map(d => (
        <div key={d.cuisine_name} className="relative grid grid-cols-[8rem_1fr] items-center gap-3 outline-none"
          tabIndex={0}
          onPointerEnter={() => setHover(d.cuisine_name)} onPointerLeave={() => setHover(null)}
          onFocus={() => setHover(d.cuisine_name)} onBlur={() => setHover(null)}>
          <span className="font-mono text-xs uppercase text-[var(--fg)] truncate">{d.cuisine_name}</span>
          <div className="flex items-center gap-2 py-1">
            <div className="h-4 rounded-r-[4px]" style={{
              width: `${(d.recipes / max) * 100}%`, minWidth: 2, background: LINE,
              opacity: hover === null || hover === d.cuisine_name ? 1 : 0.55,
            }} />
            <span className="font-mono text-xs tabular-nums text-[var(--fg)] whitespace-nowrap">
              {d.recipes} <span className="text-[var(--fg-muted)]">({d.share}%)</span>
            </span>
          </div>
          {hover === d.cuisine_name && (
            <div className="pointer-events-none absolute right-0 -top-1 z-10 border-[2px] border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 font-mono text-[11px] shadow-[3px_3px_0_0_#000]">
              <b>{d.recipes}</b> recipes · <b>{d.share}%</b> of all · top cuisines to here: <b>{d.cumulative_share}%</b>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
