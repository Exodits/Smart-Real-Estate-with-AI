import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, Database, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <Compass size={24} color="var(--color-gold)" />
              <span>TerraFind</span>
            </div>
            <p className="footer-desc">
              Nagpur District’s real-estate and location-intelligence platform. Find a home, then verify the place with live, legitimate spatial data.
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
              <span className="badge badge-emerald" style={{ fontSize: '11px' }}>
                <ShieldCheck size={12} /> Zero-Fabrication Policy
              </span>
              <span className="badge badge-gold" style={{ fontSize: '11px' }}>
                <MapPin size={12} /> Nagpur District Only
              </span>
            </div>
          </div>

          <div>
            <div className="footer-title">Platform</div>
            <ul className="footer-links">
              <li><Link to="/properties" className="footer-link">Nagpur Properties</Link></li>
              <li><Link to="/market" className="footer-link">Zone Benchmarks</Link></li>
              <li><Link to="/list-property" className="footer-link">List Your Property</Link></li>
              <li><Link to="/compare" className="footer-link">Locality Comparison</Link></li>
              <li><Link to="/ai-advisor" className="footer-link">AI Investment Advisor</Link></li>
            </ul>
          </div>

          <div>
            <div className="footer-title">Verified Data Sources</div>
            <ul className="footer-links">
              <li><a href="https://www.openstreetmap.org" target="_blank" rel="noreferrer" className="footer-link">OpenStreetMap (Nominatim & Overpass)</a></li>
              <li><a href="https://open-meteo.com" target="_blank" rel="noreferrer" className="footer-link">Open-Meteo Air Quality & Weather</a></li>
              <li><a href="https://ncrb.gov.in" target="_blank" rel="noreferrer" className="footer-link">NCRB & Nagpur Police Statistics</a></li>
              <li><a href="https://maharera.maharashtra.gov.in" target="_blank" rel="noreferrer" className="footer-link">MahaRERA Project Disclosures</a></li>
            </ul>
          </div>

          <div>
            <div className="footer-title">TerraFind Zones</div>
            <ul className="footer-links">
              <li><Link to="/search?district=Nagpur&zone=south" className="footer-link">South Nagpur (Wardha Rd, MIHAN)</Link></li>
              <li><Link to="/search?district=Nagpur&zone=west" className="footer-link">West Nagpur (Dharampeth, Ambazari)</Link></li>
              <li><Link to="/search?district=Nagpur&zone=centre" className="footer-link">Central Nagpur (Civil Lines, Zero Mile)</Link></li>
              <li><Link to="/search?district=Nagpur&zone=east" className="footer-link">East Nagpur (Wardhaman Nagar, CA)</Link></li>
              <li><Link to="/search?district=Nagpur&zone=north" className="footer-link">North Nagpur (Koradi Rd, Mankapur)</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} TerraFind. All data sourced live from authorized providers & public APIs. Not financial or legal advice.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>Built for Nagpur District Real Estate</span>
            <span>API Status: Live</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
