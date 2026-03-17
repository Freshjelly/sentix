'use client'
import { TechnicalData, Pair } from '@/lib/types'

interface Props {
  data: TechnicalData | undefined
  pair: Pair
}

function rsiColor(rsi: number): string {
  if (rsi < 30) return 'var(--accent)'
  if (rsi > 70) return 'var(--red)'
  if (rsi < 40 || rsi > 60) return 'var(--yellow)'
  return 'var(--dim)'
}

function rsiZoneLabel(rsi: number): string {
  if (rsi < 30) return '売られすぎ ← 買いゾーン'
  if (rsi > 70) return '買われすぎ ← 売りゾーン'
  if (rsi < 40) return '売られ気味'
  if (rsi > 60) return '買われ気味'
  return '中立ゾーン'
}

function formatPrice(pair: Pair, price: number): string {
  if (pair === 'EUR/USD') return price.toFixed(4)
  return price.toFixed(2)
}

// RSIゲージの30と70のラインをマークで示す
function RsiBar({ rsi }: { rsi: number }) {
  const color = rsiColor(rsi)
  return (
    <div style={{ position: 'relative' }}>
      <div className="rsi-bar-track">
        {/* 30ライン */}
        <div style={{ position: 'absolute', left: '30%', top: 0, bottom: 0, width: '1px', background: 'var(--muted)', zIndex: 1 }} />
        {/* 70ライン */}
        <div style={{ position: 'absolute', left: '70%', top: 0, bottom: 0, width: '1px', background: 'var(--muted)', zIndex: 1 }} />
        <div className="rsi-bar-fill" style={{ width: `${rsi}%`, background: color }} />
      </div>
      <div className="rsi-zones">
        <span style={{ color: 'var(--accent)' }}>0</span>
        <span>30</span>
        <span>50</span>
        <span>70</span>
        <span style={{ color: 'var(--red)' }}>100</span>
      </div>
    </div>
  )
}

export default function TechnicalPanel({ data, pair }: Props) {
  if (!data) return null

  const { rsi14, ma20, ma50, currentPrice } = data
  const color = rsiColor(rsi14)
  const uptrend = ma20 > ma50
  const trendColor = uptrend ? 'var(--accent)' : 'var(--red)'
  const trendLabel = uptrend ? '▲ 上昇トレンド' : '▼ 下降トレンド'
  const trendDetail = uptrend ? 'MA20 > MA50（短期が長期を上回る）' : 'MA20 < MA50（短期が長期を下回る）'

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', marginTop: '4px' }}>
      <div className="sub-label" style={{ marginBottom: '10px' }}>テクニカル指標</div>

      {/* RSIゲージ */}
      <div className="rsi-bar-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'baseline' }}>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--dim)' }}>RSI (14)</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '9px', color }}>{rsiZoneLabel(rsi14)}</span>
            <span style={{ fontSize: '16px', color, fontFamily: 'var(--font-display)', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{rsi14.toFixed(1)}</span>
          </div>
        </div>
        <RsiBar rsi={rsi14} />
      </div>

      {/* MAトレンド */}
      <div style={{ margin: '10px 0', padding: '8px 10px', background: 'var(--bg)', borderRadius: '2px', border: `1px solid ${trendColor}22` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-display)', fontWeight: 700, color: trendColor }}>{trendLabel}</span>
          <span style={{ fontSize: '9px', color: 'var(--dim)' }}>{trendDetail}</span>
        </div>
      </div>

      {/* 数値一覧 */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--dim)', marginBottom: '2px' }}>MA20</div>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-display)', color: uptrend ? 'var(--accent)' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{formatPrice(pair, ma20)}</div>
        </div>
        <div>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--dim)', marginBottom: '2px' }}>MA50</div>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-display)', color: !uptrend ? 'var(--red)' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{formatPrice(pair, ma50)}</div>
        </div>
        <div>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--dim)', marginBottom: '2px' }}>現在価格</div>
          <div style={{ fontSize: '11px', color: 'var(--accent)', fontFamily: 'var(--font-display)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatPrice(pair, currentPrice)}</div>
        </div>
      </div>
    </div>
  )
}
