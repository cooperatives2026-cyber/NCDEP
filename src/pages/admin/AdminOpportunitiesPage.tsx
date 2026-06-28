import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Briefcase, Plus, Eye, Star, Users, MapPin, Calendar, Building2, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card, Badge, LoadingSpinner, EmptyState, Button, ConfirmDialog } from '../../components/shared';
import { useCounties, useOpportunityCategories, useBuyerTypes } from '../../hooks';
import type { Opportunity } from '../../types';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'info' | 'error' | 'default'> = {
  draft: 'default',
  open: 'success',
  under_review: 'warning',
  awarded: 'info',
  closed: 'error',
  cancelled: 'error',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  open: 'Open',
  under_review: 'Under Review',
  awarded: 'Awarded',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

export function AdminOpportunitiesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [actionId, setActionId] = useState<{ id: string; action: 'feature' | 'delete' } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { counties } = useCounties();
  const { categories } = useOpportunityCategories();
  const { buyerTypes } = useBuyerTypes();

  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const county = searchParams.get('county') || '';
  const status = searchParams.get('status') || '';

  const countyOptions = useMemo(() =>
    counties.map(c => ({ value: c.name, label: c.name })),
    [counties]
  );

  const categoryOptions = useMemo(() =>
    categories.map(c => ({ value: c.name, label: c.name })),
    [categories]
  );

  useEffect(() => {
    fetchOpportunities();
  }, [query, category, county, status, page]);

  const fetchOpportunities = async () => {
    setLoading(true);

    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let request = supabase
        .from('opportunities')
        .select(`
          *,
          buyer:buyers(id, company_name, buyer_type, county, logo_url, verified)
        `, { count: 'exact' })
        .is('deleted_at', null)
        .range(from, to);

      if (query) {
        request = request.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
      }

      if (category) {
        request = request.eq('category', category);
      }

      if (county) {
        request = request.eq('county', county);
      }

      if (status) {
        request = request.eq('status', status);
      }

      request = request.order('created_at', { ascending: false });

      const { data, error, count } = await request;

      if (error) throw error;

      setOpportunities(data as Opportunity[] || []);
      setTotal(count || 0);
    } catch (err) {
      console.error('Error fetching opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionId) return;

    setProcessing(true);

    try {
      if (actionId.action === 'feature') {
        const opp = opportunities.find(o => o.id === actionId.id);
        const { error } = await supabase
          .from('opportunities')
          .update({ featured: !opp?.featured })
          .eq('id', actionId.id);
        if (error) throw error;
      } else if (actionId.action === 'delete') {
        const { error } = await supabase
          .from('opportunities')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', actionId.id);
        if (error) throw error;
      }

      await fetchOpportunities();
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setProcessing(false);
      setActionId(null);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSearch = formData.get('search') as string;

    const params = new URLSearchParams(searchParams);
    if (newSearch) {
      params.set('q', newSearch);
    } else {
      params.delete('q');
    }
    setPage(1);
    setSearchParams(params);
  };

  const totalPages = Math.ceil(total / pageSize);
  const isDeadlinePassed = (deadline: string | null) => deadline && new Date(deadline) < new Date();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Manage Opportunities</h1>
          <p className="text-secondary-600 mt-1">{total} opportunities</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-100 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <input
              type="text"
              name="search"
              defaultValue={query}
              placeholder="Search opportunities..."
              className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
            />
          </form>

          <select
            value={status}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) {
                params.set('status', e.target.value);
              } else {
                params.delete('status');
              }
              setPage(1);
              setSearchParams(params);
            }}
            className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="awarded">Awarded</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={category}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) {
                params.set('category', e.target.value);
              } else {
                params.delete('category');
              }
              setPage(1);
              setSearchParams(params);
            }}
            className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
          >
            <option value="">All Categories</option>
            {categoryOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={county}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) {
                params.set('county', e.target.value);
              } else {
                params.delete('county');
              }
              setPage(1);
              setSearchParams(params);
            }}
            className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
          >
            <option value="">All Counties</option>
            {countyOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Opportunities List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : opportunities.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-12 h-12" />}
          title="No opportunities found"
          description="Opportunities will appear here once buyers create them."
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opp) => (
            <Card key={opp.id} className="overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {opp.featured && (
                        <Star className="w-4 h-4 text-warning-500 fill-warning-500" />
                      )}
                      <Badge variant={STATUS_COLORS[opp.status]}>{STATUS_LABELS[opp.status]}</Badge>
                    </div>
                    <h3 className="font-semibold text-secondary-900 line-clamp-2">{opp.title}</h3>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-secondary-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-secondary-400" />
                    <span className="line-clamp-1">{opp.buyer?.company_name || 'Unknown Buyer'}</span>
                    {opp.buyer?.verified && (
                      <svg className="w-3.5 h-3.5 text-info-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 00-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 00-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 00-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.4 5.492a.75.75 0 00-1.061-1.061l-3.5 3.5-1.5-1.5a.75.75 0 10-1.06 1.06l2.03 2.03 4.091-4.091z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-secondary-400" />
                    <span>{opp.category}</span>
                  </div>
                  {opp.county && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-secondary-400" />
                      <span>{opp.county}</span>
                    </div>
                  )}
                  {opp.submission_deadline && (
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${isDeadlinePassed(opp.submission_deadline) ? 'text-error-400' : 'text-secondary-400'}`} />
                      <span className={isDeadlinePassed(opp.submission_deadline) ? 'text-error-600' : ''}>
                        Deadline: {new Date(opp.submission_deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-secondary-100">
                  <div className="flex items-center gap-2 text-sm text-secondary-500">
                    <Users className="w-4 h-4" />
                    <span>{opp.responses_count} responses</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Link
                      to={`/opportunities/${opp.id}`}
                      className="p-2 text-secondary-400 hover:text-primary-600 rounded"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/admin/opportunities/${opp.id}`}
                      className="p-2 text-secondary-400 hover:text-primary-600 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => setActionId({ id: opp.id, action: 'feature' })}
                      className={`p-2 rounded ${opp.featured ? 'text-warning-500' : 'text-secondary-400 hover:text-warning-500'}`}
                    >
                      <Star className={`w-4 h-4 ${opp.featured ? 'fill-warning-500' : ''}`} />
                    </button>
                    <button
                      onClick={() => setActionId({ id: opp.id, action: 'delete' })}
                      className="p-2 text-secondary-400 hover:text-error-600 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="text-sm text-secondary-600">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next
          </Button>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!actionId}
        onClose={() => setActionId(null)}
        onConfirm={handleAction}
        title={actionId?.action === 'feature' ? 'Toggle Featured' : 'Delete Opportunity'}
        message={
          actionId?.action === 'feature'
            ? 'Toggle featured status for this opportunity?'
            : 'Are you sure you want to delete this opportunity? This action cannot be undone.'
        }
        confirmText={actionId?.action === 'feature' ? 'Toggle' : 'Delete'}
        variant={actionId?.action === 'feature' ? 'success' : 'danger'}
        loading={processing}
      />
    </div>
  );
}
