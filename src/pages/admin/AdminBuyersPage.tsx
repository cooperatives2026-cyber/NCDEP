import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Building2, Plus, Eye, CheckCircle, XCircle, MapPin, Phone, Mail, Globe, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card, Badge, LoadingSpinner, EmptyState, Button, ConfirmDialog } from '../../components/shared';
import { useCounties, useBuyerTypes } from '../../hooks';
import type { Buyer } from '../../types';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'info' | 'error' | 'default'> = {
  pending: 'warning',
  active: 'success',
  inactive: 'default',
  suspended: 'error',
};

export function AdminBuyersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [actionBuyer, setActionBuyer] = useState<{ id: string; action: 'verify' | 'suspend' | 'delete' } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { counties } = useCounties();
  const { buyerTypes } = useBuyerTypes();

  const query = searchParams.get('q') || '';
  const buyerType = searchParams.get('type') || '';
  const county = searchParams.get('county') || '';
  const status = searchParams.get('status') || '';
  const verified = searchParams.get('verified') || '';

  const countyOptions = useMemo(() =>
    counties.map(c => ({ value: c.name, label: c.name })),
    [counties]
  );

  const buyerTypeOptions = useMemo(() =>
    buyerTypes.map(t => ({ value: t.name, label: t.name })),
    [buyerTypes]
  );

  useEffect(() => {
    fetchBuyers();
  }, [query, buyerType, county, status, verified, page]);

  const fetchBuyers = async () => {
    setLoading(true);

    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let request = supabase
        .from('buyers')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)
        .range(from, to);

      if (query) {
        request = request.or(`company_name.ilike.%${query}%,contact_name.ilike.%${query}%`);
      }

      if (buyerType) {
        request = request.eq('buyer_type', buyerType);
      }

      if (county) {
        request = request.eq('county', county);
      }

      if (status) {
        request = request.eq('status', status);
      }

      if (verified === 'true') {
        request = request.eq('verified', true);
      } else if (verified === 'false') {
        request = request.eq('verified', false);
      }

      request = request.order('created_at', { ascending: false });

      const { data, error, count } = await request;

      if (error) throw error;

      setBuyers(data as Buyer[] || []);
      setTotal(count || 0);
    } catch (err) {
      console.error('Error fetching buyers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionBuyer) return;

    setProcessing(true);

    try {
      if (actionBuyer.action === 'verify') {
        const { error } = await supabase
          .from('buyers')
          .update({ verified: true, status: 'active' })
          .eq('id', actionBuyer.id);
        if (error) throw error;
      } else if (actionBuyer.action === 'suspend') {
        const { error } = await supabase
          .from('buyers')
          .update({ status: 'suspended' })
          .eq('id', actionBuyer.id);
        if (error) throw error;
      } else if (actionBuyer.action === 'delete') {
        const { error } = await supabase
          .from('buyers')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', actionBuyer.id);
        if (error) throw error;
      }

      await fetchBuyers();
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setProcessing(false);
      setActionBuyer(null);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Manage Buyers</h1>
          <p className="text-secondary-600 mt-1">{total} buyers</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-100 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                name="search"
                defaultValue={query}
                placeholder="Search buyers..."
                className="w-full pl-4 pr-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
              />
            </div>
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
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={verified}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) {
                params.set('verified', e.target.value);
              } else {
                params.delete('verified');
              }
              setPage(1);
              setSearchParams(params);
            }}
            className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
          >
            <option value="">All</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>

          <select
            value={buyerType}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) {
                params.set('type', e.target.value);
              } else {
                params.delete('type');
              }
              setPage(1);
              setSearchParams(params);
            }}
            className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
          >
            <option value="">All Types</option>
            {buyerTypeOptions.map(opt => (
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

      {/* Buyers List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : buyers.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-12 h-12" />}
          title="No buyers found"
          description="Buyers will appear here once they register."
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-secondary-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-100">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Verified</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-100">
                {buyers.map((buyer) => (
                  <tr key={buyer.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center overflow-hidden">
                          {buyer.logo_url ? (
                            <img src={buyer.logo_url} alt={buyer.company_name} className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="w-5 h-5 text-primary-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-secondary-900">{buyer.company_name}</p>
                          {buyer.contact_name && (
                            <p className="text-xs text-secondary-500">{buyer.contact_name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                      {buyer.buyer_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                      {buyer.county || buyer.town || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={STATUS_COLORS[buyer.status]}>{buyer.status}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {buyer.verified ? (
                        <span className="inline-flex items-center gap-1 text-success-600">
                          <Shield className="w-4 h-4" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-secondary-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                      {new Date(buyer.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/buyers/${buyer.id}`} className="p-2 text-secondary-400 hover:text-primary-600">
                          <Eye className="w-4 h-4" />
                        </Link>
                        {!buyer.verified && buyer.status !== 'suspended' && (
                          <button
                            onClick={() => setActionBuyer({ id: buyer.id, action: 'verify' })}
                            className="p-2 text-secondary-400 hover:text-success-600"
                            title="Verify"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {buyer.status !== 'suspended' && (
                          <button
                            onClick={() => setActionBuyer({ id: buyer.id, action: 'suspend' })}
                            className="p-2 text-secondary-400 hover:text-warning-600"
                            title="Suspend"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setActionBuyer({ id: buyer.id, action: 'delete' })}
                          className="p-2 text-secondary-400 hover:text-error-600"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        isOpen={!!actionBuyer}
        onClose={() => setActionBuyer(null)}
        onConfirm={handleAction}
        title={
          actionBuyer?.action === 'verify' ? 'Verify Buyer' :
          actionBuyer?.action === 'suspend' ? 'Suspend Buyer' : 'Delete Buyer'
        }
        message={
          actionBuyer?.action === 'verify' ? 'Verify this buyer? They will be able to post opportunities.' :
          actionBuyer?.action === 'suspend' ? 'Suspend this buyer? They will not be able to access the platform.' :
          'Are you sure you want to delete this buyer? This action cannot be undone.'
        }
        confirmText={actionBuyer?.action === 'verify' ? 'Verify' : actionBuyer?.action === 'suspend' ? 'Suspend' : 'Delete'}
        variant={actionBuyer?.action === 'verify' ? 'success' : actionBuyer?.action === 'suspend' ? 'warning' : 'danger'}
        loading={processing}
      />
    </div>
  );
}
