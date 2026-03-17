export type Sentiment = 'BULLISH' | 'BEARISH' | 'NEUTRAL'
export type Pair = 'USD/JPY' | 'EUR/JPY' | 'GBP/JPY' | 'EUR/USD'

export interface RedditPost {
  title: string
  subreddit: string
  score: number
  url: string
  created: number
}

export interface PairResult {
  score: number
  bullish: number
  bearish: number
  neutral: number
  mood: Sentiment
}

export interface PostSentiment {
  index: number
  sentiment: Sentiment
  relevance: Pair | 'GENERAL'
}

export interface AnalysisResult {
  pairs: Record<Pair, PairResult>
  posts: PostSentiment[]
}

export interface RateData {
  pair: Pair
  rate: number
  updatedAt: string
}

export interface TechnicalData {
  pair: Pair
  rsi14: number
  ma20: number
  ma50: number
  currentPrice: number
  signal: 'BUY' | 'SELL' | 'HOLD'
}

export interface EconomicEvent {
  title: string
  country: string
  date: string
  time: string
  impact: 'high' | 'medium' | 'low'
  forecast: string
  previous: string
}
