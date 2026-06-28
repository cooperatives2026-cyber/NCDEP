import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Briefcase, Building2, MapPin, Calendar, Clock, Users, Check, X, Award, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, LoadingSpinner, ConfirmDialog } from '../../components/shared';
import { useOpportunity, useOpportunityStats, useOpportunityResponses, useResponseMutations } from '../../hooks';
import type { OpportunityResponse } from '../../types';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'info' | 'error' | 'default'> = {
  draft: 'default',
  open: 'success',
  under_review: 'warning',
  awarded: 'info',
  closed: 'error',
  cancelled: 'error',
};

const RESPONSE_STATUS_COLORS: Record<string, 'success' | 'warning' | 'info' | 'error' | 'default'> = {
  submitted: 'warning',
  shortlisted: 'info',
  rejected: 'error',
  awarded: 'success',
  withdrawn: 'default',
};

export function AdminOpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'responses'>('overview');
  const [actionResponse, setActionResponse] = useState<{ response: OpportunityResponse; action: 'shortlist' | 'reject' | 'award' } | null>(null);
  const [processing, setProcessing] = useState(false);

  const { opportunity, loading: oppLoading } = useOpportunity(id);
  const { stats, refetch: refetchStats } = useOpportunityStats(id);
  const { responses, loading: responsesLoading, refetch: refetchResponses } = useOpportunityResponses(id);
  const { shortlistResponse, rejectResponse, awardResponse } = useResponseMutations();

  const handleResponseAction = async () => {
    if (!actionResponse || !id) return;

    setProcessing(true);
    try {
      if (actionResponse.action === 'shortlist') {
        await shortlistResponse(actionResponse.response.id);
      } else if (actionResponse.action === 'reject') {
        await rejectResponse(actionResponse.response.id);
      } else if (actionResponse.action === 'award') {
        await awardResponse(actionResponse.response.id, id, actionResponse.response.cooperative_id);
      }
      await refetchResponses();
      await refetchStats();
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setProcessing(false);
      setActionResponse(null);
    }
  };

  if (oppLoading || !opportunity) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={() => navigate('/admin/opportunities')} className="flex items-center gap-2 text-sm text-secondary-600 hover:text-secondary-900 mb-4">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Opportunities
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          {opportunity.featured && <Award className="w-5 h-5 text-warning-500" />}
          <Badge variant={STATUS_COLORS[opportunity.status]}>{opportunity.status}</Badge>
        </div>
        <h1 className="text-2xl font-bold text-secondary-900">{opportunity.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-600 mt-2">
          <span className="flex items-center gap-1"><Building2 className="w-4 h-4" />{opportunity.buyer?.company_name}</span>
          <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" />{opportunity.category}</span>
          {opportunity.county && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{opportunity.county}</span>}
          {opportunity.submission_deadline && (
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{new Date(opportunity.submission_deadline).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <Card className="p-4 text-center"><Users className="w-6 h-6 text-primary-600 mx-auto mb-2" /><p className="text-2xl font-bold">{stats.total_responses}</p><p className="text-xs text-secondary-500">Total</p></Card>
          <Card className="p-4 text-center"><p className="text-2xl font-bold text-warning-600">{stats.submitted_count}</p><p className="text-xs text-secondary-500">Submitted</p></Card>
          <Card className="p-4 text-center"><p className="text-2xl font-bold text-info-600">{stats.shortlisted_count}</p><p className="text-xs text-secondary-500">Shortlisted</p></Card>
          <Card className="p-4 text-center"><p className="text-2xl font-bold text-error-600">{stats.rejected_count}</p><p className="text-xs text-secondary-500">Rejected</p></Card>
          <Card className="p-4 text-center"><p className="text-2xl font-bold text-success-600">{stats.awarded_count}</p><p className="text-xs text-secondary-500">Awarded</p></Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-secondary-200 mb-6">
        <nav className="flex gap-8">
          {['overview', 'responses'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-secondary-500 hover:text-secondary-700'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)} {tab === 'responses' && `(${responses.length})`}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card><CardHeader><CardTitle>Opportunity Details</CardTitle></CardHeader><CardContent className="space-y-3">
            <div><span className="text-secondary-500 text-sm">Buyer</span><p className="font-medium">{opportunity.buyer?.company_name}</p></div>
            <div><span className="text-secondary-500 text-sm">Category</span><p className="font-medium">{opportunity.category}</p></div>
            {opportunity.quantity_required && <div><span className="text-secondary-500 text-sm">Quantity</span><p className="font-medium">{opportunity.quantity_required} {opportunity.quantity_unit}</p></div>}
            {opportunity.delivery_location && <div><span className="text-secondary-500 text-sm">Delivery Location</span><p className="font-medium">{opportunity.delivery_location}</p></div>}
            <div><span className="text-secondary-500 text-sm">Views</span><p className="font-medium">{opportunity.views_count}</p></div>
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Description</CardTitle></CardHeader><CardContent><p className="text-secondary-600 whitespace-pre-wrap">{opportunity.description || 'No description provided.'}</p></CardContent></Card>
        </div>
      )}

      {activeTab === 'responses' && (
        <div>
          {responsesLoading ? <LoadingSpinner /> : responses.length === 0 ? <Card className="p-12 text-center"><Users className="w-12 h-12 text-secondary-300 mx-auto mb-4" /><p className="text-secondary-500">No responses yet</p></Card> : (
            <div className="bg-white rounded-lg shadow-sm border border-secondary-100 overflow-hidden">
              <table className="min-w-full divide-y divide-secondary-100">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Cooperative</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Products</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Submitted</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {responses.map(r => (
                    <tr key={r.id} className="hover:bg-secondary-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-secondary-900">{r.cooperative?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">{r.products_offered || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">{r.quantity_available ? `${r.quantity_available} ${r.quantity_unit || ''}` : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><Badge variant={RESPONSE_STATUS_COLORS[r.status]}>{r.status}</Badge></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{new Date(r.submitted_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {r.status === 'submitted' && (
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => setActionResponse({ response: r, action: 'shortlist' })}><Check className="w-4 h-4 text-info-600" /></Button>
                            <Button variant="outline" size="sm" onClick={() => setActionResponse({ response: r, action: 'reject' })}><X className="w-4 h-4 text-error-600" /></Button>
                          </div>
                        )}
                        {r.status === 'shortlisted' && (
                          <Button variant="outline" size="sm" onClick={() => setActionResponse({ response: r, action: 'award' })}>Award</Button>
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

      <ConfirmDialog
        isOpen={!!actionResponse}
        onClose={() => setActionResponse(null)}
        onConfirm={handleResponseAction}
        title={actionResponse?.action === 'shortlist' ? 'Shortlist Response' : actionResponse?.action === 'reject' ? 'Reject Response' : 'Award Contract'}
        message={actionResponse?.action === 'award' ? 'Award this opportunity to the selected cooperative?' : `Are you sure you want to ${actionResponse?.action} this response?`}
        confirmText={actionResponse?.action === 'award' ? 'Award' : actionResponse?.action === 'reject' ? 'Reject' : 'Shortlist'}
        variant={actionResponse?.action === 'award' ? 'success' : actionResponse?.action === 'reject' ? 'danger' : 'info'}
        loading={processing}
      />
    </div>
  );
}
