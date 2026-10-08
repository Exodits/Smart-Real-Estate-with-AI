/**
 * TerraFind Frontend API Client
 * Connects to the Express backend proxy /api
 */

const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('terrafind_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('terrafind_token', token);
  } else {
    localStorage.removeItem('terrafind_token');
  }
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const err = new Error(errorBody.error || errorBody.message || `Request failed with status ${res.status}`);
    err.status = res.status;
    err.data = errorBody;
    throw err;
  }

  return res.json();
}

export const api = {
  // Locations (Nagpur Biased)
  searchLocations: (q) => request(`/locations/search?q=${encodeURIComponent(q)}`),
  reverseGeocode: (lat, lon) => request(`/locations/reverse?lat=${lat}&lon=${lon}`),

  // Properties (Nagpur District Only)
  getProperties: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return request(`/properties?${query.toString()}`);
  },
  getPropertyById: (id) => request(`/properties/${id}`),
  getZoneMetrics: () => request('/properties/zones'),
  getDatabaseStats: () => request('/properties/stats'),
  submitDirectListing: (payload) =>
    request('/properties/direct-submission', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Market & Zones
  getZones: () => request('/market/zones'),
  getLocalities: (zone = '') => request(`/market/localities${zone ? `?zone=${encodeURIComponent(zone)}` : ''}`),
  getMarketSummaries: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return request(`/market?${query.toString()}`);
  },

  // Recommendations & Emerging Areas (Data-Driven, Section 24)
  getEmergingAreas: () => request('/recommendations/emerging?district=Nagpur'),

  // Location Intelligence (Independent & Non-Blocking)
  getLocationIntelligence: (lat, lon, location = '', city = 'Nagpur', district = 'Nagpur') => {
    const query = new URLSearchParams({
      lat,
      lon,
      location,
      city,
      district
    });
    return request(`/location-intelligence?${query.toString()}`);
  },
  getAirQuality: (lat, lon) => request(`/air?lat=${lat}&lon=${lon}`),
  getWeather: (lat, lon) => request(`/weather?lat=${lat}&lon=${lon}`),
  getWater: (lat, lon, location = '') => request(`/water?lat=${lat}&lon=${lon}&location=${encodeURIComponent(location)}`),
  getSafety: (lat, lon, location = '', city = 'Nagpur', district = 'Nagpur') =>
    request(`/safety/crime?lat=${lat}&lon=${lon}&location=${encodeURIComponent(location)}&city=${encodeURIComponent(city)}&district=${encodeURIComponent(district)}`),
  getAmenities: (lat, lon, radius = 3000) => request(`/amenities?lat=${lat}&lon=${lon}&radius=${radius}`),

  // AI Investment Advisor & Grounded RAG Query
  analyzeInvestment: (evidence) =>
    request('/ai/investment', {
      method: 'POST',
      body: JSON.stringify(evidence)
    }),
  queryAiRAG: (query) =>
    request('/ai/query', {
      method: 'POST',
      body: JSON.stringify({ query })
    }),

  // MahaRERA Separate Dataset (Section 7)
  getReraProjects: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return request(`/properties/rera/projects?${query.toString()}`);
  },
  getReraProjectById: (id) => request(`/properties/rera/projects/${id}`),

  // Data Integrity Audit & Pipeline Status (Section 36)
  getDataIntegrityAudit: () => request('/properties/audit/integrity'),
  getRejectedRecords: () => request('/properties/audit/rejected'),

  // Auth & Profile
  signup: (payload) => request('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getProfile: () => request('/auth/profile'),
  updateProfile: (payload) => request('/auth/profile', { method: 'PATCH', body: JSON.stringify(payload) }),

  // Favorites
  getFavorites: () => request('/auth/favorites'),
  addFavorite: (property) => request('/auth/favorites', { method: 'POST', body: JSON.stringify({ property }) }),
  removeFavorite: (propertyId) => request(`/auth/favorites/${propertyId}`, { method: 'DELETE' })
};

