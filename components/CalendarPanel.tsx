'use client'
import { EconomicEvent } from '@/lib/types'

interface Props {
  events: EconomicEvent[]
}

function parseEventDateTime(dateStr: string, timeStr: string): Date {
  let date: Date
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [month, day, year] = dateStr.split('-')
    date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`)
  } else {
    date = new Date(dateStr)
  }
  if (isNaN(date.getTime())) return new Date(0)

  const match = timeStr?.match(/(\d+):(\d+)(am|pm)/i)
  if (match) {
    let h = parseInt(match[1])
    const m = parseInt(match[2])
    const p = match[3].toLowerCase()
    if (p === 'pm' && h !== 12) h += 12
    if (p === 'am' && h === 12) h = 0
    date.setHours(h, m, 0, 0)
  }
  return date
}

function formatCountdown(ms: number): string {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h > 0) return `${h}時間${m}分`
  return `${m}分`
}

const impactColor = { high: 'var(--red)', medium: 'var(--yellow)', low: 'var(--dim)' }
const impactLabel = { high: '高', medium: '中', low: '低' }

export default function CalendarPanel({ events }: Props) {
  const now = new Date()
  const cutoff48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  const upcoming = events
    .map((e) => ({ ...e, dt: parseEventDateTime(e.date, e.time) }))
    .filter((e) => e.dt >= now && e.dt <= cutoff48h)
    .sort((a, b) => a.dt.getTime() - b.dt.getTime())

  const nextHigh = upcoming.find((e) => e.impact === 'high')

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', marginTop: '12px' }}>
      <div className="sub-label" style={{ marginBottom: '8px' }}>経済指標カレンダー（48時間以内）</div>

      {nextHigh && (
        <div className="countdown">
          次の重要指標まで {formatCountdown(nextHigh.dt.getTime() - now.getTime())}
        </div>
      )}

      {upcoming.length === 0 ? (
        <div style={{ color: 'var(--dim)', fontSize: '11px', padding: '8px 0' }}>
          今後48時間以内の指標はありません
        </div>
      ) : (
        <div>
          {upcoming.slice(0, 8).map((e, i) => (
            <div key={i} className="calendar-item">
              <div
                className="impact-dot"
                style={{ background: impactColor[e.impact] }}
                title={impactLabel[e.impact]}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: impactColor[e.impact], lineHeight: 1.4 }}>
                  {e.title}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--dim)', marginTop: '2px' }}>
                  {e.country} ·{' '}
                  {e.dt.toLocaleString('ja-JP', {
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {e.forecast && ` · 予想: ${e.forecast}`}
                  {e.previous && ` · 前回: ${e.previous}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
