import { useState } from 'react';
import { MapPin, Store, Truck, Building2, AlertCircle, Package } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, LoadingSpinner, Modal } from '../shared';
import { useProductAvailability, useProductAvailabilitySummary, useProductDistributors } from '../../hooks';

interface ProductAvailabilityWidgetProps {
  productId: string;
}

export function ProductAvailabilityWidget({ productId }: ProductAvailabilityWidgetProps) {
  const { availability, loading: availabilityLoading } = useProductAvailability(productId);
  const { summary, loading: summaryLoading } = useProductAvailabilitySummary(productId);
  const { distributors, loading: distributorsLoading } = useProductDistributors(productId);
  const [showModal, setShowModal] = useState(false);

  if (summaryLoading || availabilityLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.total_locations === 0 && distributors.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-600" />
            Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-primary-50 rounded-lg">
              <p className="text-2xl font-bold text-primary-700">{summary.total_locations}</p>
              <p className="text-xs text-primary-600">Locations</p>
            </div>
            <div className="text-center p-3 bg-success-50 rounded-lg">
              <p className="text-2xl font-bold text-success-700">{summary.counties_available}</p>
              <p className="text-xs text-success-600">Counties</p>
            </div>
          </div>

          {summary.available_count > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-secondary-500">Available at:</span>
              <Badge variant="success" size="sm">{summary.available_count} locations</Badge>
            </div>
          )}

          {distributors.length > 0 && (
            <div className="flex items-center gap-2 mb-3 pt-2 border-t border-secondary-100">
              <Truck className="w-4 h-4 text-secondary-400" />
              <span className="text-sm text-secondary-600">{distributors.length} distribution partner{distributors.length !== 1 ? 's' : ''}</span>
            </div>
          )}

          <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setShowModal(true)}>
            View Details
          </Button>
        </CardContent>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-secondary-900 mb-6">Where to Buy</h2>

          {availability.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-secondary-700 mb-3 flex items-center gap-2">
                <Store className="w-4 h-4" />
                Retail Outlets
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availability.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                    <div>
                      <p className="font-medium text-secondary-900">{a.outlet?.name || 'Unknown Outlet'}</p>
                      <p className="text-xs text-secondary-500">{a.outlet?.county || a.outlet?.town || ''}</p>
                    </div>
                    <Badge variant={a.status === 'available' ? 'success' : a.status === 'limited_stock' ? 'warning' : 'error'} size="sm">
                      {a.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {distributors.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-secondary-700 mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Distribution Partners
              </h3>
              <div className="space-y-2">
                {distributors.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                    <div>
                      <p className="font-medium text-secondary-900">{d.distributor?.name}</p>
                      <p className="text-xs text-secondary-500">{d.distributor?.partner_type}</p>
                    </div>
                    {d.exclusive && <Badge variant="info" size="sm">Exclusive</Badge>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button variant="outline" className="w-full mt-6" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </>
  );
}
