import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!supabase) return NextResponse.json({ data: [] })

  const { searchParams } = new URL(req.url)
  const pair = searchParams.get('pair') ?? 'USD/JPY'

  const since = new Date()
  since.setDate(since.getDate() - 7)

  const { data, error } = await supabase
    .from('sentiment_history')
    .select('id, pair, score, created_at')
    .eq('pair', pair)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
