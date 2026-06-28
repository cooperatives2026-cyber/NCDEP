import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Package, Plus, X, Image as ImageIcon } from 'lucide-react';
import { useProduct, useProductMutations, useMyCooperative, useProductCategories } from '../../hooks';
import { useAuth } from '../../hooks/useAuth';
import { Input, Textarea, Select, Button, Card, CardHeader, CardTitle, CardContent, LoadingSpinner } from '../../components/shared';
import { supabase } from '../../lib/supabase';
import type { Product, ProductImage } from '../../types';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<string>('draft');
  const [images, setImages] = useState<ProductImage[]>([]);
  const [newImagesUploading, setNewImagesUploading] = useState(false);
  const [cooperativeId, setCooperativeId] = useState<string | null>(null);

  const { product, loading: productLoading } = useProduct(id);
  const { cooperative } = useMyCooperative();
  const { createProduct, updateProduct, addProductImage, deleteProductImage } = useProductMutations();
  const { categories } = useProductCategories();

  const categoryOptions = useMemo(() =>
    categories.map(c => ({ value: c.name, label: c.name })),
    [categories]
  );

  useEffect(() => {
    if (isEditMode && product) {
      setName(product.name || '');
      setDescription(product.description || '');
      setCategory(product.category || '');
      setStatus(product.status || 'draft');
      setImages(product.images || []);
      setCooperativeId(product.cooperative_id);
    } else if (cooperative) {
      setCooperativeId(cooperative.id);
    }
  }, [isEditMode, product, cooperative]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !id) return;

    setNewImagesUploading(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await addProductImage(id, file);
        if (result.error) {
          throw new Error(result.error);
        }
      }

      // Refresh product to get updated images
      const { data, error: fetchError } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(*)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      setImages((data as any)?.images || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setNewImagesUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      const { error: deleteError } = await deleteProductImage(imageId);
      if (deleteError) throw deleteError;

      setImages(images.filter((img) => img.id !== imageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const data: Partial<Product> = {
      name,
      description: description || null,
      category: category || null,
      status: status as 'active' | 'inactive' | 'draft',
      cooperative_id: cooperativeId || undefined,
    };

    try {
      if (isEditMode) {
        const { error: updateError } = await updateProduct(id, data);
        if (updateError) throw new Error(updateError);
      } else {
        const result = await createProduct(data);
        if (result.error) throw new Error(result.error);

        // Navigate to edit mode for the new product
        if (result.data) {
          navigate(`/dashboard/products/${result.data.id}/edit`, { replace: true });
          return;
        }
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  if (productLoading || (!isEditMode && !cooperative && !isAdmin)) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isEditMode && !cooperative && !isAdmin) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">No Cooperative Profile</h2>
          <p className="text-secondary-600 mb-6">
            You need to create a cooperative profile before adding products.
          </p>
          <Button onClick={() => navigate('/dashboard/cooperative/new')}>
            Create Cooperative Profile
          </Button>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">
            {isEditMode ? 'Product Updated' : 'Product Created'}
          </h2>
          <p className="text-secondary-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-secondary-600 hover:text-secondary-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-secondary-900">
          {isEditMode ? 'Edit Product' : 'Add New Product'}
        </h1>
        <p className="text-secondary-600 mt-1">
          {isEditMode ? 'Update product information' : 'Create a new product listing'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg text-error-700">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Product Name"
                placeholder="Enter product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Textarea
                label="Description"
                placeholder="Describe your product..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <Select
                  label="Category"
                  placeholder="Select category"
                  options={categoryOptions}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />

                <Select
                  label="Status"
                  placeholder="Select status"
                  options={STATUS_OPTIONS}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          {isEditMode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Product Images
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing Images */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((image) => (
                        <div key={image.id} className="relative group aspect-square">
                          <img
                            src={image.image_url}
                            alt="Product"
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(image.id)}
                            className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error-50"
                          >
                            <X className="w-4 h-4 text-error-600" />
                          </button>
                        </div>
                      ))}
                  </div>
                )}

                {/* Upload New Images */}
                <div className="border-2 border-dashed border-secondary-200 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="product-images-upload"
                    disabled={newImagesUploading}
                  />
                  <label
                    htmlFor="product-images-upload"
                    className={`cursor-pointer ${newImagesUploading ? 'opacity-50' : ''}`}
                  >
                    {newImagesUploading ? (
                      <div className="flex flex-col items-center">
                        <LoadingSpinner size="md" />
                        <p className="text-sm text-secondary-600 mt-2">Uploading...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Plus className="w-8 h-8 text-secondary-400 mb-2" />
                        <p className="text-sm text-secondary-600">
                          Click to add more images
                        </p>
                        <p className="text-xs text-secondary-400 mt-1">
                          JPEG, PNG, GIF, WebP (max 5MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Initial Image Upload for New Products */}
          {!isEditMode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Product Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-secondary-600 mb-4">
                  You can add images after creating the product.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              icon={<Save className="w-4 h-4" />}
            >
              {isEditMode ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
