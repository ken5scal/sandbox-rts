import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { DraftStatus } from '../src/draftStore/draftStore';
import { ReviewStatus } from '../src/reviewStore/types';
import { ulid } from 'ulid';

const dynamoDb = new DynamoDB({
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
  region: 'ap-northeast-1',
});

const draftTableName = process.env.DRAFT_TABLE_NAME || 'mdm-drafts';
const reviewTableName = process.env.REVIEW_TABLE_NAME || 'mdm-reviews';

async function insertTestData() {
  // Create test drafts
  const draftIds = [ulid(), ulid(), ulid()];
  const userIds = ['U01', 'U02', 'U03'];
  const reviewerIds = ['R01', 'R02', 'R03'];
  
  const now = new Date().toISOString();
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const yesterDay = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Insert drafts
  const drafts = [
    {
      draftId: draftIds[0],
      userId: userIds[0],
      content: 'Draft 1 content',
      status: DraftStatus.DRAFT,
      createdAt: twoDaysAgo,
      updatedAt: twoDaysAgo,
      reviewerIds: [reviewerIds[0], reviewerIds[1]]
    },
    {
      draftId: draftIds[1],
      userId: userIds[1],
      content: 'Draft 2 content',
      status: DraftStatus.IN_REVIEW,
      createdAt: yesterDay,
      updatedAt: yesterDay,
      reviewerIds: [reviewerIds[1], reviewerIds[2]]
    },
    {
      draftId: draftIds[2],
      userId: userIds[2],
      content: 'Draft 3 content',
      status: DraftStatus.APPROVED,
      createdAt: now,
      updatedAt: now,
      reviewerIds: [reviewerIds[0], reviewerIds[2]],
      reviewCompletedBy: reviewerIds[0],
      reviewCompletedAt: now
    }
  ];

  // Insert reviews
  const reviews = [
    {
      draftId: draftIds[0],
      reviewerId: reviewerIds[0],
      status: ReviewStatus.PENDING,
      comments: [
        {
          reviewerId: reviewerIds[0],
          message: 'Initial review comment',
          createdAt: twoDaysAgo
        }
      ],
      createdAt: twoDaysAgo,
      updatedAt: twoDaysAgo
    },
    {
      draftId: draftIds[1],
      reviewerId: reviewerIds[1],
      status: ReviewStatus.PENDING,
      comments: [
        {
          reviewerId: reviewerIds[1],
          message: 'Please revise section 2',
          createdAt: yesterDay
        }
      ],
      createdAt: yesterDay,
      updatedAt: yesterDay
    },
    {
      draftId: draftIds[2],
      reviewerId: reviewerIds[0],
      status: ReviewStatus.APPROVED,
      comments: [
        {
          reviewerId: reviewerIds[0],
          message: 'Looks good!',
          createdAt: now
        }
      ],
      createdAt: now,
      updatedAt: now,
      completedAt: now
    }
  ];

  // Insert all drafts
  for (const draft of drafts) {
    try {
      await dynamoDb.putItem({
        TableName: draftTableName,
        Item: marshall(draft)
      });
      console.log(`Successfully inserted draft ${draft.draftId}`);
    } catch (error) {
      console.error(`Failed to insert draft ${draft.draftId}:`, error);
    }
  }

  // Insert all reviews
  for (const review of reviews) {
    try {
      await dynamoDb.putItem({
        TableName: reviewTableName,
        Item: marshall(review)
      });
      console.log(`Successfully inserted review for draft ${review.draftId} by reviewer ${review.reviewerId}`);
    } catch (error) {
      console.error(`Failed to insert review for draft ${review.draftId}:`, error);
    }
  }
}

// Run the insertion
insertTestData()
  .then(() => {
    console.log('Test data insertion completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to insert test data:', error);
    process.exit(1);
  });