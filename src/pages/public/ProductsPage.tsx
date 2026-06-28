import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Package, Building2, MapPin, QrCode, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SearchFilter, LoadingSpinner, EmptyState, Card, Badge, Button } from '../../components/shared';
import { RatingDisplay } from '../../components/engagement';
import { useCounties, useProductCategories } from '../../hooks';
import type { Product } from '../../types';

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
}

interface ProductEngagementStats {
  total_views: number;
  total_scans: number;
  total_ratings: number;
  avg_rating: number;
  total_reviews: number;
  total_interest: number;
  demand_score: number;
}

interface ProductWithCooperative extends Product {
  images: ProductImage[];
  cooperative: {
    id: string;
    name: string;
    county: string | null;
  } | null;
  engagement?: ProductEngagementStats;
}

const ENGAGEMENT_SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'created_at', label: 'Date Added' },
  { value: 'highest_rated', label: 'Highest Rated' },
  { value: 'most_reviewed', label: 'Most Reviewed' },
  { value: 'most_demanded', label: 'Most Demanded' },
  { value: 'most_scanned', label: 'Most Scanned' },
];

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ProductWithCooperative[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { counties } = useCounties();
  const { categories } = useProductCategories();

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
    fetchProducts();
  }, [query, county, category, sortBy, sortOrder, page]);

  const fetchProducts = async () => {
    setLoading(true);

    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let request = supabase
        .from('products')
        .select(
          `
          *,
          images:product_images(*),
          cooperative:cooperatives(id, name, county, category)
        `,
          { count: 'exact' }
        )
        .eq('status', 'active')
        .is('deleted_at', null)
        .range(from, to);

      if (query) {
        request = request.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      }

      if (category) {
        request = request.eq('category', category);
      }

      if (!['highest_rated', 'most_reviewed', 'most_demanded', 'most_scanned'].includes(sortBy)) {
        request = request.order(sortBy, { ascending: sortOrder === 'asc' });
      } else {
        request = request.order('created_at', { ascending: false });
      }

      const { data, error, count } = await request;

      if (error) throw error;

      let filteredData = data as ProductWithCooperative[] || [];
      if (county) {
        filteredData = filteredData.filter(p => p.cooperative?.county === county);
      }

      const productIds = filteredData.map(p => p.id);
      if (productIds.length > 0) {
        const { data: statsData } = await supabase.rpc('get_products_with_stats', {
          p_product_ids: productIds
        });

        if (statsData) {
          const statsMap = new Map(statsData.map((s: any) => [s.product_id, s]));
          filteredData = filteredData.map(p => ({
            ...p,
            engagement: statsMap.get(p.id) || p.engagement
          }));
        }

        if (sortBy === 'highest_rated') {
          filteredData.sort((a, b) => {
            const aRating = a.engagement?.avg_rating || 0;
            const bRating = b.engagement?.avg_rating || 0;
            return sortOrder === 'desc' ? bRating - aRating : aRating - bRating;
          });
        } else if (sortBy === 'most_reviewed') {
          filteredData.sort((a, b) => {
            const aReviews = a.engagement?.total_ratings || 0;
            const bReviews = b.engagement?.total_ratings || 0;
            return sortOrder === 'desc' ? bReviews - aReviews : aReviews - bReviews;
          });
        } else if (sortBy === 'most_demanded') {
          filteredData.sort((a, b) => {
            const aScore = a.engagement?.demand_score || 0;
            const bScore = b.engagement?.demand_score || 0;
            return sortOrder === 'desc' ? bScore - aScore : aScore - bScore;
          });
        } else if (sortBy === 'most_scanned') {
          filteredData.sort((a, b) => {
            const aScans = a.engagement?.total_scans || 0;
            const bScans = b.engagement?.total_scans || 0;
            return sortOrder === 'desc' ? bScans - aScans : aScans - bScans;
          });
        }
      }

      setProducts(filteredData);
      setTotal(count || 0);
    } catch (err) {
      console.error('Error fetching products:', err);
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
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Products Directory</h1>
        <p className="text-secondary-600">
          Browse {total} product{total !== 1 ? 's' : ''} from cooperatives across the nation
        </p>
      </div>

      <SearchFilter
        onSearch={handleSearch}
        onFilter={handleFilter}
        onSort={handleSort}
        placeholder="Search products..."
        filters={[
          { key: 'county', label: 'County', options: countyOptions },
          { key: 'category', label: 'Category', options: categoryOptions },
        ]}
        sortOptions={ENGAGEMENT_SORT_OPTIONS}
        initialFilters={{ county, category }}
        initialSort={{ sortBy, sortOrder }}
      />

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={<Package className="w-12 h-12" />}
            title="No products found"
            description="Try adjusting your search or filters to find what you're looking for."
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link key={product.id} to={`/products/${product.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-secondary-100 relative">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0].image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-secondary-300" />
                      </div>
                    )}
                    {product.engagement && product.engagement.total_scans > 0 && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="info" size="sm" className="flex items-center gap-1">
                          <QrCode className="w-3 h-3" />
                          {product.engagement.total_scans}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-secondary-900 line-clamp-1">
                      {product.name}
                    </h3>

                    {product.engagement && product.engagement.total_ratings > 0 && (
                      <div className="mt-1">
                        <RatingDisplay
                          avgRating={product.engagement.avg_rating}
                          totalRatings={product.engagement.total_ratings}
                          size="sm"
                        />
                      </div>
                    )}

                    {product.category && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-accent-50 text-accent-700 text-xs font-medium rounded-full">
                        {product.category}
                      </span>
                    )}

                    {product.description && (
                      <p className="text-sm text-secondary-600 mt-2 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    {product.engagement && product.engagement.demand_score > 10 && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-success-600">
                        <TrendingUp className="w-3 h-3" />
                        <span>High demand</span>
                      </div>
                    )}

                    {product.cooperative && (
                      <div className="mt-3 pt-3 border-t border-secondary-100">
                        <div className="flex items-center text-sm text-secondary-500 gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          <span className="line-clamp-1">{product.cooperative.name}</span>
                        </div>
                        {product.cooperative.county && (
                          <div className="flex items-center text-xs text-secondary-400 mt-1 gap-1">
                            <MapPin className="w-3 h-3" />
                            {product.cooperative.county}
                          </div>
                        )}
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
