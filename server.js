// APIキーを .env から読み込み、index.html のプレースホルダーに埋め込んで配信するNode.jsサーバー
require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.error("APIキーが設定されていません。.env に API_KEY=... を設定してください（.env.example を参照）。");
    process.exit(1);
}

// html/index.html はプレースホルダーをAPIキーに置換してから返す
app.get("/", (req, res) => {
    const html = fs.readFileSync(path.join(__dirname, "html", "index.html"), "utf-8");
    res.send(html.replace("%%GOOGLE_MAPS_API_KEY%%", API_KEY));
});

// それ以外の静的ファイルは public/ 配下にまとめて公開する
// （server.js や package.json、node_modules などサーバー側のファイルはブラウザから触れないようにする）
app.use("/public", express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});
