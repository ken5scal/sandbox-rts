import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { ulid } from 'ulid';
// import {marshall, unmarshall} from '@aws-sdk/util-dynamodb';
import { DraftStatus } from "./draftStore";
import { handleDatabaseError } from "../errors";

export interface Draft {
  draftId: string;
  userId: string;
  content: string;
  status: DraftStatus;
  createdAt: string;
  updatedAt: string;
  ttl?: number;
}

export interface ListDraftsOptions {
  userId?: string;
  status?: DraftStatus;
  limit?: number;
  nextToken?: string;
}

export interface ListDraftsResult {
  drafts: Draft[];
  nextToken?: string;
}

export class DynamoDBDraftStore {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly draftsTable: string;
  private readonly userIdIndex = "user_id_index";

  constructor(region: string = 'ap-northeast-1', draftsTable: string) {
    const client = new DynamoDBClient({ region });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.draftsTable = draftsTable;
  }

  async getDraft(draftId: string): Promise<Draft | null> {
    const cmd = new GetCommand({
      TableName: this.draftsTable,
      Key: {draft_id: draftId}
    });

    const response = await this.docClient.send(cmd);
    return response.Item as Draft ?? null;
  }

  async createDraft(input: Omit<Draft, 'createdAt' | 'updatedAt'>): Promise<Draft> {
    const now = new Date().toISOString();
    const draft: Draft = {
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    const cmd = new PutCommand({
      TableName: this.draftsTable,
      // Item: marshall(draft),
      Item: draft,
      ConditionExpression: 'attribute_not_exists(draft_id)',
    });

    try {
      await this.docClient.send(cmd);
      return draft;
    } catch (error) {
      throw handleDatabaseError(error, "Draft: createDraft");
    }
  }

  async listDrafts(options: ListDraftsOptions = {}): Promise<ListDraftsResult> {
    const { userId, status, limit = 50, nextToken } = options;

    if (userId) {
      return this.listDraftsByUser(userId, { limit, nextToken, status });
    }

    // Scan for listing all drafts
    const cmd = new ScanCommand({
      TableName: this.draftsTable,
      ...(status && {
        FilterExpression: "#status = :status",
        ExpressionAttributeValues: {":status": status},
        ExpressionAttributeNames: {"#status": "status"}
      }),
      Limit: limit,
      ...(nextToken && {
        ExclusiveStartKey: JSON.parse(Buffer.from(nextToken, 'base64').toString()) 
      })
    });

    try {
      const response = await this.docClient.send(cmd);
      // const hoge = unmarshall({data: response.Items});
      const drafts = (response.Items as Draft[] || [])
        .sort((a,b) => b.createdAt.localeCompare(a.createdAt));
      return {
        drafts,
        ...(response.LastEvaluatedKey && {
          nextToken: Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString('base64')
        })
      }
    } catch (error) {
      throw handleDatabaseError(error, "Draft: listDrafts");
    }
  }
  
  private async listDraftsByUser(
    userId: string, 
    options: Omit<ListDraftsOptions, 'userId'>
  ): Promise<ListDraftsResult> {
    const { limit = 50, nextToken, status } = options;

    let filterExpression;
    let expressionAttributeValues: Record<string, any> = {
      ":userId": userId
    };
    let expressionAttributeNames = {}


    if (status) {
      filterExpression = "#status = :status";
      expressionAttributeValues[":status"] = status;
      expressionAttributeNames = {"#status": "status"};
    }

    const cmd = new QueryCommand({
      TableName: this.draftsTable,
      IndexName: this.userIdIndex,
      KeyConditionExpression: "user_id = :userId",
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ...(Object.keys(expressionAttributeNames).length > 0 && {
        ExpressionAttributeNames: expressionAttributeNames
      }),
      Limit: limit,
      ...(nextToken && {
        ExclusiveStartKey: JSON.parse(Buffer.from(nextToken, 'base64').toString()) 
      })
    });

    try {
      const response = await this.docClient.send(cmd);
      return {
        drafts: (response.Items as Draft[] || [])
          .sort((a,b) => b.createdAt.localeCompare(a.createdAt)),
        ...(response.LastEvaluatedKey && {
          nextToken: Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString('base64')
        })
      }
    } catch (error) {
      throw handleDatabaseError(error, "Draft: listDraftsByUser");
    }
  }
}
