/**
 * TerraFind AI Investment Advisor & Location Query Service
 * Transparent, evidence-based reasoning engine.
 * Never fabricates numbers, percentages, or historical appreciation rates.
 * Uses Google Gemini API when GEMINI_API_KEY is supplied;
 * falls back to a deterministic, rule-based evidence evaluator otherwise.
 */

import { db } from '../db/database.js';

/**
 * Deterministic local evidence evaluator.
 */
function evaluateEvidenceLocally(evidence) {
  const { location, propertyMarket, airQuality, water, safety, amenities } = evidence;

  // If there is zero market data or location data, return Insufficient Evidence
  if (!propertyMarket || (!propertyMarket.averagePrice && !propertyMarket.activeListingsCount)) {
    return {
      outlook: 'Insufficient evidence',
      confidence: 'Low',
      summary: `Insufficient market evidence for a reliable investment outlook for ${location || 'this location'}. Real-time property transaction records and active registry listings were not found in the connected database.`,
      keyFactors: [
        'No active RERA/IGR transaction volume detected in current dataset',
        airQuality?.aqi ? `Observed AQI: ${airQuality.aqi} (${airQuality.description || 'Open-Meteo'})` : 'Air quality data available',
        amenities?.totalCount ? `${amenities.totalCount} amenities verified within 3 km` : 'Local amenity density pending verification'
      ],
      risks: [
        'Lack of recorded secondary market liquidity in this micro-market',
        'Inability to benchmark price-per-square-foot against verified registrations'
      ],
      disclaimer: 'This is an analytical estimate grounded in verified source evidence, not financial advice.',
      engine: 'TerraFind Deterministic Evidence Engine (Local Fallback)'
    };
  }

  const factors = [];
  const risks = [];
  let score = 0; // -3 to +3

  // 1. Amenity & Transit Density (OSM within 3km)
  const hasMetro = (amenities?.categories?.['Metro station'] || []).length > 0;
  const hasHospital = (amenities?.categories?.['Hospital'] || []).length > 0;
  const hasSchool = (amenities?.categories?.['School'] || []).length > 0;

  if (hasMetro) {
    factors.push('Direct access to rapid transit (Metro station verified within 3 km)');
    score += 1;
  } else {
    risks.push('No operational metro station verified within immediate 3 km radius');
  }

  if (hasHospital && hasSchool) {
    factors.push('Comprehensive social infrastructure (verified hospitals and schools within 3 km)');
    score += 1;
  }

  // 2. Air Quality Indicator
  if (airQuality && typeof airQuality.aqi === 'number') {
    if (airQuality.aqi <= 100) {
      factors.push(`Favorable air quality index: ${airQuality.aqi} (${airQuality.description})`);
      score += 1;
    } else if (airQuality.aqi > 150) {
      risks.push(`Elevated air pollution levels: AQI ${airQuality.aqi} (${airQuality.description})`);
      score -= 1;
    }
  }

  // 3. Official Safety
  if (safety?.crimeRatePerLakh) {
    factors.push(`Official crime rate benchmarks available at city/commissionerate level (${safety.city || 'Nagpur Police Commissionerate'})`);
  }

  // 4. Market Liquidity
  if (propertyMarket.activeListingsCount > 0) {
    factors.push(`${propertyMarket.activeListingsCount} verified active properties found in registry`);
    if (propertyMarket.averagePricePerSqft) {
      factors.push(`Average benchmark rate: ₹${propertyMarket.averagePricePerSqft.toLocaleString('en-IN')}/sq.ft.`);
    }
  }

  let outlook = 'Neutral';
  let confidence = 'Medium';

  if (score >= 2) {
    outlook = 'Positive';
  } else if (score < 0) {
    outlook = 'Cautious';
  }

  return {
    outlook,
    confidence,
    summary: `Based on ${factors.length} verified location indicators and official registry data, the locality exhibits a ${outlook.toLowerCase()} outlook. Key transit and social amenities support daily livability, while environmental and market benchmarks remain within recorded parameters.`,
    keyFactors: factors,
    risks: risks.length > 0 ? risks : ['Market risk tied to broader macroeconomic real estate cycles in Maharashtra'],
    disclaimer: 'This is an analytical estimate grounded in verified source evidence, not financial advice.',
    engine: 'TerraFind Deterministic Evidence Engine (Local Fallback)'
  };
}

/**
 * Analyzes investment potential using Gemini if configured, or local fallback.
 */
export async function analyzeInvestmentEvidence(evidence) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return evaluateEvidenceLocally(evidence);
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const prompt = `
You are the AI Location & Real Estate Investment Analyst for TerraFind, an authorized Nagpur District real estate intelligence platform.

STRICT RULES:
1. Ground your entire evaluation ONLY in the evidence provided in the JSON payload below.
2. DO NOT invent fake property appreciation rates (e.g. "will grow 25% in 3 years").
3. DO NOT fabricate historical prices, crime statistics, or amenities not present in the payload.
4. If market or property evidence is missing or insufficient, state "outlook: 'Insufficient evidence'".
5. The allowed outlook values are strictly: "Positive", "Neutral", "Cautious", or "Insufficient evidence".
6. The allowed confidence values are strictly: "High", "Medium", or "Low".
7. Return strictly valid JSON with no markdown wrapping or preamble.

EVIDENCE PAYLOAD:
${JSON.stringify(evidence, null, 2)}

JSON Output Schema:
{
  "outlook": "Positive | Neutral | Cautious | Insufficient evidence",
  "confidence": "High | Medium | Low",
  "summary": "Evidence-grounded analytical summary",
  "keyFactors": ["string factor 1", "string factor 2"],
  "risks": ["string risk 1", "string risk 2"],
  "disclaimer": "This is an analytical estimate grounded in verified source evidence, not financial advice."
}
`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        parsed.engine = `Google Gemini (${modelName})`;
        return parsed;
      }
    } else {
      console.warn('[AI Advisor] Gemini API request failed:', res.status, res.statusText);
    }
  } catch (err) {
    console.error('[AI Advisor] Gemini API call error:', err.message);
  }

  // Fallback to local evaluation
  return evaluateEvidenceLocally(evidence);
}

/**
 * Section 28 & 31: Retrieval-Augmented, Source-Grounded Natural Language Assistant
 * Extracts requirements deterministically -> retrieves DB records -> packages evidence -> explains results
 */
export async function answerUserQueryRAG(userQuery) {
  const queryLower = (userQuery || '').toLowerCase();

  // 1. Deterministic Requirement Extraction
  let maxPrice = null;
  let bhk = null;
  let zone = null;
  let targetLocality = null;

  // Budget detection (e.g. "60 lakh", "60L", "1 crore", "50 lakhs")
  const lakhMatch = queryLower.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l)/i);
  const croreMatch = queryLower.match(/(\d+(?:\.\d+)?)\s*(?:crore|crores|cr)/i);
  if (croreMatch) {
    maxPrice = parseFloat(croreMatch[1]) * 10000000;
  } else if (lakhMatch) {
    maxPrice = parseFloat(lakhMatch[1]) * 100000;
  }

  // BHK detection (e.g. "2bhk", "2 bhk", "3 bedroom")
  const bhkMatch = queryLower.match(/(\d+)\s*(?:bhk|bedroom|bed)/i);
  if (bhkMatch) {
    bhk = parseInt(bhkMatch[1], 10);
  }

  // Locality / Corridor detection
  if (queryLower.includes('mihan') || queryLower.includes('wardha road') || queryLower.includes('besa') || queryLower.includes('manish nagar')) {
    zone = 'south';
    targetLocality = queryLower.includes('mihan') ? 'MIHAN' : queryLower.includes('manish nagar') ? 'Manish Nagar' : 'Wardha Road';
  } else if (queryLower.includes('dharampeth') || queryLower.includes('shankar nagar') || queryLower.includes('shivaji nagar')) {
    zone = 'west';
    targetLocality = 'Dharampeth';
  } else if (queryLower.includes('wardhaman') || queryLower.includes('nandanvan') || queryLower.includes('kalamna')) {
    zone = 'east';
    targetLocality = 'Wardhaman Nagar';
  } else if (queryLower.includes('jaripatka') || queryLower.includes('koradi') || queryLower.includes('mankapur')) {
    zone = 'north';
    targetLocality = 'Jaripatka';
  } else if (queryLower.includes('sitabuldi') || queryLower.includes('civil lines') || queryLower.includes('dhantoli')) {
    zone = 'centre';
    targetLocality = 'Civil Lines';
  }

  // 2. TerraFind DB Retrieval
  const searchFilters = {
    district: 'Nagpur',
    status: 'active'
  };
  if (zone) searchFilters.zone = zone;
  if (bhk) searchFilters.bhk = bhk;
  if (maxPrice) searchFilters.maxPrice = maxPrice;

  const dbResults = db.queryProperties(searchFilters);
  const matchingProperties = dbResults.items.slice(0, 5);

  // Retrieve RERA projects for context
  const reraProjects = db.getReraProjects({ zone: zone || 'all' }).slice(0, 3);

  // Retrieve Market Observations for context
  const marketObs = db.getMarketObservations({ zone: zone || 'south' });

  // 3. Assemble Grounded Evidence Package
  const evidencePackage = {
    userQuery,
    parsedRequirements: {
      budgetMax: maxPrice ? `₹${maxPrice.toLocaleString('en-IN')}` : 'Unspecified',
      bhk: bhk ? `${bhk} BHK` : 'Any',
      zone: zone ? `${zone.toUpperCase()} Nagpur` : 'Nagpur District Wide',
      targetLocality: targetLocality || 'Nagpur District'
    },
    matchingRealListingsCount: dbResults.total,
    sampleRetrievedListings: matchingProperties.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      locality: p.locality,
      zone: p.zone,
      bhk: p.bhk,
      area_sqft: p.area_sqft || 'Source area unrecorded (NULL)',
      price_per_sqft: p.price_per_sqft || 'Cannot compute without verified area (NULL)',
      source: p.source,
      source_type: p.source_type
    })),
    reraBenchmarkProjects: reraProjects.map((r) => ({
      name: r.project_name,
      promoter: r.promoter,
      reraNumber: r.rera_number,
      locality: r.locality,
      status: r.status
    })),
    historicalBenchmarkObservation: marketObs[0] || null
  };

  // 4. Grounded Response Generation
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      const prompt = `
You are the TerraFind Grounded Real Estate Advisor for Nagpur District, Maharashtra.
You must adhere strictly to the Zero-Fabrication Policy:
1. Ground your response ONLY in the retrieved evidence payload below.
2. DO NOT fabricate prices, areas, growth percentages, or properties not in the payload.
3. If an area or price-per-sqft is unrecorded, state that it is unavailable rather than guessing.
4. Explain clearly how the retrieved options fit the user's budget and location preference.

EVIDENCE PAYLOAD:
${JSON.stringify(evidencePackage, null, 2)}
`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return {
            evidence: evidencePackage,
            explanation: text,
            engine: `Google Gemini (${modelName}) with TerraFind RAG Grounding`
          };
        }
      }
    } catch (e) {
      console.warn('[RAG] Gemini error, using deterministic synthesizer:', e.message);
    }
  }

  // Deterministic local response synthesizer
  const count = evidencePackage.matchingRealListingsCount;
  let explanation = '';
  if (count > 0) {
    explanation = `Found ${count} verified listing(s) matching your criteria in ${evidencePackage.parsedRequirements.zone} within ${evidencePackage.parsedRequirements.budgetMax}. ` +
      `Retrieved candidates include ${matchingProperties.map((p) => `"${p.title}" at ₹${p.price.toLocaleString('en-IN')} in ${p.locality}`).join(', ')}. ` +
      `Per TerraFind Zero-Fabrication Policy, areas or price-per-sq.ft. values that were not explicitly reported by the source are retained as unavailable rather than estimated.`;
  } else {
    explanation = `No active real listings strictly matching ${evidencePackage.parsedRequirements.bhk} under ${evidencePackage.parsedRequirements.budgetMax} were found in the current verified database for ${evidencePackage.parsedRequirements.zone}. ` +
      `However, official MahaRERA registered projects in this corridor include ${reraProjects.map((r) => `${r.project_name} by ${r.promoter} (${r.rera_number})`).join(', ')}.`;
  }

  return {
    evidence: evidencePackage,
    explanation,
    engine: 'TerraFind Deterministic RAG Retrieval Engine (Ground-Truth Evidence Mode)'
  };
}
