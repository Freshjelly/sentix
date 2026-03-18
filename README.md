# SENTIX — FX Sentiment Monitor

**Reddit × Claude AI × テクニカル指標** を組み合わせたリアルタイム為替センチメントダッシュボード。

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Claude AI](https://img.shields.io/badge/Claude-Sonnet_4.6-orange)](https://anthropic.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel)](https://sentix-steel.vercel.app/)

🔗 **Live Demo**: [https://sentix-steel.vercel.app](https://sentix-steel.vercel.app)

---

## 概要

Reddit の為替・投資コミュニティ（r/Forex, r/investing, r/Economics, r/japan）の投稿を Claude AI がリアルタイム分析し、4通貨ペアのセンチメントスコアを算出。RSI・移動平均などのテクニカル指標と経済指標カレンダーを組み合わせて、複合的な売買シグナルを生成します。

---

## 機能

### センチメント分析
- Reddit 最新投稿をリアルタイム取得（4 subreddit × 最大15件）
- Claude Sonnet が各投稿の強気/弱気/中立を判定
- USD/JPY・EUR/JPY・GBP/JPY・EUR/USD の4ペアにスコア化（0〜100）

### テクニカル指標（Yahoo Finance）
- **RSI (14期間)** — サーバーサイドで自前計算、30以下で売られすぎ / 70以上で買われすぎ
- **MA20 / MA50** — 短期・長期移動平均のクロスでトレンド方向を判定
- **現在価格** — リアルタイム更新

### 複合シグナル
センチメント × RSI × MAトレンド × 経済指標の有無を統合して 5段階で判定:

| シグナル | 条件 |
|---------|------|
| **強い買い** | RSI<30 + センチメント≥65 + 上昇トレンド + 重要指標なし |
| **買い** | RSI<40 + センチメント≥55 + 下降トレンドでない |
| **売り** | RSI>60 + センチメント≤45 + 上昇トレンドでない |
| **強い売り** | RSI>70 + センチメント≤35 + 下降トレンド + 重要指標なし |
| **様子見** | 上記以外 または 重要指標48時間以内 |

### 経済指標カレンダー
- Forex Factory API から今週の指標を取得
- USD / JPY / EUR / GBP に関連するイベントのみ表示
- 今後48時間以内に絞り込み、重要指標までのカウントダウン表示

### その他
- **リアルタイム為替レート**（open.er-api.com）
- **スコア推移グラフ**（Supabase 連携、オプション）
- **ローディングスケルトン** / **エラーバナー** / **モバイル対応**

---

## アーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│                    Next.js 14 (App Router)           │
│                                                     │
│  app/page.tsx ─── Promise.all ──┬─ /api/rates       │
│       │                         ├─ /api/technicals  │
│       │                         └─ /api/calendar    │
│       │                                             │
│       ├─ /api/reddit  ──── Reddit Public API        │
│       └─ /api/analyze ──── Anthropic Claude API     │
│                                                     │
│  External APIs (all free / no auth required):       │
│   • open.er-api.com       — 為替レート              │
│   • Yahoo Finance         — OHLC データ (RSI/MA)   │
│   • nfs.faireconomy.media — 経済指標カレンダー      │
│   • reddit.com/r/*/hot.json — Reddit 投稿           │
│                                                     │
│  Optional:                                          │
│   • Supabase              — スコア履歴保存          │
└─────────────────────────────────────────────────────┘
```

---

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 14 (App Router) |
| 言語 | TypeScript 5 |
| AI | Claude Sonnet 4.6 (Anthropic API) |
| スタイリング | CSS Variables / Space Mono / Syne |
| グラフ | Chart.js + react-chartjs-2 |
| データベース | Supabase (オプション) |
| デプロイ | Vercel |

---

## セットアップ

### 必要なもの
- Node.js 18+
- Anthropic API キー（[取得はこちら](https://console.anthropic.com/)）

### 手順

```bash
# リポジトリをクローン
git clone https://github.com/Freshjelly/sentix.git
cd sentix

# 依存パッケージをインストール
npm install

# 環境変数を設定
cp .env.local.example .env.local
# .env.local を開いて ANTHROPIC_API_KEY を入力

# 開発サーバーを起動
npm run dev
```

http://localhost:3000 をブラウザで開く。

### 環境変数

| 変数名 | 必須 | 説明 |
|-------|------|------|
| `ANTHROPIC_API_KEY` | ✅ | Anthropic API キー |
| `NEXT_PUBLIC_SUPABASE_URL` | ❌ | Supabase プロジェクト URL（トレンドグラフ用） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ❌ | Supabase 匿名キー（トレンドグラフ用） |

---

## Supabase セットアップ（オプション）

スコア推移グラフを有効にするには Supabase で以下のテーブルを作成:

```sql
-- テーブル作成
create table sentiment_history (
  id uuid default gen_random_uuid() primary key,
  pair text not null,
  score integer not null,
  bullish integer not null,
  bearish integer not null,
  neutral integer not null,
  mood text not null,
  rate numeric,
  created_at timestamptz default now()
);

-- RLS有効化
alter table sentiment_history enable row level security;

-- 読み取り: 公開（anon keyでの取得を許可）
create policy "Allow public read" on sentiment_history
  for select using (true);

-- 書き込み: 同一ペアの1分以内の連続INSERTを防止
create policy "Allow insert with rate limit" on sentiment_history
  for insert with check (
    not exists (
      select 1 from sentiment_history sh
      where sh.pair = pair
        and sh.created_at > now() - interval '1 minute'
    )
  );
```

---

## 免責事項

本ツールは学習・研究目的で作成されています。表示されるシグナルは投資判断の根拠とならず、実際の取引への使用は推奨しません。
