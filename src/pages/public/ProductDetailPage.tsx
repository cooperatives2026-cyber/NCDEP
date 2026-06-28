import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Package, Building2, MapPin, ChevronLeft, ChevronRight, QrCode, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { LoadingPage, ErrorMessage, Card, Badge, Button } from '../../components/shared';
import {
  RatingDisplay,
  RatingInput,
  RatingDistribution,
  InterestButton,
  ReviewList,
  QRCodeModal,
  ProductAvailabilityWidget,
} from '../../components/engagement';
import {
  useTrackProductView,
  useProductRatings,
  useProductReviews,
  useProductInterest,
  useQRTracking,
} from '../../hooks';
import type { ProductWithImages, Cooperative } from '../../types';

interface ProductWithCooperative extends ProductWithImages {
  cooperative: Cooperative | null;
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [product, setProduct] = useState<ProductWithCooperative | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showQRModal, setShowQRModal] = useState(false);

  // Check if this is a QR scan
  const isQRScan = searchParams.get('qr') === '1';

  // Track product view
  useTrackProductView(id);

  // QR tracking
  const { trackScan } = useQRTracking();

  // Phase 2 hooks
  const {
    avgRating,
    totalRatings,
    distribution,
    loading: ratingsLoading,
    userRating,
    submitRating,
  } = useProductRatings(id);

  const {
    reviews,
    loading: reviewsLoading,
    totalReviews,
    submitReview,
  } = useProductReviews(id);

  const {
    hasInterest,
    totalInterest,
    loading: interestLoading,
    toggleInterest,
  } = useProductInterest(id);

  // Handle QR scan tracking
  useEffect(() => {
    if (isQRScan && id) {
      trackScan(id);
    }
  }, [isQRScan, id, trackScan]);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('products')
          .select(
            `
            *,
            images:product_images(*),
            cooperative:cooperatives(*)
          `
          )
          .eq('id', id)
          .eq('status', 'active')
          .is('deleted_at', null)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (data) {
          const sortedImages = (data.images || []).sort(
            (a: any, b: any) => a.sort_order - b.sort_order
          );
          setProduct({ ...data, images: sortedImages } as ProductWithCooperative);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) return <LoadingPage />;
  if (error) return <ErrorMessage message={error} />;
  if (!product) return <ErrorMessage message="Product not found" />;

  const images = product.images || [];
  const currentImage = images[currentImageIndex];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-secondary-500 mb-6">
        <Link to="/products" className="hover:text-primary-600">
          Products
        </Link>
        <span>/</span>
        <span className="text-secondary-900">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div>
          <div className="relative aspect-square bg-secondary-100 rounded-xl overflow-hidden">
            {currentImage ? (
              <img
                src={currentImage.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-24 h-24 text-secondary-300" />
              </div>
            )}

            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-secondary-700" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-secondary-700" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    index === currentImageIndex
                      ? 'border-primary-600'
                      : 'border-transparent hover:border-secondary-300'
                  }`}
                >
                  <img
                    src={image.image_url}
                    alt={`${product.name} - ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <div className="mb-6">
            {product.category && (
              <Badge variant="info" className="mb-3">
                {product.category}
              </Badge>
            )}
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">{product.name}</h1>

            {/* Rating Display */}
            {!ratingsLoading && (
              <div className="mt-3">
                <RatingDisplay
                  avgRating={avgRating}
                  totalRatings={totalRatings}
                  size="md"
                />
              </div>
            )}
          </div>

          {product.description && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-secondary-700 mb-2">Description</h3>
              <p className="text-secondary-600 whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {/* Interest Button */}
          <div className="mb-6">
            <InterestButton
              hasInterest={hasInterest}
              totalInterest={totalInterest}
              onToggle={toggleInterest}
              loading={interestLoading}
              size="lg"
            />
          </div>

          {/* QR Code Button */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => setShowQRModal(true)}
            >
              <QrCode className="w-5 h-5 mr-2" />
              Get QR Code
            </Button>
          </div>

          {/* Rating Input */}
          <Card className="mb-6">
            <div className="p-4">
              <h3 className="text-sm font-medium text-secondary-700 mb-3">Rate this product</h3>
              {userRating !== null ? (
                <div className="flex items-center gap-2 text-sm text-secondary-600">
                  <Star className="w-5 h-5 text-warning-400 fill-warning-400" />
                  <span>You rated this product {userRating} star{userRating > 1 ? 's' : ''}</span>
                </div>
              ) : (
                <RatingInput
                  currentRating={0}
                  onRate={async (rating) => {
                    const result = await submitRating(rating);
                    if (!result.success && result.error) {
                      alert(result.error);
                    }
                  }}
                  size="lg"
                />
              )}
            </div>
          </Card>

          {/* Cooperative Info */}
          {product.cooperative && (
            <Card className="p-6">
              <h3 className="text-sm font-medium text-secondary-700 mb-4">Offered by</h3>
              <Link
                to={`/cooperatives/${product.cooperative.id}`}
                className="flex items-start gap-4 hover:bg-secondary-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
              >
                {product.cooperative.logo_url ? (
                  <img
                    src={product.cooperative.logo_url}
                    alt={product.cooperative.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-secondary-900 line-clamp-1">
                    {product.cooperative.name}
                  </p>
                  {product.cooperative.category && (
                    <p className="text-sm text-secondary-500">{product.cooperative.category}</p>
                  )}
                  {product.cooperative.county && (
                    <div className="flex items-center text-sm text-secondary-500 mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      {product.cooperative.county}
                    </div>
                  )}
                </div>
              </Link>
            </Card>
          )}

          {/* Product Availability */}
          <div className="mt-6">
            <ProductAvailabilityWidget productId={product.id} />
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="mt-12">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Rating Distribution</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <RatingDistribution
                  distribution={distribution}
                  totalRatings={totalRatings}
                />
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <p className="text-5xl font-bold text-secondary-900">{avgRating.toFixed(1)}</p>
                  <div className="mt-2">
                    <RatingDisplay
                      avgRating={avgRating}
                      totalRatings={totalRatings}
                      size="md"
                      showCount={false}
                    />
                  </div>
                  <p className="text-sm text-secondary-500 mt-1">
                    {totalRatings} rating{totalRatings !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Reviews Section */}
      <div className="mt-8">
        <Card>
          <div className="p-6">
            <ReviewList
              reviews={reviews}
              loading={reviewsLoading}
              totalReviews={totalReviews}
              onSubmitReview={submitReview}
            />
          </div>
        </Card>
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        productId={product.id}
        productName={product.name}
      />
    </div>
  );
}
