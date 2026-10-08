import express from 'express';
import { getAllProperties, summarizeProperties, getZoneMetrics } from '../services/property.js';

const router = express.Router();

router.get('/zones', async (req, res) => {
  try {
    const district = req.query.district || 'Nagpur';
    const zones = await getZoneMetrics(district);
    res.json({
      district: 'Nagpur',
      zones
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch zones', message: err.message });
  }
});

router.get('/localities', async (req, res) => {
  try {
    const { zone } = req.query;
    const properties = await getAllProperties();

    let filtered = properties.filter((p) => (p.district || '').toLowerCase() === 'nagpur');
    if (zone && zone.toLowerCase() !== 'all') {
      filtered = filtered.filter((p) => (p.zone || '').toLowerCase() === zone.toLowerCase());
    }

    const localities = [...new Set(filtered.map((p) => p.locality).filter(Boolean))].sort();
    res.json({
      district: 'Nagpur',
      zone: zone || 'All',
      localities
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch localities', message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { zone, locality, minPrice, maxPrice, bhk, propertyType } = req.query;
    let properties = await getAllProperties();

    // Filter strictly to Nagpur District
    properties = properties.filter((p) => (p.district || '').toLowerCase() === 'nagpur');

    if (zone && zone.toLowerCase() !== 'all') {
      properties = properties.filter((p) => (p.zone || '').toLowerCase() === zone.toLowerCase());
    }
    if (locality) {
      properties = properties.filter((p) => (p.locality || '').toLowerCase().includes(locality.toLowerCase()));
    }
    if (minPrice) {
      properties = properties.filter((p) => p.price >= Number(minPrice));
    }
    if (maxPrice) {
      properties = properties.filter((p) => p.price <= Number(maxPrice));
    }
    if (bhk) {
      properties = properties.filter((p) => p.bhk === Number(bhk));
    }
    if (propertyType) {
      properties = properties.filter((p) => (p.property_type || '').toLowerCase() === propertyType.toLowerCase());
    }

    const summaries = summarizeProperties(properties);

    res.json({
      district: 'Nagpur',
      zone: zone || 'All Nagpur',
      summaries,
      count: summaries.length,
      source: 'TerraFind Nagpur Real Estate Registry',
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate market summaries', message: err.message });
  }
});

export default router;
