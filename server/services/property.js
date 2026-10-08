import { db } from '../db/database.js';
import { cache } from '../cache.js';

/**
 * TerraFind Property Service — Nagpur District Platform
 * Queries high-performance indexed database (sub-millisecond)
 * Strictly enforces Nagpur District scope and 5 TerraFind zones.
 */

export async function getAllProperties() {
  return db.properties;
}

export async function queryProperties(filters = {}) {
  // Always enforce Nagpur District for normal property searches
  const queryFilters = {
    ...filters,
    district: 'Nagpur'
  };

  const cacheKey = `props_query_${JSON.stringify(queryFilters)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const result = db.queryProperties(queryFilters);
  cache.set(cacheKey, result, 300); // 5 min TTL
  return result;
}

export async function getPropertyById(id) {
  return db.getPropertyById(id);
}

export async function getZoneMetrics(district = 'Nagpur') {
  const cacheKey = `zone_metrics_${district.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const metrics = db.getZoneMetrics(district);
  cache.set(cacheKey, metrics, 600); // 10 min TTL
  return metrics;
}

export async function getEmergingAreas(district = 'Nagpur') {
  const cacheKey = `emerging_areas_${district.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const emerging = db.getEmergingAreas(district);
  cache.set(cacheKey, emerging, 600);
  return emerging;
}

export async function addDirectSubmission(payload) {
  return db.addDirectSubmission(payload);
}

/**
 * Aggregates properties into locality market statistics for Nagpur District.
 * Adheres strictly to Section 15:
 * active listing count > 0 -> 'Available'
 * active listing count = 0 -> 'No active listings'
 */
export function summarizeProperties(properties) {
  if (!properties || properties.length === 0) return [];

  const localityMap = new Map();

  for (const prop of properties) {
    if (prop.is_demo || prop.source_type === 'demo') continue;
    const locality = prop.locality || 'Nagpur';
    if (!localityMap.has(locality)) {
      localityMap.set(locality, []);
    }
    localityMap.get(locality).push(prop);
  }

  const summaries = [];

  for (const [locality, items] of localityMap.entries()) {
    const activeListings = items.filter((p) => p.status === 'active');
    const count = activeListings.length;

    const validPrices = activeListings
      .map((p) => p.price)
      .filter((price) => typeof price === 'number' && !isNaN(price) && price > 0);

    const validSqftPrices = activeListings
      .map((p) => p.price_per_sqft)
      .filter((sqft) => typeof sqft === 'number' && !isNaN(sqft) && sqft > 0);

    let averagePrice = null;
    let minPrice = null;
    let maxPrice = null;
    let averagePricePerSqft = null;

    if (validPrices.length > 0) {
      minPrice = Math.min(...validPrices);
      maxPrice = Math.max(...validPrices);
      averagePrice = Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length);
    }

    if (validSqftPrices.length > 0) {
      averagePricePerSqft = Math.round(validSqftPrices.reduce((a, b) => a + b, 0) / validSqftPrices.length);
    }

    let availability = 'No active listings';
    if (count > 0) {
      availability = 'Available';
    }

    summaries.push({
      locality,
      city: 'Nagpur',
      district: 'Nagpur',
      zone: items[0].zone || null,
      activeListingsCount: count,
      averagePrice,
      minPrice,
      maxPrice,
      averagePricePerSqft,
      availability,
      source: items[0].source || 'Nagpur Real Estate Registry',
      updatedAt: items[0].updated_at || new Date().toISOString()
    });
  }

  summaries.sort((a, b) => b.activeListingsCount - a.activeListingsCount);
  return summaries;
}
