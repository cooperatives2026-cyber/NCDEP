import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Warehouse, Search, MapPin, Edit, Trash2, Plus, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Badge, LoadingSpinner, EmptyState, ConfirmDialog, Button, Modal } from '../../components/shared';
import type { AggregationCenter } from '../../types';

export function AdminAggregationCentersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [centers, setCenters] = useState<AggregationCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editCenter, setEditCenter] = useState<AggregationCenter | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const search = searchParams.get('q') || '';
  const statusFilter = searchParams.get('status') || '';

  useEffect(() => {
    fetchCenters();
  }, [search, statusFilter]);

  const fetchCenters = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('aggregation_centers')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`name.ilike.%${search}%,county.ilike.%${search}%`);
      }
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCenters(data || []);
    } catch (err) {
      console.error('Error fetching centers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('aggregation_centers')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', deleteId);
      if (error) throw error;
      setCenters(centers.filter(c => c.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('Error deleting center:', err);
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
      county: formData.get('county') as string,
      location: formData.get('location') as string || null,
      capacity: formData.get('capacity') ? parseInt(formData.get('capacity') as string) : null,
      capacity_unit: formData.get('capacity_unit') as string || null,
      storage_type: formData.get('storage_type') as string || null,
      contact_name: formData.get('contact_name') as string || null,
      contact_phone: formData.get('contact_phone') as string || null,
      contact_email: formData.get('contact_email') as string || null,
      operating_hours: formData.get('operating_hours') as string || null,
      status: formData.get('status') as string,
    };

    try {
      if (editCenter) {
        const { error } = await supabase
          .from('aggregation_centers')
          .update(data)
          .eq('id', editCenter.id);
        if (error) throw error;
        setCenters(centers.map(c => c.id === editCenter.id ? { ...c, ...data } : c));
      } else {
        const { data: newCenter, error } = await supabase
          .from('aggregation_centers')
          .insert(data)
          .select()
          .single();
        if (error) throw error;
        setCenters([newCenter, ...centers]);
      }
      setShowForm(false);
      setEditCenter(null);
    } catch (err) {
      console.error('Error saving center:', err);
    } finally {
      setSaving(false);
    }
  };

  const counties = [...new Set(centers.map(c => c.county))].sort();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Aggregation Centers</h1>
          <p className="text-secondary-600 mt-1">{centers.length} centers registered</p>
        </div>
        <Button onClick={() => { setEditCenter(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Center
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-secondary-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={(e) => { e.preventDefault(); fetchCenters(); }} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search centers..."
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
      ) : centers.length === 0 ? (
        <EmptyState icon={<Warehouse className="w-12 h-12" />} title="No centers found" description="Add aggregation centers to get started." />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-secondary-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-100">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Center</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {centers.map((center) => (
                  <tr key={center.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                          <Warehouse className="w-5 h-5 text-warning-600" />
                        </div>
                        <div>
                          <p className="font-medium text-secondary-900">{center.name}</p>
                          {center.storage_type && (
                            <p className="text-xs text-secondary-500">{center.storage_type}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-secondary-600">
                        <MapPin className="w-4 h-4" />
                        {center.county}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {center.capacity ? (
                        <span className="text-sm text-secondary-600">
                          {center.capacity.toLocaleString()} {center.capacity_unit || 'units'}
                        </span>
                      ) : (
                        <span className="text-sm text-secondary-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={center.status === 'active' ? 'success' : 'error'} size="sm">
                        {center.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditCenter(center); setShowForm(true); }}
                          className="p-2 text-secondary-400 hover:text-primary-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(center.id)}
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
        title="Delete Center"
        message="Are you sure you want to delete this aggregation center?"
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditCenter(null); }}>
        <form onSubmit={handleSave} className="p-6">
          <h2 className="text-xl font-semibold text-secondary-900 mb-6">
            {editCenter ? 'Edit Center' : 'Add Aggregation Center'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Name *</label>
              <input
                name="name"
                defaultValue={editCenter?.name || ''}
                required
                className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">County *</label>
                <input
                  name="county"
                  defaultValue={editCenter?.county || ''}
                  required
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Status</label>
                <select
                  name="status"
                  defaultValue={editCenter?.status || 'active'}
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Location/Address</label>
              <input
                name="location"
                defaultValue={editCenter?.location || ''}
                className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Capacity</label>
                <input
                  name="capacity"
                  type="number"
                  defaultValue={editCenter?.capacity || ''}
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Unit</label>
                <select
                  name="capacity_unit"
                  defaultValue={editCenter?.capacity_unit || 'kg'}
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="tons">Metric Tons</option>
                  <option value="liters">Liters</option>
                  <option value="crates">Crates</option>
                  <option value="bags">Bags</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Storage Type</label>
              <select
                name="storage_type"
                defaultValue={editCenter?.storage_type || ''}
                className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
              >
                <option value="">Select type</option>
                <option value="cold_storage">Cold Storage</option>
                <option value="dry_storage">Dry Storage</option>
                <option value="ambient">Ambient</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Contact Name</label>
                <input
                  name="contact_name"
                  defaultValue={editCenter?.contact_name || ''}
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Contact Phone</label>
                <input
                  name="contact_phone"
                  defaultValue={editCenter?.contact_phone || ''}
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Contact Email</label>
              <input
                name="contact_email"
                type="email"
                defaultValue={editCenter?.contact_email || ''}
                className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Operating Hours</label>
              <input
                name="operating_hours"
                defaultValue={editCenter?.operating_hours || ''}
                placeholder="e.g., Mon-Sat 6AM-6PM"
                className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowForm(false); setEditCenter(null); }}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={saving}>
              {editCenter ? 'Save Changes' : 'Add Center'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
