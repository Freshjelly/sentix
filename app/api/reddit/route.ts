import { NextResponse } from 'next/server'
import { RedditPost } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

const SUBREDDITS = ['Forex', 'investing', 'Economics', 'japan']

async function fetchSubreddit(sub: string): Promise<RedditPost[]> {
  const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=15&raw_json=1`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`r/${sub} returned ${res.status}`)
  const data = await res.json()
  const items = data?.data?.children ?? []
  return items.map((p: { data: { title: string; score: number; url: string; created_utc: number } }) => ({
    title: p.data.title,
    subreddit: sub,
    score: p.data.score,
    url: p.data.url,
    created: p.data.created_utc,
  }))
}

export async function GET() {
  const results = await Promise.allSettled(SUBREDDITS.map((sub) => fetchSubreddit(sub)))
  const posts: RedditPost[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') {
      posts.push(...r.value)
    }
  }
  if (posts.length === 0) {
    return NextResponse.json({ posts: [], error: 'all_failed' }, { status: 502 })
  }
  return NextResponse.json({ posts })
}
