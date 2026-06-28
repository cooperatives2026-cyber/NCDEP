import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type {
  ProductRating,
  ProductReview,
  ProductEngagementStats,
  CooperativeEngagementStats,
  RatingDistribution,
  ReviewStatus,
} from '../types';

function getSessionId(): string {
  let sessionId = sessionStorage.getItem('ncdep_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem('ncdep_session_id', sessionId);
  }
  return sessionId;
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

// Track a product view
export function useTrackProductView(productId: string | undefined) {
  useEffect(() => {
    if (!productId) return;

    const trackView = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = getSessionId();
      const deviceType = getDeviceType();
      const referrer = document.referrer || null;

      await supabase.from('product_views').insert({
        product_id: productId,
        user_id: user?.id || null,
        session_id: sessionId,
        referrer,
        device_type: deviceType,
      });
    };

    trackView();
  }, [productId]);
}

// Product ratings
export function useProductRatings(productId: string | undefined) {
  const [ratings, setRatings] = useState<ProductRating[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [distribution, setDistribution] = useState<RatingDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState<number | null>(null);
  const { user } = useAuth();

  const fetchRatings = useCallback(async () => {
    if (!productId) return;

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('product_ratings')
        .select('*')
        .eq('product_id', productId);

      if (error) throw error;

      if (data) {
        setRatings(data as ProductRating[]);
        const total = data.length;
        setTotalRatings(total);

        if (total > 0) {
          const avg = data.reduce((sum, r) => sum + r.rating, 0) / total;
          setAvgRating(Math.round(avg * 10) / 10);

          // Calculate distribution
          const dist: RatingDistribution[] = [];
          for (let i = 5; i >= 1; i--) {
            const count = data.filter((r) => r.rating === i).length;
            dist.push({ rating: i, count });
          }
          setDistribution(dist);
        }

        // Check if current user has rated
        const sessionId = getSessionId();
        const existingRating = data.find(
          (r) => r.user_id === user?.id || r.session_id === sessionId
        );
        if (existingRating) {
          setUserRating(existingRating.rating);
        }
      }
    } catch (err) {
      console.error('Error fetching ratings:', err);
    } finally {
      setLoading(false);
    }
  }, [productId, user?.id]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  const submitRating = async (rating: number): Promise<{ success: boolean; error: string | null }> => {
    if (!productId) return { success: false, error: 'No product' };

    try {
      const sessionId = getSessionId();
      const { error } = await supabase.from('product_ratings').insert({
        product_id: productId,
        rating,
        user_id: user?.id || null,
        session_id: user?.id ? null : sessionId,
      });

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'You have already rated this product' };
        }
        throw error;
      }

      setUserRating(rating);
      await fetchRatings();
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to submit rating' };
    }
  };

  return { ratings, avgRating, totalRatings, distribution, loading, userRating, submitRating, refetch: fetchRatings };
}

// Product reviews
export function useProductReviews(productId: string | undefined) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalReviews, setTotalReviews] = useState(0);

  const fetchReviews = useCallback(async () => {
    if (!productId) return;

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviews((data as ProductReview[]) || []);
      setTotalReviews(data?.length || 0);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitReview = async (
    reviewerName: string,
    reviewText: string,
    reviewerEmail?: string
  ): Promise<{ success: boolean; error: string | null }> => {
    if (!productId) return { success: false, error: 'No product' };

    try {
      const { error } = await supabase.from('product_reviews').insert({
        product_id: productId,
        reviewer_name: reviewerName,
        review_text: reviewText,
        reviewer_email: reviewerEmail || null,
        status: 'pending',
      });

      if (error) throw error;

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to submit review' };
    }
  };

  return { reviews, loading, totalReviews, submitReview, refetch: fetchReviews };
}

// Product interest
export function useProductInterest(productId: string | undefined) {
  const [hasInterest, setHasInterest] = useState(false);
  const [totalInterest, setTotalInterest] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const checkInterest = useCallback(async () => {
    if (!productId) return;

    setLoading(true);

    try {
      // Get total interest count
      const { count } = await supabase
        .from('product_interest')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId);

      setTotalInterest(count || 0);

      // Check if current user/session has interest
      const sessionId = getSessionId();
      const { data } = await supabase
        .from('product_interest')
        .select('id')
        .eq('product_id', productId)
        .or(`user_id.eq.${user?.id || 'undefined'},session_id.eq.${sessionId}`)
        .maybeSingle();

      setHasInterest(!!data);
    } catch (err) {
      console.error('Error checking interest:', err);
    } finally {
      setLoading(false);
    }
  }, [productId, user?.id]);

  useEffect(() => {
    checkInterest();
  }, [checkInterest]);

  const toggleInterest = async (): Promise<{ success: boolean; error: string | null }> => {
    if (!productId) return { success: false, error: 'No product' };

    try {
      const sessionId = getSessionId();

      if (hasInterest) {
        // Remove interest
        if (user?.id) {
          await supabase
            .from('product_interest')
            .delete()
            .eq('product_id', productId)
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('product_interest')
            .delete()
            .eq('product_id', productId)
            .eq('session_id', sessionId);
        }
        setHasInterest(false);
        setTotalInterest((prev) => Math.max(0, prev - 1));
      } else {
        // Add interest
        const { error } = await supabase.from('product_interest').insert({
          product_id: productId,
          user_id: user?.id || null,
          session_id: user?.id ? null : sessionId,
        });

        if (error) {
          if (error.code === '23505') {
            setHasInterest(true);
            return { success: true, error: null };
          }
          throw error;
        }

        setHasInterest(true);
        setTotalInterest((prev) => prev + 1);
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update interest' };
    }
  };

  return { hasInterest, totalInterest, loading, toggleInterest, refetch: checkInterest };
}

// Product engagement stats
export function useProductEngagementStats(productId: string | undefined) {
  const [stats, setStats] = useState<ProductEngagementStats>({
    total_views: 0,
    total_scans: 0,
    total_ratings: 0,
    avg_rating: 0,
    total_reviews: 0,
    total_interest: 0,
    demand_score: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!productId) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('get_product_engagement_stats', {
        p_product_id: productId,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (err) {
      console.error('Error fetching engagement stats:', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}

// Cooperative engagement stats
export function useCooperativeEngagementStats(cooperativeId: string | undefined) {
  const [stats, setStats] = useState<CooperativeEngagementStats>({
    total_products: 0,
    total_views: 0,
    total_scans: 0,
    total_ratings: 0,
    avg_rating: 0,
    total_reviews: 0,
    total_interest: 0,
    total_demand_score: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!cooperativeId) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('get_cooperative_engagement_stats', {
        p_cooperative_id: cooperativeId,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (err) {
      console.error('Error fetching cooperative stats:', err);
    } finally {
      setLoading(false);
    }
  }, [cooperativeId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}

// QR Scan tracking
export function useQRTracking() {
  const trackScan = async (productId: string): Promise<void> => {
    const deviceType = getDeviceType();
    const sessionId = getSessionId();
    const referrer = document.referrer || null;

    await supabase.from('qr_scans').insert({
      product_id: productId,
      device_type: deviceType,
      session_id: sessionId,
      referrer,
    });
  };

  return { trackScan };
}

// Admin: Review moderation
export function useReviewModeration() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);
  const { user } = useAuth();

  const fetchReviews = useCallback(async (status?: ReviewStatus) => {
    setLoading(true);

    try {
      let query = supabase
        .from('product_reviews')
        .select(`
          *,
          product:products(id, name)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      setReviews((data as ProductReview[]) || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingCount = useCallback(async () => {
    try {
      const { count } = await supabase
        .from('product_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setTotalPending(count || 0);
    } catch (err) {
      console.error('Error fetching pending count:', err);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
    fetchPendingCount();
  }, [fetchReviews, fetchPendingCount]);

  const moderateReview = async (
    reviewId: string,
    status: 'approved' | 'rejected',
    notes?: string
  ): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await supabase
        .from('product_reviews')
        .update({
          status,
          admin_notes: notes || null,
          approved_at: status === 'approved' ? new Date().toISOString() : null,
          approved_by: status === 'approved' && user ? user.id : null,
        })
        .eq('id', reviewId);

      if (error) throw error;

      await fetchReviews();
      await fetchPendingCount();

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to moderate review' };
    }
  };

  return { reviews, loading, totalPending, moderateReview, refetch: fetchReviews };
}

// Platform-wide analytics (Admin) - uses efficient database function
export function usePlatformAnalytics() {
  const [loading, setLoading] = useState(true);
  const [topScannedProducts, setTopScannedProducts] = useState<any[]>([]);
  const [topRatedProducts, setTopRatedProducts] = useState<any[]>([]);
  const [mostDemandedProducts, setMostDemandedProducts] = useState<any[]>([]);
  const [totalPlatformScans, setTotalPlatformScans] = useState(0);
  const [stats, setStats] = useState({
    totalCooperatives: 0,
    activeCooperatives: 0,
    totalProducts: 0,
    activeProducts: 0,
    totalUsers: 0,
    totalViews: 0,
    totalRatings: 0,
    totalReviews: 0,
    totalInterest: 0,
  });

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('get_platform_analytics');

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0];
        setStats({
          totalCooperatives: result.total_cooperatives || 0,
          activeCooperatives: result.active_cooperatives || 0,
          totalProducts: result.total_products || 0,
          activeProducts: result.active_products || 0,
          totalUsers: result.total_users || 0,
          totalViews: result.total_views || 0,
          totalRatings: result.total_ratings || 0,
          totalReviews: result.total_reviews || 0,
          totalInterest: result.total_interest || 0,
        });
        setTotalPlatformScans(result.total_scans || 0);
        setTopScannedProducts(result.top_scanned_products || []);
        setTopRatedProducts(result.top_rated_products || []);
        setMostDemandedProducts(result.most_demanded_products || []);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    loading,
    stats,
    topScannedProducts,
    topRatedProducts,
    mostDemandedProducts,
    totalPlatformScans,
    refetch: fetchAnalytics,
  };
}
