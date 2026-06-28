import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Truck, MapPin, Phone, Mail, Globe, Shield, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SearchFilter, LoadingSpinner, EmptyState, Card } from '../../components/shared';
import { useCounties, useDistributionPartnerTypes } from '../../hooks';
import type { DistributionPartner } from '../../types';

export function DistributionPartnersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [partners, setPartners] = useState<DistributionPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const { counties } = useCounties();
  const { partnerTypes } = useDistributionPartnerTypes();

  const query = searchParams.get('q') || '';
  const partnerType = searchParams.get('type') || '';
  const county = searchParams.get('county') || '';

  const countyOptions = counties.map(c => ({ value: c.name, label: c.name }));
  const partnerTypeOptions = partnerTypes.map(t => ({ value: t.name, label: t.name }));

  useEffect(() => { fetchPartners(); }, [query, partnerType, county, page]);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let request = supabase.from('distribution_partners').select('*', { count: 'exact' }).eq('status', 'active').is('deleted_at', null).range(from, to);

      if (query) request = request.ilike('name', `%${query}%`);
      if (partnerType) request = request.eq('partner_type', partnerType);
      if (county) request = request.contains('coverage_counties', [county]);

      request = request.order('verified', { ascending: false }).order('name');

      const { data, error, count } = await request;
      if (error) throw error;

      setPartners(data as DistributionPartner[] || []);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Distribution Partners</h1>
        <p className="text-secondary-600">Connect with verified distribution networks</p>
      </div>

      <SearchFilter onSearch={handleSearch} onFilter={handleFilter} placeholder="Search partners..." filters={[{ key: 'county', label: 'County', options: countyOptions }, { key: 'type', label: 'Partner Type', options: partnerTypeOptions }]} initialFilters={{ county, type: partnerType }} initialSort={{ sortBy: 'name', sortOrder: 'asc' }} />

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : partners.length === 0 ? (
          <EmptyState icon={<Truck className="w-12 h-12" />} title="No partners found" description="Try adjusting your search filters." />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.map((partner) => (
              <Card key={partner.id} className="hover:shadow-md transition-shadow p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-primary-600" />
                    <span className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{partner.partner_type}</span>
                  </div>
                  {partner.verified && <Shield className="w-4 h-4 text-info-500" />}
                </div>
                <h3 className="font-semibold text-secondary-900 mb-2">{partner.name}</h3>
                {partner.description && <p className="text-sm text-secondary-600 mb-3 line-clamp-2">{partner.description}</p>}
                <div className="space-y-1 text-sm text-secondary-600 mb-3">
                  {partner.national_coverage ? (
                    <div className="flex items-center gap-1 text-success-600"><Check className="w-4 h-4" /><span>National Coverage</span></div>
                  ) : partner.coverage_counties && partner.coverage_counties.length > 0 && (
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-secondary-400" /><span>{partner.coverage_counties.slice(0, 3).join(', ')}{partner.coverage_counties.length > 3 && '...'}</span></div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-secondary-500">
                  {partner.contact_phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /><span>{partner.contact_phone}</span></div>}
                </div>
              </Card>
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
