import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Building2, CheckCircle2, AlertCircle, ArrowLeft, Image as ImageIcon, Upload, X, Camera } from 'lucide-react';

export default function ListProperty() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    ownerName: '',
    contactPhone: '',
    contactEmail: '',
    title: '',
    propertyType: 'Apartment',
    transactionType: 'buy',
    bhk: '2',
    price: '',
    areaSqft: '',
    carpetAreaSqft: '',
    locality: '',
    pincode: '',
    address: '',
    projectName: '',
    amenities: '',
    imageUrl: ''
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [imageFileError, setImageFileError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'imageUrl') {
      if (value.trim()) {
        setImagePreview(value.trim());
        setImageFileError(null);
      } else {
        setImagePreview(null);
      }
    }
  }

  function handleFileChange(e) {
    setImageFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setImageFileError('Invalid file type. Please upload a genuine JPEG, PNG, or WebP photo.');
      return;
    }

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageFileError('Image file size exceeds 5MB limit. Please compress before uploading.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      setImagePreview(result);
      setFormData((prev) => ({ ...prev, imageUrl: result }));
    };
    reader.onerror = () => {
      setImageFileError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  }

  function handleClearImage() {
    setImagePreview(null);
    setImageFileError(null);
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        ...formData,
        primary_image_url: formData.imageUrl || null,
        amenities: formData.amenities
          ? formData.amenities.split(',').map((s) => s.trim()).filter(Boolean)
          : []
      };

      const res = await api.submitDirectListing(payload);
      if (res && res.property) {
        setSuccessResult(res.property);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit property listing');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ padding: '40px 0 80px', background: '#f8fafc', minHeight: '85vh' }}>
      <div className="container" style={{ maxWidth: '720px' }}>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => navigate(-1)}
          style={{ marginBottom: '20px', padding: '6px 14px', fontSize: '13px' }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        {successResult ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <CheckCircle2 size={48} color="var(--color-emerald)" style={{ margin: '0 auto 16px' }} />
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-navy)' }}>
              Property Listing Submitted!
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--color-slate)', marginTop: '8px', maxWidth: '540px', margin: '8px auto 24px' }}>
              Your listing <strong>"{successResult.title}"</strong> in {successResult.locality}, Nagpur has been submitted directly to the TerraFind database under source type: <code>direct_submission</code>.
            </p>
            {successResult.zone && (
              <div style={{ marginBottom: '24px' }}>
                <span className="badge badge-gold" style={{ fontSize: '12px' }}>
                  Assigned Zone: {successResult.zone.toUpperCase()} NAGPUR
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate(`/property/${successResult.id}`)}
              >
                View Listing Details
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setSuccessResult(null);
                  setFormData({
                    ownerName: '',
                    contactPhone: '',
                    contactEmail: '',
                    title: '',
                    propertyType: 'Apartment',
                    transactionType: 'buy',
                    bhk: '2',
                    price: '',
                    areaSqft: '',
                    carpetAreaSqft: '',
                    locality: '',
                    pincode: '',
                    address: '',
                    projectName: '',
                    amenities: ''
                  });
                }}
              >
                Submit Another Property
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '36px' }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--color-gold)', textTransform: 'uppercase' }}>
                <Building2 size={14} /> Direct Inventory
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-navy)', marginTop: '4px' }}>
                List Your Property in Nagpur
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--color-slate)', marginTop: '4px' }}>
                Owners and builders can publish legitimate properties directly to TerraFind. All listings are assigned to one of the five Nagpur analytical zones.
              </p>
            </div>

            {errorMsg && (
              <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#b91c1c', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Owner / Contact Info */}
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-navy)', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                Owner / Builder Contact
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="ownerName"
                    required
                    value={formData.ownerName}
                    onChange={handleChange}
                    placeholder="e.g. Rajesh Sharma"
                    className="searchbox-input"
                    style={{ border: '1px solid var(--color-border)', padding: '10px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    required
                    value={formData.contactPhone}
                    onChange={handleChange}
                    placeholder="e.g. +91 98765 43210"
                    className="searchbox-input"
                    style={{ border: '1px solid var(--color-border)', padding: '10px' }}
                  />
                </div>
              </div>

              {/* Property Details */}
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-navy)', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px', marginTop: '10px' }}>
                Property Information (Nagpur District)
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Listing Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Spacious 3 BHK High-rise in Dharampeth"
                  className="searchbox-input"
                  style={{ border: '1px solid var(--color-border)', padding: '10px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    Property Type
                  </label>
                  <select
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleChange}
                    className="btn btn-outline"
                    style={{ width: '100%', padding: '10px' }}
                  >
                    <option value="Apartment">Apartment</option>
                    <option value="Villa">Villa / Row House</option>
                    <option value="Plot">Plot</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    BHK
                  </label>
                  <select
                    name="bhk"
                    value={formData.bhk}
                    onChange={handleChange}
                    className="btn btn-outline"
                    style={{ width: '100%', padding: '10px' }}
                  >
                    <option value="1">1 BHK</option>
                    <option value="2">2 BHK</option>
                    <option value="3">3 BHK</option>
                    <option value="4">4 BHK</option>
                    <option value="5">5+ BHK</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    Total Price (₹) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    required
                    placeholder="e.g. 6500000"
                    value={formData.price}
                    onChange={handleChange}
                    className="searchbox-input"
                    style={{ border: '1px solid var(--color-border)', padding: '10px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    Super Built-up Area (sq.ft.)
                  </label>
                  <input
                    type="number"
                    name="areaSqft"
                    placeholder="e.g. 1250"
                    value={formData.areaSqft}
                    onChange={handleChange}
                    className="searchbox-input"
                    style={{ border: '1px solid var(--color-border)', padding: '10px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    Carpet Area (sq.ft.)
                  </label>
                  <input
                    type="number"
                    name="carpetAreaSqft"
                    placeholder="e.g. 980"
                    value={formData.carpetAreaSqft}
                    onChange={handleChange}
                    className="searchbox-input"
                    style={{ border: '1px solid var(--color-border)', padding: '10px' }}
                  />
                </div>
              </div>

              {/* Locality & Address */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    Locality in Nagpur *
                  </label>
                  <input
                    type="text"
                    name="locality"
                    required
                    placeholder="e.g. Manish Nagar, Dharampeth, Wardhaman Nagar"
                    value={formData.locality}
                    onChange={handleChange}
                    className="searchbox-input"
                    style={{ border: '1px solid var(--color-border)', padding: '10px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    PIN Code
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    placeholder="e.g. 440015"
                    value={formData.pincode}
                    onChange={handleChange}
                    className="searchbox-input"
                    style={{ border: '1px solid var(--color-border)', padding: '10px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Full Street Address
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="e.g. Plot 42, Opposite Metro Pillar 112, Wardha Road, Nagpur"
                  value={formData.address}
                  onChange={handleChange}
                  className="searchbox-input"
                  style={{ border: '1px solid var(--color-border)', padding: '10px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Key Amenities (comma separated)
                </label>
                <input
                  type="text"
                  name="amenities"
                  placeholder="e.g. Covered Parking, Lift, 24/7 Security, Gym, Power Backup"
                  value={formData.amenities}
                  onChange={handleChange}
                  className="searchbox-input"
                  style={{ border: '1px solid var(--color-border)', padding: '10px' }}
                />
              </div>

              {/* Genuine Property Photo (Section 43.7) */}
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-navy)', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px', marginTop: '10px' }}>
                Property Photograph (Optional)
              </div>

              <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <p style={{ fontSize: '12px', color: 'var(--color-slate)', marginBottom: '12px', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--color-navy)' }}>Data Honesty Guarantee:</strong> Upload genuine photos of the actual property only. Do <strong>not</strong> upload stock photos or images of other buildings. If no photo is provided, the listing will display the honest <em>"Photo unavailable"</em> status.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: imagePreview ? '1fr 140px' : '1fr', gap: '14px', alignItems: 'center' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                      Option A: Image Direct URL
                    </label>
                    <input
                      type="url"
                      name="imageUrl"
                      placeholder="https://example.com/actual-property-photo.jpg"
                      value={formData.imageUrl.startsWith('data:') ? '' : formData.imageUrl}
                      onChange={handleChange}
                      className="searchbox-input"
                      style={{ border: '1px solid var(--color-border)', padding: '10px', width: '100%', marginBottom: '10px' }}
                    />

                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                      Option B: Upload File (JPEG, PNG, WebP &lt; 5MB)
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      style={{ fontSize: '13px' }}
                    />

                    {imageFileError && (
                      <div style={{ color: '#b91c1c', fontSize: '12px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={14} /> {imageFileError}
                      </div>
                    )}
                  </div>

                  {imagePreview && (
                    <div style={{ position: 'relative', width: '140px', height: '110px', borderRadius: '6px', overflow: 'hidden', border: '2px solid var(--color-gold)', background: '#fff' }}>
                      <img
                        src={imagePreview}
                        alt="Property preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={handleClearImage}
                        title="Remove photo"
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '22px',
                          height: '22px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '10px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: 700 }}
                >
                  {isSubmitting ? 'Submitting to Nagpur Database...' : 'Submit Listing to TerraFind'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
