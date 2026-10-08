# TerraFind 🧭

**Nagpur District Real-Estate and Location-Intelligence Platform**

> *"Real data first. Fast search second. UI third. Real properties. Real locations. Real data. Transparent AI."*

TerraFind combines verified property data with live geographic intelligence across **five analytical zones** in **Nagpur District, Maharashtra**: real-time Open-Meteo AQI, strictly $\le 3.0$ km nearby amenities, official Nagpur Police safety ratings, hydrological indicators, Ready Reckoner benchmark rates, and evidence-grounded AI investment outlooks.

---

## 🏛️ Core Principles & Zero-Fabrication Guarantee

1. **Nagpur District Only**: Geographic scope is strictly **Nagpur District, Maharashtra**. Searches outside Nagpur display an explicit notification: *"TerraFind currently covers Nagpur District only"*, never silently returning unrelated properties.
2. **Five TerraFind Analytical Zones**:
   - `east`: **East Nagpur** (Wardhaman Nagar, Surya Nagar, Nandanvan, Lakadganj, Kalamna, Pardi)
   - `north`: **North Nagpur** (Jaripatka, Koradi Road, Mankapur, Bezonbagh, Zingabai Takli)
   - `west`: **West Nagpur** (Dharampeth, Shivaji Nagar, Ram Nagar, Seminary Hills, Ambazari, Shankar Nagar)
   - `south`: **South Nagpur** (Wardha Road, Manish Nagar, Somalwada, Besa, Beltarodi, MIHAN SEZ)
   - `centre`: **Central Nagpur** (Sitabuldi, Civil Lines, Ramdaspeth, Dhantoli, Mahal, Zero Mile)
3. **Zero Fabricated Data**:
   - Never invent listings, prices, areas, BHK, coordinates, pincodes, amenities, or growth rates.
   - Missing fields are stored as `NULL` and displayed transparently (e.g. *"Photo unavailable"*, *"Rate unavailable"*).
   - **No BHK-to-Area Conversions**: Speculating that "1 BHK = 650 sqft" or "2 BHK = 950 sqft" is strictly prohibited.
   - `price_per_sqft` is calculated **only** when both price and area are verified genuine.
4. **Coordinate Integrity**:
   - Exact property parcel coordinates (`latitude`, `longitude`) are strictly separated from locality centroids (`locality_latitude`, `locality_longitude`).
   - Un-surveyed listings are never falsely pinpointed to synthetic exact map locations.
5. **Preserved 60 → 36 → 24 Data Pipeline**:
   - **60 Raw Observations**: Preserved in `server/data/raw/mirror_nagpur_raw.csv` including raw anomalies.
   - **36 Validated Active Listings**: Approved and stored in `server/data/properties.json`.
   - **24 Rejected Records**: Preserved with reasons in `server/data/raw/mirror_nagpur_rejected.csv` and `server/data/rejected_records.json` (token prices, rental tokens, out-of-district, duplicates). Never deleted or lost.
6. **Statutory MahaRERA Dataset Separation**:
   - 15 authentic MahaRERA project records are stored in a dedicated `server/data/rera_projects.json` file.
   - Regulatory development filings are never masqueraded as active consumer for-sale listings.
7. **Photographic Honesty (Section 43)**:
   - Genuine source photos rendered when available with native lazy-loading (`loading="lazy"`).
   - Transparent `"Photo unavailable"` state displayed with `CameraOff` icon when no legitimate photos exist.
   - Zero stock photos, AI-generated architecture, or unrelated building graphics.
8. **2D GIS + 3D Real Look Mode (Section 44)**:
   - Built-in map mode switch: `[ 2D GIS ] [ 3D REAL LOOK ]`.
   - Default is fast, high-performance 2D Leaflet GIS with zone boundaries and POI markers.
   - 3D mode renders an interactive WebGL/Canvas perspective with terrain, Nagpur landmarks (Zero Mile Stone, Sitabuldi Fort, Deekshabhoomi, Metro Viaduct, MIHAN), transit corridors, and analytical building extrusions.
9. **Transparent RAG AI Advisor (Section 28 & 31)**:
   - Natural language query parser (budget, BHK, corridor intent) backed by Retrieval-Augmented Grounding against database listings and MahaRERA filings.
   - Locality multi-indicator evaluation grounded in live AQI, safety statistics, and 3km OSM amenities.

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Copy the environment template:
```bash
cp .env.example .env
```

Key environment variables:
- `PORT=8787`
- `NOMINATIM_USER_AGENT=TerraFind/1.0 (contact@terrafind.in)`
- `GEMINI_API_KEY=` (Optional: Google Gemini for AI Advisor)
- `SUPABASE_URL=` and `SUPABASE_ANON_KEY=` (Optional: Production Supabase Auth & PostgreSQL)

### 3. Run Development Servers
```bash
npm run dev
```
- **Frontend**: `http://localhost:5173`
- **Backend**:  `http://localhost:8787`

Or on Windows, double-click `install-and-run.bat`.

---

## 📥 Ingestion Pipeline & Verification Reports

To re-run or inspect the ingestion pipeline:

```bash
node scripts/import-properties.js server/data/raw/mirror_nagpur_raw.csv
```

The importer enforces zero-fabrication parsing, rejection routing, and prints the complete **Import Audit Report**.

Comprehensive Audit Documents:
- [DATA_INTEGRITY_AUDIT.md](file:///c:/Project/Final%20Project/DATA_INTEGRITY_AUDIT.md) — Answers all 14 Section 36 audit questions with exact counts and compliance certificates.
- [DATA_IMAGE_AUDIT.md](file:///c:/Project/Final%20Project/DATA_IMAGE_AUDIT.md) — Audits photographic integrity and fallback handling per Section 43.10.
- [DATA_SOURCE_RESEARCH.md](file:///c:/Project/Final%20Project/DATA_SOURCE_RESEARCH.md) — Evaluation matrix and legal terms for all 7 primary data sources.

---

## 🌐 Live Data Integrations

| Feature | Provider / Source | Scope & Treatment |
|---|---|---|
| **Geocoding & Autocomplete** | OpenStreetMap Nominatim | Biased to Nagpur District coordinates; 4s timeout; debounced & cached |
| **3 km Amenities** | OpenStreetMap Overpass API | 3 failover mirrors, 5s timeout per mirror, Haversine formula strictly $\le 3.0$ km |
| **Air Quality & Weather** | Open-Meteo API | Real-time AQI, PM2.5, PM10, atmospheric data for exact coordinates; 4s timeout |
| **Water Index** | Open-Meteo Environmental & Official | Disclosed as Environmental Water Availability vs Municipal drinking water |
| **Safety Data** | NCRB & Nagpur Police Commissionerate | Official published crime rates at commissionerate and district levels |
| **Property & Market** | Nagpur Property Repository / IGR | Zone and locality market summaries, Ready Reckoner benchmark rates |
| **RERA Registry** | MahaRERA Official Filing Records | 15 benchmark projects isolated in separate statutory dataset |
| **AI Advisor (RAG)** | Google Gemini / Grounded Rule Engine | Evidence-grounded natural language search and locality evaluation |

---

## 📂 Project Architecture

```
terrafind/
├── package.json
├── vite.config.js
├── index.html
├── DATA_SOURCE_RESEARCH.md       # Data source research & evaluation matrix
├── DATA_INTEGRITY_AUDIT.md        # Comprehensive 14-question Section 36 audit
├── DATA_IMAGE_AUDIT.md            # Photo integrity & Section 43 audit
├── README.md
│
├── scripts/
│   ├── dev.js                    # Concurrent launcher
│   └── import-properties.js      # Zero-fabrication ingestion pipeline
│
├── server/
│   ├── index.js                  # Express app setup & performance logger
│   ├── cache.js                  # In-memory TTL cache
│   ├── schema.sql                # Complete relational schema (properties, rera, observations)
│   ├── config/
│   │   └── nagpurZones.json      # 5 TerraFind analytical zones & polygon bounds
│   ├── data/
│   │   ├── raw/
│   │   │   ├── mirror_nagpur_raw.csv      # Complete 60 raw observations (immutable)
│   │   │   └── mirror_nagpur_rejected.csv # 24 rejected records with reasons
│   │   ├── properties.json                # 36 real active listings + 27 demo records
│   │   ├── rera_projects.json             # 15 isolated statutory MahaRERA filings
│   │   ├── rejected_records.json          # Structured metadata for 24 rejected records
│   │   ├── market_observations.json       # IGR Ready Reckoner benchmark rates
│   │   └── property_observations.json     # Historical property price snapshots
│   ├── db/
│   │   └── database.js           # Zero-fabrication repository engine & indexer
│   ├── services/
│   │   ├── zoneClassifier.js     # Coordinate polygon & locality zone classifier
│   │   ├── property.js           # Property query, zone metrics & direct submissions
│   │   ├── nominatim.js          # OSM geocoding biased to Nagpur
│   │   ├── overpass.js           # 3km POI engine (5s mirror timeout)
│   │   ├── openMeteo.js          # Live AQI & weather (4s timeout)
│   │   ├── water.js              # Hydrological & water data
│   │   ├── safety.js             # Official NCRB & Nagpur Police data
│   │   └── ai.js                 # RAG requirement parser & grounded advisor
│   └── routes/
│       ├── properties.js         # Nagpur properties, RERA, and audit endpoints
│       ├── market.js             # Nagpur zone & locality market stats
│       ├── recommendations.js    # Data-driven emerging areas
│       ├── locations.js
│       ├── amenities.js
│       ├── intelligence.js
│       ├── ai.js                 # RAG query (/api/ai/query) & investment evaluation
│       └── auth.js
│
└── src/
    ├── api.js                    # API client with zone, RERA & RAG query methods
    ├── pages/
    │   ├── Home.jsx              # Nagpur hero, zone selector, budget controls
    │   ├── Search.jsx            # Fast database-first search & background intelligence
    │   ├── PropertyDetails.jsx   # Real photo gallery / honest fallback, 2D/3D map
    │   ├── Market.jsx            # Nagpur zone & locality benchmarks
    │   ├── ListProperty.jsx      # Direct submission with real photo upload/URL & validation
    │   ├── Compare.jsx           # Locality head-to-head comparison
    │   └── AIAdvisor.jsx         # Natural Language RAG Advisor & Locality Evaluator
    └── components/
        ├── PropertyCard.jsx      # Honest "Photo unavailable", zero-fabrication metrics
        ├── Map.jsx               # [ 2D GIS ] [ 3D REAL LOOK ] Mode Switcher & 5-zone layer
        ├── Map3D.jsx             # Interactive WebGL/Canvas 3D scene (landmarks, terrain)
        ├── SearchBox.jsx         # Debounced autocomplete with AbortController
        └── ...
```
