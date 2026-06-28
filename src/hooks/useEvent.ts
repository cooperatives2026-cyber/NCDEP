import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { Event, EventParticipant, EventProduct, EventStats, EventProductRanking } from '../types';

export function useEvent(id?: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();

      if (fetchError) throw fetchError;

      setEvent(data as Event);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch event');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return { event, loading, error, refetch: fetchEvent };
}

export function useEvents(filters?: {
  query?: string;
  status?: string;
  eventType?: string;
  county?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('events')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)
        .range(from, to);

      if (filters?.query) {
        query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.eventType) {
        query = query.eq('event_type', filters.eventType);
      }

      if (filters?.county) {
        query = query.eq('county', filters.county);
      }

      const sortBy = filters?.sortBy || 'start_date';
      const sortOrder = filters?.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setEvents(data as Event[] || []);
      setTotal(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [filters?.query, filters?.status, filters?.eventType, filters?.county, filters?.sortBy, filters?.sortOrder, filters?.page, filters?.pageSize]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, total, refetch: fetchEvents };
}

export function useEventMutations() {
  const { user } = useAuth();

  const createEvent = async (data: Partial<Event>): Promise<{ data: Event | null; error: string | null }> => {
    if (!user) {
      return { data: null, error: 'Not authenticated' };
    }

    try {
      const { data: event, error: createError } = await supabase
        .from('events')
        .insert({
          ...data,
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      return { data: event as Event, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to create event' };
    }
  };

  const updateEvent = async (id: string, data: Partial<Event>): Promise<{ data: Event | null; error: string | null }> => {
    try {
      const { data: event, error: updateError } = await supabase
        .from('events')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return { data: event as Event, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to update event' };
    }
  };

  const deleteEvent = async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error: deleteError } = await supabase
        .from('events')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (deleteError) throw deleteError;

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to delete event' };
    }
  };

  const publishEvent = async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error: updateError } = await supabase
        .from('events')
        .update({ status: 'scheduled' })
        .eq('id', id);

      if (updateError) throw updateError;

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to publish event' };
    }
  };

  const activateEvent = async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error: updateError } = await supabase
        .from('events')
        .update({ status: 'active' })
        .eq('id', id);

      if (updateError) throw updateError;

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to activate event' };
    }
  };

  const completeEvent = async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error: updateError } = await supabase
        .from('events')
        .update({ status: 'completed' })
        .eq('id', id);

      if (updateError) throw updateError;

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to complete event' };
    }
  };

  return {
    createEvent,
    updateEvent,
    deleteEvent,
    publishEvent,
    activateEvent,
    completeEvent,
  };
}

export function useEventStats(eventId: string | undefined) {
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!eventId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.rpc('get_event_stats', {
        p_event_id: eventId,
      });

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch event stats');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

export function useEventParticipants(eventId: string | undefined, status?: string) {
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipants = useCallback(async () => {
    if (!eventId) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('event_participants')
        .select(`
          *,
          cooperative:cooperatives(id, name, county, logo_url)
        `)
        .eq('event_id', eventId)
        .order('applied_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setParticipants(data as EventParticipant[] || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch participants');
    } finally {
      setLoading(false);
    }
  }, [eventId, status]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  return { participants, loading, error, refetch: fetchParticipants };
}

export function useEventProducts(eventId: string | undefined) {
  const [products, setProducts] = useState<EventProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!eventId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('event_products')
        .select(`
          *,
          product:products(
            id, name, description, category, status,
            images:product_images(id, image_url, sort_order)
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setProducts(data as EventProduct[] || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch event products');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}

export function useEventProductRankings(eventId: string | undefined) {
  const [rankings, setRankings] = useState<EventProductRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRankings = useCallback(async () => {
    if (!eventId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.rpc('get_event_product_rankings', {
        p_event_id: eventId,
      });

      if (fetchError) throw fetchError;

      setRankings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rankings');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  return { rankings, loading, error, refetch: fetchRankings };
}

export function useParticipantMutations() {
  const { user } = useAuth();

  const applyForEvent = async (eventId: string, cooperativeId: string, notes?: string): Promise<{ data: EventParticipant | null; error: string | null }> => {
    try {
      const { data, error: insertError } = await supabase
        .from('event_participants')
        .insert({
          event_id: eventId,
          cooperative_id: cooperativeId,
          notes: notes || null,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return { data: data as EventParticipant, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to apply' };
    }
  };

  const approveParticipant = async (participantId: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error: updateError } = await supabase
        .from('event_participants')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', participantId);

      if (updateError) throw updateError;

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to approve' };
    }
  };

  const rejectParticipant = async (participantId: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error: updateError } = await supabase
        .from('event_participants')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', participantId);

      if (updateError) throw updateError;

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to reject' };
    }
  };

  const addProductToEvent = async (eventId: string, productId: string, participantId?: string): Promise<{ error: string | null }> => {
    try {
      const { error: insertError } = await supabase
        .from('event_products')
        .insert({
          event_id: eventId,
          product_id: productId,
          participant_id: participantId || null,
        });

      if (insertError) throw insertError;

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to add product' };
    }
  };

  const removeProductFromEvent = async (eventProductId: string): Promise<{ error: string | null }> => {
    try {
      const { error: deleteError } = await supabase
        .from('event_products')
        .delete()
        .eq('id', eventProductId);

      if (deleteError) throw deleteError;

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to remove product' };
    }
  };

  return {
    applyForEvent,
    approveParticipant,
    rejectParticipant,
    addProductToEvent,
    removeProductFromEvent,
  };
}
