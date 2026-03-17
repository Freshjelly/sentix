'use client'
import { EconomicEvent, Pair, TechnicalData } from '@/lib/types'

type Signal = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL'

const PAIR_CURRENCIES: Record<Pair, string[]> = {
  'USD/JPY': ['USD', 'JPY'],
  'EUR/JPY': ['EUR', 'JPY'],
  'GBP/JPY': ['GBP', 'JPY'],
  'EUR/USD': ['EUR', 'USD'],
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

/**
 * 閾値の根拠:
 *  RSI < 30  → 売られすぎ（反発期待、買いゾーン）
 *  RSI > 70  → 買われすぎ（反落期待、売りゾーン）
 *  RSI 30-70 → 中立ゾーン
 *  MA20 > MA50 → 短期が長期を上回る = 上昇トレンド
 *  MA20 < MA50 → 短期が長期を下回る = 下降トレンド
 *  センチメント ≥ 65 → 市場の強気コンセンサス
 *  センチメント ≤ 35 → 市場の弱気コンセンサス
 */
function calcSignal(
  sentiment: number,
  rsi: number,
  ma20: number,
  ma50: number,
  hasHighImpactEvent: boolean,
  eventTitle: string
): { signal: Signal; reason: string; detail: string } {
  const uptrend = ma20 > ma50
  const downtrend = ma20 < ma50
  const rsiOversold = rsi < 30
  const rsiOverbought = rsi > 70
  const trendLabel = uptrend ? '上昇トレンド(MA20>MA50)' : downtrend ? '下降トレンド(MA20<MA50)' : 'MA横ばい'

  // 重要指標前はHOLD優先（STRONG系のみ）
  if (rsiOversold && sentiment >= 65 && uptrend && !hasHighImpactEvent) {
    return {
      signal: 'STRONG_BUY',
      reason: `RSI ${rsi.toFixed(1)}（売られすぎ）+ センチメント ${sentiment} + ${trendLabel}`,
      detail: '3条件一致 → 強い買いシグナル',
    }
  }
  if (rsiOverbought && sentiment <= 35 && downtrend && !hasHighImpactEvent) {
    return {
      signal: 'STRONG_SELL',
      reason: `RSI ${rsi.toFixed(1)}（買われすぎ）+ センチメント ${sentiment} + ${trendLabel}`,
      detail: '3条件一致 → 強い売りシグナル',
    }
  }

  // 重要指標があれば様子見
  if (hasHighImpactEvent) {
    return {
      signal: 'HOLD',
      reason: `重要指標「${eventTitle}」控える`,
      detail: '指標前はポジション回避推奨',
    }
  }

  // BUY: RSI<40 かつ センチメント強気 かつ 下降トレンドでない
  if (rsi < 40 && sentiment >= 55 && !downtrend) {
    return {
      signal: 'BUY',
      reason: `RSI ${rsi.toFixed(1)}（売られ気味）+ センチメント ${sentiment}`,
      detail: uptrend ? '上昇トレンド中の押し目 → 買い' : '中立トレンド + 強気 → 買い',
    }
  }

  // SELL: RSI>60 かつ センチメント弱気 かつ 上昇トレンドでない
  if (rsi > 60 && sentiment <= 45 && !uptrend) {
    return {
      signal: 'SELL',
      reason: `RSI ${rsi.toFixed(1)}（買われ気味）+ センチメント ${sentiment}`,
      detail: downtrend ? '下降トレンド中の戻り売り → 売り' : '中立トレンド + 弱気 → 売り',
    }
  }

  return {
    signal: 'HOLD',
    reason: `RSI ${rsi.toFixed(1)} / センチメント ${sentiment} / ${trendLabel}`,
    detail: '条件不一致 → 様子見',
  }
}

interface Props {
  pair: Pair
  sentiment: number | undefined
  tech: TechnicalData | undefined
  calendar: EconomicEvent[]
}

const SIGNAL_LABELS: Record<Signal, string> = {
  STRONG_BUY: '強い買い',
  BUY: '買い',
  HOLD: '様子見',
  SELL: '売り',
  STRONG_SELL: '強い売り',
}

export default function SignalBadge({ pair, sentiment, tech, calendar }: Props) {
  if (sentiment === undefined || tech === undefined) return null

  const currencies = PAIR_CURRENCIES[pair]
  const now = new Date()
  const cutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  const nextHigh = calendar.find((e) => {
    if (e.impact !== 'high') return false
    if (!currencies.includes(e.country)) return false
    const dt = parseEventDateTime(e.date, e.time)
    return dt >= now && dt <= cutoff
  })

  const { signal, reason, detail } = calcSignal(
    sentiment,
    tech.rsi14,
    tech.ma20,
    tech.ma50,
    !!nextHigh,
    nextHigh?.title ?? ''
  )

  return (
    <div title={`${reason}\n${detail}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
      <span className={`signal-badge signal-${signal}`}>{SIGNAL_LABELS[signal]}</span>
      <span style={{ fontSize: '9px', color: 'var(--dim)', maxWidth: '180px', textAlign: 'right', lineHeight: 1.3 }}>
        {reason}
      </span>
    </div>
  )
}
