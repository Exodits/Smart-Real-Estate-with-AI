import express from 'express';
import { getEmergingAreas } from '../services/property.js';

const router = express.Router();

/**
 * Section 24: Recommended / Emerging Areas Endpoint
 * Returns data-driven market activity signals for Nagpur District.
 * Never fabricates growth percentages.
 */
router.get('/emerging', async (req, res) => {
  try {
    const district = req.query.district || 'Nagpur';
    const emerging = await getEmergingAreas(district);

    res.json({
      district: 'Nagpur',
      metric: 'Current Market Activity & Listing Density',
      recommendations: emerging,
      count: emerging.length,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch emerging area recommendations', message: err.message });
  }
});

export default router;
