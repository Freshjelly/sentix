import { NextResponse } from 'next/server'
import { TechnicalData, Pair } from '@/lib/types'

export const dynamic = 'force-dynamic'

const SYMBOLS: Record<Pair, string> = {
  'USD/JPY': 'USDJPY=X',
  'EUR/JPY': 'EURJPY=X',
  'GBP/JPY': 'GBPJPY=X',
  'EUR/USD': 'EURUSD=X',
}

function calcRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50
  const changes = closes.slice(1).map((c, i) => c - closes[i])
  const recent = changes.slice(-period)
  const gains = recent.filter((c) => c > 0).reduce((a, b) => a + b, 0)
  const losses = recent.filter((c) => c < 0).reduce((a, b) => a + Math.abs(b), 0)
  const avgGain = gains / period
  const avgLoss = losses / period
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return Math.round((100 - 100 / (1 + rs)) * 10) / 10
}

function calcMA(closes: number[], period: number): number {
  if (closes.length < period) return closes[closes.length - 1]
  const recent = closes.slice(-period)
  return recent.reduce((a, b) => a + b, 0) / period
}

async function fetchTechnical(pair: Pair): Promise<TechnicalData | null> {
  const symbol = SYMBOLS[pair]
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1h&range=30d`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; sentix/1.0)' },
        next: { revalidate: 300 },
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const closes: (number | null)[] =
      data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []
    const valid = closes.filter((c): c is number => c !== null && !isNaN(c))
    if (valid.length < 20) return null

    const rsi14 = calcRSI(valid)
    const ma20 = calcMA(valid, 20)
    const ma50 = calcMA(valid, 50)
    const currentPrice = valid[valid.length - 1]
    const signal: 'BUY' | 'SELL' | 'HOLD' =
      rsi14 < 40 ? 'BUY' : rsi14 > 60 ? 'SELL' : 'HOLD'

    return { pair, rsi14, ma20, ma50, currentPrice, signal }
  } catch {
    return null
  }
}

export async function GET() {
  const pairs: Pair[] = ['USD/JPY', 'EUR/JPY', 'GBP/JPY', 'EUR/USD']
  const results = await Promise.all(pairs.map(fetchTechnical))
  const valid = results.filter((r): r is TechnicalData => r !== null)
  return NextResponse.json(valid)
}
