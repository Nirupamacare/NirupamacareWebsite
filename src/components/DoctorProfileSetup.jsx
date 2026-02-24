import React, { useState, useEffect } from 'react';
import { MapPin, Stethoscope, Save, CheckSquare, XSquare, Navigation, CheckCircle, XCircle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import './DoctorProfileSetup.css';

const DoctorProfileSetup = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // 'idle' | 'checking' | 'verified' | 'failed'
  const [locationStatus, setLocationStatus] = useState('idle');

  const [availability, setAvailability] = useState({
    clinic: true,  // Default: Clinic is Open
    online: false  // Default: Online is Closed
  });

  const [isEditing, setIsEditing] = useState(false);

  // --- NEW: Load Existing Profile if available ---
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await api.getDoctorProfile();
        console.log("Loaded Profile:", profile);

        if (profile) {
          setIsEditing(true);
          setFormData({
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            profile_image_url: profile.profile_picture || '',
            display_name: profile.display_name || '',
            specialty: profile.specialty || '',
            experience_years: profile.experience_years || '',
            education: profile.education || '',
            clinic_name: profile.clinic_name || '',
            clinic_address: profile.clinic_address || '',
            map_link: profile.map_link || '',
            clinic_lat: profile.clinic_lat || null,
            clinic_lng: profile.clinic_lng || null,
            city: profile.city || '',
            price_clinic: profile.price_clinic || '',
            price_online: profile.price_online || '',
            bio: profile.bio || '',
            languages: Array.isArray(profile.languages) ? profile.languages.join(', ') : (profile.languages || ''),
            is_nirupamacare_clinic: profile.is_nirupamacare_clinic || false
          });
          // If map_link already saved, treat location as already verified
          if (profile.map_link) setLocationStatus('verified');

          // Set Availability Toggles based on prices or existing data
          setAvailability({
            clinic: (profile.price_clinic > 0),
            online: (profile.price_online > 0)
          });
        }
      } catch (err) {
        // If 404, it means no profile exists yet, which is fine for new users.
        console.log("No existing profile found. Starting fresh.");
      }
    };
    loadProfile();
  }, []);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    profile_image_url: '',
    display_name: '',
    specialty: '',
    experience_years: '',
    education: '',
    clinic_name: '',
    clinic_address: '',
    map_link: '',
    clinic_lat: null,
    clinic_lng: null,
    city: '',
    price_clinic: '',
    price_online: '',
    bio: '',
    languages: '',
    is_nirupamacare_clinic: false
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleToggle = (type) => {
    setAvailability(prev => ({ ...prev, [type]: !prev[type] }));
  };

  // --- Utility: Extract lat/lng from a Google Maps URL ---
  const extractCoordsFromMapLink = (url) => {
    // Format 1: /@lat,lng,zoom  (e.g. https://maps.google.com/maps/@12.9716,77.5946,15z)
    const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    // Format 2: ?q=lat,lng  (e.g. https://maps.google.com/?q=12.9716,77.5946)
    const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    // Format 3: ll=lat,lng
    const llMatch = url.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (llMatch) return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
    return null;
  };

  // --- Utility: Haversine distance in meters ---
  const haversineDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // --- Verify Doctor is at the clinic location ---
  const verifyLocation = async () => {
    if (!formData.map_link.trim()) {
      alert('Please paste a Google Maps link first.');
      return;
    }
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLocationStatus('checking');

    // --- Step 1: Extract or resolve coordinates ---
    const SHORT_URL_PREFIXES = ['https://goo.gl/maps', 'https://maps.app.goo.gl'];
    const isShortUrl = SHORT_URL_PREFIXES.some(p => formData.map_link.startsWith(p));

    let coords = null;
    let resolvedUrl = formData.map_link;

    if (isShortUrl) {
      // Short URL: resolve server-side (avoids CORS, follows redirects properly)
      try {
        const result = await api.resolveMapLink(formData.map_link);
        resolvedUrl = result.resolved_url || formData.map_link;
        if (result.lat != null && result.lng != null) {
          coords = { lat: result.lat, lng: result.lng };
        }
        // Store the full resolved URL so the backend can verify coords ↔ link
        setFormData(prev => ({ ...prev, map_link: resolvedUrl }));
      } catch (err) {
        setLocationStatus('idle');
        alert('Could not resolve the short Maps link.\n\nPlease try pasting the full URL directly from maps.google.com instead.');
        return;
      }
    } else {
      // Standard URL: extract coords client-side immediately
      coords = extractCoordsFromMapLink(formData.map_link);
    }

    if (!coords) {
      setLocationStatus('idle');
      alert(
        'Could not extract coordinates from the link.\n\n' +
        'Tip: Search for your clinic on maps.google.com, click it to open its info panel, ' +
        'then copy the URL from the address bar. It should contain /@lat,lng in it.'
      );
      return;
    }

    // --- Step 2: Get doctor\'s current GPS position and compare ---
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = haversineDistance(pos.coords.latitude, pos.coords.longitude, coords.lat, coords.lng);
        if (dist <= 1000) { // within 1 km
          setFormData(prev => ({ ...prev, clinic_lat: coords.lat, clinic_lng: coords.lng }));
          setLocationStatus('verified');
        } else {
          setLocationStatus('failed');
          alert(`Location mismatch! You are ${Math.round(dist)}m away from the clinic.\n\nYou must be at the clinic to register its location.`);
        }
      },
      (err) => {
        setLocationStatus('idle');
        alert('Could not get your location. Please allow location access and try again.\n\nError: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Block submission if map_link is filled but not verified
      if (formData.map_link.trim() && locationStatus !== 'verified') {
        alert('Please verify your clinic location before saving.');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        ...formData,
        experience_years: parseInt(formData.experience_years) || 0,
        price_clinic: availability.clinic ? (parseFloat(formData.price_clinic) || 0) : 0,
        price_online: availability.online ? (parseFloat(formData.price_online) || 0) : 0,
        languages: formData.languages.split(',').map(lang => lang.trim()).filter(l => l),
        profile_picture: formData.profile_image_url || '',
        map_link: formData.map_link || '',
        clinic_lat: formData.clinic_lat || null,
        clinic_lng: formData.clinic_lng || null,
      };

      await api.createDoctorProfile(payload);
      alert(isEditing ? "Profile Updated Successfully!" : "Doctor Profile Created Successfully!");
      navigate('/doctor-dashboard');

    } catch (error) {
      console.error("Error:", error);
      alert("Failed to save profile: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="doctor-setup-root">
      <nav className="doc-navbar">
        <div className="doc-nav-container">
          <div className="doc-logo" onClick={() => navigate('/')}>
            <img src="/nirupama1.png" alt="Logo" className="doc-logo-img" />
          </div>
        </div>
      </nav>

      <div className="doc-content-container">
        <div className="doc-card">
          <div className="doc-header">
            <h2><Stethoscope className="icon-blue" /> {isEditing ? "Update Doctor Profile" : "Doctor Registration"}</h2>
            <p className="sub-text">{isEditing ? "Manage your details and settings" : "Build your digital clinic presence"}</p>
          </div>

          <form onSubmit={handleSubmit} className="doc-form">

            {/* 1. Basic Info */}
            <div className="form-section">
              <h3 className="section-title">Personal Details</h3>

              {/* --- Profile Picture Upload --- */}
              <div className="profile-upload-section" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className="avatar-preview" style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#eee', border: '2px solid #ddd' }}>
                  <img
                    src={formData.profile_image_url || `https://ui-avatars.com/api/?name=${formData.first_name}+${formData.last_name}&background=random`}
                    alt="Profile"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    id="photo-upload"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;

                      // Validate file size (max 2MB)
                      if (file.size > 2 * 1024 * 1024) {
                        alert("Image too large. Please choose a file under 2MB.");
                        e.target.value = '';
                        return;
                      }

                      // Convert to Base64 locally for instant preview + storage
                      const reader = new FileReader();
                      reader.onloadstart = () => setIsUploading(true);
                      reader.onload = (event) => {
                        const base64 = event.target.result;
                        // Instantly show preview
                        setFormData(prev => ({ ...prev, profile_image_url: base64 }));
                        setIsUploading(false);
                      };
                      reader.onerror = () => {
                        alert("Failed to read image file.");
                        setIsUploading(false);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <button
                    type="button"
                    className="btn-upload"
                    onClick={() => document.getElementById('photo-upload').click()}
                    style={{
                      padding: '8px 16px',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    {isUploading ? 'Reading...' : 'Upload Photo'}
                  </button>
                  <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>Recommended: Square JPG/PNG</p>
                </div>
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label>First Name</label>
                  <input name="first_name" value={formData.first_name} onChange={handleChange} required placeholder="Dr. John" />
                </div>
                <div className="input-group">
                  <label>Last Name</label>
                  <input name="last_name" value={formData.last_name} onChange={handleChange} required placeholder="Doe" />
                </div>
                <div className="input-group full-width">
                  <label>Display Name</label>
                  <input name="display_name" value={formData.display_name} onChange={handleChange} placeholder="Dr. John Doe, MD" />
                </div>
              </div>
            </div>

            {/* 2. Professional Info */}
            <div className="form-section">
              <h3 className="section-title">Professional Info</h3>
              <div className="form-grid">
                <div className="input-group">
                  <label>Specialty</label>
                  <select name="specialty" value={formData.specialty} onChange={handleChange} required>
                    <option value="">Select Specialty</option>
                    <option value="Cardiologist">Cardiologist</option>
                    <option value="Dermatologist">Dermatologist</option>
                    <option value="General Physician">General Physician</option>
                    <option value="Pediatrician">Pediatrician</option>
                    <option value="Dentist">Dentist</option>
                    <option value="Neurologist">Neurologist</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Experience (Years)</label>
                  <input type="number" name="experience_years" value={formData.experience_years} onChange={handleChange} onWheel={(e) => e.target.blur()} required placeholder="5" />
                </div>
                <div className="input-group full-width">
                  <label>Education / Qualifications</label>
                  <input
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    placeholder="MBBS, MD – AIIMS Delhi"
                  />
                </div>
                <div className="input-group full-width">
                  <label>Languages</label>
                  <input name="languages" value={formData.languages} onChange={handleChange} placeholder="English, Hindi" />
                </div>
              </div>
            </div>

            {/* 3. Clinic & Pricing */}
            <div className="form-section">
              <h3 className="section-title">Clinic & Fees</h3>
              <div className="form-grid">

                <div className="input-group full-width">
                  <label>Clinic Name</label>
                  <input name="clinic_name" value={formData.clinic_name} onChange={handleChange} placeholder="City Care Clinic" />
                </div>

                {/* ✅ ADDED: Nirupamacare Clinic Checkbox */}
                <div className="input-group checkbox-group full-width">
                  <label className={`toggle-label ${formData.is_nirupamacare_clinic ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      name="is_nirupamacare_clinic"
                      checked={formData.is_nirupamacare_clinic}
                      onChange={(e) => setFormData({ ...formData, is_nirupamacare_clinic: e.target.checked })}
                    />
                    {formData.is_nirupamacare_clinic ? <CheckSquare size={18} /> : <XSquare size={18} />}
                    <span>I belong to Nirupamacare Clinic</span>
                  </label>
                </div>

                {/* ✅ City Input */}
                <div className="input-group">
                  <label>City</label>
                  <input name="city" value={formData.city} onChange={handleChange} required placeholder="e.g. Kolkata" />
                </div>

                {/* Clinic Address */}
                <div className="input-group">
                  <label>Clinic Address</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={18} className="input-icon" />
                    <input
                      name="clinic_address"
                      value={formData.clinic_address}
                      onChange={handleChange}
                      placeholder="e.g. 12 MG Road, Park Street"
                      style={{ paddingLeft: '40px' }}
                    />
                  </div>
                </div>

                {/* Google Maps Link + Location Verification */}
                <div className="input-group full-width">
                  <label>Google Maps Link of Your Clinic</label>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '8px' }}>
                    Open your clinic on <a href="https://maps.google.com" target="_blank" rel="noreferrer">maps.google.com</a>, copy the URL from the address bar, and paste it below. Then click <strong>Verify Location</strong> — you must be physically at the clinic.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <input
                      name="map_link"
                      value={formData.map_link}
                      onChange={(e) => {
                        setFormData({ ...formData, map_link: e.target.value });
                        setLocationStatus('idle'); // reset verification on change
                      }}
                      placeholder="https://www.google.com/maps/place/..."
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={verifyLocation}
                      disabled={locationStatus === 'checking' || locationStatus === 'verified'}
                      className="btn-verify-location"
                    >
                      {locationStatus === 'checking' && <Loader size={14} className="spin-icon" />}
                      {locationStatus === 'verified' && <CheckCircle size={14} />}
                      {locationStatus === 'failed' && <XCircle size={14} />}
                      {locationStatus === 'idle' && <Navigation size={14} />}
                      &nbsp;
                      {locationStatus === 'checking' ? 'Checking...' :
                        locationStatus === 'verified' ? 'Verified ✓' :
                          locationStatus === 'failed' ? 'Retry' : 'Verify Location'}
                    </button>
                  </div>
                  {locationStatus === 'verified' && (
                    <p style={{ color: '#0f9d58', fontSize: '0.82rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={13} /> Location verified! You are at the clinic. ({formData.clinic_lat?.toFixed(4)}, {formData.clinic_lng?.toFixed(4)})
                    </p>
                  )}
                  {locationStatus === 'failed' && (
                    <p style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <XCircle size={13} /> You are not at the clinic location. Please go there and try again.
                    </p>
                  )}
                </div>

                {/* Toggles */}
                <div className="input-group checkbox-group full-width">
                  <label className={`toggle-label ${availability.clinic ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={availability.clinic}
                      onChange={() => handleToggle('clinic')}
                    />
                    {availability.clinic ? <CheckSquare size={18} /> : <XSquare size={18} />}
                    <span>Available for In-Clinic Visits?</span>
                  </label>
                </div>

                {availability.clinic && (
                  <div className="input-group fade-in">
                    <label>Clinic Visit Fee (₹)</label>
                    <input type="number" name="price_clinic" value={formData.price_clinic} onChange={handleChange} onWheel={(e) => e.target.blur()} placeholder="500" required={availability.clinic} />
                  </div>
                )}

                <div className="input-group checkbox-group full-width" style={{ marginTop: '10px' }}>
                  <label className={`toggle-label ${availability.online ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={availability.online}
                      onChange={() => handleToggle('online')}
                    />
                    {availability.online ? <CheckSquare size={18} /> : <XSquare size={18} />}
                    <span>Available for Online Video Consult?</span>
                  </label>
                </div>

                {availability.online && (
                  <div className="input-group fade-in">
                    <label>Online Consult Fee (₹)</label>
                    <input type="number" name="price_online" value={formData.price_online} onChange={handleChange} onWheel={(e) => e.target.blur()} placeholder="300" required={availability.online} />
                  </div>
                )}

              </div>
            </div>

            {/* 4. Bio */}
            <div className="form-section">
              <h3 className="section-title">About You</h3>
              <div className="input-group full-width">
                <textarea name="bio" rows="4" value={formData.bio} onChange={handleChange} placeholder="Tell patients about your expertise..." className="bio-input"></textarea>
              </div>
            </div>

            <div className="action-footer">
              <button type="submit" className="doc-btn-primary" disabled={isSubmitting}>
                <Save size={20} /> {isSubmitting ? "Saving..." : (isEditing ? "Update Changes" : "Create Doctor Profile")}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfileSetup;