import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Building2, MapPin, Shield, ChevronLeft, ChevronRight, Globe, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SearchFilter, LoadingSpinner, EmptyState, Card } from '../../components/shared';
import { useCounties, useBuyerTypes } from '../../hooks';
import type { Buyer } from '../../types';

export function BuyersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const { counties } = useCounties();
  const { buyerTypes } = useBuyerTypes();

  const query = searchParams.get('q') || '';
  const buyerType = searchParams.get('type') || '';
  const county = searchParams.get('county') || '';

  const countyOptions = useMemo(() => counties.map(c => ({ value: c.name, label: c.name })), [counties]);
  const buyerTypeOptions = useMemo(() => buyerTypes.map(t => ({ value: t.name, label: t.name })), [buyerTypes]);

  useEffect(() => { fetchBuyers(); }, [query, buyerType, county, page]);

  const fetchBuyers = async () => {
    setLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let request = supabase.from('buyers').select('*', { count: 'exact' }).eq('status', 'active').is('deleted_at', null).range(from, to);

      if (query) request = request.or(`company_name.ilike.%${query}%,description.ilike.%${query}%`);
      if (buyerType) request = request.eq('buyer_type', buyerType);
      if (county) request = request.eq('county', county);

      request = request.order('verified', { ascending: false }).order('created_at', { ascending: false });

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
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Buyer Directory</h1>
        <p className="text-secondary-600">Discover verified buyers and market opportunities</p>
      </div>

      <SearchFilter
        onSearch={handleSearch}
        onFilter={handleFilter}
        placeholder="Search buyers..."
        filters={[
          { key: 'county', label: 'County', options: countyOptions },
          { key: 'type', label: 'Buyer Type', options: buyerTypeOptions },
        ]}
        initialFilters={{ county, type: buyerType }}
        initialSort={{ sortBy: 'created_at', sortOrder: 'desc' }}
      />

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : buyers.length === 0 ? (
          <EmptyState icon={<Building2 className="w-12 h-12" />} title="No buyers found" description="Check back later for new buyers." />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buyers.map((buyer) => (
              <Link key={buyer.id} to={`/buyers/${buyer.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-lg bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {buyer.logo_url ? <img src={buyer.logo_url} alt={buyer.company_name} className="w-full h-full object-cover" /> : <Building2 className="w-8 h-8 text-primary-600" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-secondary-900 line-clamp-1">{buyer.company_name}</h3>
                          {buyer.verified && <Shield className="w-4 h-4 text-info-500 flex-shrink-0" />}
                        </div>
                        <span className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{buyer.buyer_type}</span>
                      </div>
                    </div>
                    {buyer.description && <p className="text-sm text-secondary-600 line-clamp-2 mb-4">{buyer.description}</p>}
                    <div className="space-y-2 text-sm text-secondary-500">
                      {buyer.county && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-secondary-400" /><span>{buyer.county}</span></div>}
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
