import { cache } from '../cache.js';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const DEFAULT_USER_AGENT = 'TerraFind/1.0 (contact@terrafind.in)';

/**
 * Searches for places specifically within Nagpur District using OpenStreetMap Nominatim.
 * Biased strictly to Nagpur District coordinates (lat: 20.50–21.75, lon: 78.50–79.80).
 * Includes 4-second AbortController timeout (Section 17 & 18).
 */
export async function searchLocations(query) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const normalizedQuery = query.trim().toLowerCase();
  const cacheKey = `geo_search_nagpur_${normalizedQuery}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const userAgent = process.env.NOMINATIM_USER_AGENT || DEFAULT_USER_AGENT;

  // Append Nagpur to query if not already present
  const searchQuery = normalizedQuery.includes('nagpur')
    ? query
    : `${query}, Nagpur, Maharashtra`;

  const url = new URL(`${NOMINATIM_BASE}/search`);
  url.searchParams.set('q', searchQuery);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '8');
  url.searchParams.set('countrycodes', 'in');
  // Bias search to Nagpur District bounding box: [minLon, maxLat, maxLon, minLat]
  url.searchParams.set('viewbox', '78.50,21.75,79.80,20.50');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second timeout

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': userAgent,
        'Accept-Language': 'en'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[Nominatim] Search failed: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();

    const filtered = data.map((item) => {
      const addr = item.address || {};
      const locality =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.village ||
        addr.town ||
        addr.city_district ||
        item.name;

      const city = addr.city || addr.town || addr.municipality || 'Nagpur';
      const district = addr.state_district || addr.county || city;
      const state = addr.state || 'Maharashtra';

      const isNagpur =
        district.toLowerCase().includes('nagpur') ||
        city.toLowerCase().includes('nagpur') ||
        (item.display_name || '').toLowerCase().includes('nagpur');

      return {
        id: `osm-${item.place_id}`,
        displayName: item.display_name,
        name: item.name || locality,
        locality: locality || item.name,
        city,
        district,
        state,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type,
        postcode: addr.postcode || null,
        isNagpur,
        outsideNagpur: !isNagpur,
        source: 'OpenStreetMap Nominatim'
      };
    });

    // Cache for 2 hours
    cache.set(cacheKey, filtered, 7200);
    return filtered;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.warn('[Nominatim] Request timed out after 4000ms');
    } else {
      console.error('[Nominatim] Error during search:', error.message);
    }
    return [];
  }
}

/**
 * Reverse geocodes coordinates to check Nagpur District administrative status.
 */
export async function reverseGeocode(lat, lon) {
  const cacheKey = `geo_rev_${Number(lat).toFixed(4)}_${Number(lon).toFixed(4)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const userAgent = process.env.NOMINATIM_USER_AGENT || DEFAULT_USER_AGENT;
  const url = new URL(`${NOMINATIM_BASE}/reverse`);
  url.searchParams.set('lat', lat);
  url.searchParams.set('lon', lon);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': userAgent,
        'Accept-Language': 'en'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const data = await response.json();
    const addr = data.address || {};

    const city = addr.city || addr.town || addr.municipality || 'Nagpur';
    const district = addr.state_district || addr.county || city;
    const isNagpur =
      district.toLowerCase().includes('nagpur') ||
      city.toLowerCase().includes('nagpur') ||
      (data.display_name || '').toLowerCase().includes('nagpur');

    const result = {
      isNagpur,
      outsideNagpur: !isNagpur,
      displayName: data.display_name,
      locality: addr.suburb || addr.neighbourhood || addr.residential || data.name,
      city,
      district,
      state: addr.state || 'Maharashtra',
      lat: parseFloat(data.lat),
      lon: parseFloat(data.lon),
      source: 'OpenStreetMap Nominatim'
    };

    cache.set(cacheKey, result, 7200);
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    return null;
  }
}
