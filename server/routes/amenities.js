import express from 'express';
import { getNearbyAmenities } from '../services/overpass.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const radius = parseFloat(req.query.radius || '3000');
    const radiusKm = radius / 1000;

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Valid lat and lon query parameters are required' });
    }

    const amenities = await getNearbyAmenities(lat, lon, radiusKm);
    res.json(amenities);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch nearby amenities', message: err.message });
  }
});

export default router;
