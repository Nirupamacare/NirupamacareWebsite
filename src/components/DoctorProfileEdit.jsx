import React, { useState, useEffect } from 'react';
import {
    MapPin, Stethoscope, Save, CheckSquare, XSquare,
    ArrowLeft, Link, Navigation, Loader, CheckCircle, XCircle, GraduationCap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import './DoctorProfileSetup.css'; // Reuse styles

// ─── Helpers (same as DoctorProfileSetup) ─────────────────────────────────────
function extractCoordsFromMapLink(url) {
    // /@lat,lng,zoom  or  /place/.../@lat,lng  or  ?q=lat,lng  or  ll=lat,lng
    const patterns = [
        /@(-?\d+\.\d+),(-?\d+\.\d+)/,
        /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
        /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
        /[?&]center=(-?\d+\.\d+),(-?\d+\.\d+)/,
    ];
    for (const re of patterns) {
        const m = url.match(re);
        if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    }
    return null;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
// ──────────────────────────────────────────────────────────────────────────────

const DoctorProfileEdit = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [viewImage, setViewImage] = useState(false);
    const [locationStatus, setLocationStatus] = useState('idle'); // idle | checking | verified | failed

    const [availability, setAvailability] = useState({ clinic: true, online: false });

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        profile_image_url: '',
        profile_picture: '',
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
        is_nirupamacare_clinic: false,
    });

    // ── Load existing profile ───────────────────────────────────────────────
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const profile = await api.getDoctorProfile();
                if (profile) {
                    setFormData({
                        first_name: profile.first_name || '',
                        last_name: profile.last_name || '',
                        profile_image_url: profile.profile_image_url || '',
                        profile_picture: profile.profile_picture || '',
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
                        languages: Array.isArray(profile.languages)
                            ? profile.languages.join(', ')
                            : (profile.languages || ''),
                        is_nirupamacare_clinic: profile.is_nirupamacare_clinic || false,
                    });

                    setAvailability({
                        clinic: (profile.price_clinic > 0),
                        online: (profile.price_online > 0),
                    });

                    // If map_link already saved, treat location as verified
                    if (profile.map_link) setLocationStatus('verified');
                }
            } catch (err) {
                console.error('Failed to load profile for editing', err);
                alert('Could not load your profile. Please check your connection.');
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleToggle = (type) => setAvailability(prev => ({ ...prev, [type]: !prev[type] }));

    // ── Photo upload ────────────────────────────────────────────────────────
    const handleProfilePictureUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { alert('Please select an image file'); return; }
        if (file.size > 2 * 1024 * 1024) { alert('Image size must be less than 2MB'); return; }

        setIsUploading(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result;
            try {
                await api.updateDoctorProfilePicture(base64String);
                setFormData(prev => ({ ...prev, profile_picture: base64String }));
                alert('Profile picture updated!');
            } catch (err) {
                alert('Failed to upload photo: ' + (err.response?.data?.detail || err.message));
            } finally {
                setIsUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    // ── Location verification (same logic as DoctorProfileSetup) ───────────
    const verifyLocation = async () => {
        if (!formData.map_link.trim()) { alert('Please paste a Google Maps link first.'); return; }
        if (!navigator.geolocation) { alert('Geolocation is not supported by your browser.'); return; }

        setLocationStatus('checking');

        const SHORT_URL_PREFIXES = ['https://goo.gl/maps', 'https://maps.app.goo.gl'];
        const isShortUrl = SHORT_URL_PREFIXES.some(p => formData.map_link.startsWith(p));

        let coords = null;
        let resolvedUrl = formData.map_link;

        if (isShortUrl) {
            try {
                const result = await api.resolveMapLink(formData.map_link);
                resolvedUrl = result.resolved_url || formData.map_link;
                if (result.lat != null && result.lng != null) {
                    coords = { lat: result.lat, lng: result.lng };
                }
                setFormData(prev => ({ ...prev, map_link: resolvedUrl }));
            } catch {
                setLocationStatus('idle');
                alert('Could not resolve the short Maps link.\n\nPlease paste the full URL from maps.google.com instead.');
                return;
            }
        } else {
            coords = extractCoordsFromMapLink(formData.map_link);
        }

        if (!coords) {
            setLocationStatus('idle');
            alert(
                'Could not extract coordinates from the link.\n\n' +
                'Tip: Search for your clinic on maps.google.com, click it, then copy the URL from the address bar.'
            );
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const dist = haversineDistance(pos.coords.latitude, pos.coords.longitude, coords.lat, coords.lng);
                if (dist <= 1000) {
                    setFormData(prev => ({ ...prev, clinic_lat: coords.lat, clinic_lng: coords.lng }));
                    setLocationStatus('verified');
                } else {
                    setLocationStatus('failed');
                    alert(`Location mismatch! You are ${Math.round(dist)}m away from the clinic.\n\nYou must be at the clinic to verify its location.`);
                }
            },
            (err) => {
                setLocationStatus('idle');
                alert('Could not get your location. Allow location access and try again.\n\nError: ' + err.message);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // ── Submit ──────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                experience_years: parseInt(formData.experience_years) || 0,
                price_clinic: availability.clinic ? (parseFloat(formData.price_clinic) || 0) : 0,
                price_online: availability.online ? (parseFloat(formData.price_online) || 0) : 0,
                languages: formData.languages.split(',').map(l => l.trim()).filter(Boolean),
            };
            await api.createDoctorProfile(payload);
            alert('Profile updated successfully!');
            navigate('/doctor-dashboard');
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to update profile: ' + (error.response?.data?.detail || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#0f9d58' }}>
                <h2>Loading your profile...</h2>
            </div>
        );
    }

    const getDisplayPicture = () => {
        if (formData.profile_picture) return formData.profile_picture;
        if (formData.profile_image_url) return formData.profile_image_url;
        return `https://ui-avatars.com/api/?name=${formData.first_name}+${formData.last_name}&background=random`;
    };

    return (
        <div id="doctor-setup-root">
            <nav className="doc-navbar">
                <div className="doc-nav-container">
                    <div className="doc-logo" onClick={() => navigate('/doctor-dashboard')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#0f9d58', fontWeight: 'bold' }}>
                            <ArrowLeft size={24} /> Back to Dashboard
                        </div>
                    </div>
                </div>
            </nav>

            <div className="doc-content-container">
                <div className="doc-card">
                    <div className="doc-header">
                        <h2><Stethoscope className="icon-blue" /> Edit My Profile</h2>
                        <p className="sub-text">Update your professional and clinic details</p>
                    </div>

                    <form onSubmit={handleSubmit} className="doc-form">

                        {/* ── 1. Personal Details ── */}
                        <div className="form-section">
                            <h3 className="section-title">Personal Details</h3>

                            {/* Profile Photo */}
                            <div className="profile-upload-section" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div
                                    className="avatar-preview"
                                    style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#eee', border: '2px solid #ddd', cursor: 'pointer' }}
                                    onClick={() => formData.profile_picture && setViewImage(true)}
                                    title="Click to view full size"
                                >
                                    <img src={getDisplayPicture()} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div>
                                    <input type="file" accept="image/*" id="edit-photo-upload" style={{ display: 'none' }} onChange={handleProfilePictureUpload} />
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('edit-photo-upload').click()}
                                        disabled={isUploading}
                                        style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.6 : 1 }}
                                    >
                                        {isUploading ? 'Uploading...' : 'Upload Photo'}
                                    </button>
                                    <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>Max 2MB · JPG, PNG</p>
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

                        {/* ── 2. Professional Info ── */}
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
                                        <option value="Orthopedic">Orthopedic</option>
                                        <option value="Psychiatrist">Psychiatrist</option>
                                        <option value="ENT Specialist">ENT Specialist</option>
                                        <option value="Ophthalmologist">Ophthalmologist</option>
                                        <option value="Gynecologist">Gynecologist</option>
                                        <option value="Urologist">Urologist</option>
                                        <option value="Endocrinologist">Endocrinologist</option>
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label>Experience (Years)</label>
                                    <input
                                        type="number"
                                        name="experience_years"
                                        value={formData.experience_years}
                                        onChange={handleChange}
                                        onWheel={(e) => e.target.blur()}
                                        required
                                        placeholder="5"
                                    />
                                </div>

                                <div className="input-group full-width">
                                    <label><GraduationCap size={15} style={{ marginRight: '4px', verticalAlign: 'middle' }} />Education / Qualifications</label>
                                    <input
                                        name="education"
                                        value={formData.education}
                                        onChange={handleChange}
                                        placeholder="MBBS, MD – AIIMS Delhi"
                                    />
                                </div>

                                <div className="input-group full-width">
                                    <label>Languages (comma separated)</label>
                                    <input name="languages" value={formData.languages} onChange={handleChange} placeholder="English, Hindi, Telugu" />
                                </div>
                            </div>
                        </div>

                        {/* ── 3. Clinic & Fees ── */}
                        <div className="form-section">
                            <h3 className="section-title">Clinic &amp; Fees</h3>
                            <div className="form-grid">

                                {/* Clinic Name */}
                                <div className="input-group full-width">
                                    <label>Clinic Name</label>
                                    <input name="clinic_name" value={formData.clinic_name} onChange={handleChange} placeholder="City Care Clinic" />
                                </div>

                                {/* Nirupamacare Clinic Checkbox */}
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

                                {/* City */}
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

                                {/* Google Maps Link + Verify */}
                                <div className="input-group full-width">
                                    <label>Google Maps Link of Your Clinic</label>
                                    <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '8px' }}>
                                        Open your clinic on <a href="https://maps.google.com" target="_blank" rel="noreferrer">maps.google.com</a>, copy the URL, paste it below, then click <strong>Verify Location</strong> while physically at the clinic.
                                    </p>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                        <input
                                            name="map_link"
                                            value={formData.map_link}
                                            onChange={(e) => {
                                                setFormData({ ...formData, map_link: e.target.value });
                                                setLocationStatus('idle');
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
                                            <CheckCircle size={13} /> Location verified! ({formData.clinic_lat?.toFixed(4)}, {formData.clinic_lng?.toFixed(4)})
                                        </p>
                                    )}
                                    {locationStatus === 'failed' && (
                                        <p style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <XCircle size={13} /> You are not at the clinic location. Please go there and try again.
                                        </p>
                                    )}
                                </div>

                                {/* Clinic Toggle & Fee */}
                                <div className="input-group checkbox-group full-width">
                                    <label className={`toggle-label ${availability.clinic ? 'active' : ''}`}>
                                        <input type="checkbox" checked={availability.clinic} onChange={() => handleToggle('clinic')} />
                                        {availability.clinic ? <CheckSquare size={18} /> : <XSquare size={18} />}
                                        <span>Available for In-Clinic Visits?</span>
                                    </label>
                                </div>

                                {availability.clinic && (
                                    <div className="input-group fade-in">
                                        <label>Clinic Visit Fee (₹)</label>
                                        <input
                                            type="number"
                                            name="price_clinic"
                                            value={formData.price_clinic}
                                            onChange={handleChange}
                                            onWheel={(e) => e.target.blur()}
                                            placeholder="500"
                                            required={availability.clinic}
                                        />
                                    </div>
                                )}

                                {/* Online Toggle & Fee */}
                                <div className="input-group checkbox-group full-width" style={{ marginTop: '10px' }}>
                                    <label className={`toggle-label ${availability.online ? 'active' : ''}`}>
                                        <input type="checkbox" checked={availability.online} onChange={() => handleToggle('online')} />
                                        {availability.online ? <CheckSquare size={18} /> : <XSquare size={18} />}
                                        <span>Available for Online Video Consult?</span>
                                    </label>
                                </div>

                                {availability.online && (
                                    <div className="input-group fade-in">
                                        <label>Online Consult Fee (₹)</label>
                                        <input
                                            type="number"
                                            name="price_online"
                                            value={formData.price_online}
                                            onChange={handleChange}
                                            onWheel={(e) => e.target.blur()}
                                            placeholder="300"
                                            required={availability.online}
                                        />
                                    </div>
                                )}

                            </div>
                        </div>

                        {/* ── 4. About You ── */}
                        <div className="form-section">
                            <h3 className="section-title">About You</h3>
                            <div className="input-group full-width">
                                <textarea
                                    name="bio"
                                    rows="5"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    placeholder="Tell patients about your expertise, approach to care, and what makes your practice unique..."
                                    className="bio-input"
                                />
                            </div>
                        </div>

                        <div className="action-footer">
                            <button type="submit" className="doc-btn-primary" disabled={isSubmitting}>
                                <Save size={20} /> {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>

            {/* ── Image Viewer Modal ── */}
            {viewImage && (formData.profile_picture || formData.profile_image_url) && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    onClick={() => setViewImage(false)}
                >
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={e => e.stopPropagation()}>
                        <img
                            src={getDisplayPicture()}
                            alt="Full Size Profile"
                            style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', boxShadow: '0 4px 30px rgba(0,0,0,0.5)', border: '2px solid white' }}
                        />
                        <button
                            style={{ position: 'absolute', top: '-40px', right: '-10px', background: 'white', border: 'none', color: '#333', width: '30px', height: '30px', borderRadius: '50%', fontWeight: 'bold', cursor: 'pointer' }}
                            onClick={() => setViewImage(false)}
                        >✕</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorProfileEdit;
