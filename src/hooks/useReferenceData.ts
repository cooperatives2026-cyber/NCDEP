import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface County {
  id: number;
  name: string;
  code: string | null;
}

export interface CooperativeCategory {
  id: number;
  name: string;
  description: string | null;
}

export interface ProductCategory {
  id: number;
  name: string;
  description: string | null;
}

export function useCounties() {
  const [counties, setCounties] = useState<County[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounties = async () => {
      try {
        const { data, error } = await supabase
          .from('counties')
          .select('*')
          .order('name');

        if (error) throw error;
        setCounties(data || []);
      } catch (err) {
        console.error('Error fetching counties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCounties();
  }, []);

  return { counties, loading };
}

export function useCooperativeCategories() {
  const [categories, setCategories] = useState<CooperativeCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('cooperative_categories')
          .select('*')
          .order('sort_order');

        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching cooperative categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading };
}

export function useProductCategories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('product_categories')
          .select('*')
          .order('sort_order');

        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching product categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading };
}

export interface EventType {
  id: number;
  name: string;
  description: string | null;
  sort_order: number;
}

export function useEventTypes() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('event_types')
          .select('*')
          .order('sort_order');

        if (error) throw error;
        setEventTypes(data || []);
      } catch (err) {
        console.error('Error fetching event types:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventTypes();
  }, []);

  return { eventTypes, loading };
}
