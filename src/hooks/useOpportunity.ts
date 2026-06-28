import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { Opportunity, OpportunityStats } from '../types';

export function useOpportunity(id?: string) {
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);

  const fetchOpportunity = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('opportunities')
        .select(`
          *,
          buyer:buyers(id, company_name, buyer_type, county, logo_url, verified, contact_name, contact_email)
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();

      if (fetchError) throw fetchError;

      setOpportunity(data as Opportunity);

      // Increment view count
      await supabase.rpc('increment_opportunity_views', { p_opportunity_id: id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch opportunity');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOpportunity();
  }, [fetchOpportunity]);

  return { opportunity, loading, error, refetch: fetchOpportunity };
}

export function useOpportunities(filters?: {
  query?: string;
  category?: string;
  county?: string;
  buyerType?: string;
  status?: string;
  featured?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('opportunities')
        .select(`
          *,
          buyer:buyers(id, company_name, buyer_type, county, logo_url, verified)
        `, { count: 'exact' })
        .is('deleted_at', null)
        .range(from, to);

      if (filters?.query) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.county) {
        query = query.eq('county', filters.county);
      }

      if (filters?.buyerType) {
        query = query.eq('buyer_type', filters.buyerType);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.featured !== undefined) {
        query = query.eq('featured', filters.featured);
      }

      const sortBy = filters?.sortBy || 'created_at';
      const sortOrder = filters?.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setOpportunities(data as Opportunity[] || []);
      setTotal(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch opportunities');
    } finally {
      setLoading(false);
    }
  }, [filters?.query, filters?.category, filters?.county, filters?.buyerType, filters?.status, filters?.featured, filters?.sortBy, filters?.sortOrder, filters?.page, filters?.pageSize]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  return { opportunities, loading, error, total, refetch: fetchOpportunities };
}

export function useOpportunityMutations() {
  const { user } = useAuth();

  const createOpportunity = async (data: Partial<Opportunity>): Promise<{ data: Opportunity | null; error: string | null }> => {
    try {
      const { data: opportunity, error: createError } = await supabase
        .from('opportunities')
        .insert(data)
        .select()
        .single();

      if (createError) throw createError;

      return { data: opportunity as Opportunity, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to create opportunity' };
    }
  };

  const updateOpportunity = async (id: string, data: Partial<Opportunity>): Promise<{ data: Opportunity | null; error: string | null }> => {
    try {
      const { data: opportunity, error: updateError } = await supabase
        .from('opportunities')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return { data: opportunity as Opportunity, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to update opportunity' };
    }
  };

  const publishOpportunity = async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error: updateError } = await supabase
        .from('opportunities')
        .update({ status: 'open' })
        .eq('id', id);

      if (updateError) throw updateError;

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to publish opportunity' };
    }
  };

  const closeOpportunity = async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error: updateError } = await supabase
        .from('opportunities')
        .update({ status: 'closed' })
        .eq('id', id);

      if (updateError) throw updateError;

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to close opportunity' };
    }
  };

  const cancelOpportunity = async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error: updateError } = await supabase
        .from('opportunities')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (updateError) throw updateError;

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to cancel opportunity' };
    }
  };

  const deleteOpportunity = async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error: deleteError } = await supabase
        .from('opportunities')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (deleteError) throw deleteError;

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to delete opportunity' };
    }
  };

  const featureOpportunity = async (id: string, featured: boolean): Promise<{ error: string | null }> => {
    try {
      const { error: updateError } = await supabase
        .from('opportunities')
        .update({ featured })
        .eq('id', id);

      if (updateError) throw updateError;

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update featured status' };
    }
  };

  return {
    createOpportunity,
    updateOpportunity,
    publishOpportunity,
    closeOpportunity,
    cancelOpportunity,
    deleteOpportunity,
    featureOpportunity,
  };
}

export function useOpportunityStats(opportunityId: string | undefined) {
  const [stats, setStats] = useState<OpportunityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!opportunityId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.rpc('get_opportunity_stats', {
        p_opportunity_id: opportunityId,
      });

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, [opportunityId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
