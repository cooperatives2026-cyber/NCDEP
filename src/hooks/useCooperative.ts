import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Cooperative } from '../types';
import { useAuth } from './useAuth';

interface CooperativeWithOwner extends Cooperative {
  owner_email?: string;
}

export function useCooperative(id?: string) {
  const { user, isAdmin } = useAuth();
  const [cooperative, setCooperative] = useState<CooperativeWithOwner | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);

  const fetchCooperative = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('cooperatives')
        .select(`
          *,
          users!cooperatives_user_id_fkey (email)
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      if (data) {
        const { users, ...coopData } = data as any;
        setCooperative({
          ...coopData,
          owner_email: users?.email,
        });
      } else {
        setCooperative(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cooperative');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCooperative();
  }, [fetchCooperative]);

  const createCooperative = async (data: Partial<Cooperative>) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data: coop, error: createError } = await supabase
        .from('cooperatives')
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      setCooperative(coop);
      return { data: coop, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to create cooperative' };
    }
  };

  const updateCooperative = async (data: Partial<Cooperative>) => {
    if (!id) return { error: 'No cooperative ID' };

    try {
      const { data: coop, error: updateError } = await supabase
        .from('cooperatives')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setCooperative(coop);
      return { data: coop, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to update cooperative' };
    }
  };

  const deleteCooperative = async () => {
    if (!id) return { error: 'No cooperative ID' };

    try {
      const { error: deleteError } = await supabase
        .from('cooperatives')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (deleteError) throw deleteError;

      setCooperative(null);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to delete cooperative' };
    }
  };

  const canEdit = cooperative && (isAdmin || cooperative.user_id === user?.id);

  return {
    cooperative,
    loading,
    error,
    createCooperative,
    updateCooperative,
    deleteCooperative,
    canEdit: !!canEdit,
    refetch: fetchCooperative,
  };
}

export function useCooperatives(filters?: {
  query?: string;
  county?: string;
  category?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}) {
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchCooperatives = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('cooperatives')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)
        .range(from, to);

      if (filters?.query) {
        query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }

      if (filters?.county) {
        query = query.eq('county', filters.county);
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const sortBy = filters?.sortBy || 'created_at';
      const sortOrder = filters?.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setCooperatives(data || []);
      setTotal(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cooperatives');
    } finally {
      setLoading(false);
    }
  }, [filters?.query, filters?.county, filters?.category, filters?.status, filters?.sortBy, filters?.sortOrder, filters?.page, filters?.pageSize]);

  useEffect(() => {
    fetchCooperatives();
  }, [fetchCooperatives]);

  return { cooperatives, loading, error, total, refetch: fetchCooperatives };
}

export function useMyCooperative() {
  const { user } = useAuth();
  const [cooperative, setCooperative] = useState<Cooperative | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyCooperative = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('cooperatives')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle();

      if (fetchError) throw fetchError;

      setCooperative(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cooperative');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyCooperative();
  }, [fetchMyCooperative]);

  return { cooperative, loading, error, refetch: fetchMyCooperative };
}
