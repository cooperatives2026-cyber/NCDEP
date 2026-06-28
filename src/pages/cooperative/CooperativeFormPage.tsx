import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import { useMyCooperative, useCounties, useCooperativeCategories } from '../../hooks';
import { supabase } from '../../lib/supabase';
import { Input, Textarea, Select, Button, Card, CardHeader, CardTitle, CardContent, SingleImageUpload } from '../../components/shared';
import type { Cooperative, SocialLinks } from '../../types';

export function CooperativeFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [county, setCounty] = useState('');
  const [category, setCategory] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [facebook, setFacebook] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  // Load existing cooperative if editing
  const { cooperative, loading: coopLoading } = useMyCooperative();
  const { counties } = useCounties();
  const { categories } = useCooperativeCategories();

  const countyOptions = useMemo(() =>
    counties.map(c => ({ value: c.name, label: c.name })),
    [counties]
  );

  const categoryOptions = useMemo(() =>
    categories.map(c => ({ value: c.name, label: c.name })),
    [categories]
  );

  useEffect(() => {
    if (isEditMode && cooperative) {
      setName(cooperative.name || '');
      setDescription(cooperative.description || '');
      setCounty(cooperative.county || '');
      setCategory(cooperative.category || '');
      setContactPhone(cooperative.contact_phone || '');
      setContactEmail(cooperative.contact_email || '');
      setContactAddress(cooperative.contact_address || '');
      setWebsite(cooperative.website || '');
      const socialLinks = cooperative.social_links || {};
      setFacebook(socialLinks.facebook || '');
      setTwitter(socialLinks.twitter || '');
      setInstagram(socialLinks.instagram || '');
      setLinkedin(socialLinks.linkedin || '');
      setLogoUrl(cooperative.logo_url);
      setCoverImageUrl(cooperative.cover_image_url);
    }
  }, [isEditMode, cooperative]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const socialLinks: SocialLinks = {};
    if (facebook) socialLinks.facebook = facebook;
    if (twitter) socialLinks.twitter = twitter;
    if (instagram) socialLinks.instagram = instagram;
    if (linkedin) socialLinks.linkedin = linkedin;

    const data: Partial<Cooperative> = {
      name,
      description: description || null,
      county: county || null,
      category: category || null,
      contact_phone: contactPhone || null,
      contact_email: contactEmail || null,
      contact_address: contactAddress || null,
      website: website || null,
      social_links: socialLinks,
      logo_url: logoUrl,
      cover_image_url: coverImageUrl,
    };

    try {
      if (isEditMode && cooperative) {
        const { error: updateError } = await supabase
          .from('cooperatives')
          .update(data)
          .eq('id', cooperative.id);

        if (updateError) throw updateError;
      } else {
        // Get current user's id
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('Not authenticated');
        }

        const { error: createError } = await supabase.from('cooperatives').insert({
          ...data,
          user_id: user.id,
          status: 'active',
        });

        if (createError) throw createError;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save cooperative');
    } finally {
      setLoading(false);
    }
  };

  if (coopLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
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
            {isEditMode ? 'Cooperative Updated' : 'Cooperative Created'}
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
          {isEditMode ? 'Edit Cooperative' : 'Create Cooperative Profile'}
        </h1>
        <p className="text-secondary-600 mt-1">
          {isEditMode
            ? 'Update your cooperative information'
            : 'Set up your cooperative profile to start listing products'}
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
                <Building2 className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Cooperative Name"
                placeholder="Enter cooperative name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Textarea
                label="Description"
                placeholder="Tell us about your cooperative..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <Select
                  label="County"
                  placeholder="Select county"
                  options={countyOptions}
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                />

                <Select
                  label="Category"
                  placeholder="Select category"
                  options={categoryOptions}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="+254 XXX XXX XXX"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="contact@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>

              <Textarea
                label="Physical Address"
                placeholder="Enter your physical address"
                value={contactAddress}
                onChange={(e) => setContactAddress(e.target.value)}
                rows={2}
              />

              <Input
                label="Website"
                type="url"
                placeholder="https://example.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Social Media Links */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Facebook"
                  type="url"
                  placeholder="https://facebook.com/..."
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                />

                <Input
                  label="Twitter"
                  type="url"
                  placeholder="https://twitter.com/..."
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                />

                <Input
                  label="Instagram"
                  type="url"
                  placeholder="https://instagram.com/..."
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                />

                <Input
                  label="LinkedIn"
                  type="url"
                  placeholder="https://linkedin.com/..."
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Logo</label>
                <SingleImageUpload value={logoUrl} onChange={setLogoUrl} />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Cover Image</label>
                <SingleImageUpload value={coverImageUrl} onChange={setCoverImageUrl} />
              </div>
            </CardContent>
          </Card>

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
              {isEditMode ? 'Update Cooperative' : 'Create Cooperative'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
