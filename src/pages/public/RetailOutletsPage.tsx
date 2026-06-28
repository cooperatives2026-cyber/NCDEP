import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Store, MapPin, Phone, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SearchFilter, LoadingSpinner, EmptyState, Card } from '../../components/shared';
import { useCounties, useRetailOutletTypes } from '../../hooks';
import type { RetailOutlet } from '../../types';

export function RetailOutletsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [outlets, setOutlets] = useState<RetailOutlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const { counties } = useCounties();
  const { outletTypes } = useRetailOutletTypes();

  const query = searchParams.get('q') || '';
  const outletType = searchParams.get('type') || '';
  const county = searchParams.get('county') || '';

  const countyOptions = counties.map(c => ({ value: c.name, label: c.name }));
  const outletTypeOptions = outletTypes.map(t => ({ value: t.name, label: t.name }));

  useEffect(() => { fetchOutlets(); }, [query, outletType, county, page]);

  const fetchOutlets = async () => {
    setLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let request = supabase.from('retail_outlets').select('*', { count: 'exact' }).eq('status', 'active').is('deleted_at', null).range(from, to);

      if (query) request = request.or(`name.ilike.%${query}%,town.ilike.%${query}%`);
      if (outletType) request = request.eq('outlet_type', outletType);
      if (county) request = request.eq('county', county);

      request = request.order('verified', { ascending: false }).order('name');

      const { data, error, count } = await request;
      if (error) throw error;

      setOutlets(data as RetailOutlet[] || []);
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
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Retail Outlets</h1>
        <p className="text-secondary-600">Find retail stores stocking cooperative products</p>
      </div>

      <SearchFilter onSearch={handleSearch} onFilter={handleFilter} placeholder="Search outlets..." filters={[{ key: 'county', label: 'County', options: countyOptions }, { key: 'type', label: 'Outlet Type', options: outletTypeOptions }]} initialFilters={{ county, type: outletType }} initialSort={{ sortBy: 'name', sortOrder: 'asc' }} />

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : outlets.length === 0 ? (
          <EmptyState icon={<Store className="w-12 h-12" />} title="No outlets found" description="Try adjusting your search filters." />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {outlets.map((outlet) => (
              <Card key={outlet.id} className="hover:shadow-md transition-shadow p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-primary-600" />
                    <span className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{outlet.outlet_type}</span>
                  </div>
                  {outlet.verified && <Shield className="w-4 h-4 text-info-500" />}
                </div>
                <h3 className="font-semibold text-secondary-900 mb-2">{outlet.name}</h3>
                <div className="space-y-1 text-sm text-secondary-600">
                  {outlet.town && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-secondary-400" /><span>{outlet.town}, {outlet.county}</span></div>}
                  {outlet.contact_phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-secondary-400" /><span>{outlet.contact_phone}</span></div>}
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
