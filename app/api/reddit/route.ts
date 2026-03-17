import { NextResponse } from 'next/server'
import { RedditPost } from '@/lib/types'

const SUBREDDITS = ['Forex', 'investing', 'Economics', 'japan']

export async function GET() {
  const posts: RedditPost[] = []
  for (const sub of SUBREDDITS) {
    try {
      const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=15`, {
        headers: { 'User-Agent': 'sentix-app/1.0' },
        next: { revalidate: 300 },
      })
      const data = await res.json()
      const items = data?.data?.children ?? []
      for (const p of items) {
        posts.push({
          title: p.data.title,
          subreddit: sub,
          score: p.data.score,
          url: p.data.url,
          created: p.data.created_utc,
        })
      }
    } catch (err) {
      console.error(`Failed r/${sub}:`, err)
    }
  }
  return NextResponse.json({ posts })
}
