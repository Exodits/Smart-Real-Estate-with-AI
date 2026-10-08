import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Maximize2, BedDouble, Heart, CameraOff } from 'lucide-react';
import { api, getAuthToken } from '../api';

export function formatIndianPrice(price) {
  if (!price || isNaN(price)) return 'Price unavailable';
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(2)} Cr`;
  }
  if (price >= 100000) {
    return `₹${(price / 100000).toFixed(2)} Lakh`;
  }
  return `₹${price.toLocaleString('en-IN')}`;
}

const ZONE_LABELS = {
  east: 'East Nagpur',
  north: 'North Nagpur',
  west: 'West Nagpur',
  south: 'South Nagpur',
  centre: 'Central Nagpur'
};

export default function PropertyCard({ property, isFavorite = false, onToggleFavorite }) {
  const [favorite, setFavorite] = useState(isFavorite);
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState(false);

  async function handleFavoriteClick(e) {
    e.preventDefault();
    e.stopPropagation();

    const token = getAuthToken();
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      setIsSaving(true);
      if (favorite) {
        await api.removeFavorite(property.id);
        setFavorite(false);
        if (onToggleFavorite) onToggleFavorite(property.id, false);
      } else {
        await api.addFavorite(property);
        setFavorite(true);
        if (onToggleFavorite) onToggleFavorite(property.id, true);
      }
    } catch (err) {
      console.error('Favorite update failed', err);
    } finally {
      setIsSaving(false);
    }
  }

  const isDemo = property.is_demo === true || property.source_type === 'demo';
  const zoneLabel = property.zone ? ZONE_LABELS[property.zone.toLowerCase()] || property.zone : null;
  const areaValue = property.area_sqft || property.area || null;
  const priceSqft = (property.price_per_sqft && !isNaN(property.price_per_sqft))
    ? property.price_per_sqft
    : (property.pricePerSqft && !isNaN(property.pricePerSqft))
    ? property.pricePerSqft
    : null;
  const propType = property.property_type || property.propertyType || 'Property';

  // Section 43: Real property image detection
  const legitimateImageUrl = (!imageError && (property.primary_image_url || property.imageUrl || property.image_url)) || null;

  return (
    <div className="property-card">
      <div className="property-card-image-wrap" style={{ position: 'relative', width: '100%', height: '190px', background: '#f1f5f9', overflow: 'hidden' }}>
        {legitimateImageUrl ? (
          <img
            src={legitimateImageUrl}
            alt={`${property.title} in ${property.locality}, Nagpur`}
            loading="lazy"
            onError={() => setImageError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            className="property-card-placeholder"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              gap: '6px',
              padding: '16px'
            }}
          >
            <CameraOff size={32} strokeWidth={1.5} color="#94a3b8" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
              Photo unavailable
            </span>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>
              {property.locality || 'Nagpur District'}
            </span>
          </div>
        )}

        {/* Status / Demo Badge */}
        {isDemo ? (
          <span
            className="property-card-badge"
            style={{ background: '#f59e0b', color: '#ffffff', fontWeight: 700, position: 'absolute', top: '10px', left: '10px' }}
          >
            DEMO RECORD
          </span>
        ) : (
          <span
            className="property-card-badge"
            style={{ position: 'absolute', top: '10px', left: '10px' }}
          >
            {property.status === 'active' ? '● Available' : property.status || 'Verified'}
          </span>
        )}

        <button
          type="button"
          className={`property-card-fav ${favorite ? 'active' : ''}`}
          onClick={handleFavoriteClick}
          disabled={isSaving}
          title={favorite ? 'Remove Favorite' : 'Save to Favorites'}
          style={{ position: 'absolute', top: '10px', right: '10px' }}
        >
          <Heart size={18} fill={favorite ? 'var(--color-rose)' : 'none'} color={favorite ? 'var(--color-rose)' : 'currentColor'} />
        </button>
      </div>

      <div className="property-card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div className="property-card-price">{formatIndianPrice(property.price)}</div>
          {priceSqft ? (
            <div className="property-card-rate">
              ₹{priceSqft.toLocaleString('en-IN')}/sq.ft.
            </div>
          ) : (
            <div className="property-card-rate" style={{ color: '#94a3b8', fontSize: '11px' }}>
              Rate unavailable
            </div>
          )}
        </div>

        <Link to={`/property/${property.id}`} className="property-card-title">
          {property.title}
        </Link>

        <div className="property-card-loc" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <MapPin size={14} color="var(--color-gold)" style={{ flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {property.locality}, Nagpur
            </span>
          </div>
          {zoneLabel && (
            <span className="badge badge-gold" style={{ fontSize: '10px', padding: '2px 8px', flexShrink: 0 }}>
              {zoneLabel}
            </span>
          )}
        </div>

        <div className="property-card-specs">
          {property.bhk !== null && property.bhk !== undefined && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <BedDouble size={16} /> {property.bhk} BHK
            </span>
          )}
          {areaValue ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Maximize2 size={16} /> {areaValue} sq.ft.
            </span>
          ) : (
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Area unlisted
            </span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--color-slate)' }}>
            {propType}
          </span>
        </div>

        <div className="property-card-source">
          <span title={property.source || 'Authorized Registry'} style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11px', color: '#64748b' }}>
            {property.source || 'Authorized Registry'}
          </span>
          <Link
            to={`/property/${property.id}`}
            className="btn btn-outline"
            style={{ padding: '4px 10px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}
          >
            Location Intel →
          </Link>
        </div>
      </div>
    </div>
  );
}
