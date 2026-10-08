import React from 'react';
import { Shield, Wind, Droplets, HeartPulse, BookOpen, Train, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatIndianPrice } from './PropertyCard';

export default function CompareTable({ locA, locB, dataA, dataB }) {
  if (!dataA || !dataB) return null;

  const rows = [
    {
      label: 'Air Quality (AQI)',
      icon: Wind,
      valA: dataA.air?.available ? `${dataA.air.aqi} (${dataA.air.description})` : 'Data unavailable',
      valB: dataB.air?.available ? `${dataB.air.aqi} (${dataB.air.description})` : 'Data unavailable',
      source: 'Open-Meteo'
    },
    {
      label: 'Water Availability',
      icon: Droplets,
      valA: dataA.water?.available && dataA.water.rating ? `${dataA.water.rating} / 5.0 (${dataA.water.label})` : 'Data unavailable',
      valB: dataB.water?.available && dataB.water.rating ? `${dataB.water.rating} / 5.0 (${dataB.water.label})` : 'Data unavailable',
      source: 'Open-Meteo Environmental / Official'
    },
    {
      label: 'Official Safety Benchmark',
      icon: Shield,
      valA: dataA.safety?.available ? dataA.safety.crimeRatePerLakh : 'Data unavailable',
      valB: dataB.safety?.available ? dataB.safety.crimeRatePerLakh : 'Data unavailable',
      source: 'NCRB / Police Reports'
    },
    {
      label: 'Hospitals within 3 km',
      icon: HeartPulse,
      valA: `${(dataA.amenities?.categories?.['Hospital'] || []).length} verified`,
      valB: `${(dataB.amenities?.categories?.['Hospital'] || []).length} verified`,
      source: 'OpenStreetMap Overpass'
    },
    {
      label: 'Schools within 3 km',
      icon: BookOpen,
      valA: `${(dataA.amenities?.categories?.['School'] || []).length} verified`,
      valB: `${(dataB.amenities?.categories?.['School'] || []).length} verified`,
      source: 'OpenStreetMap Overpass'
    },
    {
      label: 'Metro Stations within 3 km',
      icon: Train,
      valA: `${(dataA.amenities?.categories?.['Metro station'] || []).length} verified`,
      valB: `${(dataB.amenities?.categories?.['Metro station'] || []).length} verified`,
      source: 'OpenStreetMap Overpass'
    },
    {
      label: 'Property Availability',
      icon: CheckCircle2,
      valA: dataA.market?.availability || (dataA.properties?.length > 0 ? 'Available' : 'No active listings'),
      valB: dataB.market?.availability || (dataB.properties?.length > 0 ? 'Available' : 'No active listings'),
      source: 'Valuation Registry'
    },
    {
      label: 'Avg Rate / sq.ft.',
      icon: null,
      valA: dataA.market?.averagePricePerSqft ? `₹${dataA.market.averagePricePerSqft.toLocaleString('en-IN')}` : 'Data unavailable',
      valB: dataB.market?.averagePricePerSqft ? `₹${dataB.market.averagePricePerSqft.toLocaleString('en-IN')}` : 'Data unavailable',
      source: 'Valuation Registry'
    },
    {
      label: 'AI Investment Outlook',
      icon: null,
      valA: dataA.ai?.outlook || 'Insufficient evidence',
      valB: dataB.ai?.outlook || 'Insufficient evidence',
      source: 'Evidence Engine'
    }
  ];

  return (
    <div className="data-table-wrap" style={{ marginTop: '24px' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '30%' }}>Metric</th>
            <th style={{ width: '35%', color: 'var(--color-navy)', fontSize: '14px' }}>
              📍 {locA.locality || locA.name} ({locA.city})
            </th>
            <th style={{ width: '35%', color: 'var(--color-navy)', fontSize: '14px' }}>
              📍 {locB.locality || locB.name} ({locB.city})
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <tr key={row.label}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                    {Icon && <Icon size={16} color="var(--color-navy)" />}
                    <span>{row.label}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-slate-light)', marginLeft: Icon ? '24px' : '0' }}>
                    Source: {row.source}
                  </div>
                </td>
                <td style={{ fontWeight: 600 }}>{row.valA}</td>
                <td style={{ fontWeight: 600 }}>{row.valB}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
