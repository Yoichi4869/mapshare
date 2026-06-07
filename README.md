# MapShare

位置情報を共有するマップアプリケーション群のプロジェクトです。
PWA対応により、スマートフォンのホーム画面に追加してネイティブアプリのように使用できます。

## プロジェクト構成

```
mapshare/
  L index.html          ... メイン画面（トップページ）
  L firewood/           ... 薪マップ（実装済み）
  L sake/               ... 酒マップ（実装済み）
  L beer/               ... ビールマップ（実装済み）
```

## 技術スタック

| 項目 | 技術 |
|------|------|
| フロントエンド | Vanilla JavaScript (ES Modules) |
| ビルドツール | Vite (rolldown-vite) |
| 地図ライブラリ | Leaflet + MarkerCluster |
| データベース | Supabase (PostgreSQL) |
| ホスティング | Vercel |
| アイコン | Font Awesome |
| フォント | Google Fonts (Noto Sans JP) |
| PWA | Service Worker + Web App Manifest |
| 難読化 | vite-plugin-javascript-obfuscator |

## ディレクトリ構成

```
mapshare/
├── index.html                  ... メイン画面（マップ選択）
├── firewood/
│   └── index.html              ... 薪マップ画面
├── sake/
│   └── index.html              ... 酒マップ画面
├── beer/
│   └── index.html              ... ビールマップ画面
├── src/
│   ├── home.js                 ... メイン画面のJS（Service Worker登録）
│   ├── home.css                ... メイン画面のスタイルシート
│   ├── shared/
│   │   └── supabase.js         ... Supabaseクライアント共通設定
│   ├── firewood/
│   │   ├── main.js             ... 薪マップのエントリーポイント（イベント管理・UI制御）
│   │   ├── api.js              ... Supabase REST API通信
│   │   ├── map.js              ... Leaflet地図の初期化・マーカー操作
│   │   ├── utils.js            ... 共通ユーティリティ関数
│   │   ├── constants.js        ... 定数定義（マップ設定等）
│   │   └── style.css           ... 薪マップ用スタイルシート
│   ├── sake/
│   │   ├── main.js             ... 酒マップのエントリーポイント（イベント管理・UI制御）
│   │   ├── api.js              ... Supabase REST API通信
│   │   ├── map.js              ... Leaflet地図の初期化・マーカー操作
│   │   ├── utils.js            ... 共通ユーティリティ関数
│   │   ├── constants.js        ... 定数定義（マップ設定等）
│   │   └── style.css           ... 酒マップ用スタイルシート
│   └── beer/
│       ├── main.js             ... ビールマップのエントリーポイント（イベント管理・UI制御）
│       ├── api.js              ... Supabase REST API通信
│       ├── map.js              ... Leaflet地図の初期化・マーカー操作
│       ├── utils.js            ... 共通ユーティリティ関数
│       ├── constants.js        ... 定数定義（マップ設定等）
│       └── style.css           ... ビールマップ用スタイルシート
├── public/
│   ├── img/                    ... マニュアル画像
│   ├── manifest.json           ... PWAマニフェスト
│   └── service-worker.js       ... Service Worker（オフライン対応）
├── package.json                ... プロジェクト設定
├── vite.config.js              ... Viteビルド設定（マルチページ対応）
└── vercel.json                 ... Vercelデプロイ設定
```

## 開発環境のセットアップ

```bash
npm install
npm run dev
```

環境変数（`.env`）の設定が必要です。Vercelにデプロイする場合はVercelのダッシュボードで設定してください。

```
VITE_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxx
```

## ビルド

```bash
npm run build
```

---

## メイン画面（トップページ）

### 概要

MapShareのトップページ。各マップへのナビゲーションを提供する。

### 要件定義

#### 画面構成

- ヘッダー：アプリ名「MapShare」を表示
- ヒーローセクション：キャッチコピー「みんなで作る共有マップ」を表示
- マップカードグリッド：各マップへの導線をカード形式で表示
- フッター：コピーライト表示

#### 機能要件

##### マップナビゲーション

- 各マップ（薪マップ・酒マップ・ビールマップ）をカード形式で表示する
- カードをタップ/クリックすると対応するマップ画面に遷移する
- カードにはアイコン・タイトル・説明文を含める

##### PWA対応

- Service Workerの登録
- ホーム画面への追加対応
- オフライン時のフォールバック表示

#### 非機能要件

- レスポンシブデザイン（PC・タブレット・スマートフォン対応）
- モバイルファーストデザイン
- タッチ操作最適化

### 実装状況

- [x] ヘッダー表示
- [x] マップカードグリッド（3種類のマップへの導線）
- [x] レスポンシブデザイン
- [x] PWA対応（Service Worker登録）
- [ ] お問い合わせモーダルの実装

---

## 薪マップ（firewood）

キャンプユーザー同士で薪の販売場所を地図上で共有するWebアプリケーションです。

### 機能要件

##### マップ機能

- 薪の販売所をマップに表示する
- スクロールにて地図を移動できるようにする
- 地図は縮小拡大できるようにする
- ピンを用いて場所を表示する
- ポップアップ表示にて簡易情報を表示
- 詳細画面にて詳細の情報を表示
- 端末の現在地を取得できるようにすること
- 地図から座標が取得できるようにすること

#### 一覧機能

- 画面に見えている範囲を一覧表示する
- 簡易表示とする(販売所名、種類、価格)
- スクロールで複数確認できるようにする

#### 登録・編集機能

- 情報を登録できること
- 情報を編集できること
- ユーザが10回累積で通報を行うと非表示にする

##### 通知機能

- トースト通知でユーザに状態を知らせる
- 登録完了、編集完了、更新、現在地取得、座標取得、エラー表示

##### フィルター機能

- 各画面において種類をフィルター表示できるように設定を行う
- 表示する項目については各画面の項目に準拠
- フィルター位置は左上にフィルターボタンを設置
- キーワード検索も行えるように動作を設定する

##### ヘルプボタン

- マニュアルを表示する
- ユーザが開発者に向けて問い合わせができるようにする

### データモデル（firewood_locations テーブル）

| フィールド名 | 型 | 説明 | 意図 |
|------------|-----|------|------|
| id | int8 | レコードID（自動生成） | 一意にするため |
| location_name | text | 場所名 | マップの位置を知るため |
| wood_type | text | 薪の種類（針葉樹、広葉樹、ナラ、クヌギ、杉、松、ヒノキ、桜、カシ、その他） | どんな種類があるのかを知るため |
| amount | text | 単位 | 値段の元となる単位 |
| price | int4 | 価格 | 価格を参照するため |
| latitude | float8 | 緯度 | マップ反映に必要のため |
| longitude | float8 | 経度 | マップ反映に必要のため |
| notes | text | 備考 | 上記以外の情報を登録者に記載してもらうため |
| updated_at | timestamptz | 最終更新日 | 古いデータを精査するため |
| report_count | int2 | 通報回数 | 10回以上通報があれば非表示にするため |

---

## 酒マップ（sake）

日本酒好き同士で酒蔵を共有するWebアプリケーションです。

### 主な機能

- 酒蔵のマップ表示（ピン表示・クラスタリング）
- 新規登録 / 編集
- 日本酒の種類・キーワードによるフィルター検索
- 現在地取得・地図からの座標選択
- 不適切な情報の通報機能（10回以上で非表示）
- ヘルプ表示機能（操作マニュアル）
- PWA対応（Service Worker）

### データモデル（sake_locations テーブル）

| フィールド名 | 型 | 説明 |
|------------|-----|------|
| id | int8 | レコードID（自動生成） |
| location_name | text | 場所名 |
| brand_name | text | 銘柄名 |
| sake_type | text | 日本酒の種類（junmai_daiginjo / daiginjo / junmai_ginjo / ginjo / junmai / honjozo / other） |
| price | int4 | 価格 |
| latitude | float8 | 緯度 |
| longitude | float8 | 経度 |
| notes | text | 備考 |
| updated_at | timestamptz | 最終更新日 |
| report_count | int2 | 通報回数 |

---

## ビールマップ（beer）

クラフトビール好き同士で醸造所・ビアバー・専門店を共有するWebアプリケーションです。

### 主な機能

- ビール場所のマップ表示（ピン表示・クラスタリング）
- 新規登録 / 編集
- ビールスタイル・キーワードによるフィルター検索
- 現在地取得・地図からの座標選択
- 公式サイトリンク対応
- 不適切な情報の通報機能（20回以上で非表示）
- ヘルプ表示機能（操作マニュアル）
- PWA対応（Service Worker）

### データモデル（beer_locations テーブル）

| フィールド名 | 型 | 説明 |
|------------|-----|------|
| id | int8 | レコードID（自動生成） |
| location_name | text | 場所名 |
| place_type | text | 種別（brewery: 醸造所 / bar: ビアバー / shop: 専門店） |
| beer_type | text | ビールスタイル（ipa / stout / lager / wheat / pale_ale / porter / sour / other） |
| price | int4 | 価格 |
| latitude | float8 | 緯度 |
| longitude | float8 | 経度 |
| notes | text | 備考 |
| website | text | 公式サイトURL |
| updated_at | timestamptz | 最終更新日 |
| report_count | int2 | 通報回数 |

---

## DB構成

| テーブル名 | 説明 |
|------------|------|
| firewood_locations | 薪マップ用テーブル |
| sake_locations | 日本酒マップ用テーブル |
| beer_locations | ビールマップ用テーブル |
| contacts | お問い合わせ用テーブル |
| keepalive | Supabaseを一時停止にさせないようにするテーブル |

## 今後の展開予定

### タスク一覧

- [x] メイン画面の作成（mapshare トップページ）
- [x] 薪マップの画面作成
- [x] 酒マップの画面作成
- [x] ビールマップの画面作成
- [x] DB構築（3画面分）
- [ ] メイン画面にお問い合わせ機能を追加
- [ ] マニュアル作成

### データ管理

- Supabase を使用したDB管理
- GitHub によるソース管理
