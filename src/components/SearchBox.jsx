import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function SearchBox({
  placeholder = "Search locality, area, PIN or landmark in Nagpur (e.g. Manish Nagar, Dharampeth)...",
  onSelectLocation,
  initialValue = "",
  autoFocus = false
}) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);
  const debounceTimer = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced live geocoding search via Nominatim
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    setIsLoading(true);
    setError(null);

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await api.searchLocations(query.trim());
        if (res && Array.isArray(res.locations)) {
          setResults(res.locations);
          setIsOpen(res.locations.length > 0);
          if (res.locations.length === 0) {
            setError('No Nagpur locations found matching query');
          }
        } else {
          setResults([]);
        }
      } catch (err) {
        setError('Location search temporarily unavailable');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(debounceTimer.current);
  }, [query]);

  function handleKeyDown(e) {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        // Direct enter search
        if (onSelectLocation) {
          onSelectLocation({
            displayName: query,
            name: query,
            locality: query,
            city: query,
            state: 'Maharashtra',
            isCustomQuery: true
          });
        }
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        selectLocation(results[selectedIndex]);
      } else if (results.length > 0) {
        selectLocation(results[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  function selectLocation(loc) {
    setQuery(loc.locality || loc.name || loc.displayName);
    setIsOpen(false);
    setSelectedIndex(-1);
    if (onSelectLocation) {
      onSelectLocation(loc);
    }
  }

  function clearSearch() {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setError(null);
  }

  return (
    <div className="searchbox-container" ref={containerRef}>
      <div className="searchbox-input-wrapper">
        <Search size={20} className="searchbox-icon" />
        <input
          type="text"
          className="searchbox-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
        />

        {isLoading && <Loader2 size={18} className="spinner" style={{ color: 'var(--color-slate)' }} />}

        {query && !isLoading && (
          <button type="button" className="searchbox-clear" onClick={clearSearch} title="Clear">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="searchbox-dropdown animate-fade">
          {results.map((loc, idx) => (
            <div
              key={loc.id || idx}
              className={`searchbox-item ${selectedIndex === idx ? 'selected' : ''}`}
              onClick={() => selectLocation(loc)}
            >
              <MapPin size={18} style={{ color: 'var(--color-gold)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div className="searchbox-item-title">{loc.name || loc.locality}</div>
                <div className="searchbox-item-subtitle">{loc.displayName}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !isOpen && query.length > 2 && (
        <div
          style={{
            marginTop: '8px',
            fontSize: '12px',
            color: 'var(--color-slate)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <AlertCircle size={14} color="var(--color-amber)" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
