import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Calendar } from 'lucide-react';
import { useEvent, useEventMutations, useCounties, useEventTypes } from '../../hooks';
import { Input, Textarea, Select, Button, Card, CardHeader, CardTitle, CardContent, SingleImageUpload } from '../../components/shared';
import type { Event } from '../../types';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function EventFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('');
  const [county, setCounty] = useState('');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('draft');
  const [organizer, setOrganizer] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(null);

  const { event, loading: eventLoading } = useEvent(id);
  const { createEvent, updateEvent } = useEventMutations();
  const { counties } = useCounties();
  const { eventTypes } = useEventTypes();

  const countyOptions = useMemo(() =>
    counties.map(c => ({ value: c.name, label: c.name })),
    [counties]
  );

  const eventTypeOptions = useMemo(() =>
    eventTypes.map(t => ({ value: t.name, label: t.name })),
    [eventTypes]
  );

  useEffect(() => {
    if (isEditMode && event) {
      setName(event.name || '');
      setDescription(event.description || '');
      setEventType(event.event_type || '');
      setCounty(event.county || '');
      setVenue(event.venue || '');
      setStartDate(event.start_date ? new Date(event.start_date).toISOString().slice(0, 16) : '');
      setEndDate(event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : '');
      setStatus(event.status || 'draft');
      setOrganizer(event.organizer || '');
      setCoverImageUrl(event.cover_image_url);
      setBannerImageUrl(event.banner_image_url);
    }
  }, [isEditMode, event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const data: Partial<Event> = {
      name,
      description: description || null,
      event_type: eventType,
      county: county || null,
      venue: venue || null,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      status: status as Event['status'],
      organizer: organizer || null,
      cover_image_url: coverImageUrl,
      banner_image_url: bannerImageUrl,
    };

    try {
      if (isEditMode) {
        const { error: updateError } = await updateEvent(id, data);
        if (updateError) throw new Error(updateError);
      } else {
        const result = await createEvent(data);
        if (result.error) throw new Error(result.error);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/events');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  if (eventLoading) {
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
            {isEditMode ? 'Event Updated' : 'Event Created'}
          </h2>
          <p className="text-secondary-600">Redirecting to events...</p>
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
          {isEditMode ? 'Edit Event' : 'Create New Event'}
        </h1>
        <p className="text-secondary-600 mt-1">
          {isEditMode ? 'Update event information' : 'Set up a new discovery event'}
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
                <Calendar className="w-5 h-5" />
                Event Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Event Name"
                placeholder="Enter event name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Textarea
                label="Description"
                placeholder="Describe the event..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <Select
                  label="Event Type"
                  placeholder="Select type"
                  options={eventTypeOptions}
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  required
                />

                <Select
                  label="County"
                  placeholder="Select county"
                  options={countyOptions}
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                />
              </div>

              <Input
                label="Venue"
                placeholder="Event venue"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
              />

              <Input
                label="Organizer"
                placeholder="Event organizer"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                    required
                  />
                </div>
              </div>

              <Select
                label="Status"
                options={STATUS_OPTIONS}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
              />
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Cover Image</label>
                <SingleImageUpload value={coverImageUrl} onChange={setCoverImageUrl} />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Banner Image</label>
                <SingleImageUpload value={bannerImageUrl} onChange={setBannerImageUrl} />
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
              {isEditMode ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
