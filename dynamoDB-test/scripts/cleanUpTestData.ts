import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const config = {
  region: process.env.AWS_REGION || 'us-east-1',
  draftsTable: process.env.DRAFTS_TABLE || 'drafts',
  reviewsTable: process.env.REVIEWS_TABLE || 'reviews'
};

const client = new DynamoDBClient({ region: config.region });
const docClient = DynamoDBDocumentClient.from(client);

// Import the test data IDs
import { testDrafts, testReviews } from './insertTesData';

async function cleanupTestData() {
  try {
    // Delete drafts
    for (const draft of testDrafts) {
      await docClient.send(new DeleteCommand({
        TableName: config.draftsTable,
        Key: { draft_id: draft.draft_id }
      }));
      console.log(`Deleted draft: ${draft.draft_id}`);
    }

    // Delete reviews
    for (const review of testReviews) {
      await docClient.send(new DeleteCommand({
        TableName: config.reviewsTable,
        Key: { 
          draft_id: review.draft_id,
          reviewer_id: review.reviewer_id
        }
      }));
      console.log(`Deleted review: ${review.draft_id} - ${review.reviewer_id}`);
    }

    console.log('Test data cleanup completed!');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    throw error;
  }
}

// Run the script
cleanupTestData().catch(console.error);