import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Briefcase, Building2, MapPin, Clock, Users, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SearchFilter, LoadingSpinner, EmptyState, Card, Badge } from '../../components/shared';
import { useCounties, useOpportunityCategories } from '../../hooks';
import type { Opportunity } from '../../types';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'info' | 'error' | 'default'> = {
  open: 'success',
  under_review: 'warning',
  awarded: 'info',
  closed: 'error',
  cancelled: 'error',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  under_review: 'Under Review',
  awarded: 'Awarded',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

export function OpportunitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const { counties } = useCounties();
  const { categories } = useOpportunityCategories();

  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const county = searchParams.get('county') || '';

  const countyOptions = useMemo(() => counties.map(c => ({ value: c.name, label: c.name })), [counties]);
  const categoryOptions = useMemo(() => categories.map(c => ({ value: c.name, label: c.name })), [categories]);

  useEffect(() => { fetchOpportunities(); }, [query, category, county, page]);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let request = supabase.from('opportunities').select(`*, buyer:buyers(id, company_name, buyer_type, county, logo_url, verified)`, { count: 'exact' }).in('status', ['open', 'under_review']).is('deleted_at', null).range(from, to);

      if (query) request = request.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
      if (category) request = request.eq('category', category);
      if (county) request = request.eq('county', county);

      request = request.order('featured', { ascending: false }).order('created_at', { ascending: false });

      const { data, error, count } = await request;
      if (error) throw error;

      setOpportunities(data as Opportunity[] || []);
      setTotal(count || 0);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (newQuery: string) => {
    const params = new URLSearchParams(searchParams);
    if (newQuery) params.set('q', newQuery); else params.delete('q');
    setPage(1);
    setSearchParams(params);
  };

  const handleFilter = (filters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); else params.delete(key); });
    setPage(1);
    setSearchParams(params);
  };

  const totalPages = Math.ceil(total / pageSize);
  const isDeadlinePassed = (d: string | null) => d && new Date(d) < new Date();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Market Opportunities</h1>
        <p className="text-secondary-600">Discover sourcing opportunities from verified buyers</p>
      </div>

      <SearchFilter onSearch={handleSearch} onFilter={handleFilter} placeholder="Search opportunities..." filters={[{ key: 'county', label: 'County', options: countyOptions }, { key: 'category', label: 'Category', options: categoryOptions }]} initialFilters={{ county, category }} initialSort={{ sortBy: 'created_at', sortOrder: 'desc' }} />

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : opportunities.length === 0 ? (
          <EmptyState icon={<Briefcase className="w-12 h-12" />} title="No opportunities found" description="Check back later for new market opportunities." />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((opp) => (
              <Link key={opp.id} to={`/opportunities/${opp.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {opp.featured && <Star className="w-4 h-4 text-warning-500 fill-warning-500" />}
                          <Badge variant={STATUS_COLORS[opp.status]}>{STATUS_LABELS[opp.status]}</Badge>
                        </div>
                        <h3 className="font-semibold text-secondary-900 line-clamp-2">{opp.title}</h3>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-secondary-600 mb-4">
                      <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-secondary-400" /><span className="line-clamp-1">{opp.buyer?.company_name}</span></div>
                      <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-secondary-400" /><span>{opp.category}</span></div>
                      {opp.county && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-secondary-400" /><span>{opp.county}</span></div>}
                      {opp.submission_deadline && <div className="flex items-center gap-2"><Clock className={`w-4 h-4 ${isDeadlinePassed(opp.submission_deadline) ? 'text-error-400' : 'text-secondary-400'}`} /><span className={isDeadlinePassed(opp.submission_deadline) ? 'text-error-600' : ''}>{new Date(opp.submission_deadline).toLocaleDateString()}</span></div>}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-secondary-100">
                      <span className="text-xs text-secondary-500">{new Date(opp.created_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1 text-xs text-secondary-500"><Users className="w-3 h-3" />{opp.responses_count} responses</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-2 text-sm border rounded-lg disabled:opacity-50 hover:bg-secondary-50"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm text-secondary-600">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-2 text-sm border rounded-lg disabled:opacity-50 hover:bg-secondary-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        )}
      </div>
    </div>
  );
}
