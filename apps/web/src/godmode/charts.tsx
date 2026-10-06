import { useEffect, useRef, useState } from 'react'
import { cn } from '@heroui/react'

export type Point = { key: string; label: string; title: string; value: number }

/** An axis top and step on round numbers (1, 2, 2.5 or 5 times a power of ten), with `count` steps. */
function niceScale(max: number, count = 4, integers = false) {
  if (max <= 0) return { top: count, step: 1 }
  const raw = max / count
  const power = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= raw && (!integers || Number.isInteger(s)))!
  const whole = integers ? Math.max(1, Math.ceil(step)) : step
  return { top: whole * count, step: whole }
}

export function BarChart({
  points,
  format,
  axis = format,
  highlight,
}: {
  points: Point[]
  format: (value: number) => string
  axis?: (value: number) => string
  highlight?: string
}) {
  const { top, step } = niceScale(Math.max(...points.map((p) => p.value)))
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => top - i * step)

  return (
    <div className="flex gap-3">
      <div className="relative h-44 w-11 shrink-0 text-[11px] text-muted tabular-nums">
        {ticks.map((tick, i) => (
          <span
            key={tick}
            className="absolute right-0 -translate-y-1/2 leading-none"
            style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
          >
            {axis(tick)}
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative h-44">
          {ticks.map((tick, i) => (
            <div
              key={tick}
              className={cn('absolute inset-x-0 border-t', i === ticks.length - 1 ? 'border-border' : 'border-dashed border-border/70')}
              style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-end gap-1">
            {points.map((p) => (
              <div key={p.key} className="group relative flex h-full flex-1 items-end justify-center">
                {p.value > 0 && (
                  <div
                    className={cn(
                      'w-full max-w-5 rounded-full transition-colors',
                      p.key === highlight ? 'bg-accent' : 'bg-accent/55 group-hover:bg-accent',
                    )}
                    style={{ height: `${Math.max((p.value / top) * 100, 3)}%` }}
                  />
                )}
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded-lg bg-foreground px-2 py-1 text-center text-xs whitespace-nowrap text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  {p.title}
                  <br />
                  <b className="tabular-nums">{format(p.value)}</b>
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 flex gap-1 text-[11px] text-muted tabular-nums">
          {points.map((p) => (
            <span key={p.key} className={cn('flex-1 truncate text-center', p.key === highlight && 'font-semibold text-accent')}>
              {p.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export type Series = { name: string; stroke: string; fill: string; values: number[] }

const H = 200
const PAD = { left: 28, right: 12, top: 10, bottom: 24 }

/** Drawn at the container's real width, so text and strokes keep their size. */
export function LineChart({ labels, titles, series }: { labels: string[]; titles: string[]; series: Series[] }) {
  const box = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(0)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setW(Math.round(entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const { top, step } = niceScale(Math.max(...series.flatMap((s) => s.values)), 4, true)
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step)
  const x = (i: number) => PAD.left + (labels.length > 1 ? (i / (labels.length - 1)) * (W - PAD.left - PAD.right) : 0)
  const y = (v: number) => PAD.top + (1 - v / top) * (H - PAD.top - PAD.bottom)

  return (
    <div ref={box} style={{ height: H }}>
      {W > 0 && (
        <svg width={W} height={H} className="overflow-visible" role="img">
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(tick)}
                y2={y(tick)}
                className={cn('stroke-border', tick > 0 && '[stroke-dasharray:3_3]')}
              />
              <text x={PAD.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">
                {tick}
              </text>
            </g>
          ))}
          {labels.map((label, i) => (
            <text key={label + i} x={x(i)} y={H - 4} textAnchor="middle" className="fill-muted text-[11px]">
              {label}
            </text>
          ))}
          {series.map((s) => (
            <g key={s.name}>
              <polyline
                points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
                fill="none"
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                className={s.stroke}
              />
              {s.values.map((v, i) => (
                <circle key={i} cx={x(i)} cy={y(v)} r={4} strokeWidth={2} className={cn('stroke-surface', s.fill)}>
                  <title>{`${titles[i]}: ${v} ${s.name.toLowerCase()}`}</title>
                </circle>
              ))}
            </g>
          ))}
        </svg>
      )}
    </div>
  )
}
