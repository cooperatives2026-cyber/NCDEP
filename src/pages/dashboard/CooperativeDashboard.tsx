import { Link } from 'react-router-dom';
import { Building2, Package, Plus, Edit, Eye, Settings, QrCode, Star, MessageSquare, Heart } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useMyCooperative, useMyProducts } from '../../hooks';
import { useCooperativeEngagementStats, useProductEngagementStats } from '../../hooks/useEngagement';
import { Card, CardHeader, CardTitle, CardContent, LoadingSpinner, EmptyState, Badge } from '../../components/shared';
import { DemandScoreCard } from '../../components/engagement';

export function CooperativeDashboard() {
  const { user } = useAuth();
  const { cooperative, loading: coopLoading } = useMyCooperative();
  const { products, loading: productsLoading } = useMyProducts();
  const { stats: engagementStats, loading: statsLoading } = useCooperativeEngagementStats(cooperative?.id);

  if (coopLoading || productsLoading || statsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const hasCooperative = !!cooperative;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">Dashboard</h1>
        <p className="text-secondary-600 mt-1">Welcome back, {user?.email?.split('@')[0]}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-500 mb-1">Products</p>
                <p className="text-3xl font-bold text-secondary-900">{products.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-500 mb-1">Cooperative</p>
                <p className="text-lg font-semibold text-secondary-900">
                  {hasCooperative ? 'Profile Created' : 'Not Set Up'}
                </p>
              </div>
              <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-accent-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-500 mb-1">Status</p>
                <p className="text-lg font-semibold text-secondary-900">
                  {hasCooperative ? (
                    <Badge variant={cooperative.status === 'active' ? 'success' : 'warning'}>
                      {cooperative.status}
                    </Badge>
                  ) : (
                    <Badge variant="warning">Setup Required</Badge>
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-success-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Stats */}
      {hasCooperative && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">Engagement Overview</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs text-secondary-500">Total Views</p>
                    <p className="text-xl font-bold text-secondary-900">
                      {engagementStats?.total_views?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-accent-600" />
                  </div>
                  <div>
                    <p className="text-xs text-secondary-500">QR Scans</p>
                    <p className="text-xl font-bold text-secondary-900">
                      {engagementStats?.total_scans?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-warning-600" />
                  </div>
                  <div>
                    <p className="text-xs text-secondary-500">Ratings</p>
                    <p className="text-xl font-bold text-secondary-900">
                      {engagementStats?.total_ratings?.toLocaleString() || 0}
                    </p>
                    {engagementStats?.avg_rating > 0 && (
                      <p className="text-xs text-secondary-500">{engagementStats.avg_rating.toFixed(1)} avg</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-success-600" />
                  </div>
                  <div>
                    <p className="text-xs text-secondary-500">Reviews</p>
                    <p className="text-xl font-bold text-secondary-900">
                      {engagementStats?.total_reviews?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-error-100 rounded-lg flex items-center justify-center">
                    <Heart className="w-5 h-5 text-error-600" />
                  </div>
                  <div>
                    <p className="text-xs text-secondary-500">Interest</p>
                    <p className="text-xl font-bold text-secondary-900">
                      {engagementStats?.total_interest?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Demand Score */}
      {hasCooperative && (
        <div className="mb-8">
          <DemandScoreCard
            demandScore={engagementStats?.total_demand_score || 0}
            className="max-w-md"
          />
        </div>
      )}

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cooperative Profile */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Cooperative Profile</CardTitle>
            </CardHeader>
            <CardContent>
              {hasCooperative ? (
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    {cooperative.logo_url ? (
                      <img
                        src={cooperative.logo_url}
                        alt={cooperative.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-primary-100 flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-primary-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-secondary-900">{cooperative.name}</h3>
                      {cooperative.category && (
                        <p className="text-sm text-secondary-500">{cooperative.category}</p>
                      )}
                    </div>
                  </div>

                  {cooperative.description && (
                    <p className="text-sm text-secondary-600 mb-4 line-clamp-3">
                      {cooperative.description}
                    </p>
                  )}

                  <Link
                    to="/dashboard/cooperative/edit"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </Link>
                </div>
              ) : (
                <EmptyState
                  icon={<Building2 className="w-12 h-12" />}
                  title="No cooperative profile"
                  description="Create your cooperative profile to start listing products."
                  action={
                    <Link
                      to="/dashboard/cooperative/new"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                    >
                      <Plus className="w-4 h-4" />
                      Create Profile
                    </Link>
                  }
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Products List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Your Products</CardTitle>
              {hasCooperative && (
                <Link
                  to="/dashboard/products/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {!hasCooperative ? (
                <EmptyState
                  icon={<Package className="w-12 h-12" />}
                  title="Create a cooperative profile first"
                  description="You need to set up your cooperative before adding products."
                  action={
                    <Link
                      to="/dashboard/cooperative/new"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                    >
                      <Plus className="w-4 h-4" />
                      Create Cooperative
                    </Link>
                  }
                />
              ) : products.length === 0 ? (
                <EmptyState
                  icon={<Package className="w-12 h-12" />}
                  title="No products yet"
                  description="Start adding products to showcase what your cooperative offers."
                  action={
                    <Link
                      to="/dashboard/products/new"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                    >
                      <Plus className="w-4 h-4" />
                      Add First Product
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {products.slice(0, 5).map((product) => (
                    <ProductListItem key={product.id} product={product} />
                  ))}

                  {products.length > 5 && (
                    <Link
                      to="/dashboard/products"
                      className="block text-center text-sm text-primary-600 hover:text-primary-700 py-2"
                    >
                      View all {products.length} products
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProductListItem({ product }: { product: any }) {
  const { stats, loading } = useProductEngagementStats(product.id);

  return (
    <div className="flex items-center gap-4 p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors">
      <div className="w-16 h-16 bg-white rounded-lg flex-shrink-0 overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0].image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-6 h-6 text-secondary-300" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-secondary-900 line-clamp-1">
          {product.name}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <Badge
            variant={
              product.status === 'active'
                ? 'success'
                : product.status === 'draft'
                ? 'warning'
                : 'error'
            }
            size="sm"
          >
            {product.status}
          </Badge>
          {product.category && (
            <span className="text-xs text-secondary-500">{product.category}</span>
          )}
        </div>
        {/* Engagement metrics */}
        {!loading && stats && (
          <div className="flex items-center gap-3 mt-2 text-xs text-secondary-500">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {stats.total_views}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {stats.total_ratings}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {stats.total_interest}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
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
      </div>
    </div>
  );
}
