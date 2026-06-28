import React, { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onFilter: (filters: Record<string, string>) => void;
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  filters: { key: string; label: string; options: { value: string; label: string }[] }[];
  sortOptions: { value: string; label: string }[];
  placeholder?: string;
  initialFilters?: Record<string, string>;
  initialSort?: { sortBy: string; sortOrder: 'asc' | 'desc' };
}

export function SearchFilter({
  onSearch,
  onFilter,
  onSort,
  filters,
  sortOptions,
  placeholder = 'Search...',
  initialFilters = {},
  initialSort = { sortBy: 'created_at', sortOrder: 'desc' },
}: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(initialFilters);
  const [sortBy, setSortBy] = useState(initialSort.sortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSort.sortOrder);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...activeFilters, [key]: value };
    setActiveFilters(newFilters);
    onFilter(newFilters);
  };

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split(':') as [string, 'asc' | 'desc'];
    setSortBy(newSortBy);
    setSortOrder(newSortOrder || 'desc');
    onSort(newSortBy, newSortOrder || 'desc');
  };

  const clearFilter = (key: string) => {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    setActiveFilters(newFilters);
    onFilter(newFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    onFilter({});
  };

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-secondary-100 p-4 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-2.5 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
            />
          </div>
        </form>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-secondary-200 text-secondary-600 hover:bg-secondary-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-primary-600 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="relative">
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => handleSortChange(e.target.value)}
              className="appearance-none px-4 py-2.5 pr-10 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
            >
              {sortOptions.map((option) => (
                <option key={`${option.value}:asc`} value={`${option.value}:asc`}>
                  {option.label} (A-Z)
                </option>
              ))}
              {sortOptions.map((option) => (
                <option key={`${option.value}:desc`} value={`${option.value}:desc`}>
                  {option.label} (Z-A)
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {showFilters && filters.length > 0 && (
        <div className="pt-4 border-t border-secondary-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  {filter.label}
                </label>
                <select
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                >
                  <option value="">All</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(activeFilters).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([key, value]) => {
            if (!value) return null;
            const filter = filters.find((f) => f.key === key);
            const option = filter?.options.find((o) => o.value === value);

            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
              >
                {filter?.label}: {option?.label}
                <button
                  onClick={() => clearFilter(key)}
                  className="p-0.5 hover:bg-primary-100 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          <button
            onClick={clearAllFilters}
            className="text-sm text-secondary-500 hover:text-secondary-700"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
