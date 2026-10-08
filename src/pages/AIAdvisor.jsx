import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBox from '../components/SearchBox';
import AIInsight from '../components/AIInsight';
import LocationIntel from '../components/LocationIntel';
import { formatIndianPrice } from '../components/PropertyCard';
import { api } from '../api';
import {
  Sparkles,
  MapPin,
  ShieldCheck,
  AlertCircle,
  Cpu,
  ArrowRight,
  Send,
  Building2,
  ExternalLink,
  FileText,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';

const EXAMPLE_QUERIES = [
  'I have ₹60 lakh, work near MIHAN and want a 2BHK',
  'Looking for a 3 BHK in West Nagpur near Dharampeth under 1.5 Cr',
  'Affordable apartments in East Nagpur or Wardhaman Nagar',
  'Show me RERA registered benchmark projects in South Nagpur'
];

export default function AIAdvisor() {
  // Mode: 'rag' (Natural Language Query) or 'locality' (Indicator Evaluator)
  const [activeMode, setActiveMode] = useState('rag');

  // --- RAG State ---
  const [naturalQuery, setNaturalQuery] = useState('');
  const [ragLoading, setRagLoading] = useState(false);
  const [ragResult, setRagResult] = useState(null);
  const [ragError, setRagError] = useState(null);

  // --- Locality Evaluator State ---
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [report, setReport] = useState(null);
  const [intel, setIntel] = useState(null);
  const [isLocalityLoading, setIsLocalityLoading] = useState(false);
  const [localityError, setLocalityError] = useState(null);

  // Handle RAG Natural Language Query (Section 28 & 31)
  async function handleRagSubmit(queryText) {
    const q = (queryText || naturalQuery).trim();
    if (!q) return;

    setRagLoading(true);
    setRagError(null);
    setRagResult(null);

    try {
      const res = await api.queryAiRAG(q);
      setRagResult(res);
    } catch (err) {
      console.error('RAG query error:', err);
      setRagError(err.message || 'Failed to process natural language query. Please try again.');
    } finally {
      setRagLoading(false);
    }
  }

  // Handle Locality Evaluator Selection
  async function handleSelectLocality(loc) {
    setSelectedLocation(loc);
    setReport(null);
    setIntel(null);
    setLocalityError(null);
    setIsLocalityLoading(true);

    try {
      const lat = loc.lat || 21.1458;
      const lon = loc.lon || 79.0882;
      const locName = loc.locality || loc.name || 'Nagpur';

      // Fetch live evidence concurrently
      const [intelRes, amenityRes, marketRes] = await Promise.allSettled([
        api.getLocationIntelligence(lat, lon, locName, 'Nagpur', 'Nagpur'),
        api.getAmenities(lat, lon, 3000),
        api.getMarketSummaries({ district: 'Nagpur', locality: locName })
      ]);

      const fetchedIntel = intelRes.status === 'fulfilled' ? intelRes.value : {};
      const fetchedAmenities = amenityRes.status === 'fulfilled' ? amenityRes.value : {};
      const marketSummaries = marketRes.status === 'fulfilled' ? (marketRes.value.summaries || []) : [];
      const market = marketSummaries[0] || null;

      setIntel(fetchedIntel);

      // Package evidence payload
      const evidence = {
        location: `${locName}, Nagpur, Maharashtra`,
        propertyMarket: market,
        airQuality: fetchedIntel.air,
        water: fetchedIntel.water,
        safety: fetchedIntel.safety,
        amenities: fetchedAmenities
      };

      const aiResponse = await api.analyzeInvestment(evidence);
      setReport(aiResponse);
    } catch (err) {
      console.error('AI Locality Advisor error:', err);
      setLocalityError('Unable to complete AI evaluation. Please try again.');
    } finally {
      setIsLocalityLoading(false);
    }
  }

  return (
    <div style={{ padding: '40px 0 80px', background: '#f8fafc', minHeight: '85vh' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--color-gold)', textTransform: 'uppercase' }}>
            <Sparkles size={16} /> Transparent AI Grounding (Nagpur District)
          </div>
          <h1 style={{ fontSize: '34px', fontWeight: 800, color: 'var(--color-navy)', marginTop: '4px' }}>
            Nagpur AI Real Estate & Spatial Advisor
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--color-slate)', marginTop: '6px', maxWidth: '680px', margin: '6px auto 0' }}>
            Powered by Retrieval-Augmented Grounding (RAG). Every recommendation is anchored directly to real verified properties, statutory MahaRERA filings, ready reckoner rates, and spatial metrics.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '28px' }}>
          <button
            type="button"
            className={`btn ${activeMode === 'rag' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveMode('rag')}
            style={{ padding: '10px 22px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <MessageSquare size={16} /> Natural Language Advisor (RAG)
          </button>
          <button
            type="button"
            className={`btn ${activeMode === 'locality' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveMode('locality')}
            style={{ padding: '10px 22px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <MapPin size={16} /> Locality Investment Evaluator
          </button>
        </div>

        {/* ======================================================== */}
        {/* MODE 1: NATURAL LANGUAGE RAG ADVISOR (Section 28 & 31)   */}
        {/* ======================================================== */}
        {activeMode === 'rag' && (
          <div>
            <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '8px' }}>
                Ask in Natural Language (Budget, BHK, Work Corridors, Zone)
              </label>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRagSubmit();
                }}
                style={{ display: 'flex', gap: '10px' }}
              >
                <input
                  type="text"
                  value={naturalQuery}
                  onChange={(e) => setNaturalQuery(e.target.value)}
                  placeholder="e.g. I have ₹60 lakh, work near MIHAN and want a 2BHK"
                  className="searchbox-input"
                  style={{ flex: 1, border: '1px solid var(--color-border)', padding: '12px 16px', fontSize: '14px' }}
                />
                <button
                  type="submit"
                  disabled={ragLoading || !naturalQuery.trim()}
                  className="btn btn-primary"
                  style={{ padding: '0 24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700 }}
                >
                  {ragLoading ? 'Analyzing...' : <><Send size={16} /> Ask AI</>}
                </button>
              </form>

              {/* Quick Prompt Pills */}
              <div style={{ marginTop: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-slate)', marginRight: '8px' }}>
                  Try asking:
                </span>
                <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                  {EXAMPLE_QUERIES.map((eq, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setNaturalQuery(eq);
                        handleRagSubmit(eq);
                      }}
                      className="btn btn-outline"
                      style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '16px', color: 'var(--color-slate)' }}
                    >
                      "{eq}"
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {ragError && (
              <div style={{ padding: '14px 18px', background: '#fee2e2', color: '#991b1b', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <AlertCircle size={18} />
                <span>{ragError}</span>
              </div>
            )}

            {ragLoading && (
              <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                <Cpu size={36} color="var(--color-gold)" style={{ margin: '0 auto 12px', animation: 'spin 2s linear infinite' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-navy)' }}>
                  Extracting Requirements & Retrieving Nagpur District Evidence...
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-slate)', marginTop: '4px' }}>
                  Grounding response against real database listings, RERA registry, and zone benchmarks.
                </p>
              </div>
            )}

            {ragResult && !ragLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* AI Grounded Explanation Card */}
                <div className="card" style={{ padding: '28px', borderLeft: '5px solid var(--color-gold)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={18} color="var(--color-gold)" />
                      <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-navy)' }}>
                        AI Grounded Recommendation
                      </h2>
                    </div>
                    <span className="badge badge-emerald" style={{ fontSize: '11px' }}>
                      Zero-Fabrication Grounded
                    </span>
                  </div>

                  <div style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--color-slate)', whiteSpace: 'pre-line' }}>
                    {ragResult.explanation}
                  </div>

                  {ragResult.engine && (
                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-border)', fontSize: '11px', color: 'var(--color-slate-light)' }}>
                      Engine: <strong>{ragResult.engine}</strong>
                    </div>
                  )}
                </div>

                {/* Parsed Requirements Card */}
                {ragResult.evidence?.parsedRequirements && (
                  <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '12px', textTransform: 'uppercase' }}>
                      Parsed Query Intent
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                      <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--color-slate)' }}>Max Budget</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-navy)' }}>
                          {ragResult.evidence.parsedRequirements.budgetMax}
                        </div>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--color-slate)' }}>BHK Config</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-navy)' }}>
                          {ragResult.evidence.parsedRequirements.bhk}
                        </div>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--color-slate)' }}>Target Corridor</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-navy)' }}>
                          {ragResult.evidence.parsedRequirements.targetLocality}
                        </div>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--color-slate)' }}>Analytical Zone</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-navy)' }}>
                          {ragResult.evidence.parsedRequirements.zone}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Retrieved Matching Real Listings (Section 28) */}
                {ragResult.evidence?.sampleRetrievedListings && (
                  <div className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-navy)' }}>
                        Retrieved Real Database Listings ({ragResult.evidence.matchingRealListingsCount || ragResult.evidence.sampleRetrievedListings.length} total)
                      </h3>
                      <Link to="/properties" style={{ fontSize: '12px', color: 'var(--color-gold)', fontWeight: 600 }}>
                        View All in Search →
                      </Link>
                    </div>

                    {ragResult.evidence.sampleRetrievedListings.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--color-slate)' }}>
                        No listings in the verified database strictly matched all query criteria. Consider broadening budget or BHK parameters.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {ragResult.evidence.sampleRetrievedListings.map((prop) => (
                          <div
                            key={prop.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '12px 16px',
                              background: '#f8fafc',
                              border: '1px solid var(--color-border)',
                              borderRadius: '6px',
                              flexWrap: 'wrap',
                              gap: '10px'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-navy)' }}>
                                {prop.title}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--color-slate)', marginTop: '2px' }}>
                                <span>{prop.locality}, Nagpur</span> • <span>Zone: {(prop.zone || '').toUpperCase()}</span> • <span>BHK: {prop.bhk || 'N/A'}</span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--color-navy)' }}>
                                  {formatIndianPrice(prop.price)}
                                </div>
                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                  {prop.area_sqft ? `${prop.area_sqft} sq.ft.` : 'Area unlisted (NULL)'}
                                </div>
                              </div>

                              <Link
                                to={`/property/${prop.id}`}
                                className="btn btn-outline"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                              >
                                View Details <ExternalLink size={12} style={{ marginLeft: '4px' }} />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* MahaRERA Benchmark Projects (Section 7 Separate Dataset) */}
                {ragResult.evidence?.reraBenchmarkProjects && ragResult.evidence.reraBenchmarkProjects.length > 0 && (
                  <div className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <Building2 size={16} color="var(--color-navy)" />
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-navy)' }}>
                        Statutory MahaRERA Benchmark Projects in Area
                      </h3>
                      <span className="badge badge-outline" style={{ fontSize: '10px' }}>RERA Separate Dataset</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                      {ragResult.evidence.reraBenchmarkProjects.map((r, idx) => (
                        <div key={idx} style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '12px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--color-navy)' }}>{r.name}</div>
                          <div style={{ color: 'var(--color-slate)', marginTop: '2px' }}>Promoter: {r.promoter}</div>
                          <div style={{ color: 'var(--color-gold)', fontWeight: 600, marginTop: '4px' }}>RERA: {r.reraNumber}</div>
                          <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>Locality: {r.locality}, Nagpur</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 2: LOCALITY INVESTMENT EVALUATOR (Indicators)       */}
        {/* ======================================================== */}
        {activeMode === 'locality' && (
          <div>
            <div className="card" style={{ padding: '28px', marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Select Nagpur Locality for Evaluation
              </label>
              <SearchBox
                placeholder="Search Nagpur locality (e.g. Manish Nagar, Dharampeth, Wardhaman Nagar)..."
                onSelectLocation={handleSelectLocality}
              />

              {selectedLocation && (
                <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--color-navy)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} color="var(--color-gold)" />
                  <span>Analyzing: {selectedLocation.locality || selectedLocation.name}, Nagpur</span>
                </div>
              )}
            </div>

            {localityError && (
              <div style={{ padding: '14px 18px', background: '#fee2e2', color: '#991b1b', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <AlertCircle size={18} />
                <span>{localityError}</span>
              </div>
            )}

            {/* AI Insight Result */}
            <AIInsight report={report} isLoading={isLocalityLoading} />

            {/* Underlying Evidence Panel */}
            {intel && (
              <div style={{ marginTop: '40px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '14px' }}>
                  Verified Spatial Evidence Fed into AI Engine
                </h3>
                <LocationIntel intel={intel} locationName={selectedLocation?.locality} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
