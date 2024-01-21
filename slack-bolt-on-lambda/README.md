
# Slack BoltをAWS Lambda (+ API GW）で動かす

Slack Botにした場合、SlackプラットフォームがクライアントとしてBot APIを叩く。
そのリクエストは複雑であり、且つトークンも含むため、Lambda Dockerの構成をローカルで再現したテストをするのは難しい。
挙動を見ると、`awsLambdaReceiver` がよしなにパス等

Appインスタンスに入れるポートは3000じゃないとだめそう？

# Deloy to AWS Lambda

$ aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin "${AWS_ACCOUNT}.dkr.ecr.ap-northeast-1.amazonaws.com"
$ docker build --platform linux/amd64 -t test:test .
$ docker tag test:test "${AWS_ACCOUNT}.dkr.ecr.ap-northeast-1.amazonaws.com/${IMAGE_NAME}:${IMAGE_TAG}"
$ docker push "${AWS_ACCOUNT}.dkr.ecr.ap-northeast-1.amazonaws.com/${IMAGE_NAME}:${IMAGE_TAG}"
$ aws lambda update-function-code --function-name ${FUNCTION_NAME} --image-uri "${AWS_ACCOUNT}.dkr.ecr.ap-northeast-1.amazonaws.com/${IMAGE_NAME}:${IMAGE_TAG}"
$ aws lambda invoke --function-name ${FUNCTION_NAME} --log-type Tail --query 'LogResult' --output text | base64 -d
$ curl "${API_GW_ENDPOINT}"

# Check Locally

<!-- https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/typescript-image.html -->
$ docker build --platform linux/amd64 -t test:test .
$ docker run --env-file .env --ENV=${ENV} --platform linux/amd64 -p 9000:8080 test:test
$ curl http://localhost:9000/2015-03-31/functions/function/invocations -d '{}'
