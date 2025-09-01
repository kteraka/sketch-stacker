# Development Session Notes - 2025-09-01

## 今日やったこと

### 1. Viteアプリの起動と本番CloudFront接続
- Dev Container環境でVite dev server起動 (`npm run dev -- --host`)
- 本番用ビルドとpreviewサーバー起動 (`npm run build && npm run preview -- --host`)

### 2. CORS問題に遭遇
**問題**: `localhost:4174` → CloudFrontへのアクセスでCORSエラー
```
Access to fetch at 'https://d3a21s3joww9j4.cloudfront.net/viewer/images.json' 
from origin 'http://localhost:4174' has been blocked by CORS policy
```

## CORSについて学んだこと

### Same-Origin Policy（同一生成元ポリシー）
- **オリジン = プロトコル + ドメイン + ポート**
- 異なるオリジン間のリクエストはブラウザがブロック

### なぜ今まで問題なかったのか
- **以前**: HTML/JSも画像も全て同じCloudFrontドメインから配信
  - `https://d3a21s3joww9j4.cloudfront.net/viewer/index.html`
  - `https://d3a21s3joww9j4.cloudfront.net/viewer/images.json`
  - → **同一オリジン、CORS不要**

- **今回**: アプリはlocalhost、APIはCloudFront
  - `http://localhost:4174` (アプリ)
  - `https://d3a21s3joww9j4.cloudfront.net/viewer/images.json` (API)
  - → **異なるオリジン、CORS必要**

### CORSの仕組み
1. ブラウザが**プリフライトリクエスト**送信 (`OPTIONS`)
2. サーバー（CloudFront）が**CORSヘッダー**で許可応答
3. ブラウザが本リクエストを通す

### セキュリティ上の懸念と対策
**懸念**: `localhost:*` を許可すると世界中から？
**回答**: 
- `localhost` は各人のローカルマシンを指す
- 他人がアクセスするには、アプリをクローン&起動が必要
- リポジトリ非公開なら実質的に安全
- 既に公開されている画像を見るのみ、アップロードは認証保護済み

## CloudFormation修正内容

### 追加したCORS Response Headers Policy
```yaml
CORSResponseHeadersPolicy:
  Type: AWS::CloudFront::ResponseHeadersPolicy
  Properties:
    ResponseHeadersPolicyConfig:
      CorsConfig:
        AccessControlAllowOrigins:
          Items:
            - "http://localhost:*"
            - "https://localhost:*"
            - "http://127.0.0.1:*" 
            - "https://127.0.0.1:*"
        AccessControlAllowMethods:
          Items: [GET, HEAD, OPTIONS]
        AccessControlAllowHeaders:
          Items: ["*"]
        AccessControlMaxAgeSec: 600
```

### CloudFrontにPolicy適用
```yaml
DefaultCacheBehavior:
  ResponseHeadersPolicyId: !Ref CORSResponseHeadersPolicy
```

## 学んだポイント

### 1. Dev Container環境での注意点
- `--host` フラグが必要（全ホストバインド用）
- ネットワーク制限があるため`.devcontainer/custom-firewall.sh`で特定ドメイン許可

### 2. Viteの開発vs本番の違い
- **開発モード**: プロキシが動作する
- **プレビューモード**: プロキシが効かない → 直接CloudFrontアクセス

### 3. ファイル操作のベストプラクティス
- 勝手にテンプレート修正は NG
- 変更前に確認・説明してから実行

## 次回のTODO
- [x] GitHub Pages + GitHub Actions でのデプロイ設定
- [ ] 自動デプロイワークフロー構築
- [ ] 本番環境でのCORS動作確認

## 技術スタック整理
- **フロントエンド**: React + Vite
- **バックエンド**: AWS API Gateway + Lambda
- **ストレージ**: S3
- **CDN**: CloudFront (CORS対応済み)
- **認証**: Basic Auth (Secrets Manager)
- **デプロイ予定**: GitHub Pages + GitHub Actions

## 参考リンク
- [CORS - MDN](https://developer.mozilla.org/ja/docs/Web/HTTP/CORS)
- [AWS CloudFront Response Headers Policy](https://docs.aws.amazon.com/cloudfront/latest/APIReference/API_ResponseHeadersPolicy.html)
- [Vite Config - Server Options](https://vitejs.dev/config/server-options.html)