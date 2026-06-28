import { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ImageUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  multiple?: boolean;
  existingImages?: { id: string; image_url: string }[];
  onRemove?: (id: string) => Promise<void>;
  className?: string;
}

export function ImageUpload({
  onUpload,
  multiple = false,
  existingImages = [],
  onRemove,
  className = '',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    setUploading(true);

    const fileArray = Array.from(files);

    // Validate file types
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = fileArray.filter((file) => !validTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      setError('Invalid file type. Please upload images only (JPEG, PNG, GIF, WebP).');
      setUploading(false);
      return;
    }

    // Validate file sizes (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    const oversizedFiles = fileArray.filter((file) => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      setError('Some files are too large. Maximum size is 5MB per image.');
      setUploading(false);
      return;
    }

    try {
      await onUpload(fileArray);

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className={className}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${uploading ? 'opacity-50 cursor-not-allowed' : 'border-secondary-200 hover:border-primary-400 hover:bg-primary-50'}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={uploading}
        />
        <div className="flex flex-col items-center">
          {uploading ? (
            <>
              <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-secondary-600">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-secondary-400 mb-4" />
              <p className="text-sm font-medium text-secondary-700">
                Drag and drop {multiple ? 'images' : 'an image'} here, or click to browse
              </p>
              <p className="text-xs text-secondary-500 mt-2">
                JPEG, PNG, GIF, WebP (max 5MB per file)
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-error-600">{error}</p>
      )}

      {existingImages.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {existingImages.map((image) => (
            <div key={image.id} className="relative group">
              <img
                src={image.image_url}
                alt="Uploaded"
                className="w-full h-32 object-cover rounded-lg"
              />
              {onRemove && (
                <button
                  onClick={() => onRemove(image.id)}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4 text-secondary-600 hover:text-error-600" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface SingleImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  className?: string;
}

export function SingleImageUpload({ value, onChange, className = '' }: SingleImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP).');
      setUploading(false);
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File is too large. Maximum size is 5MB.');
      setUploading(false);
      return;
    }

    try {
      const path = `logos/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div className={className}>
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Uploaded"
            className="w-32 h-32 object-cover rounded-lg"
          />
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-sm hover:bg-secondary-50"
          >
            <X className="w-4 h-4 text-secondary-600" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className={`
            w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors
            ${uploading ? 'opacity-50 cursor-not-allowed' : 'border-secondary-200 hover:border-primary-400 hover:bg-primary-50'}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
          {uploading ? (
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <ImageIcon className="w-8 h-8 text-secondary-400" />
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-error-600">{error}</p>
      )}
    </div>
  );
}
