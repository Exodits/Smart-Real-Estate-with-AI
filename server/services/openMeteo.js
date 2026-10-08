import { cache } from '../cache.js';

const AIR_BASE = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const WEATHER_BASE = 'https://api.open-meteo.com/v1/forecast';

/**
 * Maps standard European / US AQI to qualitative category.
 */
function getAqiDescription(aqi) {
  if (aqi === null || aqi === undefined) return 'Data unavailable';
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

/**
 * Fetches real-time Air Quality index and pollutant values from Open-Meteo.
 */
export async function getAirQuality(lat, lon) {
  const cacheKey = `air_${Number(lat).toFixed(2)}_${Number(lon).toFixed(2)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const url = new URL(AIR_BASE);
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('current', 'us_aqi,european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) {
      return {
        available: false,
        status: 'Data unavailable',
        source: 'Open-Meteo Air Quality API',
        error: `HTTP ${res.status}`
      };
    }

    const data = await res.json();
    const cur = data.current || {};

    const aqi = cur.us_aqi ?? cur.european_aqi ?? null;
    const result = {
      available: aqi !== null,
      aqi,
      usAqi: cur.us_aqi ?? null,
      europeanAqi: cur.european_aqi ?? null,
      pm25: cur.pm2_5 !== undefined ? `${cur.pm2_5} µg/m³` : null,
      pm10: cur.pm10 !== undefined ? `${cur.pm10} µg/m³` : null,
      co: cur.carbon_monoxide !== undefined ? `${cur.carbon_monoxide} µg/m³` : null,
      no2: cur.nitrogen_dioxide !== undefined ? `${cur.nitrogen_dioxide} µg/m³` : null,
      so2: cur.sulphur_dioxide !== undefined ? `${cur.sulphur_dioxide} µg/m³` : null,
      ozone: cur.ozone !== undefined ? `${cur.ozone} µg/m³` : null,
      description: getAqiDescription(aqi),
      timestamp: cur.time || new Date().toISOString(),
      source: 'Open-Meteo Air Quality API',
      sourceUrl: 'https://open-meteo.com/en/docs/air-quality-api'
    };

    cache.set(cacheKey, result, 1800); // 30 minutes TTL
    return result;
  } catch (error) {
    console.error('[OpenMeteo] Air quality fetch error:', error.message);
    return {
      available: false,
      status: 'Data unavailable',
      source: 'Open-Meteo Air Quality API',
      error: error.message
    };
  }
}

/**
 * Fetches real-time weather and temperature for coordinates.
 */
export async function getWeather(lat, lon) {
  const cacheKey = `weather_${Number(lat).toFixed(2)}_${Number(lon).toFixed(2)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const url = new URL(WEATHER_BASE);
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) {
      return {
        available: false,
        status: 'Data unavailable',
        source: 'Open-Meteo Weather API'
      };
    }

    const data = await res.json();
    const cur = data.current || {};

    const result = {
      available: cur.temperature_2m !== undefined,
      temperature: cur.temperature_2m,
      apparentTemperature: cur.apparent_temperature,
      humidity: cur.relative_humidity_2m,
      precipitation: cur.precipitation,
      windSpeed: cur.wind_speed_10m,
      weatherCode: cur.weather_code,
      timestamp: cur.time || new Date().toISOString(),
      source: 'Open-Meteo Weather API'
    };

    cache.set(cacheKey, result, 1800);
    return result;
  } catch (err) {
    return {
      available: false,
      status: 'Data unavailable',
      source: 'Open-Meteo Weather API',
      error: err.message
    };
  }
}
