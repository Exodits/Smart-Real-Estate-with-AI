import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SearchBox from '../components/SearchBox';
import {
  Compass,
  ShieldCheck,
  MapPin,
  Sparkles,
  Building2,
  Wind,
  Droplets,
  Train,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  Layers,
  CheckCircle2,
  PlusCircle
} from 'lucide-react';
import { api } from '../api';
import { formatIndianPrice } from '../components/PropertyCard';

export default function Home() {
  const navigate = useNavigate();

  // Zone & Budget State for Hero Search Controls
  const [selectedZone, setSelectedZone] = useState('all');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');

  // Zone Metrics & Emerging Recommendations from Database
  const [zoneMetrics, setZoneMetrics] = useState({});
  const [emergingAreas, setEmergingAreas] = useState([]);
  const [isLoadingZones, setIsLoadingZones] = useState(true);

  useEffect(() => {
    // 1. Fetch live 5-zone metrics derived from database
    api.getZoneMetrics()
      .then((res) => {
        if (res && res.zones) {
          const map = {};
          if (Array.isArray(res.zones)) {
            res.zones.forEach((zm) => {
              map[zm.id] = {
                ...zm,
                localitiesCount: zm.localityCount || zm.localitiesCount
              };
            });
          } else if (typeof res.zones === 'object') {
            Object.assign(map, res.zones);
          }
          setZoneMetrics(map);
        }
      })
      .catch((err) => console.warn('[Home] Failed to load zone metrics:', err.message))
      .finally(() => setIsLoadingZones(false));

    // 2. Fetch data-driven emerging areas
    api.getEmergingAreas()
      .then((res) => {
        const list = res?.recommendations || res?.recommendedAreas || (Array.isArray(res) ? res : []);
        setEmergingAreas(list.map((item) => ({
          ...item,
          zoneLabel: item.zone ? `${item.zone.charAt(0).toUpperCase() + item.zone.slice(1)} Nagpur` : 'Nagpur',
          availability: item.activeListings > 0 ? `${item.activeListings} Active Listings` : 'Available',
          avgPricePerSqft: item.averagePricePerSqft || item.avgPricePerSqft,
          avgPrice: item.averagePrice || item.avgPrice,
          totalRecords: item.activeListings || item.totalRecords || 1,
          basis: 'Ground-truth database market signals'
        })));
      })
      .catch((err) => console.warn('[Home] Failed to load emerging areas:', err.message));
  }, []);

  function handleSelectLocation(loc) {
    const params = new URLSearchParams();
    params.set('district', 'Nagpur');
    if (selectedZone && selectedZone !== 'all') params.set('zone', selectedZone);
    if (minBudget) params.set('minPrice', minBudget);
    if (maxBudget) params.set('maxPrice', maxBudget);

    if (loc.lat && loc.lon) {
      params.set('lat', loc.lat);
      params.set('lon', loc.lon);
      params.set('location', loc.locality || loc.name);
    } else {
      params.set('q', loc.name || loc.locality || loc.displayName);
    }
    navigate(`/search?${params.toString()}`);
  }

  function handleQuickSearch(e) {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    params.set('district', 'Nagpur');
    if (selectedZone && selectedZone !== 'all') params.set('zone', selectedZone);
    if (minBudget) params.set('minPrice', minBudget);
    if (maxBudget) params.set('maxPrice', maxBudget);
    navigate(`/search?${params.toString()}`);
  }

  function applyBudgetPreset(min, max) {
    setMinBudget(min ? String(min) : '');
    setMaxBudget(max ? String(max) : '');
    const params = new URLSearchParams();
    params.set('district', 'Nagpur');
    if (selectedZone && selectedZone !== 'all') params.set('zone', selectedZone);
    if (min) params.set('minPrice', String(min));
    if (max) params.set('maxPrice', String(max));
    navigate(`/search?${params.toString()}`);
  }

  const zoneConfigs = [
    {
      id: 'east',
      name: 'East Nagpur',
      desc: 'Wardhaman Nagar, Surya Nagar, Central Avenue & Kalamna logistics corridor.',
      badge: 'Commercial & Trading'
    },
    {
      id: 'north',
      name: 'North Nagpur',
      desc: 'Jaripatka, Mankapur, Koradi Road & Kamptee healthcare & transit belt.',
      badge: 'Connectivity & Healthcare'
    },
    {
      id: 'west',
      name: 'West Nagpur',
      desc: 'Dharampeth, Ram Nagar, Shivaji Nagar, Ambazari & Seminary Hills.',
      badge: 'High-Value & Institutional'
    },
    {
      id: 'south',
      name: 'South Nagpur',
      desc: 'Wardha Road, Manish Nagar, Besa, Beltarodi, Airport & MIHAN SEZ.',
      badge: 'Tech Corridor & Growth'
    },
    {
      id: 'centre',
      name: 'Central Nagpur',
      desc: 'Sitabuldi, Civil Lines, Ramdaspeth, Dhantoli & Zero Mile administrative core.',
      badge: 'Heritage & Legal Nucleus'
    }
  ];

  return (
    <div>
      {/* 1. Hero Section (Nagpur-First, Section 3) */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0a1727 0%, #132742 50%, #1e3a5f 100%)',
          color: '#ffffff',
          padding: '70px 0 85px',
          position: 'relative'
        }}
      >
        <div className="container" style={{ textAlign: 'center', maxWidth: '880px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(245, 183, 0, 0.15)',
              border: '1px solid rgba(245, 183, 0, 0.4)',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              color: 'var(--color-gold)',
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '20px'
            }}
          >
            <MapPin size={14} /> Nagpur District Property & Location Intelligence
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(30px, 4.5vw, 52px)',
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: '-1px',
              marginBottom: '16px',
              textTransform: 'uppercase'
            }}
          >
            FIND THE RIGHT PLACE <br />
            <span style={{ color: 'var(--color-gold)' }}>TO LIVE IN NAGPUR</span>
          </h1>

          <p
            style={{
              fontSize: '17px',
              lineHeight: 1.6,
              color: '#cbd5e1',
              maxWidth: '680px',
              margin: '0 auto 32px'
            }}
          >
            Explore properties, prices and location intelligence across five parts of Nagpur.
            Strict zero-fabrication real-estate data integrated with live environmental AQI, verified 3km amenities, and official safety statistics.
          </p>

          {/* Main Search Box with Nagpur-first hint */}
          <div style={{ maxWidth: '680px', margin: '0 auto 20px' }}>
            <SearchBox
              placeholder="Search locality, area, PIN code or landmark in Nagpur (e.g. Manish Nagar, Dharampeth, 440015)..."
              onSelectLocation={handleSelectLocation}
              autoFocus
            />
          </div>

          {/* Zone Selector Controls: [ All ] [ East ] [ North ] [ West ] [ South ] [ Centre ] */}
          <div style={{ maxWidth: '720px', margin: '0 auto 22px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', marginBottom: '8px' }}>
              Select TerraFind Zone:
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Nagpur' },
                { id: 'east', label: 'East Nagpur' },
                { id: 'north', label: 'North Nagpur' },
                { id: 'west', label: 'West Nagpur' },
                { id: 'south', label: 'South Nagpur' },
                { id: 'centre', label: 'Central Nagpur' }
              ].map((z) => (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setSelectedZone(z.id)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: selectedZone === z.id ? 'var(--color-gold)' : 'rgba(255, 255, 255, 0.08)',
                    color: selectedZone === z.id ? '#0f1f35' : '#e2e8f0',
                    border: selectedZone === z.id ? '1px solid var(--color-gold)' : '1px solid rgba(255, 255, 255, 0.15)'
                  }}
                >
                  {z.label}
                </button>
              ))}
            </div>
          </div>

          {/* Budget Range Controls (Min ₹ / Max ₹) */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              maxWidth: '680px',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
              <SlidersHorizontal size={16} color="var(--color-gold)" /> Budget (₹):
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
              <input
                type="number"
                placeholder="Min ₹ (e.g. 3000000)"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#ffffff',
                  padding: '8px 12px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>to</span>
              <input
                type="number"
                placeholder="Max ₹ (e.g. 8000000)"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#ffffff',
                  padding: '8px 12px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleQuickSearch}
              style={{ padding: '8px 20px', fontSize: '13px', whiteSpace: 'nowrap' }}
            >
              Apply Filter
            </button>
          </div>

          {/* Quick Presets: Under ₹30L, ₹30–50L, ₹50L–1Cr, ₹1–2Cr, ₹2Cr+ */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12px', color: '#94a3b8' }}>
            <span style={{ alignSelf: 'center', marginRight: '4px' }}>Quick Presets:</span>
            <button
              type="button"
              onClick={() => applyBudgetPreset(null, 3000000)}
              style={{ background: 'none', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#cbd5e1', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
            >
              Under ₹30 Lakh
            </button>
            <button
              type="button"
              onClick={() => applyBudgetPreset(3000000, 5000000)}
              style={{ background: 'none', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#cbd5e1', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
            >
              ₹30–50 Lakh
            </button>
            <button
              type="button"
              onClick={() => applyBudgetPreset(5000000, 10000000)}
              style={{ background: 'none', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#cbd5e1', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
            >
              ₹50 Lakh–₹1 Cr
            </button>
            <button
              type="button"
              onClick={() => applyBudgetPreset(10000000, 20000000)}
              style={{ background: 'none', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#cbd5e1', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
            >
              ₹1–2 Cr
            </button>
            <button
              type="button"
              onClick={() => applyBudgetPreset(20000000, null)}
              style={{ background: 'none', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#cbd5e1', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
            >
              ₹2 Cr+
            </button>
          </div>
        </div>
      </section>

      {/* 2. Explore Nagpur by Area (Section 4: 5 Analytical Zones) */}
      <section style={{ padding: '70px 0', background: '#f8fafc' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Nagpur District Division
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-navy)', marginTop: '4px' }}>
                Explore Nagpur by Area
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--color-slate)', marginTop: '4px' }}>
                Five TerraFind analytical zones with live database-aggregated property and rate metrics.
              </p>
            </div>
            <Link to="/market" className="btn btn-outline">
              All Nagpur Localities <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {zoneConfigs.map((z) => {
              const m = zoneMetrics[z.id] || {};
              const hasActiveListings = m.activeListingsCount > 0;

              return (
                <div
                  key={z.id}
                  className="card"
                  style={{
                    padding: '24px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onClick={() => navigate(`/search?district=Nagpur&zone=${z.id}`)}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <span className="badge badge-gold" style={{ fontSize: '11px' }}>
                        {z.badge}
                      </span>
                      <ArrowRight size={18} color="var(--color-gold)" />
                    </div>

                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-navy)' }}>
                      {z.name}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--color-slate)', marginTop: '6px', lineHeight: 1.5 }}>
                      {z.desc}
                    </p>
                  </div>

                  {/* Allowed Database Metrics (Section 4) */}
                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                      <div>
                        <div style={{ color: 'var(--color-slate-light)', fontSize: '11px', textTransform: 'uppercase' }}>Active Listings</div>
                        <div style={{ fontWeight: 800, fontSize: '15px', color: hasActiveListings ? 'var(--color-emerald)' : 'var(--color-slate)' }}>
                          {hasActiveListings ? `${m.activeListingsCount} listings` : 'No active listings'}
                        </div>
                      </div>

                      <div>
                        <div style={{ color: 'var(--color-slate-light)', fontSize: '11px', textTransform: 'uppercase' }}>Avg Rate/sq.ft.</div>
                        <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--color-navy)' }}>
                          {m.averagePricePerSqft ? `₹${m.averagePricePerSqft.toLocaleString('en-IN')}` : 'Unavailable'}
                        </div>
                      </div>

                      <div>
                        <div style={{ color: 'var(--color-slate-light)', fontSize: '11px', textTransform: 'uppercase' }}>Avg Price</div>
                        <div style={{ fontWeight: 700, color: 'var(--color-navy)' }}>
                          {m.averagePrice ? formatIndianPrice(m.averagePrice) : 'Unavailable'}
                        </div>
                      </div>

                      <div>
                        <div style={{ color: 'var(--color-slate-light)', fontSize: '11px', textTransform: 'uppercase' }}>Localities</div>
                        <div style={{ fontWeight: 700, color: 'var(--color-navy)' }}>
                          {m.localitiesCount ? `${m.localitiesCount} mapped` : '0 mapped'}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Explore {z.name} Properties →
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Recommended / Emerging Areas (Section 5: Data-Driven, Zero Fabricated Growth) */}
      <section style={{ padding: '70px 0', background: '#ffffff' }}>
        <div className="container">
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--color-emerald)', textTransform: 'uppercase' }}>
              <TrendingUp size={14} /> Market Activity Signals
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-navy)', marginTop: '4px' }}>
              Recommended Areas in Nagpur
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-slate)', marginTop: '4px' }}>
              Ranked objectively by verified database activity, listing availability, and price benchmarks. Zero fabricated growth claims.
            </p>
          </div>

          {emergingAreas.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              {emergingAreas.map((area) => (
                <div
                  key={area.locality}
                  className="card"
                  style={{ padding: '22px', cursor: 'pointer' }}
                  onClick={() => navigate(`/search?district=Nagpur&location=${encodeURIComponent(area.locality)}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="badge badge-gold" style={{ fontSize: '11px' }}>
                      {area.zoneLabel}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-emerald)', fontWeight: 700 }}>
                      ● {area.availability}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-navy)' }}>
                    {area.locality}
                  </h3>

                  <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-slate)' }}>Benchmark Rate:</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-navy)' }}>
                        {area.avgPricePerSqft ? `₹${area.avgPricePerSqft.toLocaleString('en-IN')}/sq.ft.` : 'Data unavailable'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-slate)' }}>Average Price:</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-navy)' }}>
                        {area.avgPrice ? formatIndianPrice(area.avgPrice) : 'Unavailable'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-slate)' }}>Database Records:</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-navy)' }}>
                        {area.totalRecords} records
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--color-slate-light)', fontStyle: 'italic' }}>
                    {area.basis}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding: '36px', textAlign: 'center', background: '#f8fafc' }}>
              <Building2 size={36} color="var(--color-slate-light)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-navy)' }}>
                Market Activity Data Ingestion Ready
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-slate)', maxWidth: '520px', margin: '6px auto 16px' }}>
                TerraFind strictly displays recommendations derived from connected verified property records. Ingest a verified Nagpur property dataset using the import pipeline to populate live market rankings.
              </p>
              <Link to="/properties" className="btn btn-outline" style={{ fontSize: '13px' }}>
                Browse Nagpur Properties →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 4. Location Intelligence Pillars */}
      <section style={{ background: '#f1f5f9', padding: '75px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 48px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-navy)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Integrated Spatial Verification
            </div>
            <h2 style={{ fontSize: '30px', fontWeight: 800, color: 'var(--color-navy)', marginTop: '6px' }}>
              Multi-Source Location Intelligence for Nagpur
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--color-slate)', marginTop: '8px' }}>
              Every property query triggers independent, unblocked background intelligence for exact coordinates across Nagpur District.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '22px' }}>
            <div className="card" style={{ padding: '26px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--color-gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#996e00', marginBottom: '14px' }}>
                <Wind size={22} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-navy)' }}>Live Open-Meteo AQI</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-slate)', marginTop: '6px', lineHeight: 1.5 }}>
                Real-time European and US Air Quality Indices, PM2.5, and PM10 concentrations computed for exact Nagpur coordinates.
              </p>
            </div>

            <div className="card" style={{ padding: '26px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--color-emerald-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#065f46', marginBottom: '14px' }}>
                <Train size={22} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-navy)' }}>Strict 3 km Amenities</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-slate)', marginTop: '6px', lineHeight: 1.5 }}>
                OpenStreetMap Overpass POI engine returning actual verified names for Nagpur hospitals, schools, and metro stations within 3.0 km.
              </p>
            </div>

            <div className="card" style={{ padding: '26px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3730a3', marginBottom: '14px' }}>
                <ShieldCheck size={22} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-navy)' }}>Nagpur Police & NCRB Safety</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-slate)', marginTop: '6px', lineHeight: 1.5 }}>
                Official crime rate benchmarks published by the National Crime Records Bureau and Nagpur Police Commissionerate.
              </p>
            </div>

            <div className="card" style={{ padding: '26px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309', marginBottom: '14px' }}>
                <Sparkles size={22} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-navy)' }}>Evidence-Grounded AI</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-slate)', marginTop: '6px', lineHeight: 1.5 }}>
                Google Gemini advisory engine constrained strictly by factual data. If market liquidity is unrecorded, it outputs Insufficient Evidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Direct Owner / Builder Submission CTA (Section 27) */}
      <section style={{ padding: '60px 0', background: 'linear-gradient(135deg, #183153 0%, #244470 100%)', color: '#ffffff' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <span className="badge badge-gold" style={{ fontSize: '11px', marginBottom: '8px' }}>
              Legitimate Inventory Growth
            </span>
            <h2 style={{ fontSize: '26px', fontWeight: 800 }}>
              Are you a Property Owner or Builder in Nagpur?
            </h2>
            <p style={{ fontSize: '14px', color: '#cbd5e1', maxWidth: '580px', marginTop: '6px' }}>
              List your authentic residential or commercial property directly on TerraFind without third-party portal scraping.
            </p>
          </div>
          <Link to="/list-property" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '14px' }}>
            <PlusCircle size={16} /> List Your Property
          </Link>
        </div>
      </section>
    </div>
  );
}
