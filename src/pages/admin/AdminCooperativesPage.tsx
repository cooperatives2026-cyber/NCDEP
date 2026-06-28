import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Plus, Edit, Eye, Search, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card, Badge, LoadingSpinner, EmptyState, Button, ConfirmDialog } from '../../components/shared';
import { useCounties } from '../../hooks';
import type { Cooperative } from '../../types';

interface CooperativeWithOwner extends Cooperative {
  owner_email?: string;
  product_count?: number;
}

export function AdminCooperativesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cooperatives, setCooperatives] = useState<CooperativeWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggleId, setToggleId] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  const { counties } = useCounties();

  const search = searchParams.get('q') || '';
  const status = searchParams.get('status') || '';
  const county = searchParams.get('county') || '';

  const countyOptions = useMemo(() =>
    counties.map(c => ({ value: c.name, label: c.name })),
    [counties]
  );

  useEffect(() => {
    fetchCooperatives();
  }, [search, status, county]);

  const fetchCooperatives = async () => {
    setLoading(true);

    try {
      let query = supabase
        .from('cooperatives')
        .select(`
          *,
          users!cooperatives_user_id_fkey (email)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (county) {
        query = query.eq('county', county);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get product counts
      const coopIds = (data || []).map((c: any) => c.id);
      const { data: productCounts } = await supabase
        .from('products')
        .select('cooperative_id')
        .in('cooperative_id', coopIds)
        .is('deleted_at', null);

      const countMap: Record<string, number> = {};
      (productCounts || []).forEach((p: any) => {
        countMap[p.cooperative_id] = (countMap[p.cooperative_id] || 0) + 1;
      });

      setCooperatives(
        (data || []).map((coop: any) => ({
          ...coop,
          owner_email: coop.users?.email,
          product_count: countMap[coop.id] || 0,
        })) as CooperativeWithOwner[]
      );
    } catch (err) {
      console.error('Error fetching cooperatives:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);

    try {
      const { error } = await supabase
        .from('cooperatives')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', deleteId);

      if (error) throw error;

      setCooperatives(cooperatives.filter((c) => c.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('Error deleting cooperative:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!toggleId) return;

    setToggling(true);

    try {
      const coop = cooperatives.find((c) => c.id === toggleId);
      if (!coop) return;

      const newStatus = coop.status === 'active' ? 'inactive' : 'active';

      const { error } = await supabase
        .from('cooperatives')
        .update({ status: newStatus })
        .eq('id', toggleId);

      if (error) throw error;

      setCooperatives(
        cooperatives.map((c) =>
          c.id === toggleId ? { ...c, status: newStatus } : c
        )
      );
      setToggleId(null);
    } catch (err) {
      console.error('Error toggling status:', err);
    } finally {
      setToggling(false);
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
    setSearchParams(params);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Manage Cooperatives</h1>
          <p className="text-secondary-600 mt-1">{cooperatives.length} cooperatives</p>
        </div>

        <Button onClick={() => navigate('/admin/cooperatives/new')} icon={<Plus className="w-4 h-4" />}>
          Add Cooperative
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search cooperatives..."
                className="w-full pl-10 pr-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
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
              setSearchParams(params);
            }}
            className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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

      {/* Cooperatives List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : cooperatives.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-12 h-12" />}
          title="No cooperatives found"
          description="Get started by adding your first cooperative."
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cooperatives.map((coop) => (
            <Card key={coop.id} className="overflow-hidden">
              {coop.cover_image_url ? (
                <div className="h-32 bg-secondary-100">
                  <img
                    src={coop.cover_image_url}
                    alt={coop.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-32 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-primary-400" />
                </div>
              )}

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {coop.logo_url ? (
                      <img
                        src={coop.logo_url}
                        alt={coop.name}
                        className="w-12 h-12 rounded-lg object-cover border-2 border-white -mt-8"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-white border-2 border-white -mt-8 flex items-center justify-center shadow-sm">
                        <Building2 className="w-6 h-6 text-primary-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold text-secondary-900 line-clamp-1">
                        {coop.name}
                      </h3>
                      {coop.category && (
                        <span className="text-xs text-secondary-500">{coop.category}</span>
                      )}
                    </div>
                  </div>
                  <Badge variant={coop.status === 'active' ? 'success' : 'warning'}>
                    {coop.status}
                  </Badge>
                </div>

                {coop.county && (
                  <div className="flex items-center text-sm text-secondary-500 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    {coop.county}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-secondary-500">
                    {coop.product_count} product{coop.product_count !== 1 ? 's' : ''}
                  </span>
                  <span className="text-secondary-500">{coop.owner_email}</span>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-secondary-100">
                  <Link
                    to={`/cooperatives/${coop.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Link>
                  <button
                    onClick={() => setToggleId(coop.id)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-secondary-600 hover:text-warning-600 hover:bg-warning-50 rounded-lg transition-colors"
                  >
                    {coop.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <Link
                    to={`/admin/cooperatives/${coop.id}`}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Cooperative"
        message="Are you sure you want to delete this cooperative? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />

      {/* Toggle Status Confirmation */}
      <ConfirmDialog
        isOpen={!!toggleId}
        onClose={() => setToggleId(null)}
        onConfirm={handleToggleStatus}
        title="Change Status"
        message="Are you sure you want to change the status of this cooperative?"
        confirmText="Change"
        variant="warning"
        loading={toggling}
      />
    </div>
  );
}
