import React from 'react';
import { Link } from 'react-router-dom';
import { formatIndianPrice } from './PropertyCard';
import { CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';

export default function MarketTable({ summaries = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-slate)' }}>Aggregating locality market indicators...</p>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="card" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--color-slate)' }}>
        <AlertCircle size={36} style={{ margin: '0 auto 12px', color: 'var(--color-slate-light)' }} />
        <h4 style={{ color: 'var(--color-navy)', fontSize: '16px' }}>No Locality Market Data Found</h4>
        <p style={{ fontSize: '13px', marginTop: '6px' }}>
          No properties returned for this query to calculate locality averages.
        </p>
      </div>
    );
  }

  return (
    <div className="data-table-wrap">
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Locality</th>
              <th>City</th>
              <th>Active Listings</th>
              <th>Avg Price</th>
              <th>Price Range</th>
              <th>Avg Price / sq.ft.</th>
              <th>Availability</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((row) => (
              <tr key={row.locality}>
                <td>
                  <strong style={{ color: 'var(--color-navy)' }}>{row.locality}</strong>
                </td>
                <td>{row.city}</td>
                <td>
                  <span className="badge badge-navy">
                    {row.activeListingsCount} listings
                  </span>
                </td>
                <td>
                  <strong style={{ color: 'var(--color-navy)' }}>
                    {formatIndianPrice(row.averagePrice)}
                  </strong>
                </td>
                <td style={{ fontSize: '13px', color: 'var(--color-slate)' }}>
                  {row.minPrice && row.maxPrice
                    ? `${formatIndianPrice(row.minPrice)} – ${formatIndianPrice(row.maxPrice)}`
                    : 'Price unavailable'}
                </td>
                <td>
                  {row.averagePricePerSqft ? (
                    <strong>₹{row.averagePricePerSqft.toLocaleString('en-IN')}/sq.ft.</strong>
                  ) : (
                    <span style={{ color: 'var(--color-slate-light)' }}>Unavailable</span>
                  )}
                </td>
                <td>
                  {row.availability === 'Available' ? (
                    <span className="badge badge-emerald">
                      <CheckCircle2 size={12} /> Available
                    </span>
                  ) : (
                    <span className="badge badge-rose">
                      ● {row.availability}
                    </span>
                  )}
                </td>
                <td>
                  <Link
                    to={`/properties?city=${encodeURIComponent(row.city)}&locality=${encodeURIComponent(row.locality)}`}
                    className="btn btn-outline"
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                  >
                    View Listings <ArrowUpRight size={12} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding: '12px 20px', background: '#f8fafc', fontSize: '11px', color: 'var(--color-slate)', borderTop: '1px solid var(--color-border)' }}>
        Source: Maharashtra Real Estate Valuation Registry / RERA Benchmarks • Aggregated across valid numeric listings.
      </div>
    </div>
  );
}
