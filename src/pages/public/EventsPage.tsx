import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SearchFilter, LoadingSpinner, EmptyState, Card, Button } from '../../components/shared';
import { useCounties, useEventTypes } from '../../hooks';
import type { Event } from '../../types';

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Upcoming',
  active: 'Happening Now',
  completed: 'Past Events',
};

export function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const { counties } = useCounties();
  const { eventTypes } = useEventTypes();

  const query = searchParams.get('q') || '';
  const county = searchParams.get('county') || '';
  const eventType = searchParams.get('type') || '';
  const status = searchParams.get('status') || 'scheduled,active';

  const countyOptions = useMemo(() =>
    counties.map(c => ({ value: c.name, label: c.name })),
    [counties]
  );

  const eventTypeOptions = useMemo(() =>
    eventTypes.map(t => ({ value: t.name, label: t.name })),
    [eventTypes]
  );

  const statusOptions = [
    { value: 'scheduled', label: 'Upcoming' },
    { value: 'active', label: 'Happening Now' },
    { value: 'completed', label: 'Past Events' },
  ];

  useEffect(() => {
    fetchEvents();
  }, [query, county, eventType, status, page]);

  const fetchEvents = async () => {
    setLoading(true);

    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let request = supabase
        .from('events')
        .select('*', { count: 'exact' })
        .in('status', status.split(','))
        .is('deleted_at', null)
        .order('start_date', { ascending: status.includes('completed') ? false : true })
        .range(from, to);

      if (query) {
        request = request.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      }

      if (county) {
        request = request.eq('county', county);
      }

      if (eventType) {
        request = request.eq('event_type', eventType);
      }

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

  const handleSearch = (newQuery: string) => {
    const params = new URLSearchParams(searchParams);
    if (newQuery) {
      params.set('q', newQuery);
    } else {
      params.delete('q');
    }
    setPage(1);
    setSearchParams(params);
  };

  const handleFilter = (filters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    setPage(1);
    setSearchParams(params);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Discovery Events</h1>
        <p className="text-secondary-600">
          Explore cooperative discovery events, trade fairs, and exhibitions
        </p>
      </div>

      <SearchFilter
        onSearch={handleSearch}
        onFilter={handleFilter}
        placeholder="Search events..."
        filters={[
          { key: 'county', label: 'County', options: countyOptions },
          { key: 'type', label: 'Event Type', options: eventTypeOptions },
          { key: 'status', label: 'Status', options: statusOptions },
        ]}
        sortOptions={[
          { value: 'start_date', label: 'Date' },
          { value: 'name', label: 'Name' },
        ]}
        initialFilters={{ county, type: eventType, status }}
        initialSort={{ sortBy: 'start_date', sortOrder: 'asc' }}
      />

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-12 h-12" />}
            title="No events found"
            description="Check back later for upcoming discovery events."
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link key={event.id} to={`/events/${event.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow overflow-hidden">
                  {event.cover_image_url ? (
                    <div className="h-48 bg-secondary-100">
                      <img
                        src={event.cover_image_url}
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                      <Calendar className="w-16 h-16 text-primary-400" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
                        {event.event_type}
                      </span>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        event.status === 'active'
                          ? 'bg-success-50 text-success-700'
                          : event.status === 'completed'
                          ? 'bg-secondary-100 text-secondary-600'
                          : 'bg-info-50 text-info-700'
                      }`}>
                        {STATUS_LABELS[event.status] || event.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-secondary-900 line-clamp-2 mb-3">
                      {event.name}
                    </h3>

                    <div className="space-y-2 text-sm text-secondary-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-secondary-400" />
                        <span>
                          {new Date(event.start_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
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
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
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
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
