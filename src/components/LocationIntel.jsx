import React from 'react';
import { Wind, Droplets, Shield, CloudSun, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export default function LocationIntel({ intel, locationName = 'Location' }) {
  if (!intel) {
    return (
      <div className="card" style={{ padding: '30px', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-slate)' }}>Location intelligence data is loading...</p>
      </div>
    );
  }

  const { air, water, safety, weather } = intel;

  // AQI color badge
  function getAqiBadgeColor(aqi) {
    if (!aqi) return 'badge-navy';
    if (aqi <= 50) return 'badge-emerald';
    if (aqi <= 100) return 'badge-gold';
    return 'badge-rose';
  }

  return (
    <div>
      <div className="intel-grid">
        {/* 1. AQI / Air Quality */}
        <div className="intel-card">
          <div className="intel-header">
            <div className="intel-title">
              <Wind size={16} color="var(--color-navy)" />
              <span>Air Quality (AQI)</span>
            </div>
            {air?.available && (
              <span className={`badge ${getAqiBadgeColor(air.aqi)}`}>
                {air.description}
              </span>
            )}
          </div>

          <div className="intel-value">
            {air?.available ? air.aqi : <span style={{ fontSize: '18px', color: 'var(--color-slate)' }}>Data unavailable</span>}
          </div>

          <div className="intel-desc">
            {air?.available ? (
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', marginTop: '4px' }}>
                {air.pm25 && <span>PM2.5: {air.pm25}</span>}
                {air.pm10 && <span>PM10: {air.pm10}</span>}
              </div>
            ) : (
              <span>Live air quality sensor not responding for coordinates.</span>
            )}
          </div>

          <div className="intel-source">
            <div>Source: {air?.source || 'Open-Meteo Air Quality'}</div>
            {air?.timestamp && (
              <div style={{ color: 'var(--color-slate-light)', fontSize: '10px' }}>
                Updated: {new Date(air.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* 2. Water Availability & Hydrology */}
        <div className="intel-card">
          <div className="intel-header">
            <div className="intel-title">
              <Droplets size={16} color="var(--color-navy)" />
              <span>Water Index</span>
            </div>
            {water?.available && (
              <span className="badge badge-emerald">
                {water.label || 'Good'}
              </span>
            )}
          </div>

          <div className="intel-value">
            {water?.available && water.rating ? (
              `${water.rating} / ${water.scale || '5'}`
            ) : (
              <span style={{ fontSize: '18px', color: 'var(--color-slate)' }}>Data unavailable</span>
            )}
          </div>

          <div className="intel-desc">
            {water?.available ? (
              <div>
                <span style={{ fontWeight: 600 }}>{water.metricType}</span>
                {water.avgSoilMoisture && (
                  <div style={{ fontSize: '12px', color: 'var(--color-slate)', marginTop: '2px' }}>
                    Soil Moisture: {water.avgSoilMoisture}
                  </div>
                )}
              </div>
            ) : (
              <span>Official water dataset unavailable for this micro-coordinate.</span>
            )}
          </div>

          <div className="intel-source">
            <div>Source: {water?.source || 'Open-Meteo Environmental'}</div>
            {water?.coverageNote && (
              <div style={{ fontSize: '10px', color: 'var(--color-slate-light)', marginTop: '2px' }}>
                {water.coverageNote}
              </div>
            )}
          </div>
        </div>

        {/* 3. Official Government Safety */}
        <div className="intel-card">
          <div className="intel-header">
            <div className="intel-title">
              <Shield size={16} color="var(--color-navy)" />
              <span>Official Safety</span>
            </div>
            {safety?.available && (
              <span className="badge badge-gold">
                Govt Verified
              </span>
            )}
          </div>

          <div className="intel-value">
            {safety?.available ? (
              safety.crimeRatePerLakh
            ) : (
              <span style={{ fontSize: '18px', color: 'var(--color-slate)' }}>Data unavailable</span>
            )}
          </div>

          <div className="intel-desc">
            {safety?.available ? (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-navy)', fontWeight: 600 }}>
                  {safety.coverageNote}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-slate)', marginTop: '2px' }}>
                  Reporting Year: {safety.year || '2022'} • Level: {safety.geographicLevel}
                </div>
              </div>
            ) : (
              <span>Official crime statistics published at city/district level only.</span>
            )}
          </div>

          <div className="intel-source">
            <div>Source: {safety?.source || 'National Crime Records Bureau (NCRB)'}</div>
          </div>
        </div>

        {/* 4. Real-time Weather & Atmospheric Context */}
        <div className="intel-card">
          <div className="intel-header">
            <div className="intel-title">
              <CloudSun size={16} color="var(--color-navy)" />
              <span>Current Weather</span>
            </div>
            {weather?.available && (
              <span className="badge badge-navy">
                {weather.humidity ? `${weather.humidity}% Humidity` : 'Live'}
              </span>
            )}
          </div>

          <div className="intel-value">
            {weather?.available && weather.temperature !== undefined ? (
              `${weather.temperature}°C`
            ) : (
              <span style={{ fontSize: '18px', color: 'var(--color-slate)' }}>Data unavailable</span>
            )}
          </div>

          <div className="intel-desc">
            {weather?.available ? (
              <div style={{ fontSize: '12px', color: 'var(--color-slate)' }}>
                Feels like {weather.apparentTemperature ?? weather.temperature}°C • Wind: {weather.windSpeed || 0} km/h
              </div>
            ) : (
              <span>Atmospheric sensor data temporarily unavailable.</span>
            )}
          </div>

          <div className="intel-source">
            <div>Source: {weather?.source || 'Open-Meteo Weather'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
