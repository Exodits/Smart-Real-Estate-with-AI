# DATA SOURCE RESEARCH FOR TERRAFIND (NAGPUR DISTRICT)

**Date of Research:** September 2026  
**Scope:** Real Estate Property Records, Market Indicators, and Location Intelligence for Nagpur District, Maharashtra, India  
**Policy:** Zero-Fabrication Mandate. Strict provenance tracking, separation of active listings vs. project/valuation records, and rejection of outlier anomalies.

---

## 1. Candidate Source Evaluation Matrix

| Source Name | Source URL | Nagpur Coverage | Approx. Observed Records | Live / Static | Fields Available | Free / Tier | Rate Limits | License / Terms & Permission | Decision |
|---|---|---|---|---|---|---|---|---|---|
| **Mirror Real Estate (Nagpur Snapshot)** | `https://www.mirrorrealestate.com/homes/search?city=Nagpur` | High (all Nagpur zones & peri-urban) | 60 raw captured (36 validated usable candidates; 24 price anomalies rejected) | Static research snapshot (2026-09-27) | `listing_id`, `locality`, `price_inr`, `property_type`, `bhk`, `listing_agent`, `transaction_type`, `city`, `source_url` | Free public web listing pages | N/A (Snapshot import) | Research/Academic use permitted for demonstration. Raw prices require strict outlier filtering (reject ₹1, ₹2, ₹9800Cr anomalies). | **APPROVED (Validated 36 records as live inventory candidates)** |
| **Maharashtra RERA (MahaRERA)** | `https://maharerait.mahaonline.gov.in/` | Comprehensive across registered projects in Nagpur District | ~140 registered projects in Nagpur urban/rural | Live official registry (regulatory filings) | `project_name`, `promoter_name`, `rera_number`, `locality`, `project_type`, `completion_date`, `total_buildings`, `sanctioned_plots` | Free public disclosure under RERA Act 2016 | Form-based public search | Official statutory disclosures under RERA Act 2016. Allowed for public transparency. Must be classified as `source_type = 'project'`, NOT active sale listings. | **APPROVED (For RERA project verification & benchmarking)** |
| **Maharashtra IGR (e-ASR / Ready Reckoner)** | `https://igrmaharashtra.gov.in` | Complete coverage across Nagpur Municipal Corporation (NMC) and Nagpur Gramin zones | Zone-wise and village-wise annual benchmark valuation rates | Published annual benchmark tables (e-ASR) | `zone`, `village`, `survey_number`, `benchmark_rate_per_sqm`, `property_type` (land, flat, commercial) | Free public access for stamp duty calculation | Rate limited web interface | Official state valuation data. Must be classified as `source_type = 'government_valuation'` and used strictly for market rate benchmarking. | **APPROVED (For Locality Benchmark Rates)** |
| **OpenStreetMap (Nominatim & Overpass)** | `https://nominatim.openstreetmap.org`, `https://overpass-api.de` | Deep street, locality, landmark, and POI coverage for Nagpur District | 100,000+ spatial elements in Nagpur | Live spatial engine | `display_name`, `lat`, `lon`, `amenity`, `healthcare`, `railway`, `highway`, `leisure`, `shop` | Free open database | Nominatim: 1 req/sec; Overpass: max 2 simultaneous queries | Open Database License (ODbL). Attribution required: © OpenStreetMap contributors. Strict 3km POI distance filtering applied. | **APPROVED (Core Geocoding & Verified 3km POI Engine)** |
| **Open-Meteo Air Quality & Weather API** | `https://air-quality-api.open-meteo.com` | Global grid (includes Nagpur coordinates: 21.1458° N, 79.0882° E) | Continuous hourly models | Live API | `us_aqi`, `european_aqi`, `pm2_5`, `pm10`, `no2`, `so2`, `temperature_2m`, `humidity`, `precipitation` | Free non-commercial use (< 10,000 calls/day) | Generous free tier | Non-commercial educational use permitted under Open-Meteo terms with attribution. | **APPROVED (Live Environmental Intelligence)** |
| **National Crime Records Bureau (NCRB) & Nagpur Police Commissionerate** | `https://ncrb.gov.in`, `https://nagpurpolice.gov.in` | City / Commissionerate & District level (Nagpur) | Official annual published crime compendiums (2022–2023) | Published government records | `city`, `cognizable_crimes`, `crime_rate_per_lakh`, `reporting_level`, `year` | Public government statistical records | N/A | Open government statistical data. Geographic granularity clearly stated at City/Commissionerate level to prevent false locality-level claims. | **APPROVED (Official Published Safety Metrics)** |
| **TerraFind Direct Property Submission** | Direct platform submission | Nagpur District owners, builders, and verified brokers | Scalable native inventory | Live internal database | Owner/builder name, contact, title, type, BHK, price, area, locality, pincode, photos, amenities | Free direct submission | Controlled by authenticated platform rate limits | First-party submission with express consent for platform listing. Stored as `source_type = 'direct_submission'`. | **APPROVED (Platform Native Inventory Channel)** |

---

## 2. Ingestion & Quality Validation Protocol

1. **Strict Geofence Enforced**:
   - Every property record must belong to **Nagpur District**.
   - Bounding coordinates: Latitude `20.50° N` to `21.60° N`, Longitude `78.50° E` to `79.60° E`. Records outside Nagpur are rejected.
2. **Outlier Price Rejection**:
   - Outlier prices (e.g. ₹1 token listings, ₹15,000 shop rents misclassified as house sales, or multi-thousand crore invalid inputs) are automatically flagged and routed to `rejected_records.json`.
3. **Five-Zone Classification**:
   - Each valid record is deterministically classified into one of the 5 TerraFind zones (`east`, `north`, `west`, `south`, `centre`) using `server/config/nagpurZones.json`.
4. **Provenance Preservation**:
   - Original listing ID, source name, source URL, retrieved timestamp, and listing agent are permanently retained.
