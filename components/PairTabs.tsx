'use client'
import { Pair } from '@/lib/types'

const PAIRS: Pair[] = ['USD/JPY', 'EUR/JPY', 'GBP/JPY', 'EUR/USD']

interface Props { active: Pair; onChange: (pair: Pair) => void }

export default function PairTabs({ active, onChange }: Props) {
  return (
    <div className="pair-tabs">
      {PAIRS.map((p) => (
        <button key={p} className={`pair-tab ${p === active ? 'active' : ''}`} onClick={() => onChange(p)}>{p}</button>
      ))}
    </div>
  )
}
