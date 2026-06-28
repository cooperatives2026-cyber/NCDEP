import type { Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'cooperative_user';

export type CooperativeStatus = 'active' | 'inactive';

export type ProductStatus = 'active' | 'inactive' | 'draft';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Cooperative {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  county: string | null;
  category: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_address: string | null;
  website: string | null;
  social_links: SocialLinks;
  logo_url: string | null;
  cover_image_url: string | null;
  status: CooperativeStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
}

export interface Product {
  id: string;
  cooperative_id: string;
  name: string;
  description: string | null;
  category: string | null;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface ProductWithImages extends Product {
  images: ProductImage[];
  cooperative?: Cooperative | null;
}

export interface CooperativeWithProducts extends Cooperative {
  products: Product[];
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  error?: string;
  options?: { value: string; label: string }[];
  rows?: number;
}

export interface DataTableColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  total: number;
}

export interface SearchParams {
  query?: string;
  category?: string;
  county?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Phase 2 Types
export interface QRScan {
  id: string;
  product_id: string;
  scanned_at: string;
  device_type: string | null;
  location_country: string | null;
  location_region: string | null;
  location_city: string | null;
  referrer: string | null;
  session_id: string | null;
  event_id: string | null;
}

export interface ProductRating {
  id: string;
  product_id: string;
  rating: number;
  user_id: string | null;
  session_id: string | null;
  created_at: string;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ProductReview {
  id: string;
  product_id: string;
  reviewer_name: string;
  reviewer_email: string | null;
  review_text: string;
  status: ReviewStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
}

export interface ProductInterest {
  id: string;
  product_id: string;
  user_id: string | null;
  session_id: string | null;
  created_at: string;
}

export interface ProductView {
  id: string;
  product_id: string;
  user_id: string | null;
  session_id: string | null;
  viewed_at: string;
  referrer: string | null;
  device_type: string | null;
  ip_hash: string | null;
}

export interface ProductEngagementStats {
  total_views: number;
  total_scans: number;
  total_ratings: number;
  avg_rating: number;
  total_reviews: number;
  total_interest: number;
  demand_score: number;
}

export interface CooperativeEngagementStats {
  total_products: number;
  total_views: number;
  total_scans: number;
  total_ratings: number;
  avg_rating: number;
  total_reviews: number;
  total_interest: number;
  total_demand_score: number;
}

export interface RatingDistribution {
  rating: number;
  count: number;
}

export interface ProductWithEngagement extends ProductWithImages {
  engagement?: ProductEngagementStats;
  rating_distribution?: RatingDistribution[];
}

// Phase 3 Types - Events & Discovery Platform
export type EventStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
export type ParticipantStatus = 'pending' | 'approved' | 'rejected' | 'active';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface EventType {
  id: number;
  name: string;
  description: string | null;
  sort_order: number;
}

export interface Event {
  id: string;
  name: string;
  description: string | null;
  event_type: string;
  county: string | null;
  venue: string | null;
  start_date: string;
  end_date: string;
  status: EventStatus;
  cover_image_url: string | null;
  banner_image_url: string | null;
  organizer: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  cooperative_id: string;
  status: ParticipantStatus;
  products_count: number;
  notes: string | null;
  applied_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  cooperative?: Cooperative;
  event?: Event;
}

export interface EventProduct {
  id: string;
  event_id: string;
  product_id: string;
  participant_id: string | null;
  featured: boolean;
  notes: string | null;
  created_at: string;
  product?: ProductWithImages;
  event?: Event;
}

export interface Campaign {
  id: string;
  event_id: string | null;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: CampaignStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CampaignProduct {
  id: string;
  campaign_id: string;
  product_id: string;
  created_at: string;
  product?: ProductWithImages;
}

export interface EventStats {
  total_participants: number;
  approved_participants: number;
  total_products: number;
  total_scans: number;
  total_ratings: number;
  total_reviews: number;
  total_interest: number;
  avg_rating: number;
}

export interface EventProductRanking {
  product_id: string;
  product_name: string;
  cooperative_name: string | null;
  scan_count: number;
  rating_count: number;
  avg_rating: number;
  review_count: number;
  interest_count: number;
  demand_score: number;
}

export interface DiscoveryLeaderboardEntry {
  product_id: string;
  product_name: string;
  cooperative_name: string | null;
  category: string | null;
  total_scans: number;
  total_ratings: number;
  avg_rating: number;
  total_reviews: number;
  total_interest: number;
  demand_score: number;
  rank_position: number;
}

export interface PlatformEventAnalytics {
  total_events: number;
  active_events: number;
  scheduled_events: number;
  completed_events: number;
  total_participants: number;
  total_event_products: number;
  total_event_scans: number;
  total_event_ratings: number;
  total_event_reviews: number;
  top_events_by_engagement: Array<{
    event_id: string;
    event_name: string;
    event_type: string;
    start_date: string;
    scan_count: number;
    rating_count: number;
    product_count: number;
  }>;
}

// Phase 4 Types - Buyer Opportunities & Market Linkages
export type BuyerStatus = 'pending' | 'active' | 'inactive' | 'suspended';
export type OpportunityStatus = 'draft' | 'open' | 'under_review' | 'awarded' | 'closed' | 'cancelled';
export type ResponseStatus = 'submitted' | 'shortlisted' | 'rejected' | 'awarded' | 'withdrawn';

export interface BuyerType {
  id: number;
  name: string;
  description: string | null;
  sort_order: number;
}

export interface OpportunityCategory {
  id: number;
  name: string;
  description: string | null;
  sort_order: number;
}

export interface Buyer {
  id: string;
  user_id: string | null;
  company_name: string;
  buyer_type: string;
  description: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  county: string | null;
  town: string | null;
  address: string | null;
  logo_url: string | null;
  verified: boolean;
  status: BuyerStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Opportunity {
  id: string;
  buyer_id: string;
  title: string;
  description: string | null;
  category: string;
  quantity_required: number | null;
  quantity_unit: string | null;
  quality_requirements: string | null;
  delivery_location: string | null;
  county: string | null;
  buyer_type: string | null;
  submission_deadline: string | null;
  status: OpportunityStatus;
  featured: boolean;
  views_count: number;
  responses_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  awarded_to: string | null;
  awarded_at: string | null;
  buyer?: Buyer;
}

export interface OpportunityResponse {
  id: string;
  opportunity_id: string;
  cooperative_id: string;
  products_offered: string | null;
  quantity_available: number | null;
  quantity_unit: string | null;
  price_per_unit: number | null;
  price_currency: string;
  notes: string | null;
  capacity_information: string | null;
  delivery_capability: string | null;
  status: ResponseStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  cooperative?: Cooperative;
  opportunity?: Opportunity;
}

export interface OpportunityStats {
  total_responses: number;
  submitted_count: number;
  shortlisted_count: number;
  rejected_count: number;
  awarded_count: number;
}

export interface MarketLinkageStats {
  total_buyers: number;
  verified_buyers: number;
  total_opportunities: number;
  open_opportunities: number;
  total_responses: number;
  shortlisted_responses: number;
  awarded_responses: number;
  most_requested_categories: Array<{ category: string; count: number }>;
  top_buyer_counties: Array<{ county: string; count: number }>;
  top_supplier_counties: Array<{ county: string; awarded_count: number }>;
}

export interface CategoryDemandTrend {
  category: string;
  total_opportunities: number;
  total_quantity_requested: number;
  avg_responses: number;
  success_rate: number;
}

export interface TopSupplier {
  cooperative_id: string;
  cooperative_name: string;
  county: string | null;
  total_responses: number;
  awarded_responses: number;
  success_rate: number;
}

// Phase 5 Types - NCDE (National Cooperative Distribution Exchange)
export type RetailOutletStatus = 'active' | 'inactive' | 'closed';
export type DistributionPartnerStatus = 'active' | 'inactive' | 'suspended';
export type AggregationCenterStatus = 'active' | 'planned' | 'inactive' | 'under_construction';
export type DistributionRequestStatus = 'pending' | 'reviewed' | 'fulfilled' | 'closed' | 'spam';

export interface RetailOutlet {
  id: string;
  name: string;
  outlet_type: string;
  county: string | null;
  town: string | null;
  address: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  opening_hours: string | null;
  logo_url: string | null;
  verified: boolean;
  status: RetailOutletStatus;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProductAvailability {
  id: string;
  product_id: string;
  outlet_type: string;
  outlet_id: string | null;
  cooperative_id: string | null;
  status: string;
  quantity_range: string | null;
  price_range_low: number | null;
  price_range_high: number | null;
  notes: string | null;
  last_verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
  outlet?: RetailOutlet;
  product?: Product;
}

export interface DistributionPartner {
  id: string;
  name: string;
  partner_type: string;
  description: string | null;
  coverage_counties: string[] | null;
  national_coverage: boolean;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  website: string | null;
  logo_url: string | null;
  verified: boolean;
  status: DistributionPartnerStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProductDistributor {
  id: string;
  product_id: string;
  distributor_id: string;
  exclusive: boolean;
  coverage_counties: string[] | null;
  created_at: string;
  distributor?: DistributionPartner;
}

export interface AggregationCenter {
  id: string;
  name: string;
  county: string;
  town: string | null;
  address: string | null;
  capacity_description: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  operating_hours: string | null;
  managed_by: string | null;
  status: AggregationCenterStatus;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface AggregationProduct {
  id: string;
  center_id: string;
  product_id: string;
  quantity_range: string | null;
  handling_notes: string | null;
  created_at: string;
  center?: AggregationCenter;
  product?: Product;
}

export interface DistributionRequest {
  id: string;
  product_id: string | null;
  product_name: string | null;
  county: string;
  town: string | null;
  request_type: string;
  requestor_type: string;
  requestor_name: string | null;
  requestor_email: string | null;
  requestor_phone: string | null;
  quantity_range: string | null;
  notes: string | null;
  status: DistributionRequestStatus;
  user_id: string | null;
  session_id: string | null;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface ProductAvailabilitySummary {
  total_locations: number;
  available_count: number;
  limited_count: number;
  out_of_stock_count: number;
  counties_available: number;
  outlet_types: string[];
}

export interface NCDEStats {
  total_retail_outlets: number;
  total_distribution_partners: number;
  total_aggregation_centers: number;
  total_product_availability_records: number;
  pending_distribution_requests: number;
  active_counties: number;
  products_with_availability: number;
}

export interface CountyAvailability {
  county: string;
  total_products: number;
  available_products: number;
  total_outlets: number;
  total_centers: number;
  top_products: Array<{ product_id: string; product_name: string; availability_count: number }>;
}

export interface DistributionGap {
  county: string;
  high_demand_count: number;
  low_availability_count: number;
  gap_score: number;
  pending_requests: number;
}

export interface TopDistributedProduct {
  product_id: string;
  product_name: string;
  cooperative_name: string | null;
  availability_count: number;
  distributor_count: number;
  county_coverage: number;
}
