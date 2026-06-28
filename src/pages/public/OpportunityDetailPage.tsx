import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Briefcase, Building2, MapPin, Clock, Users, Shield, Calendar, Package, FileText, Send } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, LoadingSpinner, Button, Modal, Textarea, Input } from '../../components/shared';
import { useOpportunity, useOpportunityStats, useAuth, useMyCooperative, useResponseMutations, useOpportunityResponses } from '../../hooks';
import type { Opportunity, OpportunityResponse } from '../../types';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'info' | 'error' | 'default'> = {
  open: 'success',
  under_review: 'warning',
  awarded: 'info',
  closed: 'error',
  cancelled: 'error',
};

export function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { cooperative } = useMyCooperative();
  const { opportunity, loading: oppLoading } = useOpportunity(id);
  const { stats } = useOpportunityStats(id);
  const { responses } = useOpportunityResponses(id);
  const { submitResponse } = useResponseMutations();

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  const [formData, setFormData] = useState({
    products_offered: '',
    quantity_available: '',
    quantity_unit: 'kg',
    price_per_unit: '',
    notes: '',
    capacity_information: '',
  });

  useEffect(() => {
    if (cooperative && responses) {
      setHasApplied(responses.some((r: OpportunityResponse) => r.cooperative_id === cooperative.id));
    }
  }, [cooperative, responses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cooperative || !id) return;

    setSubmitting(true);
    try {
      const result = await submitResponse({
        opportunity_id: id,
        cooperative_id: cooperative.id,
        products_offered: formData.products_offered,
        quantity_available: parseFloat(formData.quantity_available) || null,
        quantity_unit: formData.quantity_unit,
        price_per_unit: parseFloat(formData.price_per_unit) || null,
        notes: formData.notes || null,
        capacity_information: formData.capacity_information || null,
      });

      if (result.error) throw new Error(result.error);
      setShowApplyModal(false);
      setHasApplied(true);
    } catch (err) {
      console.error('Error submitting response:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (oppLoading || !opportunity) {
    return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;
  }

  const isDeadlinePassed = opportunity.submission_deadline && new Date(opportunity.submission_deadline) < new Date();
  const canApply = opportunity.status === 'open' && !isDeadlinePassed && cooperative && !hasApplied;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/opportunities" className="text-sm text-secondary-600 hover:text-secondary-900 mb-4 inline-block">&larr; Back to Opportunities</Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Badge variant={STATUS_COLORS[opportunity.status]}>{opportunity.status}</Badge>
          {isDeadlinePassed && <Badge variant="error">Deadline Passed</Badge>}
        </div>
        <h1 className="text-3xl font-bold text-secondary-900 mb-3">{opportunity.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-600">
          <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /><Link to={`/buyers/${opportunity.buyer_id}`} className="hover:text-primary-600">{opportunity.buyer?.company_name}</Link>{opportunity.buyer?.verified && <Shield className="w-4 h-4 text-info-500" />}</span>
          <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" />{opportunity.category}</span>
          {opportunity.county && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{opportunity.county}</span>}
          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(opportunity.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card><CardHeader><CardTitle>Opportunity Description</CardTitle></CardHeader><CardContent><p className="text-secondary-600 whitespace-pre-wrap">{opportunity.description || 'No description provided.'}</p></CardContent></Card>

          <Card><CardHeader><CardTitle>Requirements</CardTitle></CardHeader><CardContent className="space-y-4">
            {opportunity.quantity_required && <div><span className="text-sm text-secondary-500">Quantity Required</span><p className="font-medium text-secondary-900">{opportunity.quantity_required} {opportunity.quantity_unit}</p></div>}
            {opportunity.quality_requirements && <div><span className="text-sm text-secondary-500">Quality Requirements</span><p className="text-secondary-600">{opportunity.quality_requirements}</p></div>}
            {opportunity.delivery_location && <div><span className="text-sm text-secondary-500">Delivery Location</span><p className="font-medium text-secondary-900">{opportunity.delivery_location}</p></div>}
            {opportunity.submission_deadline && <div><span className="text-sm text-secondary-500">Submission Deadline</span><p className={`font-medium ${isDeadlinePassed ? 'text-error-600' : 'text-secondary-900'}`}>{new Date(opportunity.submission_deadline).toLocaleString()}</p></div>}
          </CardContent></Card>
        </div>

        <div className="space-y-6">
          <Card><CardHeader><CardTitle>Buyer Information</CardTitle></CardHeader><CardContent>
            <Link to={`/buyers/${opportunity.buyer_id}`} className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center overflow-hidden">
                {opportunity.buyer?.logo_url ? <img src={opportunity.buyer.logo_url} alt="" className="w-full h-full object-cover" /> : <Building2 className="w-6 h-6 text-primary-600" />}
              </div>
              <div>
                <p className="font-medium text-secondary-900">{opportunity.buyer?.company_name}</p>
                <span className="text-xs text-secondary-500">{opportunity.buyer?.buyer_type}</span>
              </div>
            </Link>
          </CardContent></Card>

          {stats && (
            <Card className="text-center"><CardContent className="p-4">
              <Users className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-secondary-900">{stats.total_responses}</p>
              <p className="text-xs text-secondary-500">Responses</p>
            </CardContent></Card>
          )}

          {canApply && (
            <Button onClick={() => setShowApplyModal(true)} className="w-full" icon={<Send className="w-4 h-4" />}>
              Submit Response
            </Button>
          )}

          {hasApplied && (
            <Card className="bg-success-50 border-success-200"><CardContent className="p-4 text-center">
              <p className="text-success-700 font-medium">Response Submitted</p>
              <p className="text-sm text-success-600">You have already responded to this opportunity.</p>
            </CardContent></Card>
          )}

          {!user && (
            <Card className="bg-info-50 border-info-200"><CardContent className="p-4">
              <p className="text-sm text-info-700">Sign in to submit a response to this opportunity.</p>
              <Link to="/login" className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-700">Sign In</Link>
            </CardContent></Card>
          )}

          {user && !cooperative && (
            <Card className="bg-warning-50 border-warning-200"><CardContent className="p-4">
              <p className="text-sm text-warning-700">You need a cooperative profile to respond to opportunities.</p>
              <Link to="/dashboard/cooperative/new" className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-700">Create Cooperative Profile</Link>
            </CardContent></Card>
          )}
        </div>
      </div>

      <Modal isOpen={showApplyModal} onClose={() => setShowApplyModal(false)}>
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-xl font-semibold text-secondary-900 mb-6">Submit Your Response</h2>

          <div className="space-y-4">
            <Input label="Products Offered" placeholder="Describe the products you can supply" value={formData.products_offered} onChange={(e) => setFormData({ ...formData, products_offered: e.target.value })} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Quantity Available" type="number" placeholder="Amount" value={formData.quantity_available} onChange={(e) => setFormData({ ...formData, quantity_available: e.target.value })} />
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Unit</label>
                <select value={formData.quantity_unit} onChange={(e) => setFormData({ ...formData, quantity_unit: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="kg">Kilograms (kg)</option>
                  <option value="tons">Tons</option>
                  <option value="pieces">Pieces</option>
                  <option value="liters">Liters</option>
                  <option value="crates">Crates</option>
                </select>
              </div>
            </div>
            <Input label="Price per Unit (KES)" type="number" placeholder="Price in KES" value={formData.price_per_unit} onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })} />
            <Textarea label="Notes" placeholder="Additional information about your offer..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
            <Textarea label="Capacity Information" placeholder="Describe your production/supply capacity..." value={formData.capacity_information} onChange={(e) => setFormData({ ...formData, capacity_information: e.target.value })} rows={2} />
          </div>

          <div className="flex gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setShowApplyModal(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={submitting} className="flex-1">Submit Response</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
