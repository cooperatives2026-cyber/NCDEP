import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Store, Search, MapPin, Edit, Trash2, Plus, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Badge, LoadingSpinner, EmptyState, ConfirmDialog, Button, Modal } from '../../components/shared';
import { useRetailOutletTypes } from '../../hooks';
import type { RetailOutlet } from '../../types';

export function AdminRetailOutletsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [outlets, setOutlets] = useState<RetailOutlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editOutlet, setEditOutlet] = useState<RetailOutlet | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const { outletTypes } = useRetailOutletTypes();

  const search = searchParams.get('q') || '';
  const typeFilter = searchParams.get('type') || '';
  const countyFilter = searchParams.get('county') || '';
  const statusFilter = searchParams.get('status') || '';

  useEffect(() => {
    fetchOutlets();
  }, [search, typeFilter, countyFilter, statusFilter]);

  const fetchOutlets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('retail_outlets')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`name.ilike.%${search}%,town.ilike.%${search}%`);
      }
      if (typeFilter) {
        query = query.eq('outlet_type', typeFilter);
      }
      if (countyFilter) {
        query = query.eq('county', countyFilter);
      }
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOutlets(data || []);
    } catch (err) {
      console.error('Error fetching outlets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('retail_outlets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', deleteId);
      if (error) throw error;
      setOutlets(outlets.filter(o => o.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('Error deleting outlet:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      outlet_type: formData.get('outlet_type') as string,
      county: formData.get('county') as string,
      town: formData.get('town') as string || null,
      location: formData.get('location') as string || null,
      contact_phone: formData.get('contact_phone') as string || null,
      contact_email: formData.get('contact_email') as string || null,
      operating_hours: formData.get('operating_hours') as string || null,
      status: formData.get('status') as string,
    };

    try {
      if (editOutlet) {
        const { error } = await supabase
          .from('retail_outlets')
          .update(data)
          .eq('id', editOutlet.id);
        if (error) throw error;
        setOutlets(outlets.map(o => o.id === editOutlet.id ? { ...o, ...data } : o));
      } else {
        const { data: newOutlet, error } = await supabase
          .from('retail_outlets')
          .insert(data)
          .select()
          .single();
        if (error) throw error;
        setOutlets([newOutlet, ...outlets]);
      }
      setShowForm(false);
      setEditOutlet(null);
    } catch (err) {
      console.error('Error saving outlet:', err);
    } finally {
      setSaving(false);
    }
  };

  const counties = [...new Set(outlets.map(o => o.county))].sort();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Retail Outlets</h1>
          <p className="text-secondary-600 mt-1">{outlets.length} outlets registered</p>
        </div>
        <Button onClick={() => { setEditOutlet(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Outlet
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-secondary-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={(e) => { e.preventDefault(); fetchOutlets(); }} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search outlets..."
                onChange={(e) => {
                  const params = new URLSearchParams(searchParams);
                  if (e.target.value) params.set('q', e.target.value);
                  else params.delete('q');
                  setSearchParams(params);
                }}
                className="w-full pl-10 pr-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
              />
            </div>
          </form>

          <select
            value={typeFilter}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('type', e.target.value);
              else params.delete('type');
              setSearchParams(params);
            }}
            className="px-4 py-2 border border-secondary-200 rounded-lg"
          >
            <option value="">All Types</option>
            {outletTypes.map(t => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>

          <select
            value={countyFilter}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('county', e.target.value);
              else params.delete('county');
              setSearchParams(params);
            }}
            className="px-4 py-2 border border-secondary-200 rounded-lg"
          >
            <option value="">All Counties</option>
            {counties.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('status', e.target.value);
              else params.delete('status');
              setSearchParams(params);
            }}
            className="px-4 py-2 border border-secondary-200 rounded-lg"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : outlets.length === 0 ? (
        <EmptyState icon={<Store className="w-12 h-12" />} title="No outlets found" description="Add retail outlets to get started." />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-secondary-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-100">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Outlet</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {outlets.map((outlet) => (
                  <tr key={outlet.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Store className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-secondary-900">{outlet.name}</p>
                          {outlet.contact_phone && (
                            <p className="text-xs text-secondary-500">{outlet.contact_phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="info" size="sm">{outlet.outlet_type}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-secondary-600">
                        <MapPin className="w-4 h-4" />
                        {outlet.county}{outlet.town ? `, ${outlet.town}` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={outlet.status === 'active' ? 'success' : 'error'} size="sm">
                        {outlet.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditOutlet(outlet); setShowForm(true); }}
                          className="p-2 text-secondary-400 hover:text-primary-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(outlet.id)}
                          className="p-2 text-secondary-400 hover:text-error-600"
                        >
                          <Trash2 className="w-4 h-4" />
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

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Outlet"
        message="Are you sure you want to delete this retail outlet?"
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditOutlet(null); }}>
        <form onSubmit={handleSave} className="p-6">
          <h2 className="text-xl font-semibold text-secondary-900 mb-6">
            {editOutlet ? 'Edit Outlet' : 'Add Retail Outlet'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Name *</label>
              <input
                name="name"
                defaultValue={editOutlet?.name || ''}
                required
                className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Type *</label>
                <select
                  name="outlet_type"
                  defaultValue={editOutlet?.outlet_type || ''}
                  required
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
                >
                  <option value="">Select type</option>
                  {outletTypes.map(t => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Status</label>
                <select
                  name="status"
                  defaultValue={editOutlet?.status || 'active'}
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">County *</label>
                <input
                  name="county"
                  defaultValue={editOutlet?.county || ''}
                  required
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Town</label>
                <input
                  name="town"
                  defaultValue={editOutlet?.town || ''}
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Location/Address</label>
              <input
                name="location"
                defaultValue={editOutlet?.location || ''}
                className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Contact Phone</label>
                <input
                  name="contact_phone"
                  defaultValue={editOutlet?.contact_phone || ''}
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Contact Email</label>
                <input
                  name="contact_email"
                  type="email"
                  defaultValue={editOutlet?.contact_email || ''}
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Operating Hours</label>
              <input
                name="operating_hours"
                defaultValue={editOutlet?.operating_hours || ''}
                placeholder="e.g., Mon-Sat 8AM-6PM"
                className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowForm(false); setEditOutlet(null); }}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={saving}>
              {editOutlet ? 'Save Changes' : 'Add Outlet'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
