export enum ReviewStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

export interface ReviewComment {
  reviewerId: string;
  message: string;
  createdAt: string;
}

export interface Review {
  draftId: string;
  reviewerId: string;

  status: ReviewStatus;
  comments: ReviewComment[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;  // When the review was approved/rejected/cancelled
  ttl?: number;
}

export interface ListReviewsOptions {
  limit?: number;
  nextToken?: string;
  status?: ReviewStatus;
}

export interface AddCommentInput {
  draftId: string;
  reviewerId: string;
  message: string;
}

export interface ListReviewsResult {
  reviews: Review[];
  nextToken?: string;
}

export interface ReviewCounts {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
}