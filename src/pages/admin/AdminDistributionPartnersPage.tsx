import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Truck, Search, MapPin, Edit, Trash2, Plus, Globe } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Badge, LoadingSpinner, EmptyState, ConfirmDialog, Button, Modal } from '../../components/shared';
import { useDistributionPartnerTypes } from '../../hooks';
import type { DistributionPartner } from '../../types';

export function AdminDistributionPartnersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [partners, setPartners] = useState<DistributionPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editPartner, setEditPartner] = useState<DistributionPartner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const { partnerTypes } = useDistributionPartnerTypes();

  const search = searchParams.get('q') || '';
  const typeFilter = searchParams.get('type') || '';
  const statusFilter = searchParams.get('status') || '';

  useEffect(() => {
    fetchPartners();
  }, [search, typeFilter, statusFilter]);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('distribution_partners')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }
      if (typeFilter) {
        query = query.eq('partner_type', typeFilter);
      }
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPartners(data || []);
    } catch (err) {
      console.error('Error fetching partners:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('distribution_partners')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', deleteId);
      if (error) throw error;
      setPartners(partners.filter(p => p.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('Error deleting partner:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const coverageCounties = (formData.get('coverage_counties') as string)
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);

    const data = {
      name: formData.get('name') as string,
      partner_type: formData.get('partner_type') as string,
      description: formData.get('description') as string || null,
      coverage_counties: coverageCounties,
      national_coverage: formData.get('national_coverage') === 'true',
      contact_phone: formData.get('contact_phone') as string || null,
      contact_email: formData.get('contact_email') as string || null,
      website: formData.get('website') as string || null,
      status: formData.get('status') as string,
    };

    try {
      if (editPartner) {
        const { error } = await supabase
          .from('distribution_partners')
          .update(data)
          .eq('id', editPartner.id);
        if (error) throw error;
        setPartners(partners.map(p => p.id === editPartner.id ? { ...p, ...data } : p));
      } else {
        const { data: newPartner, error } = await supabase
          .from('distribution_partners')
          .insert(data)
          .select()
          .single();
        if (error) throw error;
        setPartners([newPartner, ...partners]);
      }
      setShowForm(false);
      setEditPartner(null);
    } catch (err) {
      console.error('Error saving partner:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Distribution Partners</h1>
          <p className="text-secondary-600 mt-1">{partners.length} partners registered</p>
        </div>
        <Button onClick={() => { setEditPartner(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Partner
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-secondary-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={(e) => { e.preventDefault(); fetchPartners(); }} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search partners..."
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
            {partnerTypes.map(t => (
              <option key={t.name} value={t.name}>{t.name}</option>
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
      ) : partners.length === 0 ? (
        <EmptyState icon={<Truck className="w-12 h-12" />} title="No partners found" description="Add distribution partners to get started." />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-secondary-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-100">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Partner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Coverage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {partners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                          <Truck className="w-5 h-5 text-secondary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-secondary-900">{partner.name}</p>
                          {partner.contact_email && (
                            <p className="text-xs text-secondary-500">{partner.contact_email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="info" size="sm">{partner.partner_type}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      {partner.national_coverage ? (
                        <div className="flex items-center gap-1 text-sm text-success-600">
                          <Globe className="w-4 h-4" />
                          National
                        </div>
                      ) : partner.coverage_counties?.length > 0 ? (
                        <div className="flex items-center gap-1 text-sm text-secondary-600">
                          <MapPin className="w-4 h-4" />
                          {partner.coverage_counties.length} counties
                        </div>
                      ) : (
                        <span className="text-sm text-secondary-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={partner.status === 'active' ? 'success' : 'error'} size="sm">
                        {partner.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditPartner(partner); setShowForm(true); }}
                          className="p-2 text-secondary-400 hover:text-primary-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(partner.id)}
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
        title="Delete Partner"
        message="Are you sure you want to delete this distribution partner?"
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditPartner(null); }}>
        <form onSubmit={handleSave} className="p-6">
          <h2 className="text-xl font-semibold text-secondary-900 mb-6">
            {editPartner ? 'Edit Partner' : 'Add Distribution Partner'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Name *</label>
              <input
                name="name"
                defaultValue={editPartner?.name || ''}
                required
                className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Type *</label>
                <select
                  name="partner_type"
                  defaultValue={editPartner?.partner_type || ''}
                  required
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
                >
                  <option value="">Select type</option>
                  {partnerTypes.map(t => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Status</label>
                <select
                  name="status"
                  defaultValue={editPartner?.status || 'active'}
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
              <textarea
                name="description"
                defaultValue={editPartner?.description || ''}
                rows={2}
                className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Coverage Counties</label>
              <input
                name="coverage_counties"
                defaultValue={editPartner?.coverage_counties?.join(', ') || ''}
                placeholder="Comma-separated counties (e.g., Nairobi, Kiambu, Machakos)"
                className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="national_coverage"
                id="national_coverage"
                value="true"
                defaultChecked={editPartner?.national_coverage || false}
                className="w-4 h-4 text-primary-600 border-secondary-300 rounded"
              />
              <label htmlFor="national_coverage" className="text-sm text-secondary-700">
                National Coverage (operates countrywide)
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Contact Phone</label>
                <input
                  name="contact_phone"
                  defaultValue={editPartner?.contact_phone || ''}
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Contact Email</label>
                <input
                  name="contact_email"
                  type="email"
                  defaultValue={editPartner?.contact_email || ''}
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Website</label>
              <input
                name="website"
                type="url"
                defaultValue={editPartner?.website || ''}
                placeholder="https://example.com"
                className="w-full px-4 py-2 border border-secondary-200 rounded-lg"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowForm(false); setEditPartner(null); }}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={saving}>
              {editPartner ? 'Save Changes' : 'Add Partner'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
