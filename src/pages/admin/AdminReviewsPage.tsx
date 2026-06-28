import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Check, X, Clock, Package, ArrowLeft } from 'lucide-react';
import { Card, CardContent, Badge, Button, LoadingSpinner } from '../../components/shared';
import { useReviewModeration } from '../../hooks';
import type { ReviewStatus } from '../../types';

export function AdminReviewsPage() {
  const [filter, setFilter] = useState<ReviewStatus | undefined>(undefined);
  const { reviews, loading, totalPending, moderateReview } = useReviewModeration();

  // Filter reviews based on status
  const filteredReviews = filter
    ? reviews.filter((r) => r.status === filter)
    : reviews;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="error">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  const handleModerate = async (
    reviewId: string,
    status: 'approved' | 'rejected',
    notes?: string
  ) => {
    const result = await moderateReview(reviewId, status, notes);
    if (!result.success && result.error) {
      alert(result.error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-sm text-secondary-500 hover:text-primary-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-secondary-900">Review Moderation</h1>
        <p className="text-secondary-600 mt-1">
          Approve or reject submitted reviews
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card
          className={`cursor-pointer transition-all ${!filter ? 'border-primary-500 bg-primary-50' : ''}`}
          onClick={() => setFilter(undefined)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-500">All Reviews</p>
                <p className="text-2xl font-bold text-secondary-900">{reviews.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-secondary-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${filter === 'pending' ? 'border-warning-500 bg-warning-50' : ''}`}
          onClick={() => setFilter('pending')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-500">Pending</p>
                <p className="text-2xl font-bold text-warning-600">{totalPending}</p>
              </div>
              <Clock className="w-8 h-8 text-warning-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${filter === 'approved' ? 'border-success-500 bg-success-50' : ''}`}
          onClick={() => setFilter('approved')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-500">Approved</p>
                <p className="text-2xl font-bold text-success-600">
                  {reviews.filter((r) => r.status === 'approved').length}
                </p>
              </div>
              <Check className="w-8 h-8 text-success-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-12 text-secondary-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-secondary-300" />
              <p>No reviews found</p>
            </div>
          ) : (
            <div className="divide-y divide-secondary-100">
              {filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="p-6 hover:bg-secondary-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-secondary-600">
                          {review.reviewer_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-secondary-900">{review.reviewer_name}</p>
                        <p className="text-xs text-secondary-500">
                          {formatDate(review.created_at)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(review.status)}
                  </div>

                  {/* Product Reference */}
                  {(review as any).product && (
                    <Link
                      to={`/admin/products/${(review as any).product.id}`}
                      className="inline-flex items-center gap-2 text-sm text-secondary-600 hover:text-primary-600 mb-3"
                    >
                      <Package className="w-4 h-4" />
                      {(review as any).product.name}
                    </Link>
                  )}

                  <p className="text-secondary-700 whitespace-pre-line mb-4">
                    {review.review_text}
                  </p>

                  {/* Admin Notes */}
                  {review.admin_notes && (
                    <div className="bg-secondary-100 p-3 rounded-lg mb-4">
                      <p className="text-xs text-secondary-500 mb-1">Admin Notes:</p>
                      <p className="text-sm text-secondary-700">{review.admin_notes}</p>
                    </div>
                  )}

                  {/* Moderation Actions */}
                  {review.status === 'pending' && (
                    <div className="flex gap-2 pt-3 border-t border-secondary-100">
                      <Button
                        size="sm"
                        onClick={() => handleModerate(review.id, 'approved')}
                        className="bg-success-600 hover:bg-success-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleModerate(review.id, 'rejected')}
                        className="text-error-600 border-error-300 hover:bg-error-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {/* Approval Info */}
                  {review.status === 'approved' && review.approved_at && (
                    <p className="text-xs text-secondary-400 mt-2">
                      Approved on {formatDate(review.approved_at)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
