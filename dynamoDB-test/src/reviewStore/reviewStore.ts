import { Review, ListReviewsOptions, ListReviewsResult, ReviewCounts, AddCommentInput } from './types';

export interface ReviewStore {
  // Core review operations
  createReview(review: Omit<Review, 'createdAt' | 'updatedAt'>): Promise<void>;
  getReview(draftId: string, reviewerId: string): Promise<Review | null>;
  updateReview(review: Partial<Review> & { draftId: string; reviewerId: string }): Promise<Review>;
  
  // List operations
  listReviewsByDraft(draftId: string, options?: ListReviewsOptions): Promise<ListReviewsResult>;
  listReviewsByReviewer(reviewerId: string, options?: ListReviewsOptions): Promise<ListReviewsResult>;
  
  // Review status operations
  approveReview(draftId: string, reviewerId: string): Promise<Review>;
  rejectReview(draftId: string, reviewerId: string): Promise<Review>;

  addComment(input: AddCommentInput): Promise<Review>;
  
  // Analytics
  getReviewCounts(draftId: string): Promise<ReviewCounts>;
}