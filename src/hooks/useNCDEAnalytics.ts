import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { NCDEStats, CountyAvailability, DistributionGap, TopDistributedProduct } from '../types';

export function useNCDEStats() {
  const [stats, setStats] = useState<NCDEStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.rpc('get_ncde_stats');
      if (fetchError) throw fetchError;
      if (data && data.length > 0) setStats(data[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { stats, loading, error, refetch: fetch };
}

export function useCountyAvailability(county: string | undefined) {
  const [data, setData] = useState<CountyAvailability | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!county) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      try {
        const { data: result, error } = await supabase.rpc('get_county_availability', { p_county: county });
        if (error) throw error;
        if (result && result.length > 0) setData(result[0]);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [county]);

  return { data, loading };
}

export function useDistributionGaps() {
  const [gaps, setGaps] = useState<DistributionGap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_distribution_gaps');
        if (error) throw error;
        setGaps(data || []);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  return { gaps, loading };
}

export function useTopDistributedProducts(limit: number = 10) {
  const [products, setProducts] = useState<TopDistributedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_top_distributed_products', { p_limit: limit });
        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [limit]);

  return { products, loading };
}
