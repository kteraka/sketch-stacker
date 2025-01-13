# image-share-app

Gyazo的な画像アップロード&共有アプリ

api Gateway+lambda を介して S3バケット上に画像を保存し、CloudFront 経由で画像にアクセスできるようにする


# セットアップ

1. template.yaml を用いて CloudFormation でスタック作成
2. パラメータに以下を指定
  3. BasicAuthPassword: 画像アップロード時の Basic 認証時に指定するパスワード
  4. BasicAuthUsername: 画像アップロード時の Basic 認証時に指定するユーザーネーム
  5. BucketName: 画像保存先の S3 バケット名

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
