import React, { useState } from 'react';
import { MessageSquare, Check, X, User } from 'lucide-react';
import { Card, CardContent, Button, Badge } from '../shared';
import type { ProductReview } from '../../types';

interface ReviewListProps {
  reviews: ProductReview[];
  loading: boolean;
  totalReviews: number;
  onSubmitReview: (name: string, text: string, email?: string) => Promise<{ success: boolean; error: string | null }>;
  showModeration?: boolean;
  onModerate?: (reviewId: string, status: 'approved' | 'rejected', notes?: string) => Promise<{ success: boolean; error: string | null }>;
}

export function ReviewList({
  reviews,
  loading,
  totalReviews,
  onSubmitReview,
  showModeration = false,
  onModerate,
}: ReviewListProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !reviewText.trim()) return;

    setSubmitting(true);
    setError(null);

    const result = await onSubmitReview(name.trim(), reviewText.trim(), email.trim() || undefined);

    if (result.success) {
      setSubmitted(true);
      setName('');
      setReviewText('');
      setEmail('');
    } else {
      setError(result.error);
    }

    setSubmitting(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-secondary-600" />
          <h3 className="font-semibold text-secondary-900">
            Reviews ({totalReviews})
          </h3>
        </div>
        {!showForm && !submitted && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            Write a Review
          </Button>
        )}
      </div>

      {submitted ? (
        <Card className="mb-6 bg-success-50 border-success-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-success-600 mt-0.5" />
              <div>
                <p className="font-medium text-success-800">Review Submitted</p>
                <p className="text-sm text-success-600">
                  Thank you for your review. It will be visible after moderation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : showForm ? (
        <Card className="mb-6">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reviewer-name" className="block text-sm font-medium text-secondary-700 mb-1">
                      Your Name *
                    </label>
                    <input
                      id="reviewer-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="reviewer-email" className="block text-sm font-medium text-secondary-700 mb-1">
                      Email (optional)
                    </label>
                    <input
                      id="reviewer-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="review-text" className="block text-sm font-medium text-secondary-700 mb-1">
                    Your Review *
                  </label>
                  <textarea
                    id="review-text"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Share your experience with this product..."
                  />
                </div>

                {error && (
                  <p className="text-sm text-error-600">{error}</p>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-secondary-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-secondary-300" />
          <p>No reviews yet. Be the first to review this product.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              showModeration={showModeration}
              onModerate={onModerate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ReviewCardProps {
  review: ProductReview;
  showModeration?: boolean;
  onModerate?: (reviewId: string, status: 'approved' | 'rejected', notes?: string) => Promise<{ success: boolean; error: string | null }>;
}

function ReviewCard({ review, showModeration, onModerate }: ReviewCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleModerate = async (status: 'approved' | 'rejected') => {
    if (!onModerate) return;
    setIsSubmitting(true);
    await onModerate(review.id, status);
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-secondary-900">{review.reviewer_name}</p>
              <p className="text-xs text-secondary-500">{formatDate(review.created_at)}</p>
            </div>
          </div>

          {showModeration && (
            <Badge
              variant={review.status === 'approved' ? 'success' : review.status === 'rejected' ? 'error' : 'warning'}
            >
              {review.status}
            </Badge>
          )}
        </div>

        <p className="mt-3 text-secondary-600 whitespace-pre-line">{review.review_text}</p>

        {showModeration && review.status === 'pending' && onModerate && (
          <div className="mt-4 pt-4 border-t border-secondary-100 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleModerate('approved')}
              disabled={isSubmitting}
              className="text-success-600 border-success-300 hover:bg-success-50"
            >
              <Check className="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleModerate('rejected')}
              disabled={isSubmitting}
              className="text-error-600 border-error-300 hover:bg-error-50"
            >
              <X className="w-4 h-4 mr-1" />
              Reject
            </Button>
          </div>
        )}

        {review.admin_notes && (
          <div className="mt-3 pt-3 border-t border-secondary-100">
            <p className="text-xs text-secondary-500">
              <span className="font-medium">Admin note: </span>
              {review.admin_notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
