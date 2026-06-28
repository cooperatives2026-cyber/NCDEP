import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar, MapPin, Building2, Users, Package, QrCode, Star, MessageSquare, TrendingUp,
  Check, X, Plus, Eye, Award
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, LoadingSpinner, ConfirmDialog } from '../../components/shared';
import {
  useEvent, useEventStats, useEventParticipants, useEventProducts, useEventProductRankings,
  useParticipantMutations, useEventMutations
} from '../../hooks';
import type { EventParticipant, EventProduct } from '../../types';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'info' | 'error' | 'default'> = {
  draft: 'default',
  scheduled: 'info',
  active: 'success',
  completed: 'warning',
  cancelled: 'error',
};

const PARTICIPANT_STATUS_COLORS: Record<string, 'success' | 'warning' | 'info' | 'error' | 'default'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  active: 'info',
};

export function AdminEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'products' | 'rankings'>('overview');
  const [actionParticipant, setActionParticipant] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const [processing, setProcessing] = useState(false);

  const { event, loading: eventLoading } = useEvent(id);
  const { stats, loading: statsLoading, refetch: refetchStats } = useEventStats(id);
  const { participants, loading: participantsLoading, refetch: refetchParticipants } = useEventParticipants(id);
  const { products, loading: productsLoading } = useEventProducts(id);
  const { rankings, loading: rankingsLoading } = useEventProductRankings(id);

  const { approveParticipant, rejectParticipant, addProductToEvent, removeProductFromEvent } = useParticipantMutations();
  const { activateEvent, completeEvent, publishEvent } = useEventMutations();

  const handleParticipantAction = async () => {
    if (!actionParticipant) return;

    setProcessing(true);
    try {
      if (actionParticipant.action === 'approve') {
        await approveParticipant(actionParticipant.id);
      } else {
        await rejectParticipant(actionParticipant.id);
      }
      await refetchParticipants();
      await refetchStats();
    } catch (err) {
      console.error('Error updating participant:', err);
    } finally {
      setProcessing(false);
      setActionParticipant(null);
    }
  };

  const handleStatusChange = async (newStatus: 'scheduled' | 'active' | 'completed') => {
    if (!id) return;

    try {
      if (newStatus === 'scheduled') {
        await publishEvent(id);
      } else if (newStatus === 'active') {
        await activateEvent(id);
      } else if (newStatus === 'completed') {
        await completeEvent(id);
      }
      window.location.reload();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  if (eventLoading || !event) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', count: null },
    { id: 'participants', label: 'Participants', count: participants.length },
    { id: 'products', label: 'Products', count: products.length },
    { id: 'rankings', label: 'Rankings', count: null },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/events')}
          className="flex items-center gap-2 text-sm text-secondary-600 hover:text-secondary-900 mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Events
        </button>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-secondary-900">{event.name}</h1>
              <Badge variant={STATUS_COLORS[event.status]}>{event.status}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-600">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
              </span>
              {event.venue && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {event.venue}
                </span>
              )}
              {event.county && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {event.county}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/admin/events/${id}/edit`}>
              <Button variant="outline" size="sm">Edit Event</Button>
            </Link>
            {event.status === 'draft' && (
              <Button size="sm" onClick={() => handleStatusChange('scheduled')}>Publish</Button>
            )}
            {event.status === 'scheduled' && (
              <Button size="sm" onClick={() => handleStatusChange('active')}>Activate</Button>
            )}
            {event.status === 'active' && (
              <Button size="sm" variant="outline" onClick={() => handleStatusChange('completed')}>Complete</Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <Card className="p-4 text-center">
            <Users className="w-6 h-6 text-primary-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-secondary-900">{stats.total_participants}</p>
            <p className="text-xs text-secondary-500">Participants</p>
          </Card>
          <Card className="p-4 text-center">
            <Check className="w-6 h-6 text-success-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-secondary-900">{stats.approved_participants}</p>
            <p className="text-xs text-secondary-500">Approved</p>
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
          <Card className="p-4 text-center">
            <MessageSquare className="w-6 h-6 text-secondary-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-secondary-900">{stats.total_reviews}</p>
            <p className="text-xs text-secondary-500">Reviews</p>
          </Card>
          <Card className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-success-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-secondary-900">{stats.total_interest}</p>
            <p className="text-xs text-secondary-500">Interest</p>
          </Card>
          <Card className="p-4 text-center">
            <Award className="w-6 h-6 text-primary-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-secondary-900">{stats.avg_rating?.toFixed(1) || '0.0'}</p>
            <p className="text-xs text-secondary-500">Avg Rating</p>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-secondary-200 mb-6">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
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
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-secondary-600 whitespace-pre-wrap">
                {event.description || 'No description provided.'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-secondary-500">Type</span>
                <span className="font-medium text-secondary-900">{event.event_type}</span>
              </div>
              {event.organizer && (
                <div className="flex justify-between">
                  <span className="text-secondary-500">Organizer</span>
                  <span className="font-medium text-secondary-900">{event.organizer}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-secondary-500">Start</span>
                <span className="font-medium text-secondary-900">
                  {new Date(event.start_date).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-500">End</span>
                <span className="font-medium text-secondary-900">
                  {new Date(event.end_date).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'participants' && (
        <div>
          {participantsLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : participants.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-500">No participants yet</p>
            </Card>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-secondary-100 overflow-hidden">
              <table className="min-w-full divide-y divide-secondary-100">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Cooperative</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">County</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Products</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Applied</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-100">
                  {participants.map((p) => (
                    <tr key={p.id} className="hover:bg-secondary-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/cooperatives/${p.cooperative_id}`} className="font-medium text-primary-600 hover:text-primary-700">
                          {p.cooperative?.name || 'Unknown'}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-secondary-600">
                        {p.cooperative?.county || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-secondary-600">
                        {p.products_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={PARTICIPANT_STATUS_COLORS[p.status]}>{p.status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                        {new Date(p.applied_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {p.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActionParticipant({ id: p.id, action: 'approve' })}
                            >
                              <Check className="w-4 h-4 text-success-600" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActionParticipant({ id: p.id, action: 'reject' })}
                            >
                              <X className="w-4 h-4 text-error-600" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'products' && (
        <div>
          {productsLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : products.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-500">No products associated with this event</p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((ep) => (
                <Card key={ep.id} className="overflow-hidden">
                  {ep.product?.images && ep.product.images.length > 0 ? (
                    <img
                      src={ep.product.images[0].image_url}
                      alt={ep.product.name}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-secondary-100 flex items-center justify-center">
                      <Package className="w-10 h-10 text-secondary-300" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-medium text-secondary-900 line-clamp-1">{ep.product?.name}</h3>
                    {ep.product?.category && (
                      <span className="text-xs text-secondary-500">{ep.product.category}</span>
                    )}
                    <div className="flex items-center justify-end mt-3">
                      <Link to={`/products/${ep.product_id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'rankings' && (
        <div>
          {rankingsLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : rankings.length === 0 ? (
            <Card className="p-12 text-center">
              <Award className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-500">No product rankings yet. Engagement data will appear here once the event is active.</p>
            </Card>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-secondary-100 overflow-hidden">
              <table className="min-w-full divide-y divide-secondary-100">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Cooperative</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-secondary-500 uppercase">Scans</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-secondary-500 uppercase">Ratings</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-secondary-500 uppercase">Reviews</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-secondary-500 uppercase">Interest</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Score</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-100">
                  {rankings.map((r, idx) => (
                    <tr key={r.product_id} className="hover:bg-secondary-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          idx < 3 ? 'bg-warning-100 text-warning-700' : 'bg-secondary-100 text-secondary-600'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-secondary-900">
                        {r.product_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-secondary-600">
                        {r.cooperative_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-secondary-600">
                        {r.scan_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-secondary-600">
                        {r.rating_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-secondary-600">
                        {r.review_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-secondary-600">
                        {r.interest_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="font-bold text-primary-600">{r.demand_score}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!actionParticipant}
        onClose={() => setActionParticipant(null)}
        onConfirm={handleParticipantAction}
        title={actionParticipant?.action === 'approve' ? 'Approve Participant' : 'Reject Participant'}
        message={`Are you sure you want to ${actionParticipant?.action} this participant?`}
        confirmText={actionParticipant?.action === 'approve' ? 'Approve' : 'Reject'}
        variant={actionParticipant?.action === 'approve' ? 'success' : 'danger'}
        loading={processing}
      />
    </div>
  );
}
