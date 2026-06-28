import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Product, ProductImage, ProductWithImages } from '../types';
import { useAuth } from './useAuth';
import { useMyCooperative } from './useCooperative';

export function useProduct(id?: string) {
  const [product, setProduct] = useState<ProductWithImages | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(*)
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();

      if (fetchError) throw fetchError;

      setProduct(data as ProductWithImages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return { product, loading, error, refetch: fetchProduct };
}

export function useProducts(filters?: {
  query?: string;
  cooperativeId?: string;
  category?: string;
  status?: string;
  county?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}) {
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('products')
        .select(`
          *,
          images:product_images(*),
          cooperative:cooperatives(id, name, county, category)
        `, { count: 'exact' })
        .is('deleted_at', null)
        .range(from, to);

      if (filters?.query) {
        query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }

      if (filters?.cooperativeId) {
        query = query.eq('cooperative_id', filters.cooperativeId);
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

      let filteredData = data as ProductWithImages[] || [];

      if (filters?.county) {
        filteredData = filteredData.filter(
          (p) => p.cooperative?.county === filters.county
        );
      }

      setProducts(filteredData);
      setTotal(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [filters?.query, filters?.cooperativeId, filters?.category, filters?.status, filters?.county, filters?.sortBy, filters?.sortOrder, filters?.page, filters?.pageSize]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, total, refetch: fetchProducts };
}

export function useMyProducts() {
  const { cooperative, loading: coopLoading } = useMyCooperative();
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  const fetchMyProducts = useCallback(async () => {
    if (coopLoading) return;

    if (!cooperative && !isAdmin) {
      setLoading(false);
      setProducts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          images:product_images(*)
        `)
        .is('deleted_at', null);

      if (isAdmin) {
        // Admin sees all products
      } else if (cooperative) {
        query = query.eq('cooperative_id', cooperative.id);
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setProducts(data as ProductWithImages[] || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [cooperative, coopLoading, isAdmin]);

  useEffect(() => {
    fetchMyProducts();
  }, [fetchMyProducts]);

  return { products, loading: loading || coopLoading, error, refetch: fetchMyProducts };
}

export function useProductMutations() {
  const { cooperative } = useMyCooperative();
  const { isAdmin } = useAuth();

  const createProduct = async (data: Partial<Product>, images: File[] = []): Promise<{ data: Product | null; error: string | null }> => {
    if (!cooperative && !isAdmin) {
      return { data: null, error: 'No cooperative found' };
    }

    try {
      const { data: product, error: createError } = await supabase
        .from('products')
        .insert({
          ...data,
          cooperative_id: data.cooperative_id || cooperative?.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Upload images
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const path = `products/${product.id}/${Date.now()}_${i}_${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(path, file);

        if (uploadError) {
          console.error('Failed to upload image:', uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);

        await supabase
          .from('product_images')
          .insert({
            product_id: product.id,
            image_url: urlData.publicUrl,
            sort_order: i,
          });
      }

      return { data: product, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to create product' };
    }
  };

  const updateProduct = async (id: string, data: Partial<Product>): Promise<{ data: Product | null; error: string | null }> => {
    try {
      const { data: product, error: updateError } = await supabase
        .from('products')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return { data: product, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to update product' };
    }
  };

  const deleteProduct = async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error: deleteError } = await supabase
        .from('products')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (deleteError) throw deleteError;

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to delete product' };
    }
  };

  const addProductImage = async (productId: string, file: File): Promise<{ data: ProductImage | null; error: string | null }> => {
    try {
      // Get current max sort order
      const { data: existingImages } = await supabase
        .from('product_images')
        .select('sort_order')
        .eq('product_id', productId)
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextSortOrder = existingImages && existingImages.length > 0 ? existingImages[0].sort_order + 1 : 0;

      const path = `products/${productId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);

      const { data: image, error: insertError } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: urlData.publicUrl,
          sort_order: nextSortOrder,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return { data: image, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to add image' };
    }
  };

  const deleteProductImage = async (imageId: string): Promise<{ error: string | null }> => {
    try {
      const { error: deleteError } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (deleteError) throw deleteError;

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to delete image' };
    }
  };

  const reorderProductImages = async (_productId: string, imageIds: string[]): Promise<{ error: string | null }> => {
    try {
      for (let i = 0; i < imageIds.length; i++) {
        await supabase
          .from('product_images')
          .update({ sort_order: i })
          .eq('id', imageIds[i]);
      }

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to reorder images' };
    }
  };

  return {
    createProduct,
    updateProduct,
    deleteProduct,
    addProductImage,
    deleteProductImage,
    reorderProductImages,
  };
}
