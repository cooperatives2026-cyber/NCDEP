import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, Plus, Eye, Edit, MapPin, Building2, Users, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card, Badge, LoadingSpinner, EmptyState, Button, ConfirmDialog } from '../../components/shared';
import { useCounties, useEventTypes } from '../../hooks';
import type { Event } from '../../types';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'info' | 'error' | 'default'> = {
  draft: 'default',
  scheduled: 'info',
  active: 'success',
  completed: 'warning',
  cancelled: 'error',
};

export function AdminEventsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { counties } = useCounties();
  const { eventTypes } = useEventTypes();

  const query = searchParams.get('q') || '';
  const status = searchParams.get('status') || '';
  const eventType = searchParams.get('type') || '';
  const county = searchParams.get('county') || '';

  const countyOptions = useMemo(() =>
    counties.map(c => ({ value: c.name, label: c.name })),
    [counties]
  );

  const eventTypeOptions = useMemo(() =>
    eventTypes.map(t => ({ value: t.name, label: t.name })),
    [eventTypes]
  );

  useEffect(() => {
    fetchEvents();
  }, [query, status, eventType, county, page]);

  const fetchEvents = async () => {
    setLoading(true);

    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let request = supabase
        .from('events')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)
        .range(from, to);

      if (query) {
        request = request.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      }

      if (status) {
        request = request.eq('status', status);
      }

      if (eventType) {
        request = request.eq('event_type', eventType);
      }

      if (county) {
        request = request.eq('county', county);
      }

      request = request.order('start_date', { ascending: false });

      const { data, error, count } = await request;

      if (error) throw error;

      setEvents(data as Event[] || []);
      setTotal(count || 0);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);

    try {
      const { error } = await supabase
        .from('events')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', deleteId);

      if (error) throw error;

      setEvents(events.filter(e => e.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('Error deleting event:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSearch = formData.get('search') as string;

    const params = new URLSearchParams(searchParams);
    if (newSearch) {
      params.set('q', newSearch);
    } else {
      params.delete('q');
    }
    setPage(1);
    setSearchParams(params);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Manage Events</h1>
          <p className="text-secondary-600 mt-1">{total} events</p>
        </div>
        <Button onClick={() => navigate('/admin/events/new')} icon={<Plus className="w-4 h-4" />}>
          Create Event
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-100 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                name="search"
                defaultValue={query}
                placeholder="Search events..."
                className="w-full pl-4 pr-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
              />
            </div>
          </form>

          <select
            value={status}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) {
                params.set('status', e.target.value);
              } else {
                params.delete('status');
              }
              setPage(1);
              setSearchParams(params);
            }}
            className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={eventType}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) {
                params.set('type', e.target.value);
              } else {
                params.delete('type');
              }
              setPage(1);
              setSearchParams(params);
            }}
            className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
          >
            <option value="">All Types</option>
            {eventTypeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={county}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) {
                params.set('county', e.target.value);
              } else {
                params.delete('county');
              }
              setPage(1);
              setSearchParams(params);
            }}
            className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
          >
            <option value="">All Counties</option>
            {countyOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-12 h-12" />}
          title="No events found"
          description="Create your first event to get started."
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              {event.cover_image_url ? (
                <div className="h-40 bg-secondary-100">
                  <img
                    src={event.cover_image_url}
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-40 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  <Calendar className="w-12 h-12 text-primary-400" />
                </div>
              )}

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-secondary-900 line-clamp-1">{event.name}</h3>
                    <span className="text-xs text-secondary-500">{event.event_type}</span>
                  </div>
                  <Badge variant={STATUS_COLORS[event.status]}>{event.status}</Badge>
                </div>

                <div className="space-y-2 text-sm text-secondary-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-secondary-400" />
                    <span>
                      {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  {event.venue && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-secondary-400" />
                      <span className="line-clamp-1">{event.venue}</span>
                    </div>
                  )}
                  {event.county && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-secondary-400" />
                      <span>{event.county}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-secondary-100">
                  <Link
                    to={`/events/${event.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Link>
                  <Link
                    to={`/admin/events/${event.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Manage
                  </Link>
                  <button
                    onClick={() => setDeleteId(event.id)}
                    className="p-2 text-secondary-400 hover:text-error-600 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-secondary-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
