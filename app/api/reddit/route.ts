import { NextResponse } from 'next/server'
import { RedditPost } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

const SUBREDDITS = ['Forex', 'investing', 'Economics', 'japan']

const ENDPOINTS = [
  (sub: string) => `https://old.reddit.com/r/${sub}/hot.json?limit=15&raw_json=1`,
  (sub: string) => `https://www.reddit.com/r/${sub}/hot.json?limit=15&raw_json=1`,
]

async function fetchSubreddit(sub: string): Promise<RedditPost[]> {
  for (const makeUrl of ENDPOINTS) {
    try {
      const res = await fetch(makeUrl(sub), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
        },
        cache: 'no-store',
      })
      if (!res.ok) continue
      const text = await res.text()
      if (text.startsWith('<')) continue // HTML response = blocked
      const data = JSON.parse(text)
      const items = data?.data?.children ?? []
      if (items.length === 0) continue
      return items.map((p: { data: { title: string; score: number; url: string; created_utc: number } }) => ({
        title: p.data.title,
        subreddit: sub,
        score: p.data.score,
        url: p.data.url,
        created: p.data.created_utc,
      }))
    } catch {
      continue
    }
  }
  throw new Error(`r/${sub} all endpoints failed`)
}

// デモ用フォールバックデータ（Vercel等でRedditがブロックされた場合）
const DEMO_POSTS: RedditPost[] = [
  { title: 'USD/JPY breaking above 160 resistance — Is BOJ intervention coming?', subreddit: 'Forex', score: 142, url: '#', created: Date.now() / 1000 - 3600 },
  { title: 'FOMC minutes suggest rate cuts may be delayed further into 2026', subreddit: 'Forex', score: 89, url: '#', created: Date.now() / 1000 - 7200 },
  { title: 'EUR/USD falling on weak Eurozone PMI data', subreddit: 'Forex', score: 67, url: '#', created: Date.now() / 1000 - 5400 },
  { title: 'GBP showing strength after BOE holds rates steady', subreddit: 'Forex', score: 54, url: '#', created: Date.now() / 1000 - 9000 },
  { title: 'Is the dollar rally sustainable? Fundamentals vs technicals', subreddit: 'investing', score: 203, url: '#', created: Date.now() / 1000 - 4800 },
  { title: 'Oil prices surge on Middle East tensions — impact on JPY?', subreddit: 'investing', score: 178, url: '#', created: Date.now() / 1000 - 6000 },
  { title: 'Gold hits new ATH as safe-haven demand spikes', subreddit: 'investing', score: 312, url: '#', created: Date.now() / 1000 - 3000 },
  { title: 'Japan GDP growth beats expectations at 2.1% annualized', subreddit: 'Economics', score: 445, url: '#', created: Date.now() / 1000 - 8400 },
  { title: 'ECB signals potential rate cut at next meeting', subreddit: 'Economics', score: 289, url: '#', created: Date.now() / 1000 - 10800 },
  { title: 'US inflation data comes in hotter than expected — markets react', subreddit: 'Economics', score: 567, url: '#', created: Date.now() / 1000 - 2400 },
  { title: 'BOJ Governor hints at further tightening if wage growth continues', subreddit: 'japan', score: 234, url: '#', created: Date.now() / 1000 - 7800 },
  { title: 'Yen carry trade unwinding accelerates as rate differential narrows', subreddit: 'japan', score: 156, url: '#', created: Date.now() / 1000 - 5000 },
]

export async function GET() {
  const results = await Promise.allSettled(SUBREDDITS.map((sub) => fetchSubreddit(sub)))
  const posts: RedditPost[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') {
      posts.push(...r.value)
    }
  }
  if (posts.length === 0) {
    // Reddit blocked — return demo data with flag
    return NextResponse.json({ posts: DEMO_POSTS, demo: true })
  }
  return NextResponse.json({ posts })
}
