# google_map_api（提出用）

Google Maps JavaScript API の `maps3d` ライブラリを使い、指定した拠点を3D地図上に表示するWebページです。
ナビゲーションボタンや地図上のマーカーをクリックすると、その拠点を中心にカメラがゆっくり一周し、右サイドバーに拠点の情報（名前・説明文・サムネイル）が表示されます。

## 動作環境

- Node.js（npmが使えること）
- Google Maps JavaScript API キー（`maps3d` ライブラリが有効なもの）

## セットアップ手順

1. このフォルダで依存パッケージをインストールする。
   ```
   npm install
   ```
2. `.env.example` を `.env` にコピーし、`API_KEY` に自分のGoogle Maps APIキーを設定する。
   ```
   copy .env.example .env
   ```
   （Macの場合は `cp .env.example .env`）
3. サーバーを起動する。
   ```
   npm start
   ```
4. ブラウザで `http://localhost:3000` を開く。

## 補足

- `html/index.html` を file:// で直接開いても動作しません（APIキーが埋め込まれず、`public/date/Locations.json` の読み込みもCORSでブロックされるため）。必ず `npm start` でサーバーを起動してからブラウザでアクセスしてください。
- `server.js` が起動時に `.env` の `API_KEY` を読み込み、`html/index.html` 内のプレースホルダー `%%GOOGLE_MAPS_API_KEY%%` に埋め込んで配信します。
- 拠点データは `public/date/Locations.json` にあります。ナビゲーションボタンとマーカーはここから自動生成されます。
