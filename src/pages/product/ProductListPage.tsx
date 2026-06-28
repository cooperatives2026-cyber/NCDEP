import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Package, Plus, Edit, Eye, Trash2, Search, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Badge, LoadingSpinner, EmptyState, Button, ConfirmDialog } from '../../components/shared';
import type { Product, Cooperative } from '../../types';

interface ProductWithImages extends Product {
  images: { id: string; image_url: string }[];
}

export function ProductListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [cooperatives, setCooperatives] = useState<Record<string, Cooperative>>({});
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const search = searchParams.get('q') || '';
  const status = searchParams.get('status') || '';

  useEffect(() => {
    fetchProducts();
  }, [search, status]);

  const fetchProducts = async () => {
    setLoading(true);

    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          images:product_images(id, image_url),
          cooperative:cooperatives(id, name, user_id)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      setProducts(data as ProductWithImages[] || []);

      // Build cooperative lookup
      const coopMap: Record<string, Cooperative> = {};
      (data || []).forEach((p: any) => {
        if (p.cooperative) {
          coopMap[p.cooperative.id] = p.cooperative;
        }
      });
      setCooperatives(coopMap);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);

    try {
      const { error } = await supabase
        .from('products')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', deleteId);

      if (error) throw error;

      setProducts(products.filter((p) => p.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('Error deleting product:', err);
    } finally {
      setDeleting(false);
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
          <h1 className="text-2xl font-bold text-secondary-900">Products</h1>
          <p className="text-secondary-600 mt-1">{products.length} products</p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/dashboard/products/new')} icon={<Plus className="w-4 h-4" />}>
            Add Product
          </Button>
        </div>
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
                placeholder="Search products..."
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
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="w-12 h-12" />}
          title="No products found"
          description="Get started by adding your first product."
          action={
            <Button onClick={() => navigate('/dashboard/products/new')} icon={<Plus className="w-4 h-4" />}>
              Add First Product
            </Button>
          }
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-secondary-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-100">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Cooperative
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-secondary-100 rounded-lg flex-shrink-0 overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0].image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-secondary-300" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-secondary-900 line-clamp-1">{product.name}</p>
                          <p className="text-sm text-secondary-500">
                            {new Date(product.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.cooperative_id && cooperatives[product.cooperative_id] ? (
                        <span className="text-sm text-secondary-900">
                          {cooperatives[product.cooperative_id].name}
                        </span>
                      ) : (
                        <span className="text-sm text-secondary-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-secondary-600">
                        {product.category || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={
                          product.status === 'active'
                            ? 'success'
                            : product.status === 'draft'
                            ? 'warning'
                            : 'error'
                        }
                      >
                        {product.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/dashboard/products/${product.id}/performance`}
                          className="p-2 text-secondary-400 hover:text-accent-600"
                          title="View Performance"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Link>
                        {product.status === 'active' && (
                          <Link
                            to={`/products/${product.id}`}
                            className="p-2 text-secondary-400 hover:text-secondary-600"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        )}
                        <Link
                          to={`/dashboard/products/${product.id}/edit`}
                          className="p-2 text-secondary-400 hover:text-primary-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteId(product.id)}
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
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
