import express from 'express';
import {
  queryProperties,
  getPropertyById,
  getZoneMetrics,
  addDirectSubmission
} from '../services/property.js';
import { db } from '../db/database.js';

const router = express.Router();

// 1. Zone Metrics overview (Section 14 & 21)
router.get('/zones', async (req, res) => {
  try {
    const district = req.query.district || 'Nagpur';
    const metrics = await getZoneMetrics(district);
    res.json({
      district: 'Nagpur',
      zones: metrics
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch zone metrics', message: err.message });
  }
});

// 2. Main paginated property search (Nagpur District only, DB-first high performance)
router.get('/', async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      q,
      city,
      locality,
      pincode,
      zone,
      minPrice,
      maxPrice,
      bhk,
      propertyType,
      transactionType,
      status,
      includeDemo,
      page,
      pageSize
    } = req.query;

    // Check if query is explicitly directed outside Nagpur District (Section 1)
    const outsideCheck = `${city || ''} ${q || ''}`.toLowerCase();
    const outsideCities = [
      'pune', 'mumbai', 'thane', 'navi mumbai', 'nashik', 'delhi',
      'bangalore', 'bengaluru', 'hyderabad', 'kolkata', 'chennai', 'ahmedabad'
    ];
    const isOutside = outsideCities.some((c) => {
      return outsideCheck.includes(c) && !outsideCheck.includes('nagpur');
    });

    if (isOutside) {
      return res.json({
        outsideNagpur: true,
        message: 'TerraFind currently covers Nagpur District only.',
        properties: [],
        count: 0,
        total: 0,
        page: 1,
        pageSize: 24,
        hasMore: false,
        durationMs: Date.now() - startTime
      });
    }

    const result = await queryProperties({
      q,
      locality,
      pincode,
      zone,
      minPrice,
      maxPrice,
      bhk,
      propertyType,
      transactionType,
      status: status || 'active',
      includeDemo,
      page,
      pageSize
    });

    res.json({
      district: 'Nagpur',
      properties: result.items,
      count: result.items.length,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      hasMore: result.hasMore,
      durationMs: Date.now() - startTime,
      source: 'TerraFind Nagpur Real Estate Repository (Zero-Fabrication Data Engine)',
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to query properties', message: err.message });
  }
});

// 3. RERA Projects Separate Endpoints (Section 7)
router.get('/rera/projects', (req, res) => {
  try {
    const { locality, zone } = req.query;
    const projects = db.getReraProjects({ locality, zone });
    res.json({
      district: 'Nagpur',
      totalProjects: projects.length,
      projects,
      source: 'MahaRERA Project Registry (Section 7 Separate Dataset)',
      statutoryNotice: 'RERA registered projects are development filings, not active transaction listings.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch RERA projects', message: err.message });
  }
});

router.get('/rera/projects/:id', (req, res) => {
  try {
    const project = db.getReraProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'RERA project not found' });
    }
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch RERA project', message: err.message });
  }
});

// 4. Data Integrity Audit & Pipeline Status (Section 36 & Section 37)
router.get('/audit/integrity', (req, res) => {
  try {
    const counts = db.getDataIntegrityCounts();
    res.json({
      platform: 'TerraFind — Nagpur District Real Estate',
      policy: 'Zero-Fabrication Mandate Active',
      counts,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate integrity audit', message: err.message });
  }
});

// 5. Preserved Rejected Pipeline Records (Section 9)
router.get('/audit/rejected', (req, res) => {
  try {
    const rejected = db.getRejectedRecords();
    res.json({
      count: rejected.length,
      rejectedRecords: rejected,
      policy: 'Preserved 24 rejected records from 60-observation raw snapshot'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rejected records', message: err.message });
  }
});

// 6. Direct Listing Submission (Section 3.7 & 43.7)
router.post('/direct-submission', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.locality || !payload.price) {
      return res.status(400).json({ error: 'Locality and Price are required.' });
    }

    const created = await addDirectSubmission(payload);
    res.status(201).json({
      success: true,
      message: 'Property listing submitted successfully to Nagpur District inventory.',
      property: created
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit property', message: err.message });
  }
});

// 7. Single Property by ID
router.get('/:id', async (req, res) => {
  try {
    const property = await getPropertyById(req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json({ property });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch property details', message: err.message });
  }
});

export default router;
