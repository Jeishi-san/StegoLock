import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function SearchBar({ searchQuery, onSearchChange, filters, onFiltersChange }) {
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFilters]);

  const activeFiltersCount = [
    filters.fileFormat !== 'all',
    filters.status !== 'all',
    filters.owner !== 'all'
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    onFiltersChange({
      fileFormat: 'all',
      status: 'all',
      owner: 'all',
      sort: 'date-newest'
    });
  };

  const FilterSection = ({ title, children }) => (
    <div className="mb-4">
      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{title}</h4>
      {children}
    </div>
  );

  const FilterOption = ({
    label,
    active,
    onClick
  }) => (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? 'bg-indigo-50 text-indigo-700 font-medium'
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="relative" ref={filterRef}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            showFilters || activeFiltersCount > 0
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal className="size-4" />
          <span className="text-sm font-medium">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="bg-indigo-600 text-white text-xs font-semibold rounded-full size-5 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDown className={`size-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {showFilters && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-[calc(90vh-100px)] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Filters & Sort</h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <X className="size-3" />
                  Reset
                </button>
              )}
            </div>

            <div className="overflow-y-auto p-4">
              <FilterSection title="Sort By">
                <div className="space-y-1">
                  <FilterOption
                    label="Name (A-Z)"
                    active={filters.sort === 'name-asc'}
                    onClick={() => onFiltersChange({ ...filters, sort: 'name-asc' })}
                  />
                  <FilterOption
                    label="Name (Z-A)"
                    active={filters.sort === 'name-desc'}
                    onClick={() => onFiltersChange({ ...filters, sort: 'name-desc' })}
                  />
                  <FilterOption
                    label="Date (Newest First)"
                    active={filters.sort === 'date-newest'}
                    onClick={() => onFiltersChange({ ...filters, sort: 'date-newest' })}
                  />
                  <FilterOption
                    label="Date (Oldest First)"
                    active={filters.sort === 'date-oldest'}
                    onClick={() => onFiltersChange({ ...filters, sort: 'date-oldest' })}
                  />
                  <FilterOption
                    label="Size (Largest First)"
                    active={filters.sort === 'size-largest'}
                    onClick={() => onFiltersChange({ ...filters, sort: 'size-largest' })}
                  />
                  <FilterOption
                    label="Size (Smallest First)"
                    active={filters.sort === 'size-smallest'}
                    onClick={() => onFiltersChange({ ...filters, sort: 'size-smallest' })}
                  />
                </div>
              </FilterSection>

              <div className="border-t border-gray-200 my-4" />

              <FilterSection title="File Format">
                <div className="space-y-1">
                  <FilterOption
                    label="All Formats"
                    active={filters.fileFormat === 'all'}
                    onClick={() => onFiltersChange({ ...filters, fileFormat: 'all' })}
                  />
                  <FilterOption
                    label="PDF Files"
                    active={filters.fileFormat === 'pdf'}
                    onClick={() => onFiltersChange({ ...filters, fileFormat: 'pdf' })}
                  />
                  <FilterOption
                    label="DOC Files"
                    active={filters.fileFormat === 'doc'}
                    onClick={() => onFiltersChange({ ...filters, fileFormat: 'doc' })}
                  />
                  <FilterOption
                    label="DOCX Files"
                    active={filters.fileFormat === 'docx'}
                    onClick={() => onFiltersChange({ ...filters, fileFormat: 'docx' })}
                  />
                  <FilterOption
                    label="TXT Files"
                    active={filters.fileFormat === 'txt'}
                    onClick={() => onFiltersChange({ ...filters, fileFormat: 'txt' })}
                  />
                </div>
              </FilterSection>

              <div className="border-t border-gray-200 my-4" />

              <FilterSection title="Status">
                <div className="space-y-1">
                  <FilterOption
                    label="All Files"
                    active={filters.status === 'all'}
                    onClick={() => onFiltersChange({ ...filters, status: 'all' })}
                  />
                  <FilterOption
                    label="Secured Files"
                    active={filters.status === 'secured'}
                    onClick={() => onFiltersChange({ ...filters, status: 'secured' })}
                  />
                  <FilterOption
                    label="Original Files"
                    active={filters.status === 'original'}
                    onClick={() => onFiltersChange({ ...filters, status: 'original' })}
                  />
                </div>
              </FilterSection>

              <div className="border-t border-gray-200 my-4" />

              <FilterSection title="Owner">
                <div className="space-y-1">
                  <FilterOption
                    label="All Owners"
                    active={filters.owner === 'all'}
                    onClick={() => onFiltersChange({ ...filters, owner: 'all' })}
                  />
                  <FilterOption
                    label="My Files"
                    active={filters.owner === 'me'}
                    onClick={() => onFiltersChange({ ...filters, owner: 'me' })}
                  />
                  <FilterOption
                    label="Shared With Me"
                    active={filters.owner === 'others'}
                    onClick={() => onFiltersChange({ ...filters, owner: 'others' })}
                  />
                </div>
              </FilterSection>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
