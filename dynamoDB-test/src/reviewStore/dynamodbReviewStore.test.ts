import { DynamoDB, PutItemCommandOutput, QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { DynamoDBReviewStore } from "./dynamodbReviewStore";
import { Review, ReviewStatus } from "./types";
import { marshall } from "@aws-sdk/util-dynamodb";
import { ResourceExistsError, DatabaseError, ResourceNotFoundError, InvalidStateError } from '../errors';
import { mock } from "node:test";

const awsSdkPromiseResponse = jest.fn().mockReturnValue(Promise.resolve(true));
jest.mock('@aws-sdk/client-dynamodb');
const mockClient = new DynamoDB() as jest.Mocked<DynamoDB>
const tableName = 'mdm-reviews'
const mockDate = '2024-01-01T00:00:00.000Z';

describe('DynamoDB', () => {
  let store: DynamoDBReviewStore;
  // let mockClient: jest.Mocked<DynamoDB>;

  beforeEach(() => {
    jest.clearAllMocks();
    store = new DynamoDBReviewStore(mockClient, tableName);
    jest.useFakeTimers();
    jest.setSystemTime(new Date(mockDate));
  })
  afterEach(() => {
    jest.useRealTimers();
  })

  it('should create a review', async () => {
    mockClient.putItem = jest.fn().mockImplementation(() => ({promise: awsSdkPromiseResponse}));
    const input: Omit<Review, "createdAt" | "updatedAt" | "status"> = {
      reviewerId: '123',
      draftId: '456',
      comments: [],
    }
    await store.createReview(input);
    const expectedArg = {
      TableName: tableName,
      Item: marshall({
        ...input,
        status: ReviewStatus.PENDING,
        createdAt: mockDate,
        updatedAt: mockDate,
      },  { removeUndefinedValues: true }),
      ConditionExpression: "attribute_not_exists(draftId) AND attribute_not_exists(reviewerId)",
    }
    expect(mockClient.putItem).toHaveBeenCalledWith(expectedArg);
  })

  it('should throw ResourceExistsError when review already exists', async () => {
    // Setup
    const mockPutItem = jest.fn().mockRejectedValue({
      name: 'ConditionalCheckFailedException',
      message: 'The conditional request failed'
    });
    mockClient.putItem = mockPutItem

    const input: Omit<Review, "createdAt" | "updatedAt" | "status"> = {
      reviewerId: '123',
      draftId: '456',
      comments: [],
    }

    await expect(store.createReview(input))
      .rejects
      .toThrow(ResourceExistsError);
    expect(mockPutItem).toHaveBeenCalled();
  });

  it('should handle unexpected errors', async () => {
    // Setup
    const mockError = new Error('Network error');
    const mockPutItem = jest.fn().mockRejectedValue(mockError);
    mockClient.putItem = mockPutItem

    const input: Omit<Review, "createdAt" | "updatedAt" | "status"> = {
      draftId: '456',
      reviewerId: '123',
      comments: []
    };

    // Act & Assert
    await expect(store.createReview(input))
      .rejects
      .toThrow(DatabaseError);
    expect(mockPutItem).toHaveBeenCalled();
  });
})

describe('DynamoDBReviewStore - updateReview', () => {
  let store: DynamoDBReviewStore;
  const mockReview: Review = {
    draftId: '456',
    reviewerId: '123',
    status: ReviewStatus.PENDING,
    comments: [],
    createdAt: mockDate,
    updatedAt: mockDate,
  }

  beforeEach(() => {
    jest.clearAllMocks();
    store = new DynamoDBReviewStore(mockClient, tableName);
    jest.useFakeTimers();
    jest.setSystemTime(new Date(mockDate));
  })

  afterEach(() => {
    jest.useRealTimers();
  })

  it('should successfully update a review', async () => {
    mockClient.getItem = jest.fn().mockResolvedValue({
      Item: marshall(mockReview)
    });

    const updatedReview = {
      ...mockReview,
      status: ReviewStatus.APPROVED,
      updatedAt: mockDate,
    }

    mockClient.updateItem = jest.fn().mockResolvedValue({Attributes: marshall(updatedReview)});

    const updateInput = {
      draftId: '456',
      reviewerId: '123',
      status: ReviewStatus.APPROVED
    }

    const result = await store.updateReview(updateInput);
    expect(mockClient.getItem).toHaveBeenCalledWith(expect.objectContaining({
      TableName: tableName,
      Key: marshall({draftId: '456', reviewerId: '123'})
    }));

    expect(mockClient.updateItem).toHaveBeenCalledWith(expect.objectContaining({
      TableName: tableName,
      Key: marshall({draftId: '456', reviewerId: '123'}),
    }));

    expect(result).toEqual(updatedReview);
  })

  it('should throw ResourceNotFoundError when review does not exist', async () => {
    mockClient.getItem = jest.fn().mockResolvedValue({});

    const updateInput = {
      draftId: '456',
      reviewerId: '123',
      status: ReviewStatus.APPROVED
    }

    await expect(store.updateReview(updateInput))
      .rejects
      .toThrow(ResourceNotFoundError);

    expect(mockClient.getItem).toHaveBeenCalled();
    expect(mockClient.updateItem).not.toHaveBeenCalled();
  })

  it('should throw InvalidStateError when review is not in a PENDING state', async () => {
    const completedReview = {
      ...mockReview,
      status: ReviewStatus.APPROVED,
    }
    mockClient.getItem = jest.fn().mockResolvedValue({
      Item: marshall(completedReview)
    });

    const updateInput = {
      draftId: '456',
      reviewerId: '123',
      status: ReviewStatus.REJECTED // or any state that's not PENDING
    }

    await expect(store.updateReview(updateInput))
      .rejects.toThrow(InvalidStateError);
    
    expect(mockClient.getItem).toHaveBeenCalled();
    expect(mockClient.updateItem).not.toHaveBeenCalled();
  })

  it('should handle unexpected errors', async () => {
    mockClient.getItem = jest.fn().mockResolvedValue({
      Item: marshall(mockReview)
    });

    const mockError = new Error('Network error');
    mockClient.updateItem = jest.fn().mockRejectedValue(mockError);

    const updateInput = {
      draftId: '456',
      reviewerId: '123',
      status: ReviewStatus.APPROVED
    }

    await expect(store.updateReview(updateInput))
      .rejects
      .toThrow(DatabaseError);

    expect(mockClient.getItem).toHaveBeenCalled();
    expect(mockClient.updateItem).toHaveBeenCalled();
  })

  it('should throw error when update succeeds but returns no attributes', async () => {
    mockClient.getItem = jest.fn().mockResolvedValue({
      Item: marshall(mockReview)
    });
    mockClient.updateItem = jest.fn().mockResolvedValue({});

    const updateInput = {
      draftId: '456',
      reviewerId: '123',
      status: ReviewStatus.APPROVED
    }

    await expect(store.updateReview(updateInput))
      .rejects
      .toThrow(DatabaseError);

    expect(mockClient.getItem).toHaveBeenCalled();
    expect(mockClient.updateItem).toHaveBeenCalled();
  })
})

describe('DynamoDBReviewStore - listReviewsByReviewer', () => {
  let store: DynamoDBReviewStore;
  const reviewerId = 'reviewer123';
  const nonReviewerId = 'nonReviewer123';

  const reviewerReviews: Review[] = [
    {
      draftId: 'draft1',
      reviewerId,
      status: ReviewStatus.PENDING,
      comments: [],
      createdAt: '2023-12-31T00:00:00.000Z',
      updatedAt: '2023-12-31T00:00:00.000Z'
    },
    {
      draftId: 'draft2',
      reviewerId,
      status: ReviewStatus.APPROVED,
      comments: [],
      createdAt: '2023-12-30T00:00:00.000Z',
      updatedAt: '2023-12-30T00:00:00.000Z'
    },
  ]
  const allReviews: Review[] = [
    ...reviewerReviews,
    {
      draftId: 'draft3',
      reviewerId: reviewerId + 'hogefuga',
      status: ReviewStatus.APPROVED,
      comments: [],
      createdAt: '2023-12-30T00:00:00.000Z',
      updatedAt: '2023-12-30T00:00:00.000Z'
    },
    {
      draftId: 'draft4',
      reviewerId: reviewerId + 'boobar',
      status: ReviewStatus.APPROVED,
      comments: [],
      createdAt: '2023-12-28T00:00:00.000Z',
      updatedAt: '2023-12-28T00:00:00.000Z'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks();
    store = new DynamoDBReviewStore(mockClient, tableName);
    jest.useFakeTimers();
    jest.setSystemTime(new Date(mockDate));
  })

  afterEach(() => {
    jest.useRealTimers();
  })

  it('should list reviews without filters', async () => {
    // Mock query to return reviews - Note that in reality, DynamoDB's KeyConditionExpression
    // would handle this filtering, but we simulate it here for clarity
    mockClient.query = jest.fn().mockResolvedValue({
      // In a real DynamoDB query, we wouldn't need to filter here as the KeyConditionExpression
      // would ensure we only get items for the specified reviewer
      Items: reviewerReviews.map(review => marshall(review))
    });

    const result = await store.listReviewsByReviewer(reviewerId);
    expect(mockClient.query).toHaveBeenCalledWith(expect.objectContaining({
      TableName: tableName,
      IndexName: 'reviewerId_index',
      KeyConditionExpression: 'reviewerId = :reviewerId',
      ExpressionAttributeValues: {
        ':reviewerId': { S: reviewerId }
      },
      Limit: 50
    }));

    expect(result.reviews).toHaveLength(reviewerReviews.length);
    expect(result).toEqual({reviews: reviewerReviews});
  })

  it('should handle pagination', async () => {
    const nextToken = Buffer.from(JSON.stringify({
      draftId: 'lastDraftId',
      reviewerId: 'lastReviewerId'
    })).toString('base64');

    mockClient.query = jest.fn().mockResolvedValue({
      Items: reviewerReviews.map(review => marshall(review)),
      LastEvaluatedKey: {
        draftId: { S: 'nextDraftId' },
        reviewerId: { S: 'nextReviewerId' }
      }
    })

    const result = await store.listReviewsByReviewer(
      reviewerId, { nextToken, limit: 2 });

    expect(mockClient.query).toHaveBeenCalledWith(expect.objectContaining({
      TableName: tableName,
      IndexName: 'reviewerId_index',
      KeyConditionExpression: 'reviewerId = :reviewerId',
      ExpressionAttributeValues: {
        ':reviewerId': { S: reviewerId }
      },
      Limit: 2,
      ExclusiveStartKey: {
        draftId: 'lastDraftId',
        reviewerId: 'lastReviewerId'
      }
    }));

    expect(result.reviews).toEqual(reviewerReviews);
    expect(result.nextToken).toBeDefined();
    const decodedToken = JSON.parse(Buffer.from(result.nextToken!, 'base64').toString());
    expect(decodedToken).toEqual({
      draftId: { S: 'nextDraftId' },
      reviewerId: { S: 'nextReviewerId' }
    });
  })
  

  it('should respect cutom limit', async () => {
    const customLimit = 2;
    mockClient.query = jest.fn().mockReturnThis();
    await store.listReviewsByReviewer(reviewerId, { limit: customLimit });
    const queryInput = mockClient.query.mock.calls[0][0] as QueryCommandInput;
    expect(queryInput.Limit).toBe(customLimit);
  })

  it('should respect default custom limit', async () => {
    mockClient.query = jest.fn().mockReturnThis();
    await store.listReviewsByReviewer(reviewerId);
    const queryInput = mockClient.query.mock.calls[0][0] as QueryCommandInput;
    expect(queryInput.Limit).toBe(50);
  })
  
  it('should handle empty results', async () => {
    mockClient.query = jest.fn().mockResolvedValue({ Items: [] });
    const result = await store.listReviewsByReviewer(reviewerId);
    expect(result.reviews).toEqual([]);
  })

  it('should handle database errors', async () => {
    const mockError = new Error('Network error');
    mockClient.query = jest.fn().mockRejectedValue(mockError);
    await expect(store.listReviewsByReviewer(reviewerId))
      .rejects
      .toThrow(DatabaseError);
    expect(mockClient.query).toHaveBeenCalled();
  })
})