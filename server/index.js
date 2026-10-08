import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import route handlers
import locationsRouter from './routes/locations.js';
import propertiesRouter from './routes/properties.js';
import marketRouter from './routes/market.js';
import amenitiesRouter from './routes/amenities.js';
import intelligenceRouter from './routes/intelligence.js';
import aiRouter from './routes/ai.js';
import authRouter from './routes/auth.js';
import recommendationsRouter from './routes/recommendations.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8787;

// Security & Parsing Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Performance & Request timing logging middleware (Section 33)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production' && req.path !== '/api/health') {
      const tag = req.path.startsWith('/api/properties') ? '[PERF-PROPERTIES]'
        : req.path.startsWith('/api/location-intelligence') ? '[PERF-INTEL]'
        : req.path.startsWith('/api/amenities') ? '[PERF-OVERPASS]'
        : req.path.startsWith('/api/market') ? '[PERF-MARKET]'
        : '[API]';
      console.log(`${tag} ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'TerraFind — Nagpur District Real Estate & Location Intelligence',
    version: '2.0.0',
    district: 'Nagpur',
    zones: ['east', 'north', 'west', 'south', 'centre'],
    scope: 'Nagpur District, Maharashtra (Zero-Fabrication Data Engine)',
    timestamp: new Date().toISOString()
  });
});

// Mount modular sub-routers
app.use('/api/locations', locationsRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/market', marketRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/amenities', amenitiesRouter);
app.use('/api', intelligenceRouter);
app.use('/api/ai', aiRouter);
app.use('/api/auth', authRouter);

// Global 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found on TerraFind API' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  TerraFind Backend Engine Running on port ${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/api/health`);
  console.log(`  District Scope: Nagpur District (5 TerraFind Zones)`);
  console.log(`  Zero-Fabrication Policy: Active`);
  console.log(`======================================================\n`);
});
