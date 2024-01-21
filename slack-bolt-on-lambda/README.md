
# Slack Bolt on Lambda

## Slack BoltをAWS Lambda (+ API GW）で動かす際のつらみ

Slackプラットフォームがクライアントとして、登録したSlackアプリのAPIを叩く。

そのリクエストは複雑であり、且つトークンも含むため、CLI等から自前のリクエストを構成・送信することは難しい。これは、Slackアプリの稼働環境（※）がどのようなものでも変わらない。

※ローカル、Docker、Lambda。ただしServerless FWや、Slack Platformではどうかわからない

また、Slack Appインスタンスを初期化する際はポートを指定せず、
`app.start()` する際に指定したほうが良さそう。
理由は、稼働構成を複数パターン（※）とする場合、コンフリクトする可能性があるためである。

※ ローカルではサーバーとして、それ以外はサーバーレスみたいなものを指す

## Slack Boltで `awsLambdaReceiver` を使うと嬉しいこと

挙動を見ると、`awsLambdaReceiver` が、よしなにパス含めハンドリングしてくれるっぽい。
例えばEvent SubscriptionsやSlash Commands等では、パス末尾 `/slash/events`のエンドポイントへのリクエストを
ハンドリングする必要があるのだが、そこは `awsLambdaReceiver` が受け持ってくれる。
そのため、Lambda Functionが発行したURLか、Lambdaに紐づいたAPI Gatewayのエンドポイントを、
[Slackアプリ設定画面](https://api.slack.com/apps)のRequest先URLとして登録すればよい。

## Deloy to AWS Lambda

```bash
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin "${AWS_ACCOUNT}.dkr.ecr.ap-northeast-1.amazonaws.com"
docker build --platform linux/amd64 -t test:test .
docker tag test:test "${AWS_ACCOUNT}.dkr.ecr.ap-northeast-1.amazonaws.com/${IMAGE_NAME}:${IMAGE_TAG}"
docker push "${AWS_ACCOUNT}.dkr.ecr.ap-northeast-1.amazonaws.com/${IMAGE_NAME}:${IMAGE_TAG}"
aws lambda update-function-code --function-name ${FUNCTION_NAME} --image-uri "${AWS_ACCOUNT}.dkr.ecr.ap-northeast-1.amazonaws.com/${IMAGE_NAME}:${IMAGE_TAG}"
``````
