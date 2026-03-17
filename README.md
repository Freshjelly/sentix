# SENTIX — FX Sentiment Monitor

RedditのリアルタイムデータをClaude AIで感情分析する為替センチメントダッシュボード。

## セットアップ

### 1. 依存パッケージのインストール
```bash
npm install
```

### 2. APIキーの設定
```bash
cp .env.local.example .env.local
# .env.local を編集してAPIキーを入力
```

### 3. 開発サーバー起動
```bash
npm run dev
```
http://localhost:3000 で開く。

### 使い方
1. **▶ 取得** ボタンを押す
2. Reddit から最新投稿を自動取得
3. Claude AI がセンチメント分析
4. 各通貨ペアのスコアが表示

## 技術スタック
- Next.js 14 (App Router)
- Claude Sonnet (Anthropic API)
- Reddit Public API
- open.er-api.com (為替レート)
- Supabase (オプション: 過去データ保存)
- chart.js / react-chartjs-2 (トレンドグラフ)

## Supabase セットアップ（オプション）

トレンドグラフ機能を使うには Supabase プロジェクトを作成し、以下のテーブルを作成してください。

```sql
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
```

`.env.local` に以下を追加:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

未設定の場合はトレンドグラフが非表示になりますが、その他の機能は正常動作します。
