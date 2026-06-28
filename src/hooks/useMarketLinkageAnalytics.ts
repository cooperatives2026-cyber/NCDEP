import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { MarketLinkageStats, CategoryDemandTrend, TopSupplier } from '../types';

export function useMarketLinkageStats() {
  const [stats, setStats] = useState<MarketLinkageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.rpc('get_market_linkage_stats');

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

export function useCategoryDemandTrends() {
  const [trends, setTrends] = useState<CategoryDemandTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.rpc('get_category_demand_trends');

      if (fetchError) throw fetchError;

      setTrends(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch demand trends');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  return { trends, loading, error, refetch: fetchTrends };
}

export function useTopSuppliers(limit: number = 10) {
  const [suppliers, setSuppliers] = useState<TopSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.rpc('get_top_supplier_cooperatives', {
        p_limit: limit,
      });

      if (fetchError) throw fetchError;

      setSuppliers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  return { suppliers, loading, error, refetch: fetchSuppliers };
}
