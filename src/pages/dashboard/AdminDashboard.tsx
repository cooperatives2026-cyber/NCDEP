import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Package, Users, TrendingUp, Eye, Edit, QrCode, Star, MessageSquare, AlertCircle, Calendar, Briefcase, Award, Store, Truck, Warehouse, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent, LoadingSpinner, Badge, Button } from '../../components/shared';
import { usePlatformAnalytics, useReviewModeration, usePlatformEventAnalytics, useMarketLinkageStats, useNCDEStats } from '../../hooks';
import type { Cooperative, Product } from '../../types';

interface RecentCooperative extends Cooperative {
  owner_email?: string;
}

export function AdminDashboard() {
  const [recentCooperatives, setRecentCooperatives] = useState<RecentCooperative[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Platform analytics - stats are now returned from this hook
  const {
    loading: analyticsLoading,
    stats,
    topScannedProducts,
    topRatedProducts,
    mostDemandedProducts,
    totalPlatformScans,
  } = usePlatformAnalytics();

  // Event analytics
  const { analytics: eventAnalytics, loading: eventAnalyticsLoading } = usePlatformEventAnalytics();

  // Market linkage analytics
  const { stats: marketStats, loading: marketLoading } = useMarketLinkageStats();

  // NCDE analytics
  const { stats: ncdeStats, loading: ncdeLoading } = useNCDEStats();

  // Review moderation
  const { totalPending } = useReviewModeration();

  useEffect(() => {
    fetchRecentItems();
  }, []);

  const fetchRecentItems = async () => {
    setLoading(true);

    try {
      // Fetch recent cooperatives with owner email
      const { data: recentCoops } = await supabase
        .from('cooperatives')
        .select(`
          *,
          users!cooperatives_user_id_fkey (email)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentCoops) {
        setRecentCooperatives(
          recentCoops.map((coop: any) => ({
            ...coop,
            owner_email: coop.users?.email,
          }))
        );
      }

      // Fetch recent products
      const { data: recentProds } = await supabase
        .from('products')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentProds) {
        setRecentProducts(recentProds);
      }
    } catch (err) {
      console.error('Error fetching recent items:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || analyticsLoading || eventAnalyticsLoading || marketLoading || ncdeLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">Admin Dashboard</h1>
        <p className="text-secondary-600 mt-1">Platform overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-500 mb-1">Total Cooperatives</p>
                <p className="text-3xl font-bold text-secondary-900">{stats.totalCooperatives}</p>
                <p className="text-xs text-success-600 mt-1">{stats.activeCooperatives} active</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-500 mb-1">Total Products</p>
                <p className="text-3xl font-bold text-secondary-900">{stats.totalProducts}</p>
                <p className="text-xs text-success-600 mt-1">{stats.activeProducts} active</p>
              </div>
              <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-accent-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-500 mb-1">Users</p>
                <p className="text-3xl font-bold text-secondary-900">{stats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-warning-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-500 mb-1">Platform QR Scans</p>
                <p className="text-3xl font-bold text-secondary-900">{totalPlatformScans}</p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                <QrCode className="w-6 h-6 text-success-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Stats Grid */}
      {eventAnalytics && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">Event Analytics</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary-500 mb-1">Total Events</p>
                    <p className="text-3xl font-bold text-secondary-900">{eventAnalytics.total_events}</p>
                    <p className="text-xs text-success-600 mt-1">{eventAnalytics.active_events} active</p>
                  </div>
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary-500 mb-1">Event Participants</p>
                    <p className="text-3xl font-bold text-secondary-900">{eventAnalytics.total_participants}</p>
                  </div>
                  <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-accent-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary-500 mb-1">Event Products</p>
                    <p className="text-3xl font-bold text-secondary-900">{eventAnalytics.total_event_products}</p>
                  </div>
                  <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-warning-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary-500 mb-1">Event Scans</p>
                    <p className="text-3xl font-bold text-secondary-900">{eventAnalytics.total_event_scans}</p>
                  </div>
                  <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-success-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Phase 2 Analytics Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-secondary-900 mb-4">Engagement Analytics</h2>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Top Scanned Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-accent-600" />
                Top Scanned Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner />
                </div>
              ) : topScannedProducts.length === 0 ? (
                <p className="text-secondary-500 text-center py-4">No scans yet</p>
              ) : (
                <div className="space-y-3">
                  {topScannedProducts.slice(0, 5).map((item: any, index: number) => (
                    <div key={item.product_id} className="flex items-center justify-between p-2 bg-secondary-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-secondary-400">#{index + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-secondary-900 line-clamp-1">{item.product_name}</p>
                          {item.cooperative && (
                            <p className="text-xs text-secondary-500">{item.cooperative.name}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="info" size="sm">{item.scan_count} scans</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Rated Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-warning-600" />
                Top Rated Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner />
                </div>
              ) : topRatedProducts.length === 0 ? (
                <p className="text-secondary-500 text-center py-4">No ratings yet</p>
              ) : (
                <div className="space-y-3">
                  {topRatedProducts.slice(0, 5).map((item: any, index: number) => (
                    <div key={item.product_id} className="flex items-center justify-between p-2 bg-secondary-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-secondary-400">#{index + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-secondary-900 line-clamp-1">{item.product_name}</p>
                          {item.cooperative && (
                            <p className="text-xs text-secondary-500">{item.cooperative.name}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="warning" size="sm">{item.avg_rating.toFixed(1)} stars</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Most Demanded Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success-600" />
                Most Demanded Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner />
                </div>
              ) : mostDemandedProducts.length === 0 ? (
                <p className="text-secondary-500 text-center py-4">No demand signals yet</p>
              ) : (
                <div className="space-y-3">
                  {mostDemandedProducts.slice(0, 5).map((item: any, index: number) => (
                    <div key={item.product_id} className="flex items-center justify-between p-2 bg-secondary-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-secondary-400">#{index + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-secondary-900 line-clamp-1">{item.product_name}</p>
                          {item.cooperative && (
                            <p className="text-xs text-secondary-500">{item.cooperative.name}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="success" size="sm">{item.demand_score.toFixed(0)} score</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Link to="/admin/cooperatives">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-secondary-900">Manage Cooperatives</p>
                <p className="text-sm text-secondary-500">View, edit, activate</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/products">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-accent-600" />
              </div>
              <div>
                <p className="font-medium text-secondary-900">Manage Products</p>
                <p className="text-sm text-secondary-500">View, edit, activate</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/events">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-info-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-info-600" />
              </div>
              <div>
                <p className="font-medium text-secondary-900">Manage Events</p>
                <p className="text-sm text-secondary-500">Create, schedule events</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/users">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-warning-600" />
              </div>
              <div>
                <p className="font-medium text-secondary-900">Manage Users</p>
                <p className="text-sm text-secondary-500">View, manage roles</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/reviews">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <p className="font-medium text-secondary-900">Review Moderation</p>
                <p className="text-sm text-secondary-500">
                  {totalPending > 0 ? `${totalPending} pending` : 'No pending'}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/buyers">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-accent-600" />
              </div>
              <div>
                <p className="font-medium text-secondary-900">Manage Buyers</p>
                <p className="text-sm text-secondary-500">{marketStats?.total_buyers || 0} buyers</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/retail-outlets">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-secondary-900">Retail Outlets</p>
                <p className="text-sm text-secondary-500">{ncdeStats?.total_outlets || 0} outlets</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/distribution-partners">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-info-100 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-info-600" />
              </div>
              <div>
                <p className="font-medium text-secondary-900">Distribution Partners</p>
                <p className="text-sm text-secondary-500">{ncdeStats?.total_partners || 0} partners</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Market Linkage Stats */}
      {marketStats && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">Market Linkages</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary-500 mb-1">Open Opportunities</p>
                    <p className="text-3xl font-bold text-secondary-900">{marketStats.open_opportunities}</p>
                  </div>
                  <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-success-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary-500 mb-1">Total Responses</p>
                    <p className="text-3xl font-bold text-secondary-900">{marketStats.total_responses}</p>
                  </div>
                  <div className="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-info-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary-500 mb-1">Successful Matches</p>
                    <p className="text-3xl font-bold text-secondary-900">{marketStats.awarded_responses}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary-500 mb-1">Verified Buyers</p>
                    <p className="text-3xl font-bold text-secondary-900">{marketStats.verified_buyers}</p>
                  </div>
                  <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-warning-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* NCDE Distribution Stats */}
      {ncdeStats && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">Distribution Network (NCDE)</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary-500 mb-1">Retail Outlets</p>
                    <p className="text-3xl font-bold text-secondary-900">{ncdeStats.total_outlets}</p>
                    <p className="text-xs text-success-600 mt-1">{ncdeStats.active_outlets} active</p>
                  </div>
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Store className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary-500 mb-1">Distribution Partners</p>
                    <p className="text-3xl font-bold text-secondary-900">{ncdeStats.total_partners}</p>
                    <p className="text-xs text-success-600 mt-1">{ncdeStats.active_partners} active</p>
                  </div>
                  <div className="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center">
                    <Truck className="w-6 h-6 text-info-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary-500 mb-1">Aggregation Centers</p>
                    <p className="text-3xl font-bold text-secondary-900">{ncdeStats.total_centers}</p>
                    <p className="text-xs text-success-600 mt-1">{ncdeStats.active_centers} active</p>
                  </div>
                  <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                    <Warehouse className="w-6 h-6 text-warning-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary-500 mb-1">Distribution Requests</p>
                    <p className="text-3xl font-bold text-secondary-900">{ncdeStats.total_requests}</p>
                    <p className="text-xs text-warning-600 mt-1">{ncdeStats.pending_requests} pending</p>
                  </div>
                  <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-accent-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Cooperatives */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Cooperatives</CardTitle>
            <Link
              to="/admin/cooperatives"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCooperatives.length === 0 ? (
                <p className="text-secondary-500 text-center py-4">No cooperatives yet</p>
              ) : (
                recentCooperatives.map((coop) => (
                  <div
                    key={coop.id}
                    className="flex items-center gap-4 p-3 bg-secondary-50 rounded-lg"
                  >
                    <div className="w-12 h-12 bg-white rounded-lg flex-shrink-0 overflow-hidden">
                      {coop.logo_url ? (
                        <img
                          src={coop.logo_url}
                          alt={coop.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-secondary-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-secondary-900 line-clamp-1">{coop.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={coop.status === 'active' ? 'success' : 'warning'}
                          size="sm"
                        >
                          {coop.status}
                        </Badge>
                        {coop.category && (
                          <span className="text-xs text-secondary-500">{coop.category}</span>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/admin/cooperatives/${coop.id}`}
                      className="p-2 text-secondary-400 hover:text-primary-600"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Products</CardTitle>
            <Link
              to="/admin/products"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProducts.length === 0 ? (
                <p className="text-secondary-500 text-center py-4">No products yet</p>
              ) : (
                recentProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 p-3 bg-secondary-50 rounded-lg"
                  >
                    <div className="w-12 h-12 bg-white rounded-lg flex-shrink-0 flex items-center justify-center">
                      <Package className="w-5 h-5 text-secondary-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-secondary-900 line-clamp-1">{product.name}</h4>
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
                    </div>
                    <div className="flex items-center gap-1">
                      {product.status === 'active' && (
                        <Link
                          to={`/products/${product.id}`}
                          className="p-2 text-secondary-400 hover:text-secondary-600"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      )}
                      <Link
                        to={`/admin/products/${product.id}`}
                        className="p-2 text-secondary-400 hover:text-primary-600"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Reviews Alert */}
      {totalPending > 0 && (
        <div className="mt-8">
          <Card className="border-warning-200 bg-warning-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-warning-600" />
                <div className="flex-1">
                  <p className="font-medium text-warning-800">
                    {totalPending} review{totalPending !== 1 ? 's' : ''} pending moderation
                  </p>
                  <p className="text-sm text-warning-600">
                    Review and approve or reject pending reviews.
                  </p>
                </div>
                <Link to="/admin/reviews">
                  <Button size="sm" variant="outline">
                    View Reviews
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
