import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SENTIX — FX Sentiment Monitor',
  description: 'Reddit-powered forex sentiment analysis',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
