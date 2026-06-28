import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { OpportunityResponse } from '../types';

export function useOpportunityResponses(opportunityId?: string, status?: string) {
  const [responses, setResponses] = useState<OpportunityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResponses = useCallback(async () => {
    if (!opportunityId) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('opportunity_responses')
        .select(`
          *,
          cooperative:cooperatives(id, name, county, logo_url)
        `)
        .eq('opportunity_id', opportunityId)
        .order('submitted_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setResponses(data as OpportunityResponse[] || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch responses');
    } finally {
      setLoading(false);
    }
  }, [opportunityId, status]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  return { responses, loading, error, refetch: fetchResponses };
}

export function useCooperativeResponses(cooperativeId?: string, status?: string) {
  const [responses, setResponses] = useState<OpportunityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResponses = useCallback(async () => {
    if (!cooperativeId) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('opportunity_responses')
        .select(`
          *,
          opportunity:opportunities(id, title, category, status, submission_deadline,
            buyer:buyers(id, company_name, buyer_type, county)
          )
        `)
        .eq('cooperative_id', cooperativeId)
        .order('submitted_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setResponses(data as OpportunityResponse[] || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch responses');
    } finally {
      setLoading(false);
    }
  }, [cooperativeId, status]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  return { responses, loading, error, refetch: fetchResponses };
}

export function useMyResponses() {
  const { user } = useAuth();
  const [responses, setResponses] = useState<OpportunityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResponses = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First get the user's cooperative
      const { data: coopData } = await supabase
        .from('cooperatives')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!coopData) {
        setResponses([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('opportunity_responses')
        .select(`
          *,
          opportunity:opportunities(id, title, category, status, submission_deadline,
            buyer:buyers(id, company_name, buyer_type, county, logo_url)
          )
        `)
        .eq('cooperative_id', coopData.id)
        .order('submitted_at', { ascending: false });

      if (fetchError) throw fetchError;

      setResponses(data as OpportunityResponse[] || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch responses');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  return { responses, loading, error, refetch: fetchResponses };
}

export function useResponseMutations() {
  const { user } = useAuth();

  const submitResponse = async (data: Partial<OpportunityResponse>): Promise<{ data: OpportunityResponse | null; error: string | null }> => {
    try {
      const { data: response, error: insertError } = await supabase
        .from('opportunity_responses')
        .insert(data)
        .select()
        .single();

      if (insertError) throw insertError;

      return { data: response as OpportunityResponse, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to submit response' };
    }
  };

  const updateResponse = async (id: string, data: Partial<OpportunityResponse>): Promise<{ data: OpportunityResponse | null; error: string | null }> => {
    try {
      const { data: response, error: updateError } = await supabase
        .from('opportunity_responses')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return { data: response as OpportunityResponse, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to update response' };
    }
  };

  const withdrawResponse = async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error: updateError } = await supabase
        .from('opportunity_responses')
        .update({ status: 'withdrawn' })
        .eq('id', id);

      if (updateError) throw updateError;

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to withdraw response' };
    }
  };

  const shortlistResponse = async (id: string, notes?: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error: updateError } = await supabase
        .from('opportunity_responses')
        .update({
          status: 'shortlisted',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          review_notes: notes || null,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to shortlist' };
    }
  };

  const rejectResponse = async (id: string, notes?: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error: updateError } = await supabase
        .from('opportunity_responses')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          review_notes: notes || null,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to reject' };
    }
  };

  const awardResponse = async (responseId: string, opportunityId: string, cooperativeId: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not authenticated' };

    try {
      // Update response to awarded
      const { error: responseError } = await supabase
        .from('opportunity_responses')
        .update({
          status: 'awarded',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', responseId);

      if (responseError) throw responseError;

      // Update opportunity to awarded
      const { error: oppError } = await supabase
        .from('opportunities')
        .update({
          status: 'awarded',
          awarded_to: cooperativeId,
          awarded_at: new Date().toISOString(),
        })
        .eq('id', opportunityId);

      if (oppError) throw oppError;

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to award contract' };
    }
  };

  return {
    submitResponse,
    updateResponse,
    withdrawResponse,
    shortlistResponse,
    rejectResponse,
    awardResponse,
  };
}
