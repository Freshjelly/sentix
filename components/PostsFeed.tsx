'use client'
import { RedditPost, PostSentiment, Sentiment } from '@/lib/types'

interface Props { posts: RedditPost[]; sentiments: PostSentiment[] }

function badgeStyle(s: Sentiment) {
  if (s === 'BULLISH') return { color: 'var(--accent)', background: 'rgba(0,229,160,0.1)' }
  if (s === 'BEARISH') return { color: 'var(--red)', background: 'rgba(255,69,96,0.1)' }
  return { color: 'var(--yellow)', background: 'rgba(255,210,0,0.1)' }
}

export default function PostsFeed({ posts, sentiments }: Props) {
  const sentMap: Record<number, PostSentiment> = {}
  sentiments.forEach((s) => { sentMap[s.index] = s })
  if (posts.length === 0) return <div className="empty-state" style={{ padding: '20px' }}>取得待ち...</div>
  return (
    <div className="posts-list">
      {posts.slice(0, 30).map((post, i) => {
        const s = sentMap[i + 1]
        const sentiment: Sentiment = s?.sentiment ?? 'NEUTRAL'
        const style = badgeStyle(sentiment)
        return (
          <div key={i} className="post-item">
            <span className="post-badge" style={style}>{{ BULLISH: '強気', BEARISH: '弱気', NEUTRAL: '中立' }[sentiment]}</span>
            <div style={{ flex: 1 }}>
              <div className="post-title">{post.title}</div>
              <div className="post-meta">r/{post.subreddit} · ↑{post.score.toLocaleString()} · {new Date(post.created * 1000).toLocaleTimeString('ja-JP')}</div>
            </div>
            {s?.relevance && s.relevance !== 'GENERAL' && <span className="post-relevance">{s.relevance}</span>}
          </div>
        )
      })}
    </div>
  )
}
