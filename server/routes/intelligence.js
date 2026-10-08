import express from 'express';
import { getAirQuality, getWeather } from '../services/openMeteo.js';
import { getNearbyAmenities } from '../services/overpass.js';
import { getWaterData } from '../services/water.js';
import { getSafetyData } from '../services/safety.js';

const router = express.Router();

router.get('/air', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Valid lat and lon are required' });
    }
    const air = await getAirQuality(lat, lon);
    res.json(air);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch air quality', message: err.message });
  }
});

router.get('/weather', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Valid lat and lon are required' });
    }
    const weather = await getWeather(lat, lon);
    res.json(weather);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch weather', message: err.message });
  }
});

router.get('/water', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const location = req.query.location || '';
    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Valid lat and lon are required' });
    }
    const water = await getWaterData(lat, lon, location);
    res.json(water);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch water data', message: err.message });
  }
});

router.get('/safety/crime', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const { location, city, district } = req.query;
    const safety = await getSafetyData(lat, lon, location, city, district);
    res.json(safety);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch safety data', message: err.message });
  }
});

// Unified Location Intelligence Endpoint (Section 15)
router.get('/location-intelligence', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  const location = req.query.location || '';
  const city = req.query.city || '';
  const district = req.query.district || '';

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'Valid lat and lon are required' });
  }

  // Use Promise.allSettled() so one failed API doesn't fail the whole response
  const [airRes, weatherRes, amenitiesRes, waterRes, safetyRes] = await Promise.allSettled([
    getAirQuality(lat, lon),
    getWeather(lat, lon),
    getNearbyAmenities(lat, lon, 3.0),
    getWaterData(lat, lon, location),
    getSafetyData(lat, lon, location, city, district)
  ]);

  res.json({
    location: {
      lat,
      lon,
      name: location,
      city,
      district,
      state: 'Maharashtra'
    },
    air: airRes.status === 'fulfilled' ? airRes.value : { available: false, status: 'Data unavailable' },
    weather: weatherRes.status === 'fulfilled' ? weatherRes.value : { available: false, status: 'Data unavailable' },
    amenities: amenitiesRes.status === 'fulfilled' ? amenitiesRes.value : { success: false, categories: {}, totalCount: 0 },
    water: waterRes.status === 'fulfilled' ? waterRes.value : { available: false, status: 'Data unavailable' },
    safety: safetyRes.status === 'fulfilled' ? safetyRes.value : { available: false, status: 'Data unavailable' },
    fetchedAt: new Date().toISOString()
  });
});

export default router;
