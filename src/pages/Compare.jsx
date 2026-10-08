import React, { useState } from 'react';
import SearchBox from '../components/SearchBox';
import CompareTable from '../components/CompareTable';
import { api } from '../api';
import { ArrowLeftRight, MapPin, AlertCircle, Sparkles, Loader2 } from 'lucide-react';

export default function Compare() {
  const [locA, setLocA] = useState(null);
  const [locB, setLocB] = useState(null);

  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);

  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState(null);

  async function handleCompare() {
    if (!locA || !locB) {
      setError('Please select two distinct Nagpur localities to compare.');
      return;
    }

    // Prevent comparing identical locations
    const nameA = (locA.locality || locA.name || '').toLowerCase().trim();
    const nameB = (locB.locality || locB.name || '').toLowerCase().trim();
    if (nameA === nameB || (locA.lat === locB.lat && locA.lon === locB.lon)) {
      setError('Locations are identical. Please select two different localities in Nagpur.');
      return;
    }

    setError(null);
    setIsComparing(true);

    try {
      // Fetch Location Intelligence, Amenities, Market & AI for both locations concurrently
      const [resA, resB] = await Promise.all([
        fetchLocationFullPackage(locA),
        fetchLocationFullPackage(locB)
      ]);

      setDataA(resA);
      setDataB(resB);
    } catch (err) {
      console.error('Comparison error:', err);
      setError('Failed to fetch comparison datasets. Please try again.');
    } finally {
      setIsComparing(false);
    }
  }

  async function fetchLocationFullPackage(loc) {
    const lat = loc.lat || 21.1458;
    const lon = loc.lon || 79.0882;
    const locName = loc.locality || loc.name || '';

    const [intelRes, amenityRes, marketRes] = await Promise.allSettled([
      api.getLocationIntelligence(lat, lon, locName, 'Nagpur', 'Nagpur'),
      api.getAmenities(lat, lon, 3000),
      api.getMarketSummaries({ district: 'Nagpur', locality: locName })
    ]);

    const intel = intelRes.status === 'fulfilled' ? intelRes.value : {};
    const amenities = amenityRes.status === 'fulfilled' ? amenityRes.value : {};
    const marketList = marketRes.status === 'fulfilled' ? (marketRes.value.summaries || []) : [];
    const market = marketList[0] || null;

    // AI outlook for location
    let aiOutlook = null;
    try {
      aiOutlook = await api.analyzeInvestment({
        location: `${locName}, Nagpur, Maharashtra`,
        propertyMarket: market,
        airQuality: intel.air,
        water: intel.water,
        safety: intel.safety,
        amenities: amenities
      });
    } catch (e) {
      aiOutlook = { outlook: 'Insufficient evidence' };
    }

    return {
      air: intel.air,
      water: intel.water,
      safety: intel.safety,
      amenities,
      market,
      ai: aiOutlook
    };
  }

  return (
    <div style={{ padding: '40px 0 70px', background: '#f8fafc', minHeight: '85vh' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 36px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--color-gold)', textTransform: 'uppercase' }}>
            <ArrowLeftRight size={16} /> Locality Head-to-Head
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-navy)', marginTop: '4px' }}>
            Compare Nagpur Localities
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--color-slate)', marginTop: '6px' }}>
            Side-by-side comparison of live AQI, water hydrology, official crime benchmarks, 3km verified amenities, and market prices across Nagpur District.
          </p>
        </div>

        {/* Dual Search Boxes */}
        <div className="card" style={{ padding: '30px', marginBottom: '30px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Location A */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '10px' }}>
                <MapPin size={16} color="var(--color-gold)" /> Location A (Nagpur)
              </label>
              <SearchBox
                placeholder="Search first locality (e.g. Manish Nagar, South Nagpur)..."
                onSelectLocation={(loc) => {
                  setLocA(loc);
                  setDataA(null);
                }}
              />
              {locA && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-emerald)', fontWeight: 600 }}>
                  Selected: {locA.locality || locA.name} ({locA.lat?.toFixed(4)}, {locA.lon?.toFixed(4)})
                </div>
              )}
            </div>

            {/* Location B */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '10px' }}>
                <MapPin size={16} color="var(--color-gold)" /> Location B (Nagpur)
              </label>
              <SearchBox
                placeholder="Search second locality (e.g. Dharampeth, West Nagpur)..."
                onSelectLocation={(loc) => {
                  setLocB(loc);
                  setDataB(null);
                }}
              />
              {locB && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-emerald)', fontWeight: 600 }}>
                  Selected: {locB.locality || locB.name} ({locB.lat?.toFixed(4)}, {locB.lon?.toFixed(4)})
                </div>
              )}
            </div>
          </div>

          {error && (
            <div style={{ marginTop: '20px', padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCompare}
              disabled={isComparing || !locA || !locB}
              style={{ padding: '10px 32px', fontSize: '15px' }}
            >
              {isComparing ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  <span>Fetching Nagpur Spatial Evidence...</span>
                </>
              ) : (
                <>
                  <ArrowLeftRight size={16} />
                  <span>Compare Localities</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Comparison Results */}
        {dataA && dataB && (
          <CompareTable
            locA={locA}
            locB={locB}
            dataA={dataA}
            dataB={dataB}
          />
        )}
      </div>
    </div>
  );
}
