import { useParams, Link } from 'react-router-dom';
import { Building2, MapPin, Phone, Mail, Globe, ExternalLink, Package, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { LoadingPage, ErrorMessage, Card } from '../../components/shared';
import { useState, useEffect } from 'react';
import type { Cooperative, ProductWithImages } from '../../types';

interface CooperativeWithProducts extends Cooperative {
  products: ProductWithImages[];
}

export function CooperativeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [cooperative, setCooperative] = useState<CooperativeWithProducts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchCooperative = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('cooperatives')
          .select(`
            *,
            products:products!products_cooperative_id_fkey (
              *,
              images:product_images(*)
            )
          `)
          .eq('id', id)
          .eq('status', 'active')
          .is('deleted_at', null)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (data) {
          // Filter active products
          const activeProducts = (data.products || []).filter(
            (p: any) => p.status === 'active' && !p.deleted_at
          );
          setCooperative({ ...data, products: activeProducts } as CooperativeWithProducts);
        } else {
          setError('Cooperative not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cooperative');
      } finally {
        setLoading(false);
      }
    };

    fetchCooperative();
  }, [id]);

  if (loading) return <LoadingPage />;
  if (error) return <ErrorMessage message={error} />;
  if (!cooperative) return <ErrorMessage message="Cooperative not found" />;

  const socialLinks = cooperative.social_links || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="relative">
        {cooperative.cover_image_url ? (
          <div className="h-48 sm:h-64 rounded-xl overflow-hidden">
            <img
              src={cooperative.cover_image_url}
              alt={cooperative.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-48 sm:h-64 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
            <Building2 className="w-20 h-20 text-primary-400" />
          </div>
        )}

        <div className="absolute -bottom-8 left-6 flex items-end gap-4">
          {cooperative.logo_url ? (
            <img
              src={cooperative.logo_url}
              alt={`${cooperative.name} logo`}
              className="w-20 h-20 rounded-xl object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-white border-4 border-white shadow-lg flex items-center justify-center">
              <Building2 className="w-10 h-10 text-primary-400" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-secondary-900">{cooperative.name}</h1>
                {cooperative.category && (
                  <span className="inline-block mt-2 px-3 py-1 bg-primary-50 text-primary-700 text-sm font-medium rounded-full">
                    {cooperative.category}
                  </span>
                )}
              </div>
            </div>

            {cooperative.county && (
              <div className="flex items-center mt-4 text-secondary-600">
                <MapPin className="w-5 h-5 mr-2" />
                {cooperative.county}
              </div>
            )}
          </div>

          {cooperative.description && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-3">About</h2>
              <p className="text-secondary-600 whitespace-pre-line">{cooperative.description}</p>
            </Card>
          )}

          {/* Products */}
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">
              Products ({cooperative.products.length})
            </h2>

            {cooperative.products.length === 0 ? (
              <Card className="p-6 text-center">
                <Package className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                <p className="text-secondary-600">No products listed yet</p>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {cooperative.products.map((product) => (
                  <Link key={product.id} to={`/products/${product.id}`}>
                    <Card className="h-full hover:shadow-md transition-shadow">
                      <div className="aspect-video bg-secondary-100">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0].image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-secondary-300" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-secondary-900 line-clamp-1">
                          {product.name}
                        </h3>
                        {product.category && (
                          <span className="text-xs text-secondary-500">{product.category}</span>
                        )}
                        {product.description && (
                          <p className="text-sm text-secondary-600 mt-1 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-24">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Contact Information</h3>

            <div className="space-y-4">
              {cooperative.contact_phone && (
                <div className="flex items-center text-secondary-600">
                  <Phone className="w-5 h-5 mr-3 text-secondary-400" />
                  <a href={`tel:${cooperative.contact_phone}`} className="hover:text-primary-600">
                    {cooperative.contact_phone}
                  </a>
                </div>
              )}

              {cooperative.contact_email && (
                <div className="flex items-center text-secondary-600">
                  <Mail className="w-5 h-5 mr-3 text-secondary-400" />
                  <a
                    href={`mailto:${cooperative.contact_email}`}
                    className="hover:text-primary-600"
                  >
                    {cooperative.contact_email}
                  </a>
                </div>
              )}

              {cooperative.contact_address && (
                <div className="flex items-start text-secondary-600">
                  <MapPin className="w-5 h-5 mr-3 text-secondary-400 mt-0.5" />
                  <span className="whitespace-pre-line">{cooperative.contact_address}</span>
                </div>
              )}

              {cooperative.website && (
                <div className="flex items-center text-secondary-600">
                  <Globe className="w-5 h-5 mr-3 text-secondary-400" />
                  <a
                    href={cooperative.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary-600 flex items-center gap-1"
                  >
                    Visit Website
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            {/* Social Links */}
            {(socialLinks.facebook ||
              socialLinks.twitter ||
              socialLinks.instagram ||
              socialLinks.linkedin) && (
              <div className="mt-6 pt-6 border-t border-secondary-100">
                <h4 className="text-sm font-medium text-secondary-700 mb-3">Follow Us</h4>
                <div className="flex gap-3">
                  {socialLinks.facebook && (
                    <a
                      href={socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center text-secondary-600 hover:bg-primary-100 hover:text-primary-600 transition-colors"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                  {socialLinks.twitter && (
                    <a
                      href={socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center text-secondary-600 hover:bg-primary-100 hover:text-primary-600 transition-colors"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                  {socialLinks.instagram && (
                    <a
                      href={socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center text-secondary-600 hover:bg-primary-100 hover:text-primary-600 transition-colors"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {socialLinks.linkedin && (
                    <a
                      href={socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center text-secondary-600 hover:bg-primary-100 hover:text-primary-600 transition-colors"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
