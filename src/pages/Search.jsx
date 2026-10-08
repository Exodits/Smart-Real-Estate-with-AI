import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SearchBox from '../components/SearchBox';
import PropertyGrid from '../components/PropertyGrid';
import MarketTable from '../components/MarketTable';
import LocationIntel from '../components/LocationIntel';
import AmenityList from '../components/AmenityList';
import Map from '../components/Map';
import { formatIndianPrice } from '../components/PropertyCard';
import { api } from '../api';
import {
  Filter,
  MapPin,
  CheckCircle2,
  SlidersHorizontal,
  Map as MapIcon,
  List,
  AlertTriangle,
  Loader2,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL Query Parameters
  const queryText = searchParams.get('q') || '';
  const queryLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')) : null;
  const queryLon = searchParams.get('lon') ? parseFloat(searchParams.get('lon')) : null;
  const locationParam = searchParams.get('location') || '';
  const zoneParam = searchParams.get('zone') || '';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const bhkParam = searchParams.get('bhk') || '';
  const typeParam = searchParams.get('propertyType') || '';

  // View & Filter State
  const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'market' | 'map'
  const [selectedZone, setSelectedZone] = useState(zoneParam);
  const [filterBhk, setFilterBhk] = useState(bhkParam);
  const [filterType, setFilterType] = useState(typeParam);
  const [filterMinPrice, setFilterMinPrice] = useState(minPriceParam);
  const [filterMaxPrice, setFilterMaxPrice] = useState(maxPriceParam);

  // Property Data & Pagination State
  const [properties, setProperties] = useState([]);
  const [totalProperties, setTotalProperties] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingProps, setIsLoadingProps] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [outsideNagpur, setOutsideNagpur] = useState(false);
  const [outsideMessage, setOutsideMessage] = useState('');

  // Market & Background Intelligence State (Decoupled)
  const [marketSummaries, setMarketSummaries] = useState([]);
  const [localityStats, setLocalityStats] = useState(null);
  const [locationIntel, setLocationIntel] = useState(null);
  const [amenitiesData, setAmenitiesData] = useState(null);
  const [isLoadingIntel, setIsLoadingIntel] = useState(false);

  // Map Center Coordinates
  const [centerCoords, setCenterCoords] = useState({
    lat: queryLat || 21.1458,
    lon: queryLon || 79.0882
  });

  // Track search invocation to avoid stale race conditions
  const currentSearchId = useRef(0);

  // Trigger search whenever relevant query parameters or filters change
  useEffect(() => {
    setSelectedZone(zoneParam);
    setFilterBhk(bhkParam);
    setFilterType(typeParam);
    setFilterMinPrice(minPriceParam);
    setFilterMaxPrice(maxPriceParam);
    setCurrentPage(1);

    executeFastSearch(1);
  }, [
    queryText,
    queryLat,
    queryLon,
    locationParam,
    zoneParam,
    minPriceParam,
    maxPriceParam,
    bhkParam,
    typeParam
  ]);

  /**
   * Fast Database-First Search Flow (Section 16)
   * 1. Query DB immediately -> render property cards in low-milliseconds
   * 2. Background intelligence runs completely asynchronously
   */
  async function executeFastSearch(pageNumber = 1) {
    const searchId = ++currentSearchId.current;
    if (pageNumber === 1) {
      setIsLoadingProps(true);
      setProperties([]);
      setOutsideNagpur(false);
    } else {
      setIsLoadingMore(true);
    }

    try {
      let lat = queryLat;
      let lon = queryLon;
      let searchLocality = locationParam;

      // 1. Check for outside-Nagpur query
      const knownOutside = ['pune', 'mumbai', 'thane', 'navi mumbai', 'nashik', 'delhi', 'bangalore', 'hyderabad'];
      const rawTarget = `${queryText} ${searchLocality}`.toLowerCase().trim();
      const isOutside = knownOutside.some((c) => rawTarget.includes(c) && !rawTarget.includes('nagpur'));

      if (isOutside) {
        setOutsideNagpur(true);
        setOutsideMessage('TerraFind currently covers Nagpur District only. Real estate records and spatial intelligence are active for the five Nagpur zones.');
        setIsLoadingProps(false);
        setIsLoadingMore(false);
        return;
      }

      // 2. Fast Database Query (Database-First, Section 16)
      const propFilters = {
        district: 'Nagpur',
        q: queryText || searchLocality,
        zone: selectedZone || zoneParam,
        locality: searchLocality,
        bhk: filterBhk || bhkParam,
        propertyType: filterType || typeParam,
        minPrice: filterMinPrice || minPriceParam,
        maxPrice: filterMaxPrice || maxPriceParam,
        page: pageNumber,
        pageSize: 24
      };

      const propRes = await api.getProperties(propFilters);

      // Guard against race conditions if query changed
      if (searchId !== currentSearchId.current) return;

      if (propRes.outsideNagpur) {
        setOutsideNagpur(true);
        setOutsideMessage(propRes.message || 'TerraFind currently covers Nagpur District only.');
        setIsLoadingProps(false);
        return;
      }

      const fetchedItems = propRes.items || propRes.properties || [];
      const totalCount = propRes.total !== undefined ? propRes.total : fetchedItems.length;

      if (pageNumber === 1) {
        setProperties(fetchedItems);
      } else {
        setProperties((prev) => [...prev, ...fetchedItems]);
      }

      setTotalProperties(totalCount);
      setHasMore(propRes.hasMore || false);
      setCurrentPage(pageNumber);

      // Turn off property loading spinner IMMEDIATELY (Cards render right now!)
      setIsLoadingProps(false);
      setIsLoadingMore(false);

      // Determine center coordinates for map & intelligence
      if (lat && lon) {
        setCenterCoords({ lat, lon });
      } else if (fetchedItems.length > 0 && fetchedItems[0].latitude && fetchedItems[0].longitude) {
        lat = fetchedItems[0].latitude;
        lon = fetchedItems[0].longitude;
        setCenterCoords({ lat, lon });
      }

      // 3. Fetch Market Summaries in Parallel (Non-Blocking)
      api.getMarketSummaries({
        district: 'Nagpur',
        zone: selectedZone || zoneParam,
        locality: searchLocality
      }).then((mRes) => {
        if (searchId === currentSearchId.current && mRes && mRes.summaries) {
          setMarketSummaries(mRes.summaries);
        }
      }).catch((e) => console.warn('[Search] Market summaries error:', e.message));

      // 4. Fetch Background Intelligence Asynchronously (Decoupled, Section 16 & 17)
      if (lat && lon) {
        fetchBackgroundIntelligence(lat, lon, searchLocality || queryText, searchId);
      }
    } catch (err) {
      if (searchId === currentSearchId.current) {
        console.error('Search execution error:', err);
        setIsLoadingProps(false);
        setIsLoadingMore(false);
      }
    }
  }

  /**
   * Independent, Non-Blocking Location Intelligence & Amenities
   */
  async function fetchBackgroundIntelligence(lat, lon, locName, searchId) {
    setIsLoadingIntel(true);
    try {
      // Fire requests independently
      const intelPromise = api.getLocationIntelligence(lat, lon, locName, 'Nagpur', 'Nagpur');
      const amenityPromise = api.getAmenities(lat, lon, 3000);

      const [intelRes, amenityRes] = await Promise.allSettled([intelPromise, amenityPromise]);

      if (searchId !== currentSearchId.current) return;

      if (intelRes.status === 'fulfilled') {
        setLocationIntel(intelRes.value);
      }
      if (amenityRes.status === 'fulfilled') {
        setAmenitiesData(amenityRes.value);
      }
    } catch (e) {
      console.warn('[Search] Background intelligence error:', e.message);
    } finally {
      if (searchId === currentSearchId.current) {
        setIsLoadingIntel(false);
      }
    }
  }

  function handleSelectNewLocation(loc) {
    const params = new URLSearchParams(searchParams);
    if (loc.outsideNagpur) {
      setOutsideNagpur(true);
      setOutsideMessage('TerraFind currently covers Nagpur District only.');
      return;
    }

    if (loc.lat && loc.lon) {
      params.set('lat', loc.lat);
      params.set('lon', loc.lon);
      params.set('location', loc.locality || loc.name);
      params.delete('q');
    } else {
      params.set('q', loc.name || loc.locality || loc.displayName);
      params.delete('lat');
      params.delete('lon');
      params.delete('location');
    }
    setSearchParams(params);
  }

  function updateFilterParam(key, val) {
    const params = new URLSearchParams(searchParams);
    if (val) {
      params.set(key, val);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  }

  function handleClearAllFilters() {
    setSelectedZone('');
    setFilterBhk('');
    setFilterType('');
    setFilterMinPrice('');
    setFilterMaxPrice('');
    const params = new URLSearchParams();
    if (queryText) params.set('q', queryText);
    if (locationParam) params.set('location', locationParam);
    setSearchParams(params);
  }

  function handleLoadMore() {
    if (!isLoadingMore && hasMore) {
      executeFastSearch(currentPage + 1);
    }
  }

  // Flatten amenities for Map view
  const allAmenitiesList = [];
  if (amenitiesData && amenitiesData.categories) {
    Object.values(amenitiesData.categories).forEach((cat) => {
      allAmenitiesList.push(...cat);
    });
  }

  const zoneDisplayLabels = {
    east: 'East Nagpur',
    north: 'North Nagpur',
    west: 'West Nagpur',
    south: 'South Nagpur',
    centre: 'Central Nagpur'
  };

  return (
    <div style={{ padding: '30px 0 60px', background: '#f8fafc', minHeight: '80vh' }}>
      <div className="container">
        {/* Search header & input */}
        <div style={{ maxWidth: '760px', margin: '0 auto 26px' }}>
          <SearchBox
            placeholder="Search locality, area, PIN or landmark in Nagpur..."
            onSelectLocation={handleSelectNewLocation}
            initialValue={locationParam || queryText}
          />
        </div>

        {/* Outside Nagpur Warning Banner (Section 1) */}
        {outsideNagpur && (
          <div
            className="card"
            style={{
              padding: '24px 28px',
              marginBottom: '28px',
              borderLeft: '6px solid var(--color-amber)',
              background: '#fffbeb'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={24} color="var(--color-amber)" />
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#92400e' }}>
                  Coverage Notice
                </h3>
                <p style={{ fontSize: '14px', color: '#78350f', marginTop: '4px' }}>
                  {outsideMessage}
                </p>
              </div>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: '12px', padding: '6px 14px' }}
                onClick={() => navigate('/search?district=Nagpur&zone=south')}
              >
                Explore South Nagpur →
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: '12px', padding: '6px 14px' }}
                onClick={() => navigate('/search?district=Nagpur&zone=west')}
              >
                Explore West Nagpur →
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: '12px', padding: '6px 14px' }}
                onClick={() => navigate('/search?district=Nagpur&zone=centre')}
              >
                Explore Central Nagpur →
              </button>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div
          className="card"
          style={{
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          {/* Filter Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--color-navy)' }}>
              <Filter size={16} /> Filters:
            </div>

            {/* Zone Selector */}
            <select
              value={selectedZone}
              onChange={(e) => updateFilterParam('zone', e.target.value)}
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              <option value="">All Nagpur Zones</option>
              <option value="east">East Nagpur</option>
              <option value="north">North Nagpur</option>
              <option value="west">West Nagpur</option>
              <option value="south">South Nagpur</option>
              <option value="centre">Central Nagpur</option>
            </select>

            {/* BHK Selector */}
            <select
              value={filterBhk}
              onChange={(e) => updateFilterParam('bhk', e.target.value)}
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              <option value="">All BHK</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4">4+ BHK</option>
            </select>

            {/* Property Type */}
            <select
              value={filterType}
              onChange={(e) => updateFilterParam('propertyType', e.target.value)}
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              <option value="">All Types</option>
              <option value="Apartment">Apartment</option>
              <option value="Villa">Villa / Row House</option>
              <option value="Plot">Plot</option>
            </select>

            {/* Budget Max */}
            <select
              value={filterMaxPrice}
              onChange={(e) => updateFilterParam('maxPrice', e.target.value)}
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              <option value="">Any Budget</option>
              <option value="3000000">Up to ₹30 Lakh</option>
              <option value="5000000">Up to ₹50 Lakh</option>
              <option value="10000000">Up to ₹1.00 Cr</option>
              <option value="20000000">Up to ₹2.00 Cr</option>
              <option value="50000000">Up to ₹5.00 Cr</option>
            </select>

            {(selectedZone || filterBhk || filterType || filterMinPrice || filterMaxPrice) && (
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--color-rose)' }}
                onClick={handleClearAllFilters}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* View Mode Toggles */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className={`btn ${activeTab === 'listings' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 14px', fontSize: '13px' }}
              onClick={() => setActiveTab('listings')}
            >
              <List size={14} /> Listings ({totalProperties})
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'market' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 14px', fontSize: '13px' }}
              onClick={() => setActiveTab('market')}
            >
              Localities ({marketSummaries.length})
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'map' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 14px', fontSize: '13px' }}
              onClick={() => setActiveTab('map')}
            >
              <MapIcon size={14} /> GIS Map
            </button>
          </div>
        </div>

        {/* Active Search & Filter Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--color-slate)' }}>
              Showing {properties.length} of {totalProperties} Nagpur {totalProperties === 1 ? 'property' : 'properties'}
              {selectedZone ? ` in ${zoneDisplayLabels[selectedZone] || selectedZone}` : ''}
              {locationParam ? ` matching "${locationParam}"` : ''}
            </span>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--color-slate-light)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="badge badge-emerald" style={{ fontSize: '10px' }}>Zero Fabrication</span>
            <span>Nagpur District Only</span>
          </div>
        </div>

        {/* Tab 1: Property Listings Grid & Pagination */}
        {activeTab === 'listings' && (
          <div>
            <PropertyGrid properties={properties} isLoading={isLoadingProps} />

            {/* Load More / Pagination Button (Section 14) */}
            {hasMore && !isLoadingProps && (
              <div style={{ textAlign: 'center', marginTop: '36px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  style={{ padding: '10px 28px', fontSize: '14px', fontWeight: 600 }}
                >
                  {isLoadingMore ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Loader2 size={16} className="spinner" /> Loading more properties...
                    </span>
                  ) : (
                    <span>Load More Properties ({totalProperties - properties.length} remaining)</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Market Localities Table */}
        {activeTab === 'market' && (
          <div>
            <MarketTable summaries={marketSummaries} isLoading={isLoadingProps} />
          </div>
        )}

        {/* Tab 3: GIS Map */}
        {activeTab === 'map' && (
          <div>
            <Map
              lat={centerCoords.lat}
              lon={centerCoords.lon}
              locationName={locationParam || queryText || 'Nagpur'}
              radiusKm={3.0}
              amenities={allAmenitiesList}
              properties={properties}
            />
          </div>
        )}

        {/* Background Location Intelligence Section (Independent & Non-Blocking, Section 16 & 20) */}
        <div style={{ marginTop: '50px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-navy)' }}>
                Live Location Intelligence for Nagpur Coordinates
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--color-slate)' }}>
                Coordinates: ({centerCoords.lat.toFixed(4)}, {centerCoords.lon.toFixed(4)}) • Open-Meteo AQI, 3km Overpass POIs & Official NCRB Safety
              </p>
            </div>
            {isLoadingIntel && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-slate)' }}>
                <Loader2 size={14} className="spinner" /> Loading background spatial data...
              </div>
            )}
          </div>

          {locationIntel ? (
            <LocationIntel intel={locationIntel} locationName={locationParam || 'Nagpur'} />
          ) : isLoadingIntel ? (
            <div className="card" style={{ padding: '30px', textAlign: 'center', color: 'var(--color-slate)' }}>
              <Loader2 size={24} className="spinner" style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: '13px' }}>Fetching real-time environmental AQI, weather, and safety data...</p>
            </div>
          ) : null}
        </div>

        {/* Strict 3km Amenities (Non-Blocking) */}
        {amenitiesData && (
          <div style={{ marginTop: '30px' }}>
            <AmenityList amenitiesData={amenitiesData} />
          </div>
        )}
      </div>
    </div>
  );
}
