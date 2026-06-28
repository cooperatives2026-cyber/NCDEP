import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Package, Eye, QrCode, Star, MessageSquare, Heart, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent, LoadingSpinner, Badge, Button } from '../../components/shared';
import { useProductEngagementStats } from '../../hooks';
import { DemandScoreCard } from '../../components/engagement';
import type { ProductWithImages } from '../../types';

export function ProductPerformancePage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductWithImages | null>(null);
  const [loading, setLoading] = useState(true);
  const { stats, loading: statsLoading } = useProductEngagementStats(id);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            images:product_images(*)
          `)
          .eq('id', id)
          .is('deleted_at', null)
          .maybeSingle();

        if (error) throw error;
        setProduct(data as ProductWithImages);
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading || statsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 mx-auto mb-4 text-secondary-300" />
        <p className="text-secondary-500">Product not found</p>
        <Link to="/dashboard/products" className="text-primary-600 mt-2 inline-block">
          Back to Products
        </Link>
      </div>
    );
  }

  const images = product.images || [];
  const mainImage = images.length > 0 ? images[0].image_url : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/dashboard/products"
          className="inline-flex items-center gap-2 text-sm text-secondary-500 hover:text-primary-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary-100">
              {mainImage ? (
                <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-secondary-300" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">{product.name}</h1>
              {product.category && (
                <Badge variant="info" className="mt-1">{product.category}</Badge>
              )}
              <Badge
                variant={
                  product.status === 'active'
                    ? 'success'
                    : product.status === 'draft'
                    ? 'warning'
                    : 'error'
                }
                className="ml-2"
              >
                {product.status}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {product.status === 'active' && (
              <Link
                to={`/products/${product.id}`}
                target="_blank"
              >
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View Public Page
                </Button>
              </Link>
            )}
            <Link to={`/dashboard/products/${product.id}/edit`}>
              <Button size="sm">
                Edit Product
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-secondary-500">Total Views</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.total_views}</p>
              </div>
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-secondary-500">QR Scans</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.total_scans}</p>
              </div>
              <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                <QrCode className="w-5 h-5 text-accent-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-secondary-500">Ratings</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.total_ratings}</p>
                {stats.avg_rating > 0 && (
                  <p className="text-xs text-secondary-500">{stats.avg_rating.toFixed(1)} avg</p>
                )}
              </div>
              <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-warning-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-secondary-500">Reviews</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.total_reviews}</p>
              </div>
              <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-success-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-secondary-500">Interest Signals</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.total_interest}</p>
              </div>
              <div className="w-10 h-10 bg-error-100 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-error-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demand Score */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <DemandScoreCard demandScore={stats.demand_score} />
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                  <span className="text-secondary-700">Views per Interest Signal</span>
                  <span className="font-semibold text-secondary-900">
                    {stats.total_interest > 0
                      ? (stats.total_views / stats.total_interest).toFixed(1)
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                  <span className="text-secondary-700">Scans per Rating</span>
                  <span className="font-semibold text-secondary-900">
                    {stats.total_ratings > 0
                      ? (stats.total_scans / stats.total_ratings).toFixed(1)
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                  <span className="text-secondary-700">Rating Conversion Rate</span>
                  <span className="font-semibold text-secondary-900">
                    {stats.total_views > 0
                      ? ((stats.total_ratings / stats.total_views) * 100).toFixed(1) + '%'
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                  <span className="text-secondary-700">Interest Conversion Rate</span>
                  <span className="font-semibold text-secondary-900">
                    {stats.total_views > 0
                      ? ((stats.total_interest / stats.total_views) * 100).toFixed(1) + '%'
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
