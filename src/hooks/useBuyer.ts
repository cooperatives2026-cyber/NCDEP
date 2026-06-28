import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { Buyer } from '../types';

export function useBuyer(id?: string) {
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);

  const fetchBuyer = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('buyers')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();

      if (fetchError) throw fetchError;

      setBuyer(data as Buyer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch buyer');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBuyer();
  }, [fetchBuyer]);

  return { buyer, loading, error, refetch: fetchBuyer };
}

export function useBuyers(filters?: {
  query?: string;
  buyerType?: string;
  county?: string;
  status?: string;
  verified?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}) {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchBuyers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('buyers')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)
        .range(from, to);

      if (filters?.query) {
        query = query.or(`company_name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }

      if (filters?.buyerType) {
        query = query.eq('buyer_type', filters.buyerType);
      }

      if (filters?.county) {
        query = query.eq('county', filters.county);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.verified !== undefined) {
        query = query.eq('verified', filters.verified);
      }

      const sortBy = filters?.sortBy || 'created_at';
      const sortOrder = filters?.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setBuyers(data as Buyer[] || []);
      setTotal(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch buyers');
    } finally {
      setLoading(false);
    }
  }, [filters?.query, filters?.buyerType, filters?.county, filters?.status, filters?.verified, filters?.sortBy, filters?.sortOrder, filters?.page, filters?.pageSize]);

  useEffect(() => {
    fetchBuyers();
  }, [fetchBuyers]);

  return { buyers, loading, error, total, refetch: fetchBuyers };
}

export function useMyBuyer() {
  const { user } = useAuth();
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBuyer = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('buyers')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle();

      if (fetchError) throw fetchError;

      setBuyer(data as Buyer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch buyer profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBuyer();
  }, [fetchBuyer]);

  return { buyer, loading, error, refetch: fetchBuyer };
}

export function useBuyerMutations() {
  const { user } = useAuth();

  const createBuyer = async (data: Partial<Buyer>): Promise<{ data: Buyer | null; error: string | null }> => {
    if (!user) {
      return { data: null, error: 'Not authenticated' };
    }

    try {
      const { data: buyer, error: createError } = await supabase
        .from('buyers')
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      return { data: buyer as Buyer, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to create buyer profile' };
    }
  };

  const updateBuyer = async (id: string, data: Partial<Buyer>): Promise<{ data: Buyer | null; error: string | null }> => {
    try {
      const { data: buyer, error: updateError } = await supabase
        .from('buyers')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return { data: buyer as Buyer, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to update buyer profile' };
    }
  };

  const verifyBuyer = async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error: updateError } = await supabase
        .from('buyers')
        .update({ verified: true, status: 'active' })
        .eq('id', id);

      if (updateError) throw updateError;

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to verify buyer' };
    }
  };

  const suspendBuyer = async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error: updateError } = await supabase
        .from('buyers')
        .update({ status: 'suspended' })
        .eq('id', id);

      if (updateError) throw updateError;

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to suspend buyer' };
    }
  };

  const deleteBuyer = async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error: deleteError } = await supabase
        .from('buyers')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (deleteError) throw deleteError;

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to delete buyer' };
    }
  };

  return {
    createBuyer,
    updateBuyer,
    verifyBuyer,
    suspendBuyer,
    deleteBuyer,
  };
}

export function useBuyerTypes() {
  const [buyerTypes, setBuyerTypes] = useState<{ id: number; name: string; description: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuyerTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('buyer_types')
          .select('*')
          .order('sort_order');

        if (error) throw error;
        setBuyerTypes(data || []);
      } catch (err) {
        console.error('Error fetching buyer types:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBuyerTypes();
  }, []);

  return { buyerTypes, loading };
}

export function useOpportunityCategories() {
  const [categories, setCategories] = useState<{ id: number; name: string; description: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('opportunity_categories')
          .select('*')
          .order('sort_order');

        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching opportunity categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading };
}
