import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { DiscoveryLeaderboardEntry, PlatformEventAnalytics } from '../types';

export function usePlatformEventAnalytics() {
  const [analytics, setAnalytics] = useState<PlatformEventAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.rpc('get_platform_event_analytics');

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        setAnalytics(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { analytics, loading, error, refetch: fetchAnalytics };
}

export function useDiscoveryLeaderboard(period: 'all' | 'month' | 'quarter' | 'year' = 'all', limit: number = 10) {
  const [leaderboard, setLeaderboard] = useState<DiscoveryLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.rpc('get_discovery_leaderboard', {
        p_period: period,
        p_limit: limit,
      });

      if (fetchError) throw fetchError;

      setLeaderboard(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  }, [period, limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { leaderboard, loading, error, refetch: fetchLeaderboard };
}

export function useCooperativeEvents(cooperativeId: string | undefined, status?: string) {
  const [events, setEvents] = useState<Array<{ event: any; participant: any }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!cooperativeId) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('event_participants')
        .select(`
          *,
          event:events(*)
        `)
        .eq('cooperative_id', cooperativeId)
        .order('applied_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setEvents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [cooperativeId, status]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
}

export function useCampaign(campaignId: string | undefined) {
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(!!campaignId);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaign = useCallback(async () => {
    if (!campaignId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('campaigns')
        .select(`
          *,
          event:events(id, name)
        `)
        .eq('id', campaignId)
        .is('deleted_at', null)
        .maybeSingle();

      if (fetchError) throw fetchError;

      setCampaign(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch campaign');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  return { campaign, loading, error, refetch: fetchCampaign };
}

export function useCampaigns(eventId?: string) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('campaigns')
        .select(`
          *,
          event:events(id, name)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setCampaigns(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return { campaigns, loading, error, refetch: fetchCampaigns };
}

export function useCampaignMutations() {
  const { user } = useAuth();

  const createCampaign = async (data: any): Promise<{ data: any | null; error: string | null }> => {
    if (!user) {
      return { data: null, error: 'Not authenticated' };
    }

    try {
      const { data: campaign, error: createError } = await supabase
        .from('campaigns')
        .insert({
          ...data,
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      return { data: campaign, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to create campaign' };
    }
  };

  const updateCampaign = async (id: string, data: any): Promise<{ data: any | null; error: string | null }> => {
    try {
      const { data: campaign, error: updateError } = await supabase
        .from('campaigns')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return { data: campaign, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to update campaign' };
    }
  };

  const deleteCampaign = async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error: deleteError } = await supabase
        .from('campaigns')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (deleteError) throw deleteError;

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to delete campaign' };
    }
  };

  const addProductToCampaign = async (campaignId: string, productId: string): Promise<{ error: string | null }> => {
    try {
      const { error: insertError } = await supabase
        .from('campaign_products')
        .insert({
          campaign_id: campaignId,
          product_id: productId,
        });

      if (insertError) throw insertError;

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to add product' };
    }
  };

  const removeProductFromCampaign = async (campaignProductId: string): Promise<{ error: string | null }> => {
    try {
      const { error: deleteError } = await supabase
        .from('campaign_products')
        .delete()
        .eq('id', campaignProductId);

      if (deleteError) throw deleteError;

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to remove product' };
    }
  };

  return {
    createCampaign,
    updateCampaign,
    deleteCampaign,
    addProductToCampaign,
    removeProductFromCampaign,
  };
}
