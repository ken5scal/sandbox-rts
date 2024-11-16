import { ReviewStatus } from "../reviewStore/types";

export interface Draft {
  draftId: string;
  // version: number;
  userId: string;
  content: string;
  status: DraftStatus;
  reviewerIds?: string[];        // List of assigned reviewers
  reviewCompletedBy?: string;    // ID of reviewer who completed the review
  reviewCompletedAt?: string;    // When the review was completed
  createdAt: string;
  updatedAt: string;
  ttl?: number;
}

export interface DraftWithReview extends Draft {
  reviewerIds?: string[];        // List of assigned reviewers
  reviewStatus?: ReviewStatus;   // Overall review status
  reviewCompletedBy?: string;    // ID of reviewer who completed the review
  reviewCompletedAt?: string;    // When the review was completed
}

// export interface Review {
//   draft_id: string;
//   reviewer_id: string;
//   status: ReviewStatus;
//   comments?: string;
//   created_at: string;
//   updated_at: string;
//   ttl?: number;
// }

export enum DraftStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

// export enum ReviewStatus {
//   PENDING = 'PENDING',
//   APPROVED = 'APPROVED',
//   REJECTED = 'REJECTED'
// }

export interface ListDraftsOptions {
  limit?: number;
  nextToken?: string;
  status?: DraftStatus;
}

export interface ListDraftsResult {
  drafts: Draft[];
  nextToken?: string;
}

export interface DraftStore {
  // Draft operations
  getDraft(draftId: string): Promise<Draft | null>;
  getLatestDraft(draftId: string): Promise<Draft | null>;
  createDraft(draft: Omit<Draft, 'version' | 'createdAt' | 'updatedAt'>): Promise<Draft>;
  updateDraft(draft: Partial<Draft> & { draftId: string }): Promise<Draft>;
  listDraftsByUser(userId: string, options?: ListDraftsOptions): Promise<ListDraftsResult>;
  
  // Review operations
  // getReview(draftId: string, reviewerId: string): Promise<Review | null>;
  // createReview(review: Omit<Review, 'created_at' | 'updated_at'>): Promise<Review>;
  // updateReview(review: Partial<Review> & { draft_id: string, reviewer_id: string }): Promise<Review>;
}