import { NextResponse } from 'next/server'
import { EconomicEvent } from '@/lib/types'

interface FFEvent {
  title: string
  country: string
  date: string
  time: string
  impact: string
  forecast: string
  previous: string
}

const TARGET = new Set(['USD', 'JPY', 'EUR', 'GBP'])

export async function GET() {
  try {
    const res = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
      next: { revalidate: 1800 },
    })
    if (!res.ok) throw new Error('calendar fetch failed')
    const data: FFEvent[] = await res.json()

    const events: EconomicEvent[] = data
      .filter((e) => TARGET.has(e.country))
      .map((e) => ({
        title: e.title ?? '',
        country: e.country,
        date: e.date ?? '',
        time: e.time ?? '',
        impact:
          e.impact === 'High' ? 'high' : e.impact === 'Medium' ? 'medium' : ('low' as const),
        forecast: e.forecast ?? '',
        previous: e.previous ?? '',
      }))

    return NextResponse.json(events)
  } catch {
    return NextResponse.json([])
  }
}
