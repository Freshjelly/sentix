'use client'
import { useState, useEffect } from 'react'
import { Pair, RedditPost, AnalysisResult, PostSentiment, PairResult, RateData, TechnicalData, EconomicEvent } from '@/lib/types'
import PairTabs from '@/components/PairTabs'
import ScorePanel from '@/components/ScorePanel'
import PostsFeed from '@/components/PostsFeed'
import TrendChart from '@/components/TrendChart'
import TechnicalPanel from '@/components/TechnicalPanel'
import CalendarPanel from '@/components/CalendarPanel'
import SignalBadge from '@/components/SignalBadge'
import { ScoreSkeleton, PostsSkeleton } from '@/components/Skeleton'
import ErrorBanner from '@/components/ErrorBanner'

function formatRate(pair: Pair, rate: number): string {
  if (pair === 'EUR/USD') return `$${rate.toFixed(4)}`
  return `¥${rate.toFixed(2)}`
}

function rateLabel(pair: Pair): string {
  if (pair.endsWith('/JPY')) return 'スコア高 = 円安方向'
  return 'スコア高 = 基軸通貨高'
}

export default function Home() {
  const [activePair, setActivePair] = useState<Pair>('USD/JPY')
  const [posts, setPosts] = useState<RedditPost[]>([])
  const [sentiments, setSentiments] = useState<PostSentiment[]>([])
  const [results, setResults] = useState<Partial<Record<Pair, PairResult>>>({})
  const [status, setStatus] = useState<'idle' | 'fetching' | 'analyzing' | 'done' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState('—')
  const [clock, setClock] = useState('')
  const [rates, setRates] = useState<RateData[]>([])
  const [rateError, setRateError] = useState(false)
  const [technicals, setTechnicals] = useState<TechnicalData[]>([])
  const [calendar, setCalendar] = useState<EconomicEvent[]>([])
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString('ja-JP')), 1000)
    return () => clearInterval(t)
  }, [])

  // Load calendar on mount (static this week)
  useEffect(() => {
    fetch('/api/calendar')
      .then((r) => r.json())
      .then((data: EconomicEvent[]) => setCalendar(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  async function run() {
    setStatus('fetching')
    setErrorMessage(null)

    // Fetch rates, technicals in parallel (non-blocking)
    Promise.all([
      fetch('/api/rates').then((r) => r.json()).catch(() => null),
      fetch('/api/technicals').then((r) => r.json()).catch(() => null),
    ]).then(([rateData, techData]) => {
      if (Array.isArray(rateData)) {
        setRates(rateData)
        setRateError(false)
      } else {
        setRateError(true)
      }
      if (Array.isArray(techData)) setTechnicals(techData)
    })

    try {
      const rRes = await fetch('/api/reddit')
      const rData = await rRes.json()
      const fetched: RedditPost[] = rData.posts ?? []
      if (fetched.length === 0) throw new Error('reddit')
      if (rData.demo) setDemoMode(true); else setDemoMode(false)
      setPosts(fetched)
      setStatus('analyzing')
      const aRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts: fetched }),
      })
      if (!aRes.ok) throw new Error('analyze')
      const analysis: AnalysisResult = await aRes.json()
      setResults(analysis.pairs ?? {})
      setSentiments(analysis.posts ?? [])
      setLastUpdate(new Date().toLocaleTimeString('ja-JP'))
      setStatus('done')
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (msg === 'reddit') {
        setErrorMessage('Reddit への接続に失敗しました')
      } else if (msg === 'analyze') {
        setErrorMessage('AI分析に失敗しました（APIキーを確認してください）')
      } else {
        setErrorMessage('エラーが発生しました')
      }
      setStatus('error')
    }
  }

  const isLoading = status === 'fetching' || status === 'analyzing'
  const statusText = { idle: '待機中', fetching: 'Reddit取得中', analyzing: '分析中', done: 'ライブ', error: 'エラー' }[status]

  const activeRate = rates.find((r) => r.pair === activePair)
  const activeTech = technicals.find((t) => t.pair === activePair)
  const activeScore = results[activePair]?.score

  return (
    <div className="app">
      <header className="header">
        <div className="logo">SENTIX <span>/ FX センチメント モニター</span></div>
        <div className="header-right">
          <SignalBadge
            pair={activePair}
            sentiment={activeScore}
            tech={activeTech}
            calendar={calendar}
          />
          <button className="btn" onClick={run} disabled={isLoading}>
            {isLoading ? '処理中...' : '▶ 取得'}
          </button>
          {status === 'done' && <button className="btn-sm" onClick={run}>↻ 更新</button>}
          <div className="live-badge">
            <div className={`live-dot ${status === 'done' ? 'active' : ''}`} />
            <span>{statusText}</span>
          </div>
          <div className="clock">{clock}</div>
        </div>
      </header>
      <div className="main">
        <div className="panel">
          <div className="panel-label">センチメント スコア</div>
          <PairTabs active={activePair} onChange={setActivePair} />
          {isLoading ? (
            <ScoreSkeleton />
          ) : (
            <ScorePanel pair={activePair} data={results[activePair]} />
          )}
          {status === 'error' && errorMessage && (
            <ErrorBanner message={errorMessage} onRetry={run} />
          )}
          <div className="rate-display">
            <div className="rate-value">
              {rateError ? '--' : activeRate ? formatRate(activePair, activeRate.rate) : '--'}
            </div>
            <div className="rate-label">{rateLabel(activePair)}</div>
          </div>
          <TrendChart pair={activePair} />
          <TechnicalPanel data={activeTech} pair={activePair} />
        </div>
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-label">
            <span>Reddit 投稿</span>
            <span className="post-count">
              {posts.length > 0 ? `${posts.length} 件` : ''}
              {demoMode && <span style={{ color: 'var(--yellow)', marginLeft: 8, fontSize: 10 }}>DEMO</span>}
            </span>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            {isLoading ? <PostsSkeleton /> : <PostsFeed posts={posts} sentiments={sentiments} />}
          </div>
          <CalendarPanel events={calendar} />
        </div>
      </div>
      <div className="status-bar">
        <div className="status-item">取得件数 <span className="status-val">{posts.length || '—'}</span></div>
        <div className="status-item">分析件数 <span className="status-val">{sentiments.length || '—'}</span></div>
        <div className="status-item">最終更新 <span className="status-val">{lastUpdate}</span></div>
        {isLoading && <div className="status-item"><div className="spinner" /> <span>{status === 'fetching' ? 'Reddit取得中...' : 'Claude分析中...'}</span></div>}
      </div>
    </div>
  )
}
