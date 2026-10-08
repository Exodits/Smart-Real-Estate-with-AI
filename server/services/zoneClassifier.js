import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load central Nagpur zones configuration
let nagpurConfig = null;
try {
  const configPath = path.resolve(__dirname, '../config/nagpurZones.json');
  const raw = fs.readFileSync(configPath, 'utf-8');
  nagpurConfig = JSON.parse(raw);
} catch (e) {
  console.warn('[ZoneClassifier] Failed to load nagpurZones.json, using fallback configuration');
}

export const VALID_ZONES = ['east', 'north', 'west', 'south', 'centre'];

export const ZONE_LABELS = {
  east: 'East Nagpur',
  north: 'North Nagpur',
  west: 'West Nagpur',
  south: 'South Nagpur',
  centre: 'Central Nagpur'
};

/**
 * Checks whether coordinate point (lat, lon) is within a bounding box.
 */
function isPointInBounds(lat, lon, bounds) {
  if (!bounds || lat === null || lon === null || isNaN(lat) || isNaN(lon)) return false;
  return (
    lat >= bounds.minLat &&
    lat <= bounds.maxLat &&
    lon >= bounds.minLon &&
    lon <= bounds.maxLon
  );
}

/**
 * Classifies a property or locality into one of the 5 TerraFind analytical zones.
 * Priority order:
 * 1. Geographic coordinates within zone bounding polygon
 * 2. Reviewed locality name exact or substring match
 * 3. PIN code match
 * If uncertain, returns null (never guesses).
 *
 * @param {Object} input
 * @param {number} [input.latitude]
 * @param {number} [input.longitude]
 * @param {string} [input.locality]
 * @param {string} [input.address]
 * @param {string} [input.pincode]
 * @returns {{ zone: string|null, method: string, confidence: string }}
 */
export function classifyNagpurZone({ latitude, longitude, locality = '', address = '', pincode = '' }) {
  if (!nagpurConfig || !Array.isArray(nagpurConfig.zones)) {
    return { zone: null, method: 'unconfigured', confidence: 'none' };
  }

  const lat = latitude ? parseFloat(latitude) : null;
  const lon = longitude ? parseFloat(longitude) : null;

  // 1. Primary: Geometric coordinate bounding polygon check
  if (lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon)) {
    // Check if within overall Nagpur district bounding box
    const distBox = nagpurConfig.districtBoundingBox;
    if (distBox && !isPointInBounds(lat, lon, distBox)) {
      return {
        zone: null,
        method: 'out_of_district_coordinates',
        confidence: 'high',
        isOutsideNagpur: true
      };
    }

    // Check Centre first (most compact core zone)
    const centreZone = nagpurConfig.zones.find((z) => z.id === 'centre');
    if (centreZone && isPointInBounds(lat, lon, centreZone.bounds)) {
      return { zone: 'centre', method: 'coordinate_polygon', confidence: 'high' };
    }

    // Check remaining zones
    for (const z of nagpurConfig.zones) {
      if (z.id === 'centre') continue;
      if (isPointInBounds(lat, lon, z.bounds)) {
        return { zone: z.id, method: 'coordinate_polygon', confidence: 'high' };
      }
    }
  }

  // 2. Secondary: Reviewed Locality-to-Zone mapping
  const normLocality = locality.toLowerCase().trim();
  const normAddress = address.toLowerCase().trim();
  const searchCorpus = `${normLocality} ${normAddress}`;

  if (normLocality || normAddress) {
    for (const z of nagpurConfig.zones) {
      for (const loc of z.localities) {
        if (normLocality === loc || searchCorpus.includes(loc)) {
          return { zone: z.id, method: 'locality_reviewed_mapping', confidence: 'medium' };
        }
      }
    }
  }

  // 3. Tertiary: Pincode mapping
  const cleanPin = String(pincode || '').trim().replace(/\D/g, '');
  if (cleanPin && cleanPin.length === 6 && cleanPin.startsWith('44')) {
    for (const z of nagpurConfig.zones) {
      if (z.pincodes && z.pincodes.includes(cleanPin)) {
        return { zone: z.id, method: 'pincode_mapping', confidence: 'medium' };
      }
    }
  }

  // If uncertain: return null and flag for review (Section 2 rule)
  return {
    zone: null,
    method: 'uncertain',
    confidence: 'none',
    requiresReview: true
  };
}

/**
 * Returns complete zone metadata including description, landmarks, etc.
 */
export function getZoneMetadata(zoneId) {
  if (!nagpurConfig) return null;
  return nagpurConfig.zones.find((z) => z.id === zoneId) || null;
}

/**
 * Returns all 5 zones.
 */
export function getAllZones() {
  if (!nagpurConfig) return [];
  return nagpurConfig.zones.map((z) => ({
    id: z.id,
    label: z.label,
    shortLabel: z.shortLabel,
    description: z.description,
    keyLandmarks: z.keyLandmarks,
    bounds: z.bounds
  }));
}
