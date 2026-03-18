import { NextResponse } from 'next/server'
import { RedditPost } from '@/lib/types'

export const dynamic = 'force-dynamic'

const SUBREDDITS = ['Forex', 'investing', 'Economics', 'japan']
const UA = 'Mozilla/5.0 (compatible; sentix/1.0; +https://sentix-steel.vercel.app)'

async function fetchSubreddit(sub: string): Promise<RedditPost[]> {
  const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=15&raw_json=1`, {
    headers: { 'User-Agent': UA },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`r/${sub} returned ${res.status}`)
  const text = await res.text()
  const data = JSON.parse(text)
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
  const results = await Promise.allSettled(SUBREDDITS.map(fetchSubreddit))
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
