import { Eye, QrCode, Star, MessageSquare, Heart, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '../shared';
import type { ProductEngagementStats, CooperativeEngagementStats } from '../../types';

interface EngagementStatsCardsProps {
  stats: ProductEngagementStats | CooperativeEngagementStats;
  loading?: boolean;
  variant?: 'product' | 'cooperative';
  className?: string;
}

export function EngagementStatsCards({
  stats,
  loading = false,
  variant = 'product',
  className = '',
}: EngagementStatsCardsProps) {
  if (loading) {
    return (
      <div className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-secondary-200 rounded w-1/2 mb-2" />
                <div className="h-8 bg-secondary-200 rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const isCooperative = variant === 'cooperative';

  const cards = [
    {
      label: 'Total Views',
      value: stats.total_views,
      icon: Eye,
      color: 'primary',
    },
    {
      label: 'QR Scans',
      value: stats.total_scans,
      icon: QrCode,
      color: 'accent',
    },
    {
      label: 'Ratings',
      value: stats.total_ratings,
      subValue: stats.avg_rating > 0 ? `${stats.avg_rating} avg` : undefined,
      icon: Star,
      color: 'warning',
    },
    {
      label: 'Reviews',
      value: stats.total_reviews,
      icon: MessageSquare,
      color: 'success',
    },
    {
      label: 'Interest Signals',
      value: stats.total_interest,
      icon: Heart,
      color: 'error',
    },
  ];

  if (isCooperative) {
    cards.splice(0, 0, {
      label: 'Total Products',
      value: (stats as CooperativeEngagementStats).total_products,
      icon: TrendingUp,
      color: 'secondary',
    });
  }

  const colorClasses: Record<string, { bg: string; text: string }> = {
    primary: { bg: 'bg-primary-100', text: 'text-primary-600' },
    accent: { bg: 'bg-accent-100', text: 'text-accent-600' },
    warning: { bg: 'bg-warning-100', text: 'text-warning-600' },
    success: { bg: 'bg-success-100', text: 'text-success-600' },
    error: { bg: 'bg-error-100', text: 'text-error-600' },
    secondary: { bg: 'bg-secondary-100', text: 'text-secondary-600' },
  };

  return (
    <div className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {cards.map((card, index) => {
        const Icon = card.icon;
        const colors = colorClasses[card.color];

        return (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-500">{card.label}</p>
                  <p className="text-2xl font-bold text-secondary-900 mt-1">
                    {card.value.toLocaleString()}
                  </p>
                  {card.subValue && (
                    <p className="text-xs text-secondary-500 mt-0.5">{card.subValue}</p>
                  )}
                </div>
                <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

interface DemandScoreCardProps {
  demandScore: number;
  loading?: boolean;
  rank?: number;
  className?: string;
}

export function DemandScoreCard({
  demandScore,
  loading = false,
  rank,
  className = '',
}: DemandScoreCardProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-secondary-200 rounded w-1/2 mb-4" />
            <div className="h-12 bg-secondary-200 rounded w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getDemandLevel = (score: number): { label: string; color: string; percentage: number } => {
    if (score >= 100) return { label: 'Exceptional', color: 'bg-success-500', percentage: 100 };
    if (score >= 50) return { label: 'High', color: 'bg-success-400', percentage: 80 };
    if (score >= 20) return { label: 'Moderate', color: 'bg-warning-400', percentage: 60 };
    if (score >= 5) return { label: 'Growing', color: 'bg-warning-300', percentage: 40 };
    return { label: 'Emerging', color: 'bg-secondary-300', percentage: 20 };
  };

  const level = getDemandLevel(demandScore);

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-secondary-900">Demand Score</h3>
          {rank !== undefined && (
            <span className="text-sm text-secondary-500">
              Rank #{rank}
            </span>
          )}
        </div>

        <div className="text-center mb-4">
          <p className="text-4xl font-bold text-secondary-900">{demandScore.toFixed(1)}</p>
          <p className="text-sm text-secondary-500 mt-1">{level.label} Demand</p>
        </div>

        <div className="w-full h-2 bg-secondary-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${level.color} rounded-full transition-all duration-500`}
            style={{ width: `${level.percentage}%` }}
          />
        </div>

        <p className="text-xs text-secondary-400 mt-3">
          Based on views, scans, ratings, reviews, and interest signals
        </p>
      </CardContent>
    </Card>
  );
}
