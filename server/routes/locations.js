import express from 'express';
import { searchLocations, reverseGeocode } from '../services/nominatim.js';

const router = express.Router();

router.get('/search', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || q.trim().length < 2) {
      return res.json({ locations: [] });
    }
    const locations = await searchLocations(q);
    res.json({ locations, count: locations.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to search locations', message: err.message });
  }
});

router.get('/reverse', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: 'lat and lon are required' });
    }
    const result = await reverseGeocode(lat, lon);
    if (!result) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to reverse geocode', message: err.message });
  }
});

export default router;
