import React from 'react';
import PropertyCard from './PropertyCard';
import { Building2, SearchX } from 'lucide-react';

export default function PropertyGrid({
  properties = [],
  isLoading = false,
  emptyMessage = "No active listings found for the selected criteria in the connected dataset."
}) {
  if (isLoading) {
    return (
      <div className="property-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="property-card" style={{ opacity: 0.6 }}>
            <div className="property-card-image-wrap" style={{ background: '#e2e8f0' }} />
            <div className="property-card-body">
              <div style={{ height: '24px', width: '45%', background: '#e2e8f0', borderRadius: '4px' }} />
              <div style={{ height: '18px', width: '80%', background: '#e2e8f0', borderRadius: '4px', marginTop: '12px' }} />
              <div style={{ height: '14px', width: '60%', background: '#e2e8f0', borderRadius: '4px', marginTop: '8px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: '60px 20px',
          textAlign: 'center',
          marginTop: '24px',
          color: 'var(--color-slate)'
        }}
      >
        <SearchX size={48} strokeWidth={1.5} style={{ margin: '0 auto 16px', color: 'var(--color-slate-light)' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-navy)' }}>
          No Properties Found
        </h3>
        <p style={{ maxWidth: '420px', margin: '8px auto 0', fontSize: '14px' }}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="property-grid">
      {properties.map((prop) => (
        <PropertyCard key={prop.id} property={prop} />
      ))}
    </div>
  );
}
