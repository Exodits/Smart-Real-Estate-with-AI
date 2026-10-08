import React, { useState } from 'react';
import {
  HeartPulse,
  Bus,
  GraduationCap,
  BookOpen,
  Train,
  ShoppingBag,
  Trees,
  Navigation
} from 'lucide-react';

const CATEGORY_ICONS = {
  'Hospital': HeartPulse,
  'Bus stop / Bus stand': Bus,
  'School': BookOpen,
  'College / University': GraduationCap,
  'Metro station': Train,
  'Railway station': Train,
  'Shopping / Market': ShoppingBag,
  'Park': Trees
};

export default function AmenityList({ amenitiesData }) {
  const [activeTab, setActiveTab] = useState('All');

  if (!amenitiesData || !amenitiesData.categories) {
    return (
      <div className="card" style={{ padding: '30px', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-slate)' }}>Finding nearby verified amenities within 3 km...</p>
      </div>
    );
  }

  const categories = amenitiesData.categories;
  const categoryNames = Object.keys(categories);

  if (categoryNames.length === 0) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-slate)' }}>
        <Navigation size={32} style={{ margin: '0 auto 12px', color: 'var(--color-slate-light)' }} />
        <h4 style={{ color: 'var(--color-navy)', fontSize: '16px' }}>No Verified POIs Within 3.0 km</h4>
        <p style={{ fontSize: '13px', marginTop: '6px' }}>
          OpenStreetMap data returned no verified institutions or transport nodes within this immediate 3 km radius.
        </p>
      </div>
    );
  }

  // Filtered items
  let displayItems = [];
  if (activeTab === 'All') {
    Object.values(categories).forEach((list) => {
      displayItems.push(...list);
    });
    displayItems.sort((a, b) => a.distanceKm - b.distanceKm);
  } else {
    displayItems = categories[activeTab] || [];
  }

  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-navy)' }}>
            Verified Nearby Amenities
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-slate)', marginTop: '2px' }}>
            Within strictly 3.0 km radius • Source: OpenStreetMap Overpass
          </p>
        </div>

        <span className="badge badge-emerald">
          {amenitiesData.totalCount} Verified Places
        </span>
      </div>

      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '16px 0 8px', scrollbarWidth: 'none' }}>
        <button
          type="button"
          className={`btn ${activeTab === 'All' ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '6px 14px', fontSize: '12px', borderRadius: 'var(--radius-full)' }}
          onClick={() => setActiveTab('All')}
        >
          All ({amenitiesData.totalCount})
        </button>

        {categoryNames.map((cat) => {
          const Icon = CATEGORY_ICONS[cat] || Navigation;
          const count = categories[cat].length;
          return (
            <button
              key={cat}
              type="button"
              className={`btn ${activeTab === cat ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 14px', fontSize: '12px', borderRadius: 'var(--radius-full)' }}
              onClick={() => setActiveTab(cat)}
            >
              <Icon size={14} />
              <span>{cat} ({count})</span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', marginTop: '16px' }}>
        {displayItems.slice(0, 24).map((poi) => {
          const Icon = CATEGORY_ICONS[poi.category] || Navigation;
          return (
            <div
              key={poi.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: '#f8fafc',
                border: '1px solid var(--color-border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <Icon size={16} color="var(--color-navy)" />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--color-charcoal)',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden'
                    }}
                    title={poi.name}
                  >
                    {poi.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-slate)' }}>
                    {poi.category}
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--color-navy)',
                  whiteSpace: 'nowrap',
                  marginLeft: '12px',
                  background: '#ffffff',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)'
                }}
              >
                {poi.distanceKm} km
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
