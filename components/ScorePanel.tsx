'use client'
import { Pair, PairResult } from '@/lib/types'

const SUBREDDITS = ['Forex', 'investing', 'Economics', 'japan']

interface Props { pair: Pair; data: PairResult | undefined }

function moodColor(mood: string) {
  if (mood === 'BULLISH') return 'var(--accent)'
  if (mood === 'BEARISH') return 'var(--red)'
  return 'var(--yellow)'
}

export default function ScorePanel({ pair, data }: Props) {
  if (!data) return (
    <div className="empty-state">
      <div className="big">--</div>
      <div>取得ボタンを押してください</div>
    </div>
  )
  const color = moodColor(data.mood)
  return (
    <div>
      <div className="score-display">
        <div className="score-big" style={{ color }}>{data.score}</div>
        <div className="score-meta">
          <div className="score-label">Sentiment Score — {pair}</div>
          <div className="score-mood" style={{ color }}>{data.mood}</div>
        </div>
      </div>
      <div className="bars">
        {[
          { label: '強気', pct: data.bullish, color: 'var(--accent)' },
          { label: '弱気', pct: data.bearish, color: 'var(--red)' },
          { label: '中立', pct: data.neutral, color: 'var(--yellow)' },
        ].map(({ label, pct, color: c }) => (
          <div key={label} className="bar-row">
            <div className="bar-name">{label}</div>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%`, background: c }} /></div>
            <div className="bar-pct" style={{ color: c }}>{pct}%</div>
          </div>
        ))}
      </div>
      <div className="subreddit-section">
        <div className="sub-label">取得元 Subreddit</div>
        <div className="subreddit-tags">
          {SUBREDDITS.map((s) => <span key={s} className="subreddit-tag">r/{s}</span>)}
        </div>
      </div>
    </div>
  )
}
