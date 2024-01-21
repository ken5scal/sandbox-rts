
# Deloy to AWS Lambda

$ aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin "${AWS_ACCOUNT}.dkr.ecr.ap-northeast-1.amazonaws.com"
$ docker build --platform linux/amd64 -t test:test .
$ docker tag test:test "${AWS_ACCOUNT}.dkr.ecr.ap-northeast-1.amazonaws.com/${IMAGE_NAME}:${IMAGE_TAG}"
$ docker push "${AWS_ACCOUNT}.dkr.ecr.ap-northeast-1.amazonaws.com/${IMAGE_NAME}:${IMAGE_TAG}"
$ # Lambda で紐付けイメージを変更
$ aws lambda invoke --function-name ${FUNCTION_NAME} --log-type Tail --query 'LogResult' --output text | base64 -d
$ curl "${API_GW_ENDPOINT}"