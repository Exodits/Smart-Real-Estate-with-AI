import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ZONES_FILE = path.resolve(__dirname, '../server/config/nagpurZones.json');
const OUTPUT_FILE = path.resolve(__dirname, '../server/data/properties.json');
const RAW_DIR = path.resolve(__dirname, '../server/data/raw');
const REJECTED_FILE = path.resolve(__dirname, '../server/data/rejected_records.json');

// Load zone definitions
const zonesConfig = JSON.parse(fs.readFileSync(ZONES_FILE, 'utf8'));

function classifyZone(locality = '', lat = null, lon = null) {
  if (!locality && !lat && !lon) return null;
  const locNorm = (locality || '').toLowerCase().trim();

  // 1. Locality check
  for (const zone of zonesConfig.zones) {
    const matched = zone.localities.some((l) => {
      const ln = l.toLowerCase();
      return locNorm === ln || locNorm.includes(ln) || ln.includes(locNorm);
    });
    if (matched) return zone.id;
  }

  // 2. Geospatial bounds check
  if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
    for (const zone of zonesConfig.zones) {
      const b = zone.bounds;
      if (lat >= b.minLat && lat <= b.maxLat && lon >= b.minLon && lon <= b.maxLon) {
        return zone.id;
      }
    }
  }

  return null;
}

// Approximate representative coordinates for major Nagpur localities (locality centroids ONLY)
const NAGPUR_LOCALITY_CENTROIDS = {
  'wardha road': { lat: 21.092, lon: 79.068 },
  'manish nagar': { lat: 21.098, lon: 79.082 },
  'new manish nagar': { lat: 21.094, lon: 79.085 },
  'somalwada': { lat: 21.102, lon: 79.069 },
  'besa': { lat: 21.082, lon: 79.095 },
  'besa pipla road': { lat: 21.085, lon: 79.098 },
  'pipla': { lat: 21.088, lon: 79.112 },
  'beltarodi': { lat: 21.074, lon: 79.089 },
  'mihan': { lat: 21.045, lon: 79.048 },
  'butibori': { lat: 20.925, lon: 78.995 },
  'khapri': { lat: 21.062, lon: 79.055 },
  'pratap nagar': { lat: 21.118, lon: 79.055 },
  'khamla': { lat: 21.115, lon: 79.065 },
  'manewada': { lat: 21.105, lon: 79.102 },
  'dharampeth': { lat: 21.144, lon: 79.062 },
  'shivaji nagar': { lat: 21.139, lon: 79.058 },
  'gokulpeth': { lat: 21.141, lon: 79.052 },
  'ram nagar': { lat: 21.145, lon: 79.048 },
  'ambazari': { lat: 21.132, lon: 79.045 },
  'shankar nagar': { lat: 21.135, lon: 79.062 },
  'seminary hills': { lat: 21.162, lon: 79.052 },
  'dabha': { lat: 21.168, lon: 79.015 },
  'wadi': { lat: 21.152, lon: 78.992 },
  'hingna': { lat: 21.078, lon: 78.968 },
  'hingna road': { lat: 21.115, lon: 79.012 },
  'midc hingna': { lat: 21.102, lon: 78.985 },
  'wanadongri, hingna': { lat: 21.092, lon: 78.972 },
  'isasani': { lat: 21.098, lon: 78.965 },
  'sitabuldi': { lat: 21.146, lon: 79.083 },
  'sita buldi': { lat: 21.146, lon: 79.083 },
  'civil lines': { lat: 21.155, lon: 79.075 },
  'ramdaspeth': { lat: 21.138, lon: 79.078 },
  'dhantoli': { lat: 21.132, lon: 79.085 },
  'mahal': { lat: 21.142, lon: 79.105 },
  'sadar': { lat: 21.162, lon: 79.082 },
  'ganesh peth': { lat: 21.148, lon: 79.095 },
  'wardhaman nagar': { lat: 21.148, lon: 79.132 },
  'surya nagar': { lat: 21.155, lon: 79.145 },
  'nandanvan': { lat: 21.132, lon: 79.128 },
  'lakadganj': { lat: 21.145, lon: 79.122 },
  'kalamna': { lat: 21.172, lon: 79.142 },
  'pardi': { lat: 21.148, lon: 79.155 },
  'tarodi': { lat: 21.135, lon: 79.182 },
  'mouda': { lat: 21.168, lon: 79.385 },
  'jaripatka': { lat: 21.188, lon: 79.088 },
  'koradi road': { lat: 21.215, lon: 79.088 },
  'mankapur': { lat: 21.182, lon: 79.075 },
  'bezonbagh': { lat: 21.175, lon: 79.088 },
  'godhani': { lat: 21.222, lon: 79.055 },
  'fetri': { lat: 21.225, lon: 79.012 },
  'peotha': { lat: 21.245, lon: 79.062 },
  'bothli': { lat: 21.235, lon: 79.095 },
  'parseoni': { lat: 21.378, lon: 79.205 },
  'mohgaon': { lat: 21.015, lon: 79.085 },
  'dongargaon': { lat: 21.025, lon: 79.045 },
  'gumgaon': { lat: 20.985, lon: 79.022 },
  'shankarpur': { lat: 21.055, lon: 79.082 },
  'veda': { lat: 21.035, lon: 79.065 },
  'malegaon': { lat: 21.012, lon: 79.045 },
  'umred': { lat: 20.852, lon: 79.325 },
  'samruddhi nagpur': { lat: 21.085, lon: 78.985 },
  'kondhali': { lat: 21.142, lon: 78.685 },
  'narkhed': { lat: 21.485, lon: 78.535 },
  'katol': { lat: 21.265, lon: 78.585 }
};

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

export function importNagpurProperties() {
  console.log('\n======================================================');
  console.log('   TerraFind Nagpur Property Ingestion Pipeline');
  console.log('   Zero-Fabrication & Strict Provenance Mode');
  console.log('======================================================\n');

  const rawCsvPath = path.join(RAW_DIR, 'mirror_nagpur_raw.csv');
  if (!fs.existsSync(rawCsvPath)) {
    console.error(`Missing raw file: ${rawCsvPath}`);
    return;
  }

  const content = fs.readFileSync(rawCsvPath, 'utf8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = parseCSVLine(lines[0]);

  const report = {
    totalRowsRead: lines.length - 1,
    validRows: 0,
    invalidRows: 0,
    duplicatesRemoved: 0,
    nagpurRows: 0,
    eastRows: 0,
    northRows: 0,
    westRows: 0,
    southRows: 0,
    centreRows: 0,
    rowsWithoutZone: 0,
    activeListings: 0,
    nonActiveRecords: 0,
    demoRecords: 0,
    rejectedRecords: 0,
    missingArea: 0,
    missingPincode: 0,
    missingExactCoordinates: 0,
    sourceCounts: {},
    localityCounts: {},
    propertyTypeCounts: {},
    transactionTypeCounts: {}
  };

  const seenIds = new Set();
  const validProperties = [];
  const rejectedRecordsList = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < header.length) {
      report.invalidRows++;
      report.rejectedRecords++;
      continue;
    }

    const row = {};
    header.forEach((h, idx) => {
      row[h] = cols[idx];
    });

    const listingId = row.listing_id || `MIRROR-NGP-${i}`;

    // 1. Deduplication (Section 11)
    if (seenIds.has(listingId)) {
      report.duplicatesRemoved++;
      report.rejectedRecords++;
      rejectedRecordsList.push({
        source_record_id: listingId,
        source: row.source || 'Mirror Real Estate',
        source_url: row.source_url,
        locality: row.locality,
        raw_price: row.price_inr,
        rejection_category: 'duplicate_record',
        rejection_reason: `Duplicate listing ID ${listingId} in batch`,
        rejected_at: new Date().toISOString()
      });
      continue;
    }
    seenIds.add(listingId);

    // 2. Geographic Geofence check (Section 1 & 10)
    const city = (row.city || '').toLowerCase();
    if (city && !city.includes('nagpur')) {
      report.invalidRows++;
      report.rejectedRecords++;
      rejectedRecordsList.push({
        source_record_id: listingId,
        source: row.source || 'Mirror Real Estate',
        source_url: row.source_url,
        locality: row.locality,
        city: row.city,
        raw_price: row.price_inr,
        rejection_category: 'geographic_scope_violation',
        rejection_reason: `Location '${row.city}' is outside Nagpur District geofence`,
        rejected_at: new Date().toISOString()
      });
      continue;
    }
    report.nagpurRows++;

    // 3. Price Validation & Outlier Detection (Section 10)
    const priceNum = parseFloat(row.price_inr);
    if (isNaN(priceNum) || priceNum <= 100 || priceNum > 1000000000) {
      report.invalidRows++;
      report.rejectedRecords++;
      const reason = isNaN(priceNum)
        ? 'Missing or unparseable price'
        : priceNum <= 100
        ? `Token price outlier of Rs ${priceNum}`
        : `Extreme price outlier of Rs ${priceNum}`;
      const category = isNaN(priceNum)
        ? 'missing_price'
        : priceNum <= 100
        ? 'price_outlier_token'
        : 'price_outlier_extreme';

      rejectedRecordsList.push({
        source_record_id: listingId,
        source: row.source || 'Mirror Real Estate',
        source_url: row.source_url,
        locality: row.locality,
        raw_price: row.price_inr,
        rejection_category: category,
        rejection_reason: reason,
        rejected_at: new Date().toISOString()
      });
      continue;
    }

    // 4. Property Type check
    const propType = row.property_type || 'Residential Plots';
    if (propType.toLowerCase().includes('boiler') || propType.toLowerCase().includes('parking slot')) {
      report.invalidRows++;
      report.rejectedRecords++;
      rejectedRecordsList.push({
        source_record_id: listingId,
        source: row.source || 'Mirror Real Estate',
        source_url: row.source_url,
        locality: row.locality,
        property_type: propType,
        raw_price: priceNum,
        rejection_category: 'invalid_property_type',
        rejection_reason: `Non-real-estate category: ${propType}`,
        rejected_at: new Date().toISOString()
      });
      continue;
    }

    const locality = row.locality || 'Nagpur';
    const locLower = locality.toLowerCase().trim();

    // Locality Centroid Resolution (Centroid only; exact property coordinates stay NULL)
    let locCentroidLat = null;
    let locCentroidLon = null;
    if (NAGPUR_LOCALITY_CENTROIDS[locLower]) {
      locCentroidLat = NAGPUR_LOCALITY_CENTROIDS[locLower].lat;
      locCentroidLon = NAGPUR_LOCALITY_CENTROIDS[locLower].lon;
    }

    // Zone Classification (Section 14)
    const zone = classifyZone(locality, locCentroidLat, locCentroidLon);

    if (zone === 'east') report.eastRows++;
    else if (zone === 'north') report.northRows++;
    else if (zone === 'west') report.westRows++;
    else if (zone === 'south') report.southRows++;
    else if (zone === 'centre') report.centreRows++;
    else report.rowsWithoutZone++;

    const bhkVal = row.bhk && !isNaN(parseFloat(row.bhk)) ? parseFloat(row.bhk) : null;
    const transType = (row.transaction_type || 'sale').toLowerCase();

    // Generate accurate title without inventing BHK
    let title = '';
    if (bhkVal) {
      title = `${bhkVal} BHK ${propType} for ${transType === 'rent' ? 'Rent' : 'Sale'} in ${locality}`;
    } else {
      title = `${propType} for ${transType === 'rent' ? 'Rent' : 'Sale'} in ${locality}`;
    }

    // Section 3.1 & 3.2: NEVER convert BHK into area. Never calculate price_per_sqft without legitimate area.
    const areaSqft = null;
    const carpetAreaSqft = null;
    const pricePerSqft = null;

    report.missingArea++;
    report.missingPincode++;
    report.missingExactCoordinates++;

    const record = {
      id: listingId,
      source: row.source || 'Mirror Real Estate',
      source_listing_id: listingId,
      source_url: row.source_url || 'https://www.mirrorrealestate.com/homes/search?city=Nagpur',
      source_type: 'active_listing',
      source_date: row.retrieved_at || '2026-09-27',
      is_demo: false,

      title,
      property_type: propType,
      transaction_type: transType,
      bhk: bhkVal,
      bedrooms: bhkVal,
      bathrooms: null, // Section 3: Do not fabricate bathrooms

      price: priceNum,
      area_sqft: areaSqft,
      carpet_area_sqft: carpetAreaSqft,
      price_per_sqft: pricePerSqft,

      locality,
      city: 'Nagpur',
      district: 'Nagpur',
      pincode: null, // Section 3.3: Do not generate pincode from formula
      address: null, // Section 3.4: Do not turn locality into fake address
      zone,
      latitude: null, // Section 3.6: Exact property coordinates stay NULL
      longitude: null,
      locality_latitude: locCentroidLat,
      locality_longitude: locCentroidLon,

      project_name: null,
      society_name: null,
      builder_name: row.listing_agent || null,
      listing_agent: row.listing_agent || null,
      listing_agent_contact: null,

      floor: null,
      total_floors: null,
      furnishing: null,
      parking: null,
      amenities_json: '[]', // Section 3.5: Do not hardcode amenities

      primary_image_url: null, // Section 43: Honest null when source has no photo
      image_urls: [],

      status: 'active',
      approval_status: 'approved',
      listed_date: row.retrieved_at || '2026-09-27',
      updated_at: new Date().toISOString(),
      imported_at: new Date().toISOString(),
      quality_status: 'validated_candidate',
      data_quality_note: row.data_quality_note || 'Validated candidate from Mirror Real Estate Nagpur search. Area, bathrooms, and exact coordinates unavailable on source search page; preserved as NULL per Zero-Fabrication Policy.'
    };

    validProperties.push(record);
    report.validRows++;
    report.activeListings++;

    // Track distributions
    report.sourceCounts[record.source] = (report.sourceCounts[record.source] || 0) + 1;
    report.localityCounts[record.locality] = (report.localityCounts[record.locality] || 0) + 1;
    report.propertyTypeCounts[record.property_type] = (report.propertyTypeCounts[record.property_type] || 0) + 1;
    report.transactionTypeCounts[record.transaction_type] = (report.transactionTypeCounts[record.transaction_type] || 0) + 1;
  }

  // Preserve the 27 demo records in properties.json (classified as demo per Section 3.7)
  let existingProperties = [];
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      existingProperties = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    } catch (e) {
      existingProperties = [];
    }
  }

  const demoRecords = existingProperties.filter((p) => p.is_demo === true || p.source_type === 'demo');
  report.demoRecords = demoRecords.length;

  const combinedOutput = [...validProperties, ...demoRecords];
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(combinedOutput, null, 2), 'utf8');

  // Update rejected_records.json
  fs.writeFileSync(REJECTED_FILE, JSON.stringify(rejectedRecordsList, null, 2), 'utf8');

  // Section 35 Import Audit Report
  console.log('======================================================');
  console.log('           SECTION 35 IMPORT AUDIT REPORT             ');
  console.log('======================================================');
  console.log(`Total Rows Read:              ${report.totalRowsRead}`);
  console.log(`Valid Rows Approved:          ${report.validRows}`);
  console.log(`Invalid Rows Filtered:        ${report.invalidRows}`);
  console.log(`Duplicates Removed:           ${report.duplicatesRemoved}`);
  console.log(`Nagpur District Rows:         ${report.nagpurRows}`);
  console.log('------------------------------------------------------');
  console.log(`East Zone Rows:               ${report.eastRows}`);
  console.log(`North Zone Rows:              ${report.northRows}`);
  console.log(`West Zone Rows:               ${report.westRows}`);
  console.log(`South Zone Rows:              ${report.southRows}`);
  console.log(`Centre Zone Rows:             ${report.centreRows}`);
  console.log(`Rows Without Zone:            ${report.rowsWithoutZone}`);
  console.log('------------------------------------------------------');
  console.log(`Real Active Listings:         ${report.activeListings}`);
  console.log(`Preserved Demo Records:       ${report.demoRecords}`);
  console.log(`Rejected Outlier Records:     ${report.rejectedRecords}`);
  console.log(`Missing Area (NULL):          ${report.missingArea}`);
  console.log(`Missing Pincode (NULL):       ${report.missingPincode}`);
  console.log(`Missing Exact Coords (NULL):  ${report.missingExactCoordinates}`);
  console.log('======================================================\n');

  return report;
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('import-properties.js')) {
  importNagpurProperties();
}
