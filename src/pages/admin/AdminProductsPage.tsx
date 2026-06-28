import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Package, Eye, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Badge, LoadingSpinner, EmptyState, ConfirmDialog } from '../../components/shared';
import { useProductCategories } from '../../hooks';
import type { Product } from '../../types';

interface ProductWithCooperative extends Product {
  cooperative?: { id: string; name: string } | null;
}

export function AdminProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ProductWithCooperative[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggleId, setToggleId] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  const { categories } = useProductCategories();

  const search = searchParams.get('q') || '';
  const status = searchParams.get('status') || '';
  const category = searchParams.get('category') || '';

  const categoryOptions = useMemo(() =>
    categories.map(c => ({ value: c.name, label: c.name })),
    [categories]
  );

  useEffect(() => {
    fetchProducts();
  }, [search, status, category]);

  const fetchProducts = async () => {
    setLoading(true);

    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          cooperative:cooperatives(id, name)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      setProducts(data as ProductWithCooperative[] || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!toggleId) return;

    setToggling(true);

    try {
      const product = products.find((p) => p.id === toggleId);
      if (!product) return;

      const newStatus = product.status === 'active' ? 'inactive' : 'active';

      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('id', toggleId);

      if (error) throw error;

      setProducts(
        products.map((p) =>
          p.id === toggleId ? { ...p, status: newStatus } : p
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
          <h1 className="text-2xl font-bold text-secondary-900">Manage Products</h1>
          <p className="text-secondary-600 mt-1">{products.length} products</p>
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

          <select
            value={category}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) {
                params.set('category', e.target.value);
              } else {
                params.delete('category');
              }
              setSearchParams(params);
            }}
            className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
          >
            <option value="">All Categories</option>
            {categoryOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
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
          description="No products match your search criteria."
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Created
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
                        <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-secondary-400" />
                        </div>
                        <span className="font-medium text-secondary-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.cooperative ? (
                        <Link
                          to={`/cooperatives/${product.cooperative.id}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          {product.cooperative.name}
                        </Link>
                      ) : (
                        <span className="text-secondary-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-secondary-600">{product.category || '-'}</span>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                      {new Date(product.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {product.status === 'active' && (
                          <Link
                            to={`/products/${product.id}`}
                            className="p-2 text-secondary-400 hover:text-secondary-600"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        )}
                        <button
                          onClick={() => setToggleId(product.id)}
                          className="p-2 text-secondary-400 hover:text-warning-600"
                          title={product.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {product.status === 'active' ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
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
        isOpen={!!toggleId}
        onClose={() => setToggleId(null)}
        onConfirm={handleToggleStatus}
        title="Change Status"
        message="Are you sure you want to change the status of this product?"
        confirmText="Change"
        variant="warning"
        loading={toggling}
      />
    </div>
  );
}
