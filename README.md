# A.S.OTRPGキャラクターシート MVP

TRPG『アサルト・スティール・オンライン』用の、非公式キャラクターシートです。ブラウザだけで入力・計算・保存できます。

## 使い方

- 編集モード: キャラクター、機体、武装、技巧、消耗品を入力します。
- 閲覧モード: 同じ内容をテンプレート形式で確認します。
- 下書き: 入力内容は同じブラウザ内に自動保存されます。
- 画像: 機体用・パイロット用を各1枚登録できます。閲覧モードでは「切り替え」で表裏表示します。
- 書き出し: ヘッダーの形式選択から、以下を利用できます。
  - `キャラクターHTML（閲覧・再編集）`: キャラクター情報、画像、ルールデータ、編集画面を1ファイルにまとめます。受け取った人もブラウザで開いて閲覧・再編集できます。
  - `テンプレート（.txt）`: 提出・貼り付け用のテキストです。
  - `ココフォリア用JSON（コピー）`: ココフォリアに貼り付けるデータをクリップボードへコピーします。

キャラクターHTMLを編集した後は、同じ書き出しをもう一度行って新しいHTMLを共有します。ブラウザは開いたローカルファイルを直接上書きできないためです。

## 配布用HTMLを作る

```powershell
node build-distribution.mjs
```

実行すると、次のファイルが更新されます。

- `A.S.OTRPGキャラクターシート配布版.html`: ローカル配布用の編集アプリです。DiscordにはこのHTMLだけを添付すれば使えます。
- `editable-template.html`: キャラクターHTMLの書き出しに使うテンプレートです。
- `cloudflare-pages/index.html` と `cloudflare-pages/editable-template.html`: 公開サイト用の成果物です。

## 公開サイトの更新

現在のCloudflare WorkerプロジェクトはGit連携済みです。更新時はローカルでビルドした成果物も含めて `main` へpushします。

```powershell
node build-distribution.mjs
git add app.js exporter.js media.js index.html build-distribution.mjs tests.mjs README.md editable-template.html A.S.OTRPGキャラクターシート配布版.html cloudflare-pages
git commit -m "更新内容"
git push origin main
```

push後、Cloudflareダッシュボードの `aso-character-sheet-site` プロジェクトで `デプロイ` を開き、最新の `main` ビルドが成功したことを確認します。成功すれば、公開URL [aso-character-sheet-site.alcion.workers.dev](https://aso-character-sheet-site.alcion.workers.dev/) に自動反映されます。手動アップロードは不要です。

## ルールデータの扱い

- `data.js` はルール資料と製作者の回答を元に構造化したデータです。
- メイン/サブ同一クラス、脚部制限など未確定のルールは、選択禁止にせず警告で示します。
- カスタム入力は可能ですが、自動計算に必要な数値がない場合は警告が出ます。

## 非公式について

製作者の公認および公開範囲は未確定です。共有・公開前に製作者へ確認してください。
