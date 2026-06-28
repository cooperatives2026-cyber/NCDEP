import React from 'react';
import { Star } from 'lucide-react';

interface RatingDisplayProps {
  avgRating: number;
  totalRatings: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export function RatingDisplay({
  avgRating,
  totalRatings,
  size = 'md',
  showCount = true,
  className = '',
}: RatingDisplayProps) {
  const starSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  const textSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.round(avgRating);
          const partial = !filled && star === Math.ceil(avgRating);
          const fillPercentage = partial ? (avgRating % 1) * 100 : 0;

          return (
            <div key={star} className="relative">
              <Star
                className={`${starSize} ${
                  filled ? 'text-warning-400 fill-warning-400' : 'text-secondary-200'
                }`}
              />
              {partial && fillPercentage > 0 && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fillPercentage}%` }}
                >
                  <Star className={`${starSize} text-warning-400 fill-warning-400`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <span className={`font-semibold text-secondary-900 ${textSize}`}>
        {avgRating.toFixed(1)}
      </span>
      {showCount && (
        <span className={`text-secondary-500 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          ({totalRatings} rating{totalRatings !== 1 ? 's' : ''})
        </span>
      )}
    </div>
  );
}

interface RatingInputProps {
  currentRating: number;
  onRate: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function RatingInput({
  currentRating,
  onRate,
  size = 'md',
  disabled = false,
  className = '',
}: RatingInputProps) {
  const starSize = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  const [hoverRating, setHoverRating] = React.useState(0);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onRate(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className={`transition-colors ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <Star
            className={`${starSize} transition-colors ${
              (hoverRating || currentRating) >= star
                ? 'text-warning-400 fill-warning-400'
                : 'text-secondary-300 hover:text-warning-300'
            } ${disabled ? 'opacity-50' : ''}`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-secondary-600">
        {currentRating > 0 ? `${currentRating} star${currentRating > 1 ? 's' : ''}` : 'Rate this product'}
      </span>
    </div>
  );
}

interface RatingDistributionProps {
  distribution: { rating: number; count: number }[];
  totalRatings: number;
  className?: string;
}

export function RatingDistribution({
  distribution,
  totalRatings,
  className = '',
}: RatingDistributionProps) {
  if (totalRatings === 0) {
    return (
      <p className={`text-sm text-secondary-500 ${className}`}>No ratings yet</p>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {distribution.map(({ rating, count }) => {
        const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;

        return (
          <div key={rating} className="flex items-center gap-2">
            <span className="w-3 text-sm text-secondary-600">{rating}</span>
            <Star className="w-3 h-3 text-secondary-400" />
            <div className="flex-1 h-2 bg-secondary-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-warning-400 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="w-8 text-xs text-secondary-500 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
