// import { DynamoDBClient, DynamoDB } from "@aws-sdk/client-dynamodb";
import { AttributeValue, DynamoDB, PutItemCommandInput, QueryCommandInput, UpdateItemCommandInput } from "@aws-sdk/client-dynamodb";
import {
  // DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { Review, ReviewStatus, ListReviewsOptions, ListReviewsResult, ReviewCounts, AddCommentInput, ReviewComment } from './types';
import { ReviewStore } from './reviewStore';
import { handleDatabaseError , InvalidStateError, ResourceNotFoundError} from "../errors";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

export class DynamoDBReviewStore implements ReviewStore {
  private readonly client: DynamoDB;
  private readonly reviewsTable: string;
  private readonly reviewerIdIndex = "reviewer_id_index";

  constructor(client: DynamoDB, table: string) {
    this.client = client;
    this.reviewsTable = table;
  }

  async listTables(): Promise<string[]> {
    const result = await this.client.listTables({});
    return result.TableNames || [];
  }

  async createReview(input: Omit<Review, "createdAt" | "updatedAt" | "status">): Promise<void> {
    const now = new Date().toISOString();
    const review: Review = {
      ...input,
      status: ReviewStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    };

    const putItemInput: PutItemCommandInput = {
      TableName: this.reviewsTable,
      Item: marshall(review, {removeUndefinedValues: true}),
      ConditionExpression: "attribute_not_exists(draftId) AND attribute_not_exists(reviewerId)",
    };

    console.log("putItemInput: " + JSON.stringify(putItemInput))

    try {
      await this.client.putItem(putItemInput);
    } catch (error) {
      throw handleDatabaseError(error, "Review: createReview");
    }
  }

  async getReview(draftId: string, reviewerId: string): Promise<Review | null> {
    try {
      const input = {
        TableName: this.reviewsTable,
        Key: marshall({ draftId, reviewerId }),
      }
      console.log(input)
      const response = await this.client.getItem(input);

      if (!response.Item) {
        return null;
      }

      return unmarshall(response.Item) as Review ?? null;
    } catch (error) {
      throw handleDatabaseError(error, "Review: getReview");
    }
  }

  async updateReview(review: Partial<Review> & { draftId: string; reviewerId: string; }): Promise<Review> {
    // First check if the review exists and is in a valid state
    const existingReview = await this.getReview(review.draftId, review.reviewerId);
    if (!existingReview) {
      throw new ResourceNotFoundError(`Review does not exist for draftId: ${review.draftId} and reviewerId: ${review.reviewerId}`);
    }

    if (existingReview.status !== ReviewStatus.PENDING) {
      throw new InvalidStateError(`Review is not in a valid state for draftId: ${review.draftId} and reviewerId: ${review.reviewerId}`);
    }

    const now = new Date().toISOString();
    const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
    const expressionAttributeNames: Record<string, string> = { '#updatedAt': 'updated_at' };
    const expressionAttributeValues: Record<string, any> = { ':updatedAt': { S: now } };

    Object.entries(review).forEach(([key, value]) => {
      if (key !== 'draft_id' && key !== 'reviewer_id' && value !== undefined) {
        const attributeName = `#${key}`;
        const attributeValue = `:${key}`;
        updateExpressions.push(`${attributeName} = ${attributeValue}`);
        expressionAttributeNames[attributeName] = key;
        expressionAttributeValues[attributeValue] = marshall({ value })[`value`];
      }
    });

    const command = new UpdateCommand({
      TableName: this.reviewsTable,
      Key: { 
        draftId: review.draftId, 
        reviewerId: review.reviewerId,
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const updateItemInput: UpdateItemCommandInput = {
      TableName: this.reviewsTable,
      Key: marshall({ draftId: review.draftId, reviewerId: review.reviewerId }),
      // Key: {
      //   draft_id: { S: review.draft_id },
      //   reviewer_id: { S: review.reviewer_id }
      // },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    try {
      // const response = await this.docClient.send(command);
      // return response.Attributes as Review;
      const response = await this.client.updateItem(updateItemInput);
    
      if (!response.Attributes) {
        throw new Error('Update succeeded but no attributes returned');
      }

      return unmarshall(response.Attributes) as Review;
    } catch (error) {
      throw handleDatabaseError(error, "Review: updateReview");
    }
  }
  async listReviewsByDraft(draftId: string, options?: ListReviewsOptions): Promise<ListReviewsResult> {
    throw new Error("Method not implemented.");
  }
  async listReviewsByReviewer(reviewerId: string, options: ListReviewsOptions = {}): Promise<ListReviewsResult> {
    const { limit = 50, nextToken, status } = options;
    
    // const command = new QueryCommand({
    //   TableName: this.reviewsTable,
    //   IndexName: this.reviewerIdIndex,
    //   KeyConditionExpression: 'reviewerId = :reviewerId',
    //   ExpressionAttributeValues: {
    //     ':reviewerId': reviewerId,
    //     ...(status && { ':status': status })
    //   },
    //   ...(status && {
    //     FilterExpression: 'status = :status',
    //   }),
    //   Limit: limit,
    //   ...(nextToken && { 
    //     ExclusiveStartKey: JSON.parse(Buffer.from(nextToken, 'base64').toString()) 
    //   })
    // });

    const queryInput: QueryCommandInput = {
      TableName: this.reviewsTable,
      IndexName: this.reviewerIdIndex,
      KeyConditionExpression: 'reviewerId = :reviewerId',
      ExpressionAttributeValues: {
        ':reviewerId': { S: reviewerId },
        ...(status && { ':status': { S: status } }) // Wrap status in an AttributeValue object
      },
      ...(status && {
        FilterExpression: 'status = :status',
      }),
      Limit: limit,
        ...(nextToken && { 
        ExclusiveStartKey: JSON.parse(Buffer.from(nextToken, 'base64').toString()) 
      })
    };

    // Add pagination token if provided
    if (nextToken) {
      queryInput.ExclusiveStartKey = JSON.parse(
        Buffer.from(nextToken, 'base64').toString()
      );
    }

    try {
      // const response = await this.docClient.send(command);
      // return {
      //   reviews: response.Items as Review[] || [],
      //   ...(response.LastEvaluatedKey && {
      //     nextToken: Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString('base64')
      //   })
      // };
      const response = await this.client.query(queryInput);
      // Convert DynamoDB items to Review objects
      const reviews = response.Items ? 
        response.Items.map(item => unmarshall(item) as Review) : 
        [];

      return {
        reviews: reviews,
        ...(response.LastEvaluatedKey && {
          nextToken: Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString('base64')
        })
      };
    } catch (error) {
      throw handleDatabaseError(error, "Review: listReviewsByReviewer");
    }
  }

  async approveReview(draftId: string, reviewerId: string): Promise<Review> {
    return this.updateReview({
      draftId: draftId,
      reviewerId: reviewerId,
      status: ReviewStatus.APPROVED,
    });
  }

  async rejectReview(draftId: string, reviewerId: string): Promise<Review> {
    return this.updateReview({
      draftId: draftId,
      reviewerId: reviewerId,
      status: ReviewStatus.REJECTED,
    });
  }

  async addComment(input: AddCommentInput): Promise<Review> {
    const now = new Date().toISOString();
    const newComment: ReviewComment = {
      reviewerId: input.reviewerId,
      message: input.message,
      createdAt: now
    };

    const marshalledComment = marshall(newComment);

    const command = new UpdateCommand({
      TableName: this.reviewsTable,
      Key: {
        draftId: input.draftId,
          reviewerId: input.reviewerId
        },
        UpdateExpression: 'SET #comments = list_append(#comments, :newComment), #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#comments': 'comments',
          '#updatedAt': 'updatedAt'
        },
        ExpressionAttributeValues: {
        ':newComment': [newComment],
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    });

    const updateItemInput: UpdateItemCommandInput = {
      TableName: this.reviewsTable,
      Key: marshall({ draftId: input.draftId, reviewerId: input.reviewerId }),
      // Key: {
      //   draft_id: { S: review.draft_id },
      //   reviewer_id: { S: review.reviewer_id }
      // },
      UpdateExpression: 'SET #comments = list_append(if_not_exists(#comments, :empty_list), :newComment), #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#comments': 'comments',
        '#updatedAt': 'updated_at'
      },
      ExpressionAttributeValues: marshall({
        ':newComment': [newComment],
        ':empty_list': [],
        ':updatedAt': now
      }),
      ReturnValues: 'ALL_NEW'
    };

    try {
      const response = await this.client.updateItem(updateItemInput);

      if (!response.Attributes) {
        throw new Error('Update succeeded but no attributes returned');
      }

      return unmarshall(response.Attributes) as Review;
    } catch (error) {
      throw handleDatabaseError(error, 'Review');
    }
  }

  async getReviewCounts(draftId: string): Promise<ReviewCounts> {
    const { reviews } = await this.listReviewsByDraft(draftId);
    
    return reviews.reduce(
      (counts, review) => {
        counts.total++;
        switch (review.status) {
          case ReviewStatus.APPROVED:
            counts.approved++;
            break;
          case ReviewStatus.REJECTED:
            counts.rejected++;
            break;
          case ReviewStatus.PENDING:
            counts.pending++;
            break;
        }
        return counts;
      },
      { total: 0, approved: 0, rejected: 0, pending: 0 }
    );
  }
}
