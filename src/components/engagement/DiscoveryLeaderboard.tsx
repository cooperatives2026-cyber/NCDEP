import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Star, TrendingUp, QrCode, MessageSquare, Heart } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, LoadingSpinner, Badge } from '../shared';
import { useDiscoveryLeaderboard } from '../../hooks';
import type { DiscoveryLeaderboardEntry } from '../../types';

interface LeaderboardTabProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  data: DiscoveryLeaderboardEntry[];
  getValue: (entry: DiscoveryLeaderboardEntry) => number | string;
  valueLabel: string;
}

function LeaderboardTab({ id, label, icon, data, getValue, valueLabel }: LeaderboardTabProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <Award className="w-10 h-10 text-secondary-300 mx-auto mb-3" />
        <p className="text-secondary-500">No data available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.slice(0, 10).map((entry, idx) => (
        <Link
          key={entry.product_id}
          to={`/products/${entry.product_id}`}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary-50 transition-colors"
        >
          <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            idx === 0 ? 'bg-warning-100 text-warning-700' :
            idx === 1 ? 'bg-secondary-200 text-secondary-700' :
            idx === 2 ? 'bg-amber-100 text-amber-700' :
            'bg-secondary-100 text-secondary-600'
          }`}>
            {idx + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-secondary-900 line-clamp-1">{entry.product_name}</p>
            <p className="text-sm text-secondary-500">{entry.cooperative_name || 'Unknown Cooperative'}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-primary-600">{getValue(entry)}</p>
            <p className="text-xs text-secondary-500">{valueLabel}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

interface DiscoveryLeaderboardProps {
  period?: 'all' | 'month' | 'quarter' | 'year';
  limit?: number;
}

export function DiscoveryLeaderboard({ period = 'all', limit = 10 }: DiscoveryLeaderboardProps) {
  const [activeTab, setActiveTab] = useState<'scans' | 'ratings' | 'reviews' | 'demand'>('demand');
  const { leaderboard, loading, error } = useDiscoveryLeaderboard(period, limit);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-error-600">
          Failed to load leaderboard
        </CardContent>
      </Card>
    );
  }

  const tabs = [
    { id: 'demand', label: 'Demand Score', data: [...leaderboard].sort((a, b) => b.demand_score - a.demand_score) },
    { id: 'scans', label: 'Most Scanned', data: [...leaderboard].sort((a, b) => b.total_scans - a.total_scans) },
    { id: 'ratings', label: 'Highest Rated', data: [...leaderboard].sort((a, b) => b.avg_rating - a.avg_rating) },
    { id: 'reviews', label: 'Most Reviewed', data: [...leaderboard].sort((a, b) => b.total_reviews - a.total_reviews) },
  ];

  const activeData = tabs.find(t => t.id === activeTab)?.data || leaderboard;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-warning-600" />
          Discovery Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tabs */}
        <div className="flex border-b border-secondary-200 mb-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-shrink-0 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'demand' && (
          <LeaderboardTab
            id="demand"
            label="Demand Score"
            icon={<TrendingUp className="w-5 h-5" />}
            data={activeData}
            getValue={(e) => e.demand_score.toFixed(0)}
            valueLabel="score"
          />
        )}

        {activeTab === 'scans' && (
          <LeaderboardTab
            id="scans"
            label="Most Scanned"
            icon={<QrCode className="w-5 h-5" />}
            data={activeData}
            getValue={(e) => e.total_scans}
            valueLabel="scans"
          />
        )}

        {activeTab === 'ratings' && (
          <LeaderboardTab
            id="ratings"
            label="Highest Rated"
            icon={<Star className="w-5 h-5" />}
            data={activeData.filter(e => e.total_ratings >= 3)}
            getValue={(e) => e.avg_rating.toFixed(1)}
            valueLabel="avg rating"
          />
        )}

        {activeTab === 'reviews' && (
          <LeaderboardTab
            id="reviews"
            label="Most Reviewed"
            icon={<MessageSquare className="w-5 h-5" />}
            data={activeData}
            getValue={(e) => e.total_reviews}
            valueLabel="reviews"
          />
        )}
      </CardContent>
    </Card>
  );
}

export function DiscoveryLeaderboardCompact() {
  const { leaderboard, loading } = useDiscoveryLeaderboard('month', 5);

  if (loading || leaderboard.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success-600" />
            Top Products This Month
          </span>
          <Link to="/leaderboard" className="text-sm text-primary-600 hover:text-primary-700">
            View All
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {leaderboard.map((entry, idx) => (
            <Link
              key={entry.product_id}
              to={`/products/${entry.product_id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary-50 transition-colors"
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                idx === 0 ? 'bg-warning-100 text-warning-700' : 'bg-secondary-100 text-secondary-600'
              }`}>
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-900 line-clamp-1">{entry.product_name}</p>
              </div>
              <Badge variant="success" size="sm">{entry.demand_score.toFixed(0)}</Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
