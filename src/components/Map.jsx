import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import Map3D from './Map3D';
import { Layers, Box, Info } from 'lucide-react';
import { formatIndianPrice } from './PropertyCard';

// 5 Nagpur Analytical Zone Polygons & Centers (Section 14 & 44.1)
const NAGPUR_ZONES = [
  {
    id: 'south',
    name: 'South Nagpur',
    color: '#10b981',
    bounds: [[20.950, 79.010], [21.120, 79.120]]
  },
  {
    id: 'west',
    name: 'West Nagpur',
    color: '#6366f1',
    bounds: [[21.100, 78.960], [21.180, 79.070]]
  },
  {
    id: 'north',
    name: 'North Nagpur',
    color: '#a855f7',
    bounds: [[21.170, 79.040], [21.260, 79.130]]
  },
  {
    id: 'east',
    name: 'East Nagpur',
    color: '#f59e0b',
    bounds: [[21.120, 79.110], [21.190, 79.220]]
  },
  {
    id: 'centre',
    name: 'Central Nagpur',
    color: '#0284c7',
    bounds: [[21.130, 79.070], [21.165, 79.110]]
  }
];

export default function Map({
  lat = 21.1458,
  lon = 79.0882,
  locationName = 'Nagpur District',
  radiusKm = 3.0,
  amenities = [],
  properties = []
}) {
  // Mode toggle state: '2d' (default) or '3d' (Section 44.1)
  const [mapMode, setMapMode] = useState('2d');

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const zoneLayerGroupRef = useRef(null);

  // Initialize and update 2D Leaflet map
  useEffect(() => {
    if (mapMode !== '2d') return;
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize Leaflet map centered at Nagpur (Section 1)
      const map = L.map(mapContainerRef.current, {
        center: [lat, lon],
        zoom: 13,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors • TerraFind Nagpur GIS',
        maxZoom: 19
      }).addTo(map);

      const zoneLayerGroup = L.layerGroup().addTo(map);
      const layerGroup = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      zoneLayerGroupRef.current = zoneLayerGroup;
      layerGroupRef.current = layerGroup;

      // Draw 5 TerraFind Analytical Zone Polygons
      NAGPUR_ZONES.forEach((z) => {
        L.rectangle(z.bounds, {
          color: z.color,
          weight: 1.5,
          fillColor: z.color,
          fillOpacity: 0.06,
          dashArray: '4, 6'
        }).addTo(zoneLayerGroup).bindTooltip(`<b>${z.name}</b>`, { permanent: false, direction: 'center' });
      });
    }

    const map = mapInstanceRef.current;
    const layers = layerGroupRef.current;

    // Clear previous markers
    layers.clearLayers();

    // Center map
    map.setView([lat, lon], 13);

    // Primary Selected Location Marker
    const primaryIcon = L.divIcon({
      className: 'custom-map-marker-primary',
      html: `
        <div style="background: #183153; color: #fff; width: 34px; height: 34px; border-radius: 50%; border: 3px solid #F5B700; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const marker = L.marker([lat, lon], { icon: primaryIcon }).addTo(layers);
    marker.bindPopup(`<b>${locationName}</b><br/>Nagpur District Reference: ${lat.toFixed(4)}, ${lon.toFixed(4)}`).openPopup();

    // 3.0 km Radius Circle (Section 16)
    if (radiusKm) {
      L.circle([lat, lon], {
        color: '#F5B700',
        fillColor: '#F5B700',
        fillOpacity: 0.08,
        weight: 2,
        dashArray: '5, 8',
        radius: radiusKm * 1000
      }).addTo(layers);
    }

    // Property Markers (for verified properties with coordinates)
    if (Array.isArray(properties) && properties.length > 0) {
      properties.forEach((prop) => {
        const pLat = prop.latitude || prop.locality_latitude;
        const pLon = prop.longitude || prop.locality_longitude;
        if (!pLat || !pLon) return;

        const isExact = Boolean(prop.latitude);
        const propIcon = L.divIcon({
          className: 'custom-map-marker-prop',
          html: `
            <div style="background: ${isExact ? '#10b981' : '#f59e0b'}; color: #fff; width: 28px; height: 28px; border-radius: 50%; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">
              ₹
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const propMarker = L.marker([pLat, pLon], { icon: propIcon }).addTo(layers);
        const hasPhoto = Boolean(prop.primary_image_url || prop.imageUrl || prop.image_url);
        const photoHtml = hasPhoto
          ? `<img src="${prop.primary_image_url || prop.imageUrl || prop.image_url}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 4px; margin-bottom: 6px;" alt="${prop.title}"/>`
          : `<div style="background: #f1f5f9; padding: 6px; text-align: center; color: #94a3b8; font-size: 10px; border-radius: 4px; margin-bottom: 6px;">Photo unavailable</div>`;

        propMarker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; max-width: 220px;">
            ${photoHtml}
            <strong style="color: #183153; font-size: 13px;">${prop.title}</strong><br/>
            <span style="color: #10b981; font-weight: bold; font-size: 13px;">${formatIndianPrice(prop.price)}</span><br/>
            <span style="color: #64748B;">${prop.locality}, Nagpur</span><br/>
            <span style="font-size: 10px; color: ${isExact ? '#059669' : '#d97706'}; font-weight: 600;">
              ${isExact ? '● Exact property coordinate' : '○ Locality centroid reference'}
            </span><br/>
            <a href="/property/${prop.id}" style="color: #183153; font-weight: bold; text-decoration: underline; margin-top: 6px; display: inline-block;">
              View Details →
            </a>
          </div>
        `);
      });
    }

    // Amenity Markers (within strictly <= 3.0km)
    if (Array.isArray(amenities) && amenities.length > 0) {
      amenities.forEach((poi) => {
        if (!poi.lat || !poi.lon) return;

        const amenityIcon = L.divIcon({
          className: 'custom-map-marker-poi',
          html: `
            <div style="background: #ffffff; color: #183153; width: 20px; height: 20px; border-radius: 50%; border: 2px solid #183153; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
              •
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const poiMarker = L.marker([poi.lat, poi.lon], { icon: amenityIcon }).addTo(layers);
        poiMarker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px;">
            <strong style="color: #183153;">${poi.name}</strong><br/>
            <span style="color: #64748B;">${poi.category}</span><br/>
            <b>${poi.distanceKm} km away</b>
          </div>
        `);
      });
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  }, [lat, lon, locationName, radiusKm, amenities, properties, mapMode]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Section 44.1: MAP MODE TOGGLE BAR */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          background: '#ffffff',
          padding: '8px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-slate)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            MAP MODE:
          </span>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '6px', gap: '2px' }}>
            <button
              type="button"
              onClick={() => setMapMode('2d')}
              style={{
                background: mapMode === '2d' ? 'var(--color-navy)' : 'transparent',
                color: mapMode === '2d' ? '#ffffff' : '#64748b',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Layers size={14} /> 2D GIS
            </button>
            <button
              type="button"
              onClick={() => setMapMode('3d')}
              style={{
                background: mapMode === '3d' ? 'var(--color-navy)' : 'transparent',
                color: mapMode === '3d' ? '#ffffff' : '#64748b',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Box size={14} /> 3D REAL LOOK
            </button>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Info size={14} color="var(--color-gold)" />
          <span>
            {mapMode === '2d'
              ? 'Analytical 2D GIS: 5 Nagpur Zones & ≤3km POIs'
              : 'Interactive 3D: OSM Building Geometry & 360° Tilt/Rotate'}
          </span>
        </div>
      </div>

      {/* 2D GIS Mode */}
      {mapMode === '2d' && (
        <div
          ref={mapContainerRef}
          style={{
            height: '480px',
            width: '100%',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--color-border)',
            zIndex: 1
          }}
        />
      )}

      {/* 3D Real Look Mode (Section 44) */}
      {mapMode === '3d' && (
        <Map3D
          centerLat={lat}
          centerLon={lon}
          properties={properties}
          amenities={amenities}
          locationName={locationName}
          onSwitchTo2D={() => setMapMode('2d')}
        />
      )}
    </div>
  );
}
