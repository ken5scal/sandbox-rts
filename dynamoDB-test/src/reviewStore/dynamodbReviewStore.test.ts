import { DynamoDB, PutItemCommandOutput } from "@aws-sdk/client-dynamodb";
import { DynamoDBReviewStore } from "./dynamodbReviewStore";
import { Review, ReviewStatus } from "./types";
import { marshall } from "@aws-sdk/util-dynamodb";
import { ResourceExistsError, DatabaseError } from '../errors';

const awsSdkPromiseResponse = jest.fn().mockReturnValue(Promise.resolve(true));
// const mockPutItem = jest.fn().mockImplementation(() => ({promise: awsSdkPromiseResponse}));
// const mockDynamoDB = {
//   putItem: mockPutItem
// } as unknown as DynamoDB;
jest.mock('@aws-sdk/client-dynamodb', () => {
  // DynamoDB: jest.fn(() => mockDynamoDB)
  return {
    DynamoDB: jest.fn(() => ({
      // putItem: mockPutItem
      // putItem: jest.fn().mockImplementation(() => ({promise: awsSdkPromiseResponse}))
    }))
  }
})

describe('DynamoDB', () => {
  let store: DynamoDBReviewStore;
  let mockClient: jest.Mocked<DynamoDB>;
  const tableName = 'mdm-reviews'
  const mockDate = '2024-01-01T00:00:00.000Z';

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = new DynamoDB() as jest.Mocked<DynamoDB>;
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
