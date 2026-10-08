# DATA IMAGE AUDIT REPORT — TERRAFIND (NAGPUR DISTRICT)

**Date of Audit:** October 2026  
**Audited Subsystem:** Visual Asset Management & Property Imagery Pipeline  
**Governing Standard:** Section 43 Real Property Photos & Zero-Fabrication Visuals  
**Status:** 100% Verified Compliant  

---

## 1. Executive Summary

TerraFind enforces strict photographic honesty:  
- **Rule 1:** Only genuine photographs of the actual property or development site may be displayed.
- **Rule 2:** Unrelated stock photography, synthetic AI architectural renders, and generic vector building icons masquerading as photos are strictly prohibited.
- **Rule 3:** When no genuine photograph was captured or provided by the listing source, the interface must display an honest `"Photo unavailable"` state.
- **Rule 4:** Direct submissions must enforce file-level validation (JPEG, PNG, WebP < 5MB) and present an explicit warning against stock uploads.

---

## 2. Core Image Audit Metrics

| Metric | Measured Value | Compliance Benchmark | Status |
|---|---|---|---|
| **Total Real Active Properties Audited** | **36** | 36 | ✅ 100% Audited |
| **Properties with Genuine Source Photos** | **0** | Snapshot did not include URLs | ✅ Accurately Reported |
| **Properties with Honest Fallback (`Photo unavailable`)** | **36 (100%)** | 36 | ✅ 100% Honest Fallback |
| **Stock / AI-Generated Photos Substituted** | **0** | Exactly 0 allowed | ✅ Zero Fabrication Maintained |
| **Direct Listing Image Validation Active** | **Yes** | JPEG/PNG/WebP, &lt; 5MB limit | ✅ Enforced |
| **Real-time Image Preview in Listing Form** | **Yes** | Live preview with remove control | ✅ Implemented |
| **Image Lazy-Loading (`loading="lazy"`)** | **Yes** | Native lazy loading on all cards | ✅ Implemented |
| **Broken Image Graceful Degradation (`onError`)** | **Yes** | Automatic fallback switch | ✅ Implemented |

---

## 3. Implementation Verification Across Components

### 3.1 Property Card (`src/components/PropertyCard.jsx`)
- Implements `legitimateImageUrl = (!imageError && (property.primary_image_url || property.imageUrl || property.image_url)) || null`.
- When legitimate photo exists: renders with `loading="lazy"` and `onError={() => setImageError(true)}`.
- When photo is null or fails to load: displays the honest placeholder with `CameraOff` icon (stroke width 1.5, `#94a3b8`), `"Photo unavailable"` text, and locality name.
- No misleading "Verified Photo" badges are displayed on blank listings.

### 3.2 Property Details Gallery (`src/pages/PropertyDetails.jsx`)
- Implements dynamic gallery: if `validImages.length > 0`, renders hero image with thumbnail navigation and photo counter (`Photo X of Y`).
- If no genuine photos exist: renders clean container with `CameraOff` icon and explanatory notice:  
  *"No photographs were provided by the source for this property record. TerraFind never substitutes unrelated stock images."*
- Full image error handling (`imageErrorMap`) protects against dead or unreachable image URLs.

### 3.3 Listing Submission Form (`src/pages/ListProperty.jsx`)
- Implements dual photo ingestion:
  1. Direct URL input for hosted real photography.
  2. Local file upload with FileReader preview.
- File type validation strictly restricts input to `image/jpeg`, `image/png`, and `image/webp`.
- Size validation rejects files greater than 5MB with clear inline warning.
- Displayed Data Honesty Guarantee banner:  
  *"Data Honesty Guarantee: Upload genuine photos of the actual property only. Do not upload stock photos or images of other buildings. If no photo is provided, the listing will display the honest 'Photo unavailable' status."*

---

## 4. Verification Check

All 36 real active listings in `server/data/properties.json` have `primary_image_url: null` and `image_urls: []`. In the client application, navigating to search or any property details page shows the transparent "Photo unavailable" state. No stock photos exist anywhere in the active database.
