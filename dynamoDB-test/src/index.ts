import {
  DynamoDB,
  PutItemCommandInput,
  GetItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import { config } from 'process';
import {marshall, unmarshall} from '@aws-sdk/util-dynamodb';
import { DynamoDBReviewStore } from './reviewStore/dynamodbReviewStore';
import { ReviewStatus } from './reviewStore/types';

async function listTables(dynamoDBClient: DynamoDB): Promise<string[]> {
  try {
    const result = await dynamoDBClient.listTables({});
    return result.TableNames || [];
  } catch (error) {
    console.error('Error listing tables:', error);
    throw error;
  }
}

(async () => {
  const dynamoDBClient = new DynamoDB({
    endpoint: 'http://localhost:8000',
    region: 'ap-northeast-1',
  });
  const tables = await listTables(dynamoDBClient);
  console.log('Tables in DynamoDB:', tables);

  const store = new DynamoDBReviewStore(dynamoDBClient, 'mdm-reviews');
  const foo = await store.listTables();
  console.log(foo);
  const fuga = await store.getReview('draft-123', 'reviewer-456');
  console.log(fuga);
  // await store.createReview({
  //   draftId: 'draft-123',
  //   reviewerId: '456',
  //   comments: [{
  //     reviewerId: '4562',
  //     message: 'hogefuga',
  //     createdAt: new Date().toISOString(),
  //   }],
  // });

  try {
    const hoge = await store.getReview('draft-123', '456');
    console.log(hoge);
  } catch (error) {
    console.log('error: ' + JSON.stringify(error));
  }
})();
