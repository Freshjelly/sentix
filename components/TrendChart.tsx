'use client'
import { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js'
import { Pair } from '@/lib/types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

interface HistoryEntry {
  id: string
  pair: string
  score: number
  created_at: string
}

interface Props {
  pair: Pair
}

export default function TrendChart({ pair }: Props) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL

  useEffect(() => {
    if (!hasSupabase) return
    fetch(`/api/history?pair=${encodeURIComponent(pair)}`)
      .then((r) => r.json())
      .then(({ data }) => setHistory(data ?? []))
      .catch(console.error)
  }, [pair, hasSupabase])

  if (!hasSupabase || history.length === 0) return null

  const labels = history.map((h) =>
    new Date(h.created_at).toLocaleString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  )
  const scores = history.map((h) => h.score)

  const chartData = {
    labels,
    datasets: [
      {
        data: scores,
        borderColor: '#00e5a0',
        backgroundColor: 'rgba(0,229,160,0.05)',
        borderWidth: 1.5,
        pointRadius: 3,
        pointBackgroundColor: '#00e5a0',
        tension: 0.3,
        fill: true,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0e1318',
        borderColor: '#1a2230',
        borderWidth: 1,
        titleColor: '#5a7080',
        bodyColor: '#c8d8e8',
      },
    },
    scales: {
      x: {
        grid: { color: '#1a2230' },
        ticks: { color: '#5a7080', font: { size: 9 }, maxRotation: 0 },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: '#1a2230' },
        ticks: { color: '#5a7080', font: { size: 9 }, stepSize: 25 },
      },
    },
  }

  return (
    <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
      <div className="sub-label">スコア推移 (7日)</div>
      <div style={{ height: '110px' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}
