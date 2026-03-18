import { NextResponse } from 'next/server'
import { RateData } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 300 },
    })
    if (!res.ok) throw new Error('Failed to fetch rates')
    const data = await res.json()
    const r = data.rates as Record<string, number>
    const updatedAt = new Date().toISOString()

    const usdJpy = r['JPY']
    const eurUsd = 1 / r['EUR']
    const eurJpy = eurUsd * usdJpy
    const gbpJpy = (1 / r['GBP']) * usdJpy

    const result: RateData[] = [
      { pair: 'USD/JPY', rate: usdJpy, updatedAt },
      { pair: 'EUR/JPY', rate: eurJpy, updatedAt },
      { pair: 'GBP/JPY', rate: gbpJpy, updatedAt },
      { pair: 'EUR/USD', rate: eurUsd, updatedAt },
    ]
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch rates' }, { status: 500 })
  }
}
