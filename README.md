# image-share-app

Gyazo的な画像アップロード&共有アプリ

api Gateway+lambda を介して S3バケット上に画像を保存し、CloudFront 経由で画像にアクセスできるようにする


# セットアップ

## アップローダースタック

1. template.yaml を用いて CloudFormation でスタック作成
2. パラメータに以下を指定
  3. BasicAuthUsername: 画像アップロード時の Basic 認証時に指定するユーザーネーム
  4. ImageBucketName: 画像保存先の S3 バケット名
  5. ImagesJsonFilenamePath: 保存した画像のビュワーをホストする S3 バケット内のファイル名管理用ファイルおよびパス
  6. ViewerBucketName: 保存した画像のビュワーをホストする S3 バケット名
7. ViewerBucket 上に viewer フォルダを作成
  8. index.html の BASE_URL を作成したCloudFrontのものに変更（https://<スタック出力のCloudFrontDomain>）
  9. viewer フォルダ上に index.html ファイルを配置


# 使用方法
```
% AUTH=$(echo -n '<your Username>:<your AuthPassword>' | base64)
% IMAGE=$(base64 -i test.png)
% curl -X POST \
  -H "Authorization: Basic $AUTH" \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$IMAGE\"}" \
  <スタック出力の ApiEndpoint を指定>

{"url":"<CloudFront の 画像 URL.png>"}
```

もしくは、Mac OS, iOS のショートカットアプリなどから使用できる

- [Mac OS](https://www.icloud.com/shortcuts/e03d33432d5a432e97b38d9063327115)
    - 取得した CloudFront の URL をクリップボードにコピーする
※エンコードしたUsername, Passwordを指定する必要あり

- 保存した画像については、`<CloudFront ドメイン名>/viewer/index.html` にアクセスして確認

# 開発

Claude Codeが提供する Dev Container 環境を使う

# 例
https://d3a21s3joww9j4.cloudfront.net/viewer/index.html
