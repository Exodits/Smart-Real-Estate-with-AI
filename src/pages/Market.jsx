import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import MarketTable from '../components/MarketTable';
import { Building2, TrendingUp, Filter, RefreshCw, MapPin } from 'lucide-react';
import { formatIndianPrice } from '../components/PropertyCard';

export default function Market() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [localities, setLocalities] = useState([]);
  const [selectedZone, setSelectedZone] = useState(searchParams.get('zone') || '');
  const [selectedLocality, setSelectedLocality] = useState(searchParams.get('locality') || '');
  const [summaries, setSummaries] = useState([]);
  const [zoneMetrics, setZoneMetrics] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Load localities and zone metrics on mount
  useEffect(() => {
    api.getLocalities(selectedZone).then((res) => {
      if (res && Array.isArray(res.localities)) {
        setLocalities(res.localities);
      }
    }).catch(console.error);

    api.getZoneMetrics().then((res) => {
      if (res && res.zones) {
        const map = {};
        if (Array.isArray(res.zones)) {
          res.zones.forEach((zm) => { map[zm.id] = zm; });
        } else if (typeof res.zones === 'object') {
          Object.assign(map, res.zones);
        }
        setZoneMetrics(map);
      }
    }).catch(console.error);
  }, [selectedZone]);

  useEffect(() => {
    fetchMarketData();
  }, [selectedZone, selectedLocality]);

  async function fetchMarketData() {
    setIsLoading(true);
    try {
      const res = await api.getMarketSummaries({
        district: 'Nagpur',
        zone: selectedZone,
        locality: selectedLocality
      });
      setSummaries(res.summaries || []);
    } catch (err) {
      console.error('Failed to fetch market data:', err);
      setSummaries([]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setSelectedZone('');
    setSelectedLocality('');
    setSearchParams(new URLSearchParams());
  }

  const currentZoneMetric = selectedZone ? zoneMetrics[selectedZone] : null;

  return (
    <div style={{ padding: '40px 0 70px', background: '#f8fafc', minHeight: '85vh' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--color-gold)', textTransform: 'uppercase' }}>
            <TrendingUp size={16} /> Nagpur Market Intelligence
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-navy)', marginTop: '4px' }}>
            Nagpur District Locality & Zone Benchmarks
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--color-slate)', marginTop: '6px' }}>
            Calculated directly from connected Nagpur property records. Derived metrics reflect real database observations with zero fabricated rates.
          </p>
        </div>

        {/* Zone Overview Cards */}
        {currentZoneMetric && (
          <div
            className="card"
            style={{
              padding: '24px 28px',
              marginBottom: '28px',
              background: 'linear-gradient(135deg, #183153 0%, #244470 100%)',
              color: '#ffffff'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-gold)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Active Zone Filter
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '2px' }}>
                  {selectedZone.toUpperCase()} NAGPUR
                </h2>
              </div>

              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', textTransform: 'uppercase' }}>Active Listings</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#34d399' }}>
                    {currentZoneMetric.activeListingsCount} listings
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', textTransform: 'uppercase' }}>Avg Rate/sq.ft.</div>
                  <div style={{ fontSize: '18px', fontWeight: 800 }}>
                    {currentZoneMetric.averagePricePerSqft ? `₹${currentZoneMetric.averagePricePerSqft.toLocaleString('en-IN')}` : 'Unavailable'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', textTransform: 'uppercase' }}>Avg Price</div>
                  <div style={{ fontSize: '18px', fontWeight: 800 }}>
                    {currentZoneMetric.averagePrice ? formatIndianPrice(currentZoneMetric.averagePrice) : 'Unavailable'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', textTransform: 'uppercase' }}>Localities Mapped</div>
                  <div style={{ fontSize: '18px', fontWeight: 800 }}>
                    {currentZoneMetric.localitiesCount}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Card */}
        <div className="card" style={{ padding: '20px 24px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--color-navy)' }}>
              <Filter size={16} /> Filter by Zone / Locality:
            </div>

            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="btn btn-outline"
              style={{ padding: '8px 14px', fontSize: '13px' }}
            >
              <option value="">All 5 Nagpur Zones</option>
              <option value="east">East Nagpur</option>
              <option value="north">North Nagpur</option>
              <option value="west">West Nagpur</option>
              <option value="south">South Nagpur</option>
              <option value="centre">Central Nagpur</option>
            </select>

            <select
              value={selectedLocality}
              onChange={(e) => setSelectedLocality(e.target.value)}
              className="btn btn-outline"
              style={{ padding: '8px 14px', fontSize: '13px' }}
            >
              <option value="">All Localities in Zone</option>
              {localities.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            {(selectedZone || selectedLocality) && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleReset}
                style={{ padding: '8px 14px', fontSize: '12px', color: 'var(--color-rose)' }}
              >
                Reset Filters
              </button>
            )}

            <button
              type="button"
              className="btn btn-outline"
              onClick={fetchMarketData}
              title="Refresh Data"
              style={{ marginLeft: 'auto', padding: '8px 12px' }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Locality Market Table */}
        <MarketTable summaries={summaries} isLoading={isLoading} />
      </div>
    </div>
  );
}
