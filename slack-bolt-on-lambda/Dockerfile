FROM public.ecr.aws/lambda/nodejs:18 as builder
WORKDIR /usr/app
COPY package.json ./
RUN npm install
COPY ./src/app.ts  ./src/
RUN npm run build
    
FROM public.ecr.aws/lambda/nodejs:18
ENV WORKLOAD=lambda
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=builder /usr/app/dist/* ./
CMD ["app.handler"]