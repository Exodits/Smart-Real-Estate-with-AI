import { cache } from '../cache.js';

// Multiple public Overpass API mirrors for resilient failover
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

/**
 * Calculates great-circle distance between two points in kilometers (Haversine formula).
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

/**
 * Builds Overpass QL query around a center coordinate.
 */
function buildOverpassQuery(lat, lon, queryRadius = 3500) {
  return `
[out:json][timeout:20];
(
  // Hospitals & Healthcare
  node["amenity"="hospital"](around:${queryRadius},${lat},${lon});
  way["amenity"="hospital"](around:${queryRadius},${lat},${lon});
  node["healthcare"="hospital"](around:${queryRadius},${lat},${lon});
  way["healthcare"="hospital"](around:${queryRadius},${lat},${lon});

  // Schools
  node["amenity"="school"](around:${queryRadius},${lat},${lon});
  way["amenity"="school"](around:${queryRadius},${lat},${lon});

  // Colleges & Universities
  node["amenity"="college"](around:${queryRadius},${lat},${lon});
  way["amenity"="college"](around:${queryRadius},${lat},${lon});
  node["amenity"="university"](around:${queryRadius},${lat},${lon});
  way["amenity"="university"](around:${queryRadius},${lat},${lon});

  // Bus stops & stations
  node["highway"="bus_stop"](around:${queryRadius},${lat},${lon});
  node["amenity"="bus_station"](around:${queryRadius},${lat},${lon});
  way["amenity"="bus_station"](around:${queryRadius},${lat},${lon});

  // Metro stations
  node["railway"="subway_entrance"](around:${queryRadius},${lat},${lon});
  node["railway"="station"]["station"="subway"](around:${queryRadius},${lat},${lon});
  node["station"="subway"](around:${queryRadius},${lat},${lon});

  // Railway stations
  node["railway"="station"]["station"!="subway"](around:${queryRadius},${lat},${lon});
  node["railway"="halt"](around:${queryRadius},${lat},${lon});

  // Shopping & Markets
  node["shop"="supermarket"](around:${queryRadius},${lat},${lon});
  node["shop"="mall"](around:${queryRadius},${lat},${lon});
  way["shop"="mall"](around:${queryRadius},${lat},${lon});
  node["amenity"="marketplace"](around:${queryRadius},${lat},${lon});

  // Parks
  node["leisure"="park"](around:${queryRadius},${lat},${lon});
  way["leisure"="park"](around:${queryRadius},${lat},${lon});
);
out center;
`;
}

/**
 * Resolves item category based on OSM tags.
 */
function getCategory(tags) {
  if (tags.amenity === 'hospital' || tags.healthcare === 'hospital') {
    return 'Hospital';
  }
  if (tags.amenity === 'college' || tags.amenity === 'university') {
    return 'College / University';
  }
  if (tags.amenity === 'school') {
    return 'School';
  }
  if (
    tags.railway === 'subway' ||
    tags.railway === 'subway_entrance' ||
    tags.station === 'subway'
  ) {
    return 'Metro station';
  }
  if (tags.railway === 'station' || tags.railway === 'halt') {
    return 'Railway station';
  }
  if (
    tags.highway === 'bus_stop' ||
    tags.amenity === 'bus_station' ||
    tags.public_transport === 'platform'
  ) {
    return 'Bus stop / Bus stand';
  }
  if (
    tags.shop === 'mall' ||
    tags.shop === 'supermarket' ||
    tags.amenity === 'marketplace'
  ) {
    return 'Shopping / Market';
  }
  if (tags.leisure === 'park') {
    return 'Park';
  }
  return null;
}

/**
 * Fetches nearby amenities with strict 3km filtering and multi-endpoint failover.
 */
export async function getNearbyAmenities(lat, lon, maxRadiusKm = 3.0) {
  const cacheKey = `amenities_${Number(lat).toFixed(3)}_${Number(lon).toFixed(3)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const query = buildOverpassQuery(lat, lon, 3500);

  let rawElements = null;
  let usedEndpoint = null;

  // Attempt each endpoint sequentially until one succeeds
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout per mirror (Section 17)

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': process.env.NOMINATIM_USER_AGENT || 'TerraFind/1.0'
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.elements)) {
          rawElements = json.elements;
          usedEndpoint = endpoint;
          break;
        }
      }
    } catch (err) {
      console.warn(`[Overpass] Failed on ${endpoint}: ${err.message}. Trying next mirror...`);
    }
  }

  if (!rawElements) {
    console.warn('[Overpass] All mirrors exhausted or returned error.');
    return {
      success: false,
      categories: {},
      totalCount: 0,
      radiusKm: maxRadiusKm,
      source: 'OpenStreetMap Overpass API',
      status: 'Source temporarily unavailable'
    };
  }

  const seenNames = new Set();
  const validPOIs = [];

  for (const el of rawElements) {
    const tags = el.tags || {};
    const name = tags.name || tags['name:en'];
    if (!name || name.trim().length < 2) continue;

    const category = getCategory(tags);
    if (!category) continue;

    const elLat = el.lat || el.center?.lat;
    const elLon = el.lon || el.center?.lon;
    if (!elLat || !elLon) continue;

    // Calculate actual geographic distance
    const distanceKm = calculateDistanceKm(lat, lon, elLat, elLon);

    // Filter strictly to <= 3 km
    if (distanceKm > maxRadiusKm) continue;

    // Deduplicate by normalized name and category
    const dedupKey = `${category.toLowerCase()}_${name.toLowerCase().trim()}`;
    if (seenNames.has(dedupKey)) continue;
    seenNames.add(dedupKey);

    validPOIs.push({
      id: `osm-${el.id}`,
      name: name.trim(),
      category,
      lat: elLat,
      lon: elLon,
      distanceKm,
      source: 'OpenStreetMap'
    });
  }

  // Sort by nearest distance first
  validPOIs.sort((a, b) => a.distanceKm - b.distanceKm);

  // Group by category, omitting categories with 0 verified items
  const categories = {};
  for (const poi of validPOIs) {
    if (!categories[poi.category]) {
      categories[poi.category] = [];
    }
    categories[poi.category].push(poi);
  }

  const result = {
    success: true,
    categories,
    totalCount: validPOIs.length,
    radiusKm: maxRadiusKm,
    source: 'OpenStreetMap Overpass API',
    endpoint: usedEndpoint,
    fetchedAt: new Date().toISOString()
  };

  // Cache for 1 hour
  cache.set(cacheKey, result, 3600);
  return result;
}
