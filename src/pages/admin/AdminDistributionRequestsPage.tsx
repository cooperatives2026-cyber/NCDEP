import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Search, MapPin, Building2, Package, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Badge, LoadingSpinner, EmptyState, Button, Modal } from '../../components/shared';
import { useRequestTypes, useRequestorTypes } from '../../hooks';
import type { DistributionRequest } from '../../types';

interface RequestWithDetails extends DistributionRequest {
  cooperative?: { id: string; name: string } | null;
  product?: { id: string; name: string } | null;
  aggregation_center?: { id: string; name: string } | null;
}

export function AdminDistributionRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState<RequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RequestWithDetails | null>(null);
  const [updating, setUpdating] = useState(false);

  const { requestTypes } = useRequestTypes();
  const { requestorTypes } = useRequestorTypes();

  const search = searchParams.get('q') || '';
  const typeFilter = searchParams.get('type') || '';
  const statusFilter = searchParams.get('status') || '';
  const urgencyFilter = searchParams.get('urgency') || '';

  useEffect(() => {
    fetchRequests();
  }, [search, typeFilter, statusFilter, urgencyFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('distribution_requests')
        .select(`
          *,
          cooperative:cooperatives(id, name),
          product:products(id, name),
          aggregation_center:aggregation_centers(id, name)
        `)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }
      if (typeFilter) {
        query = query.eq('request_type', typeFilter);
      }
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      if (urgencyFilter) {
        query = query.eq('urgency', urgencyFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRequests(data as RequestWithDetails[] || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string, notes?: string) => {
    if (!selectedRequest) return;
    setUpdating(true);
    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'fulfilled') {
        updateData.fulfilled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('distribution_requests')
        .update(updateData)
        .eq('id', selectedRequest.id);

      if (error) throw error;
      setRequests(requests.map(r => r.id === selectedRequest.id ? { ...r, ...updateData } : r));
      setSelectedRequest(null);
    } catch (err) {
      console.error('Error updating request:', err);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-warning-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-success-500" />;
      case 'fulfilled':
        return <CheckCircle className="w-4 h-4 text-primary-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-error-500" />;
      default:
        return <FileText className="w-4 h-4 text-secondary-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Distribution Requests</h1>
          <p className="text-secondary-600 mt-1">{requests.length} requests total</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-secondary-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={(e) => { e.preventDefault(); fetchRequests(); }} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search requests..."
                onChange={(e) => {
                  const params = new URLSearchParams(searchParams);
                  if (e.target.value) params.set('q', e.target.value);
                  else params.delete('q');
                  setSearchParams(params);
                }}
                className="w-full pl-10 pr-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
              />
            </div>
          </form>

          <select
            value={typeFilter}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('type', e.target.value);
              else params.delete('type');
              setSearchParams(params);
            }}
            className="px-4 py-2 border border-secondary-200 rounded-lg"
          >
            <option value="">All Types</option>
            {requestTypes.map(t => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('status', e.target.value);
              else params.delete('status');
              setSearchParams(params);
            }}
            className="px-4 py-2 border border-secondary-200 rounded-lg"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('urgency', e.target.value);
              else params.delete('urgency');
              setSearchParams(params);
            }}
            className="px-4 py-2 border border-secondary-200 rounded-lg"
          >
            <option value="">All Urgency</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : requests.length === 0 ? (
        <EmptyState icon={<FileText className="w-12 h-12" />} title="No requests found" description="Distribution requests will appear here when submitted." />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-secondary-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-100">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Request</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Requestor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Urgency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-secondary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-secondary-900">{req.title}</p>
                          {req.product && (
                            <p className="text-xs text-secondary-500 flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {req.product.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {req.cooperative ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Building2 className="w-4 h-4 text-secondary-400" />
                          {req.cooperative.name}
                        </div>
                      ) : (
                        <span className="text-sm text-secondary-400">{req.requestor_type || 'Unknown'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="info" size="sm">{req.request_type}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          req.urgency === 'urgent' ? 'error' :
                          req.urgency === 'high' ? 'warning' :
                          'secondary'
                        }
                        size="sm"
                      >
                        {req.urgency}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(req.status)}
                        <span className="text-sm capitalize">{req.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-secondary-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(req.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelectedRequest(req)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)}>
        {selectedRequest && (
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-secondary-900">{selectedRequest.title}</h2>
                <p className="text-sm text-secondary-500 mt-1">Request ID: {selectedRequest.id}</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(selectedRequest.status)}
                <Badge
                  variant={
                    selectedRequest.status === 'fulfilled' ? 'success' :
                    selectedRequest.status === 'cancelled' ? 'error' :
                    selectedRequest.status === 'approved' ? 'info' : 'warning'
                  }
                >
                  {selectedRequest.status}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-secondary-500 uppercase">Request Type</p>
                  <p className="font-medium">{selectedRequest.request_type}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary-500 uppercase">Urgency</p>
                  <Badge
                    variant={
                      selectedRequest.urgency === 'urgent' ? 'error' :
                      selectedRequest.urgency === 'high' ? 'warning' : 'secondary'
                    }
                  >
                    {selectedRequest.urgency}
                  </Badge>
                </div>
              </div>

              {selectedRequest.description && (
                <div>
                  <p className="text-xs text-secondary-500 uppercase mb-1">Description</p>
                  <p className="text-sm text-secondary-700">{selectedRequest.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedRequest.cooperative && (
                  <div>
                    <p className="text-xs text-secondary-500 uppercase">Cooperative</p>
                    <p className="font-medium">{selectedRequest.cooperative.name}</p>
                  </div>
                )}
                {selectedRequest.product && (
                  <div>
                    <p className="text-xs text-secondary-500 uppercase">Product</p>
                    <p className="font-medium">{selectedRequest.product.name}</p>
                  </div>
                )}
              </div>

              {selectedRequest.aggregation_center && (
                <div>
                  <p className="text-xs text-secondary-500 uppercase">Aggregation Center</p>
                  <p className="font-medium">{selectedRequest.aggregation_center.name}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-secondary-500 uppercase">Quantity</p>
                  <p className="font-medium">
                    {selectedRequest.quantity} {selectedRequest.quantity_unit}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-secondary-500 uppercase">Preferred Date</p>
                  <p className="font-medium">
                    {selectedRequest.preferred_date
                      ? new Date(selectedRequest.preferred_date).toLocaleDateString()
                      : 'Not specified'}
                  </p>
                </div>
              </div>

              {(selectedRequest.source_county || selectedRequest.destination_county) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedRequest.source_county && (
                    <div>
                      <p className="text-xs text-secondary-500 uppercase">Source</p>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-secondary-400" />
                        {selectedRequest.source_county}
                      </div>
                    </div>
                  )}
                  {selectedRequest.destination_county && (
                    <div>
                      <p className="text-xs text-secondary-500 uppercase">Destination</p>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-secondary-400" />
                        {selectedRequest.destination_county}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedRequest.status !== 'fulfilled' && selectedRequest.status !== 'cancelled' && (
              <div className="flex gap-3 mt-6 pt-6 border-t border-secondary-100">
                {selectedRequest.status === 'pending' && (
                  <>
                    <Button
                      variant="success"
                      className="flex-1"
                      onClick={() => handleStatusUpdate('approved')}
                      loading={updating}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      className="flex-1"
                      onClick={() => handleStatusUpdate('cancelled')}
                      loading={updating}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {selectedRequest.status === 'approved' && (
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => handleStatusUpdate('fulfilled')}
                    loading={updating}
                  >
                    Mark Fulfilled
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                  Close
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
