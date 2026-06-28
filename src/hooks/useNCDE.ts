import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { RetailOutlet, ProductAvailability, DistributionPartner, ProductDistributor, AggregationCenter, DistributionRequest } from '../types';

// =====================================================
// RETAIL OUTLETS
// =====================================================

export function useRetailOutlets(filters?: {
  query?: string;
  outletType?: string;
  county?: string;
  town?: string;
  status?: string;
  verified?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const [outlets, setOutlets] = useState<RetailOutlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchOutlets = useCallback(async () => {
    setLoading(true);
    try {
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase.from('retail_outlets').select('*', { count: 'exact' }).is('deleted_at', null).range(from, to);

      if (filters?.query) query = query.or(`name.ilike.%${filters.query}%,town.ilike.%${filters.query}%`);
      if (filters?.outletType) query = query.eq('outlet_type', filters.outletType);
      if (filters?.county) query = query.eq('county', filters.county);
      if (filters?.town) query = query.eq('town', filters.town);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.verified !== undefined) query = query.eq('verified', filters.verified);

      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;

      setOutlets(data as RetailOutlet[] || []);
      setTotal(count || 0);
    } catch (err) {
      console.error('Error fetching outlets:', err);
    } finally {
      setLoading(false);
    }
  }, [filters?.query, filters?.outletType, filters?.county, filters?.town, filters?.status, filters?.verified, filters?.page, filters?.pageSize]);

  useEffect(() => { fetchOutlets(); }, [fetchOutlets]);

  return { outlets, loading, total, refetch: fetchOutlets };
}

export function useRetailOutletMutations() {
  const createOutlet = async (data: Partial<RetailOutlet>): Promise<{ data: RetailOutlet | null; error: string | null }> => {
    try {
      const { data: outlet, error: createError } = await supabase.from('retail_outlets').insert(data).select().single();
      if (createError) throw createError;
      return { data: outlet as RetailOutlet, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to create outlet' };
    }
  };

  const updateOutlet = async (id: string, data: Partial<RetailOutlet>): Promise<{ error: string | null }> => {
    try {
      const { error: updateError } = await supabase.from('retail_outlets').update(data).eq('id', id);
      if (updateError) throw updateError;
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update outlet' };
    }
  };

  const deleteOutlet = async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error: deleteError } = await supabase.from('retail_outlets').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (deleteError) throw deleteError;
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to delete outlet' };
    }
  };

  return { createOutlet, updateOutlet, deleteOutlet };
}

export function useRetailOutletTypes() {
  const [outletTypes, setOutletTypes] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data, error } = await supabase.from('retail_outlet_types').select('*').order('sort_order');
        if (error) throw error;
        setOutletTypes(data || []);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { outletTypes, loading };
}

// =====================================================
// PRODUCT AVAILABILITY
// =====================================================

export function useProductAvailability(productId?: string) {
  const [availability, setAvailability] = useState<ProductAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!productId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_availability')
        .select(`*, outlet:retail_outlets(id, name, outlet_type, county, town)`)
        .eq('product_id', productId);

      if (error) throw error;
      setAvailability(data as ProductAvailability[] || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { availability, loading, refetch: fetch };
}

export function useProductAvailabilitySummary(productId?: string) {
  const [summary, setSummary] = useState<{ total_locations: number; available_count: number; limited_count: number; out_of_stock_count: number; counties_available: number; outlet_types: string[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;

    const fetch = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_product_availability_summary', { p_product_id: productId });
        if (error) throw error;
        if (data && data.length > 0) setSummary(data[0]);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [productId]);

  return { summary, loading };
}

export function useAvailabilityMutations() {
  const addAvailability = async (data: Partial<ProductAvailability>): Promise<{ error: string | null }> => {
    try {
      const { error: insertError } = await supabase.from('product_availability').insert(data);
      if (insertError) throw insertError;
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed' };
    }
  };

  const updateAvailability = async (id: string, data: Partial<ProductAvailability>): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.from('product_availability').update(data).eq('id', id);
      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed' };
    }
  };

  const deleteAvailability = async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.from('product_availability').delete().eq('id', id);
      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed' };
    }
  };

  return { addAvailability, updateAvailability, deleteAvailability };
}

// =====================================================
// DISTRIBUTION PARTNERS
// =====================================================

export function useDistributionPartners(filters?: { query?: string; partnerType?: string; status?: string; county?: string; page?: number; pageSize?: number }) {
  const [partners, setPartners] = useState<DistributionPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase.from('distribution_partners').select('*', { count: 'exact' }).is('deleted_at', null).range(from, to);

      if (filters?.query) query = query.ilike('name', `%${filters.query}%`);
      if (filters?.partnerType) query = query.eq('partner_type', filters.partnerType);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.county) query = query.contains('coverage_counties', [filters.county]);

      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;

      setPartners(data as DistributionPartner[] || []);
      setTotal(count || 0);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters?.query, filters?.partnerType, filters?.status, filters?.county, filters?.page, filters?.pageSize]);

  useEffect(() => { fetch(); }, [fetch]);

  return { partners, loading, total, refetch: fetch };
}

export function useDistributionPartnerMutations() {
  const createPartner = async (data: Partial<DistributionPartner>): Promise<{ data: DistributionPartner | null; error: string | null }> => {
    try {
      const { data: partner, error } = await supabase.from('distribution_partners').insert(data).select().single();
      if (error) throw error;
      return { data: partner as DistributionPartner, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed' };
    }
  };

  const updatePartner = async (id: string, data: Partial<DistributionPartner>): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.from('distribution_partners').update(data).eq('id', id);
      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed' };
    }
  };

  const deletePartner = async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.from('distribution_partners').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed' };
    }
  };

  return { createPartner, updatePartner, deletePartner };
}

export function useDistributionPartnerTypes() {
  const [partnerTypes, setPartnerTypes] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data, error } = await supabase.from('distribution_partner_types').select('*').order('sort_order');
        if (error) throw error;
        setPartnerTypes(data || []);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { partnerTypes, loading };
}

// =====================================================
// AGGREGATION CENTERS
// =====================================================

export function useAggregationCenters(filters?: { query?: string; county?: string; status?: string; page?: number; pageSize?: number }) {
  const [centers, setCenters] = useState<AggregationCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase.from('aggregation_centers').select('*', { count: 'exact' }).is('deleted_at', null).range(from, to);

      if (filters?.query) query = query.ilike('name', `%${filters.query}%`);
      if (filters?.county) query = query.eq('county', filters.county);
      if (filters?.status) query = query.eq('status', filters.status);

      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;

      setCenters(data as AggregationCenter[] || []);
      setTotal(count || 0);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters?.query, filters?.county, filters?.status, filters?.page, filters?.pageSize]);

  useEffect(() => { fetch(); }, [fetch]);

  return { centers, loading, total, refetch: fetch };
}

export function useAggregationCenterMutations() {
  const createCenter = async (data: Partial<AggregationCenter>): Promise<{ data: AggregationCenter | null; error: string | null }> => {
    try {
      const { data: center, error } = await supabase.from('aggregation_centers').insert(data).select().single();
      if (error) throw error;
      return { data: center as AggregationCenter, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed' };
    }
  };

  const updateCenter = async (id: string, data: Partial<AggregationCenter>): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.from('aggregation_centers').update(data).eq('id', id);
      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed' };
    }
  };

  const deleteCenter = async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.from('aggregation_centers').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed' };
    }
  };

  return { createCenter, updateCenter, deleteCenter };
}

// =====================================================
// PRODUCT DISTRIBUTORS
// =====================================================

export function useProductDistributors(productId?: string) {
  const [distributors, setDistributors] = useState<ProductDistributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;

    const fetch = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('product_distributors')
          .select(`*, distributor:distribution_partners(id, name, partner_type, coverage_counties, verified)`)
          .eq('product_id', productId);
        if (error) throw error;
        setDistributors(data as ProductDistributor[] || []);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [productId]);

  return { distributors, loading };
}

// =====================================================
// DISTRIBUTION REQUESTS
// =====================================================

export function useDistributionRequests(filters?: { county?: string; status?: string; requestType?: string; page?: number; pageSize?: number }) {
  const [requests, setRequests] = useState<DistributionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase.from('distribution_requests').select('*', { count: 'exact' }).range(from, to);

      if (filters?.county) query = query.eq('county', filters.county);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.requestType) query = query.eq('request_type', filters.requestType);

      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;

      setRequests(data as DistributionRequest[] || []);
      setTotal(count || 0);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters?.county, filters?.status, filters?.requestType, filters?.page, filters?.pageSize]);

  useEffect(() => { fetch(); }, [fetch]);

  return { requests, loading, total, refetch: fetch };
}

export function useDistributionRequestMutations() {
  const submitRequest = async (data: Partial<DistributionRequest>): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.from('distribution_requests').insert(data);
      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed' };
    }
  };

  const updateRequestStatus = async (id: string, status: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.from('distribution_requests').update({ status }).eq('id', id);
      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed' };
    }
  };

  return { submitRequest, updateRequestStatus };
}

export function useRequestTypes() {
  const [requestTypes, setRequestTypes] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data, error } = await supabase.from('distribution_request_types').select('*').order('sort_order');
        if (error) throw error;
        setRequestTypes(data || []);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { requestTypes, loading };
}

export function useRequestorTypes() {
  const [requestorTypes, setRequestorTypes] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data, error } = await supabase.from('requestor_types').select('*').order('sort_order');
        if (error) throw error;
        setRequestorTypes(data || []);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { requestorTypes, loading };
}
