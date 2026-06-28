import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Building2, Users, Package, QrCode, Star, Award } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent, Badge, LoadingSpinner, Button } from '../../components/shared';
import { useEvent, useEventStats, useEventParticipants, useEventProducts, useEventProductRankings } from '../../hooks';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'info' | 'error' | 'default'> = {
  draft: 'default',
  scheduled: 'info',
  active: 'success',
  completed: 'warning',
  cancelled: 'error',
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Upcoming',
  active: 'Happening Now',
  completed: 'Completed',
};

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'products' | 'rankings'>('overview');

  const { event, loading: eventLoading } = useEvent(id);
  const { stats } = useEventStats(id);
  const { participants } = useEventParticipants(id, 'approved');
  const { products } = useEventProducts(id);
  const { rankings } = useEventProductRankings(id);

  if (eventLoading || !event) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      {event.banner_image_url ? (
        <div className="relative h-64 -mx-4 sm:-mx-6 lg:-mx-8 mb-8">
          <img
            src={event.banner_image_url}
            alt={event.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-medium text-white bg-white/20 backdrop-blur px-2 py-1 rounded">
                {event.event_type}
              </span>
              <Badge variant={STATUS_COLORS[event.status]}>{STATUS_LABELS[event.status] || event.status}</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">{event.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-white/80">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
              </span>
              {event.venue && (
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {event.venue}
                </span>
              )}
              {event.county && (
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {event.county}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
              {event.event_type}
            </span>
            <Badge variant={STATUS_COLORS[event.status]}>{STATUS_LABELS[event.status] || event.status}</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-secondary-900 mb-4">{event.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-secondary-600">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
            </span>
            {event.venue && (
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {event.venue}
              </span>
            )}
            {event.county && (
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {event.county}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (event.status === 'active' || event.status === 'completed') && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center">
            <Users className="w-6 h-6 text-primary-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-secondary-900">{stats.approved_participants}</p>
            <p className="text-xs text-secondary-500">Participants</p>
          </Card>
          <Card className="p-4 text-center">
            <Package className="w-6 h-6 text-accent-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-secondary-900">{stats.total_products}</p>
            <p className="text-xs text-secondary-500">Products</p>
          </Card>
          <Card className="p-4 text-center">
            <QrCode className="w-6 h-6 text-info-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-secondary-900">{stats.total_scans}</p>
            <p className="text-xs text-secondary-500">QR Scans</p>
          </Card>
          <Card className="p-4 text-center">
            <Star className="w-6 h-6 text-warning-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-secondary-900">{stats.total_ratings}</p>
            <p className="text-xs text-secondary-500">Ratings</p>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-secondary-200 mb-6">
        <nav className="flex gap-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'participants', label: 'Participants', count: participants.length },
            { id: 'products', label: 'Products', count: products.length },
            { id: 'rankings', label: 'Rankings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 px-2 py-0.5 bg-secondary-100 text-secondary-600 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>About This Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-secondary-600 whitespace-pre-wrap">
                  {event.description || 'No description provided.'}
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-secondary-500">Start Date</p>
                  <p className="font-medium text-secondary-900">
                    {new Date(event.start_date).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-secondary-500">End Date</p>
                  <p className="font-medium text-secondary-900">
                    {new Date(event.end_date).toLocaleString()}
                  </p>
                </div>
                {event.organizer && (
                  <div>
                    <p className="text-sm text-secondary-500">Organizer</p>
                    <p className="font-medium text-secondary-900">{event.organizer}</p>
                  </div>
                )}
                {event.venue && (
                  <div>
                    <p className="text-sm text-secondary-500">Venue</p>
                    <p className="font-medium text-secondary-900">{event.venue}</p>
                  </div>
                )}
                {event.county && (
                  <div>
                    <p className="text-sm text-secondary-500">County</p>
                    <p className="font-medium text-secondary-900">{event.county}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'participants' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {participants.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <div className="h-24 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                {p.cooperative?.logo_url ? (
                  <img
                    src={p.cooperative.logo_url}
                    alt={p.cooperative.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white"
                  />
                ) : (
                  <Building2 className="w-12 h-12 text-primary-400" />
                )}
              </div>
              <div className="p-4">
                <Link
                  to={`/cooperatives/${p.cooperative_id}`}
                  className="font-medium text-secondary-900 hover:text-primary-600 line-clamp-1"
                >
                  {p.cooperative?.name || 'Unknown Cooperative'}
                </Link>
                {p.cooperative?.county && (
                  <p className="text-sm text-secondary-500">{p.cooperative.county}</p>
                )}
                <div className="mt-2 flex items-center gap-2 text-xs text-secondary-500">
                  <Package className="w-3 h-3" />
                  <span>{p.products_count} products</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'products' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((ep) => (
            <Link key={ep.id} to={`/products/${ep.product_id}`}>
              <Card className="h-full hover:shadow-md transition-shadow overflow-hidden">
                {ep.product?.images && ep.product.images.length > 0 ? (
                  <img
                    src={ep.product.images[0].image_url}
                    alt={ep.product.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-secondary-100 flex items-center justify-center">
                    <Package className="w-12 h-12 text-secondary-300" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-medium text-secondary-900 line-clamp-1">{ep.product?.name}</h3>
                  {ep.product?.category && (
                    <span className="text-xs text-secondary-500">{ep.product.category}</span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {activeTab === 'rankings' && (
        <div>
          {rankings.length === 0 ? (
            <Card className="p-12 text-center">
              <Award className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-500">
                Product rankings will be available once the event begins and engagement data is collected.
              </p>
            </Card>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-secondary-100 overflow-hidden">
              <table className="min-w-full divide-y divide-secondary-100">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Cooperative</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-secondary-500 uppercase">Scans</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-secondary-500 uppercase">Avg Rating</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-secondary-500 uppercase">Interest</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-100">
                  {rankings.slice(0, 20).map((r, idx) => (
                    <tr key={r.product_id} className="hover:bg-secondary-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                          idx === 0 ? 'bg-warning-100 text-warning-700' :
                          idx === 1 ? 'bg-secondary-200 text-secondary-700' :
                          idx === 2 ? 'bg-amber-100 text-amber-700' :
                          'bg-secondary-50 text-secondary-600'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/products/${r.product_id}`} className="font-medium text-primary-600 hover:text-primary-700">
                          {r.product_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-secondary-600">
                        {r.cooperative_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-secondary-600">
                        {r.scan_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 text-warning-500" />
                          {r.avg_rating?.toFixed(1) || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-secondary-600">
                        {r.interest_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
