import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '../shared';

interface InterestButtonProps {
  hasInterest: boolean;
  totalInterest: number;
  onToggle: () => Promise<{ success: boolean; error: string | null }>;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export function InterestButton({
  hasInterest,
  totalInterest,
  onToggle,
  loading = false,
  size = 'md',
  showCount = true,
  className = '',
}: InterestButtonProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleClick = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await onToggle();
    setIsSubmitting(false);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant={hasInterest ? 'primary' : 'outline'}
        size={size}
        onClick={handleClick}
        disabled={loading || isSubmitting}
        className={hasInterest ? 'bg-error-500 hover:bg-error-600 border-error-500' : ''}
      >
        <Heart
          className={`${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} ${
            hasInterest ? 'fill-white' : ''
          }`}
        />
        <span>{hasInterest ? 'Interested' : 'Show Interest'}</span>
      </Button>
      {showCount && (
        <span className="text-sm text-secondary-500">
          {totalInterest} interest{totalInterest !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
