import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Building2, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SearchFilter, LoadingSpinner, EmptyState, Card, Button } from '../../components/shared';
import { useCounties, useCooperativeCategories } from '../../hooks';
import type { Cooperative } from '../../types';

export function CooperativesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { counties } = useCounties();
  const { categories } = useCooperativeCategories();

  const query = searchParams.get('q') || '';
  const county = searchParams.get('county') || '';
  const category = searchParams.get('category') || '';
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

  const countyOptions = useMemo(() =>
    counties.map(c => ({ value: c.name, label: c.name })),
    [counties]
  );

  const categoryOptions = useMemo(() =>
    categories.map(c => ({ value: c.name, label: c.name })),
    [categories]
  );

  useEffect(() => {
    fetchCooperatives();
  }, [query, county, category, sortBy, sortOrder, page]);

  const fetchCooperatives = async () => {
    setLoading(true);

    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let request = supabase
        .from('cooperatives')
        .select('*', { count: 'exact' })
        .eq('status', 'active')
        .is('deleted_at', null)
        .range(from, to);

      if (query) {
        request = request.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      }

      if (county) {
        request = request.eq('county', county);
      }

      if (category) {
        request = request.eq('category', category);
      }

      request = request.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error, count } = await request;

      if (error) throw error;

      setCooperatives(data || []);
      setTotal(count || 0);
    } catch (err) {
      console.error('Error fetching cooperatives:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (newQuery: string) => {
    const params = new URLSearchParams(searchParams);
    if (newQuery) {
      params.set('q', newQuery);
    } else {
      params.delete('q');
    }
    setPage(1);
    setSearchParams(params);
  };

  const handleFilter = (filters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    setPage(1);
    setSearchParams(params);
  };

  const handleSort = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    const params = new URLSearchParams(searchParams);
    params.set('sortBy', newSortBy);
    params.set('sortOrder', newSortOrder);
    setPage(1);
    setSearchParams(params);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Cooperatives Directory</h1>
        <p className="text-secondary-600">
          Browse {total} cooperative{total !== 1 ? 's' : ''} across the nation
        </p>
      </div>

      <SearchFilter
        onSearch={handleSearch}
        onFilter={handleFilter}
        onSort={handleSort}
        placeholder="Search cooperatives..."
        filters={[
          { key: 'county', label: 'County', options: countyOptions },
          { key: 'category', label: 'Category', options: categoryOptions },
        ]}
        sortOptions={[
          { value: 'name', label: 'Name' },
          { value: 'created_at', label: 'Date Added' },
        ]}
        initialFilters={{ county, category }}
        initialSort={{ sortBy, sortOrder }}
      />

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : cooperatives.length === 0 ? (
          <EmptyState
            icon={<Building2 className="w-12 h-12" />}
            title="No cooperatives found"
            description="Try adjusting your search or filters to find what you're looking for."
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cooperatives.map((coop) => (
              <Link key={coop.id} to={`/cooperatives/${coop.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  {coop.cover_image_url ? (
                    <div className="h-48 bg-secondary-100">
                      <img
                        src={coop.cover_image_url}
                        alt={coop.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                      <Building2 className="w-16 h-16 text-primary-400" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-secondary-900 line-clamp-1">
                        {coop.name}
                      </h3>
                      {coop.logo_url && (
                        <img
                          src={coop.logo_url}
                          alt={`${coop.name} logo`}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white -mt-8 mr-2"
                        />
                      )}
                    </div>

                    {coop.category && (
                      <span className="inline-block px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full mb-3">
                        {coop.category}
                      </span>
                    )}

                    {coop.description && (
                      <p className="text-sm text-secondary-600 line-clamp-2 mb-3">
                        {coop.description}
                      </p>
                    )}

                    {coop.county && (
                      <div className="flex items-center text-sm text-secondary-500">
                        <MapPin className="w-4 h-4 mr-1" />
                        {coop.county}
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm text-secondary-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
