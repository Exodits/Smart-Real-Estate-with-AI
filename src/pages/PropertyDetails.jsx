import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, getAuthToken } from '../api';
import LocationIntel from '../components/LocationIntel';
import AmenityList from '../components/AmenityList';
import Map from '../components/Map';
import AIInsight from '../components/AIInsight';
import { formatIndianPrice } from '../components/PropertyCard';
import {
  MapPin,
  Maximize2,
  BedDouble,
  Heart,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  CameraOff,
  Image as ImageIcon
} from 'lucide-react';

const ZONE_LABELS = {
  east: 'East Nagpur',
  north: 'North Nagpur',
  west: 'West Nagpur',
  south: 'South Nagpur',
  centre: 'Central Nagpur'
};

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [intel, setIntel] = useState(null);
  const [amenities, setAmenities] = useState(null);
  const [aiReport, setAiReport] = useState(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [isLoadingProp, setIsLoadingProp] = useState(true);
  const [isLoadingIntel, setIsLoadingIntel] = useState(false);
  const [isFav, setIsFav] = useState(false);

  // Image Gallery State (Section 43.5)
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageErrorMap, setImageErrorMap] = useState({});

  useEffect(() => {
    loadPropertyFast();
  }, [id]);

  /**
   * Fast Database-First Property Load (Section 33)
   */
  async function loadPropertyFast() {
    setIsLoadingProp(true);
    try {
      const res = await api.getPropertyById(id);
      if (res && res.property) {
        const prop = res.property;
        setProperty(prop);
        setIsLoadingProp(false); // Render property details immediately!

        // Fetch location intelligence in background (Non-Blocking)
        const targetLat = prop.latitude || prop.locality_latitude;
        const targetLon = prop.longitude || prop.locality_longitude;
        if (targetLat && targetLon) {
          fetchPropertyIntelligence(targetLat, targetLon, prop.locality);
        }

        // Check user favorite
        const token = getAuthToken();
        if (token) {
          api.getFavorites().then((favRes) => {
            if (favRes && Array.isArray(favRes.favorites)) {
              setIsFav(favRes.favorites.some((f) => f.propertyId === prop.id));
            }
          }).catch(() => null);
        }
      } else {
        setIsLoadingProp(false);
      }
    } catch (err) {
      console.error('Failed to load property details', err);
      setIsLoadingProp(false);
    }
  }

  async function fetchPropertyIntelligence(lat, lon, locality) {
    setIsLoadingIntel(true);
    try {
      const [intelRes, amenityRes] = await Promise.allSettled([
        api.getLocationIntelligence(lat, lon, locality, 'Nagpur', 'Nagpur'),
        api.getAmenities(lat, lon, 3000)
      ]);

      if (intelRes.status === 'fulfilled') setIntel(intelRes.value);
      if (amenityRes.status === 'fulfilled') setAmenities(amenityRes.value);
    } catch (e) {
      console.warn('[PropertyDetails] Background intelligence error:', e.message);
    } finally {
      setIsLoadingIntel(false);
    }
  }

  async function toggleFavorite() {
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }
    if (isFav) {
      await api.removeFavorite(property.id);
      setIsFav(false);
    } else {
      await api.addFavorite(property);
      setIsFav(true);
    }
  }

  async function handleRunAiAnalysis() {
    if (!property || !intel) return;
    setIsAnalyzingAi(true);
    try {
      const evidence = {
        location: `${property.locality}, Nagpur, Maharashtra`,
        propertyMarket: {
          averagePrice: property.price,
          averagePricePerSqft: property.price_per_sqft || null,
          activeListingsCount: 1,
          propertyType: property.property_type,
          bhk: property.bhk
        },
        airQuality: intel.air,
        water: intel.water,
        safety: intel.safety,
        amenities: amenities
      };
      const report = await api.analyzeInvestment(evidence);
      setAiReport(report);
    } catch (e) {
      console.error('AI analysis failed:', e);
    } finally {
      setIsAnalyzingAi(false);
    }
  }

  if (isLoadingProp) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <Loader2 size={32} className="spinner" style={{ margin: '0 auto 16px', color: 'var(--color-gold)' }} />
        <p style={{ color: 'var(--color-slate)' }}>Loading verified Nagpur property record...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-navy)' }}>Property Record Not Found</h2>
        <p style={{ color: 'var(--color-slate)', marginTop: '8px' }}>
          This property record is not present in the connected Nagpur database.
        </p>
        <Link to="/properties" className="btn btn-primary" style={{ marginTop: '20px' }}>
          Browse Nagpur Properties
        </Link>
      </div>
    );
  }

  const isDemo = property.is_demo === true || property.source_type === 'demo';
  const zoneLabel = property.zone ? ZONE_LABELS[property.zone.toLowerCase()] || property.zone : null;
  const areaValue = property.area_sqft || null;
  const priceSqft = property.price_per_sqft || null;

  // Flatten verified amenities for map
  const mapPOIs = [];
  if (amenities && amenities.categories) {
    Object.values(amenities.categories).forEach((cat) => {
      mapPOIs.push(...cat);
    });
  }

  // Section 43: Assemble legitimate photos
  const rawImages = Array.isArray(property.image_urls) && property.image_urls.length > 0
    ? property.image_urls
    : property.primary_image_url
    ? [property.primary_image_url]
    : [];

  const validImages = rawImages.filter((_, idx) => !imageErrorMap[idx]);
  const hasPhotos = validImages.length > 0;

  const mapLat = property.latitude || property.locality_latitude || 21.1458;
  const mapLon = property.longitude || property.locality_longitude || 79.0882;

  return (
    <div style={{ padding: '30px 0 70px', background: '#f8fafc' }}>
      <div className="container">
        {/* Back Link */}
        <div style={{ marginBottom: '20px' }}>
          <Link
            to="/properties"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: 'var(--color-slate)' }}
          >
            <ArrowLeft size={16} /> Back to Nagpur Properties
          </Link>
        </div>

        {/* Demo Notice Banner if demo record */}
        {isDemo && (
          <div
            className="card"
            style={{
              padding: '16px 20px',
              marginBottom: '20px',
              borderLeft: '6px solid var(--color-amber)',
              background: '#fffbeb',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <AlertTriangle size={20} color="var(--color-amber)" />
            <div style={{ fontSize: '13px', color: '#92400e' }}>
              <strong>Notice:</strong> This is a development demo record (<code>source_type: demo</code>). It is strictly excluded from real active listing statistics and market averages.
            </div>
          </div>
        )}

        {/* Section 43: Real Photo Gallery or Honest Fallback */}
        <div className="card" style={{ padding: '24px', marginBottom: '28px', overflow: 'hidden' }}>
          {hasPhotos ? (
            <div>
              <div style={{ height: '380px', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#0f172a', position: 'relative' }}>
                <img
                  src={validImages[activeImageIndex] || validImages[0]}
                  alt={`${property.title} - View ${activeImageIndex + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={() => setImageErrorMap((prev) => ({ ...prev, [activeImageIndex]: true }))}
                />
                <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ImageIcon size={14} /> Photo {activeImageIndex + 1} of {validImages.length}
                </div>
              </div>

              {validImages.length > 1 && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '14px', overflowX: 'auto', paddingBottom: '6px' }}>
                  {validImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      style={{
                        width: '80px',
                        height: '60px',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        border: activeImageIndex === idx ? '3px solid var(--color-gold)' : '2px solid transparent',
                        padding: 0,
                        cursor: 'pointer',
                        background: '#e2e8f0',
                        flexShrink: 0
                      }}
                    >
                      <img src={img} alt={`Thumbnail ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                height: '240px',
                borderRadius: 'var(--radius-md)',
                background: '#f1f5f9',
                border: '2px dashed #cbd5e1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                gap: '8px',
                padding: '24px',
                textAlign: 'center'
              }}
            >
              <CameraOff size={44} strokeWidth={1.5} color="#94a3b8" />
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-navy)' }}>
                Photo unavailable
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '420px', margin: 0 }}>
                No photographs were provided by the source for this property record. TerraFind never substitutes unrelated stock images.
              </p>
            </div>
          )}
        </div>

        {/* Property Header & Facts */}
        <div className="card" style={{ padding: '32px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="badge badge-emerald">
                  <CheckCircle2 size={12} /> {property.status === 'active' ? 'Available' : property.status}
                </span>
                <span className="badge badge-navy">
                  {property.property_type || property.propertyType}
                </span>
                {zoneLabel && (
                  <span className="badge badge-gold">
                    {zoneLabel}
                  </span>
                )}
                <span className="badge badge-outline" style={{ fontSize: '11px' }}>
                  Nagpur District
                </span>
              </div>

              <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-navy)', marginTop: '10px' }}>
                {property.title}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-slate)', marginTop: '8px', fontSize: '15px' }}>
                <MapPin size={18} color="var(--color-gold)" />
                <span>
                  {property.address ? `${property.address}, ` : ''}{property.locality}, Nagpur, Maharashtra
                </span>
                {property.pincode && <span style={{ color: 'var(--color-slate-light)' }}>(PIN: {property.pincode})</span>}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 800, color: 'var(--color-navy)' }}>
                {formatIndianPrice(property.price)}
              </div>
              {priceSqft ? (
                <div style={{ fontSize: '14px', color: 'var(--color-slate)', fontWeight: 600 }}>
                  ₹{priceSqft.toLocaleString('en-IN')} per sq.ft.
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Rate per sq.ft. unavailable (area unlisted)
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className={`btn ${isFav ? 'btn-primary' : 'btn-outline'}`}
                  onClick={toggleFavorite}
                >
                  <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
                  <span>{isFav ? 'Favorited' : 'Add to Favorites'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Specs Bar (Zero Fabrication: Only show fields if legitimately reported) */}
          <div
            style={{
              display: 'flex',
              gap: '32px',
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid var(--color-border)',
              flexWrap: 'wrap'
            }}
          >
            {property.bhk && (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-slate)', textTransform: 'uppercase', fontWeight: 700 }}>Configuration</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <BedDouble size={16} /> {property.bhk} BHK
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-slate)', textTransform: 'uppercase', fontWeight: 700 }}>Area</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: areaValue ? 'var(--color-navy)' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <Maximize2 size={16} /> {areaValue ? `${areaValue} sq.ft.` : 'Unlisted on source'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-slate)', textTransform: 'uppercase', fontWeight: 700 }}>Data Source</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-navy)', marginTop: '4px' }}>
                {property.source}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-slate)', textTransform: 'uppercase', fontWeight: 700 }}>Record Type</div>
              <div style={{ fontSize: '13px', color: 'var(--color-slate)', marginTop: '4px' }}>
                <code>{property.source_type || 'active_listing'}</code>
              </div>
            </div>

            {property.source_listing_id && (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-slate)', textTransform: 'uppercase', fontWeight: 700 }}>Source ID</div>
                <div style={{ fontSize: '13px', color: 'var(--color-slate)', marginTop: '4px' }}>
                  {property.source_listing_id}
                </div>
              </div>
            )}

            {property.source_url && (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-slate)', textTransform: 'uppercase', fontWeight: 700 }}>Verification Link</div>
                <div style={{ marginTop: '4px' }}>
                  <a
                    href={property.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '13px', color: 'var(--color-navy)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'underline' }}
                  >
                    Source Page <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Location Intelligence Section */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-navy)' }}>
                Location Intelligence
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--color-slate)' }}>
                {property.latitude
                  ? `Live environmental, transit, and official government data for coordinates (${property.latitude.toFixed(4)}, ${property.longitude.toFixed(4)}).`
                  : `Locality-level environmental, transit, and official government data for ${property.locality}, Nagpur.`}
              </p>
            </div>

            {intel && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRunAiAnalysis}
                disabled={isAnalyzingAi}
                style={{ fontSize: '13px', padding: '8px 16px' }}
              >
                <Sparkles size={16} />
                <span>{isAnalyzingAi ? 'Analyzing Evidence...' : 'Generate AI Investment Outlook'}</span>
              </button>
            )}
          </div>

          {intel ? (
            <LocationIntel intel={intel} locationName={property.locality} />
          ) : isLoadingIntel ? (
            <div className="card" style={{ padding: '36px', textAlign: 'center', color: 'var(--color-slate)' }}>
              <Loader2 size={24} className="spinner" style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: '13px' }}>Loading real-time AQI, weather, and safety indicators...</p>
            </div>
          ) : (
            <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-slate)' }}>
              Location coordinates unavailable for this record.
            </div>
          )}
        </div>

        {/* AI Insight Report */}
        {aiReport && (
          <div style={{ marginBottom: '36px' }}>
            <AIInsight report={aiReport} locality={property.locality} />
          </div>
        )}

        {/* Verified Amenities within 3km */}
        {amenities && (
          <div style={{ marginBottom: '36px' }}>
            <AmenityList amenitiesData={amenities} />
          </div>
        )}

        {/* Map (Supports both 2D GIS and 3D Real Look Mode) */}
        <div>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-navy)' }}>
              Spatial Context & Verified POIs
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-slate)' }}>
              Strict 3.0 km radius around {property.locality}, Nagpur. Switch between 2D GIS and 3D Real Look modes below.
            </p>
          </div>
          <Map
            lat={mapLat}
            lon={mapLon}
            locationName={property.title}
            radiusKm={3.0}
            amenities={mapPOIs}
            properties={[property]}
          />
        </div>
      </div>
    </div>
  );
}
