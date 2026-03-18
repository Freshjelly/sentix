import { NextRequest, NextResponse } from 'next/server'
import { RedditPost, AnalysisResult, Pair, PairResult } from '@/lib/types'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const { posts }: { posts: RedditPost[] } = await req.json()
  if (!posts || posts.length === 0) {
    return NextResponse.json({ error: 'No posts to analyze' }, { status: 400 })
  }
  const sample = posts.slice(0, 30)
  const titles = sample.map((p, i) => `${i + 1}. [r/${p.subreddit}] ${p.title}`).join('\n')

  const prompt = `以下はRedditの為替・投資関連の投稿タイトル一覧です。
各投稿のセンチメントを分析し、4通貨ペア(USD/JPY, EUR/JPY, GBP/JPY, EUR/USD)のスコアを出してください。

投稿一覧:
${titles}

以下のJSON形式のみで返してください（説明不要）:
{
  "pairs": {
    "USD/JPY": { "score": 0-100, "bullish": 整数%, "bearish": 整数%, "neutral": 整数%, "mood": "BULLISH"|"BEARISH"|"NEUTRAL" },
    "EUR/JPY": { "score": 0-100, "bullish": 整数%, "bearish": 整数%, "neutral": 整数%, "mood": "..." },
    "GBP/JPY": { "score": 0-100, "bullish": 整数%, "bearish": 整数%, "neutral": 整数%, "mood": "..." },
    "EUR/USD": { "score": 0-100, "bullish": 整数%, "bearish": 整数%, "neutral": 整数%, "mood": "..." }
  },
  "posts": [
    { "index": 番号, "sentiment": "BULLISH"|"BEARISH"|"NEUTRAL", "relevance": "USD/JPY"|"EUR/JPY"|"GBP/JPY"|"EUR/USD"|"GENERAL" }
  ]
}`

  let res: Response
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] }),
    })
  } catch {
    return NextResponse.json({ error: 'Anthropic API unreachable' }, { status: 502 })
  }

  if (!res.ok) {
    return NextResponse.json({ error: `Anthropic API error: ${res.status}` }, { status: res.status })
  }

  const data = await res.json()
  const text: string = data.content?.[0]?.text ?? '{}'
  try {
    const result: AnalysisResult = JSON.parse(text.replace(/```json|```/g, '').trim())

    if (supabase && result.pairs) {
      try {
        await Promise.all(
          (Object.entries(result.pairs) as [Pair, PairResult][]).map(([pair, d]) =>
            supabase!.from('sentiment_history').insert({
              pair,
              score: d.score,
              bullish: d.bullish,
              bearish: d.bearish,
              neutral: d.neutral,
              mood: d.mood,
            })
          )
        )
      } catch (err) {
        console.error('Supabase save error:', err)
      }
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Parse error', raw: text }, { status: 500 })
  }
}
