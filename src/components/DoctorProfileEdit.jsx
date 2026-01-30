import React, { useState, useEffect } from 'react';
import { MapPin, Stethoscope, Save, CheckSquare, XSquare, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import './DoctorProfileSetup.css'; // Reuse styles

const DoctorProfileEdit = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [viewImage, setViewImage] = useState(false); // State for image viewer modal

    // Toggles for Availability
    const [availability, setAvailability] = useState({
        clinic: true,
        online: false
    });

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        profile_image_url: '', // Legacy field (kept for compatibility)
        profile_picture: '', // New Base64 field
        display_name: '',
        specialty: '',
        experience_years: '',
        credentials: '',
        clinic_name: '',
        clinic_address: '',
        city: '',
        price_clinic: '',
        price_online: '',
        bio: '',
        languages: ''
    });

    // Load Existing Profile
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const profile = await api.getDoctorProfile();
                console.log("Edit Page Loaded Profile:", profile);

                if (profile) {
                    setFormData({
                        first_name: profile.first_name || '',
                        last_name: profile.last_name || '',
                        profile_image_url: profile.profile_image_url || '',
                        profile_picture: profile.profile_picture || '', // Load Base64 picture
                        display_name: profile.display_name || '',
                        specialty: profile.specialty || '',
                        experience_years: profile.experience_years || '',
                        credentials: profile.credentials || '',
                        clinic_name: profile.clinic_name || '',
                        clinic_address: profile.clinic_address || '',
                        city: profile.city || '',
                        price_clinic: profile.price_clinic || '',
                        price_online: profile.price_online || '',
                        bio: profile.bio || '',
                        languages: Array.isArray(profile.languages) ? profile.languages.join(', ') : (profile.languages || '')
                    });

                    setAvailability({
                        clinic: (profile.price_clinic > 0),
                        online: (profile.price_online > 0)
                    });
                }
            } catch (err) {
                console.error("Failed to load profile for editing", err);
                alert("Could not load your profile. Please check your connection.");
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleToggle = (type) => {
        setAvailability(prev => ({ ...prev, [type]: !prev[type] }));
    };

    // Handle profile picture upload (Base64)
    const handleProfilePictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            alert('Image size must be less than 2MB');
            return;
        }

        try {
            setIsSubmitting(true);

            // Convert to Base64
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result;

                try {
                    // Upload to backend
                    await api.updateDoctorProfilePicture(base64String);

                    // Update local state
                    setFormData(prev => ({ ...prev, profile_picture: base64String }));
                    alert('Profile picture updated successfully!');
                } catch (err) {
                    console.error("Upload error:", err);
                    alert("Failed to upload photo: " + (err.response?.data?.detail || err.message));
                }
            };

            reader.readAsDataURL(file);
        } catch (err) {
            console.error("File read error:", err);
            alert("Failed to process image");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload = {
                ...formData,
                experience_years: parseInt(formData.experience_years) || 0,
                price_clinic: availability.clinic ? (parseFloat(formData.price_clinic) || 0) : 0,
                price_online: availability.online ? (parseFloat(formData.price_online) || 0) : 0,
                languages: formData.languages.split(',').map(lang => lang.trim()).filter(l => l)
            };

            await api.createDoctorProfile(payload);
            alert("Profile Updated Successfully!");
            navigate('/doctor-dashboard');

        } catch (error) {
            console.error("Error:", error);
            alert("Failed to update profile: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#0f9d58' }}>
                <h2>Loading your profile details...</h2>
            </div>
        );
    }

    // Get display picture (prioritize Base64, fallback to URL or placeholder)
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

                        {/* 1. Basic Info */}
                        <div className="form-section">
                            <h3 className="section-title">Personal Details</h3>

                            {/* --- Profile Picture Upload (Base64) --- */}
                            <div className="profile-upload-section" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div
                                    className="avatar-preview"
                                    style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#eee', border: '2px solid #ddd', cursor: 'pointer' }}
                                    onClick={() => formData.profile_picture && setViewImage(true)}
                                    title="Click to view full size"
                                >
                                    <img
                                        src={getDisplayPicture()}
                                        alt="Profile"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                                <div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="edit-photo-upload"
                                        style={{ display: 'none' }}
                                        onChange={handleProfilePictureUpload}
                                    />
                                    <button
                                        type="button"
                                        className="btn-upload"
                                        onClick={() => document.getElementById('edit-photo-upload').click()}
                                        disabled={isSubmitting}
                                        style={{
                                            padding: '8px 16px',
                                            background: '#007bff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                            opacity: isSubmitting ? 0.6 : 1
                                        }}
                                    >
                                        {isSubmitting ? 'Uploading...' : 'Upload Photo'}
                                    </button>
                                    <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '8px' }}>
                                        Max 2MB • JPG, PNG
                                    </p>
                                </div>
                            </div>

                            <div className="form-grid">
                                <div className="input-group">
                                    <label>First Name</label>
                                    <input name="first_name" value={formData.first_name} onChange={handleChange} required />
                                </div>
                                <div className="input-group">
                                    <label>Last Name</label>
                                    <input name="last_name" value={formData.last_name} onChange={handleChange} required />
                                </div>
                                <div className="input-group full-width">
                                    <label>Display Name (e.g. Dr. Ray)</label>
                                    <input name="display_name" value={formData.display_name} onChange={handleChange} />
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
                                        <option value="Orthopedic">Orthopedic</option>
                                        <option value="Psychiatrist">Psychiatrist</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Experience (Years)</label>
                                    <input type="number" name="experience_years" value={formData.experience_years} onChange={handleChange} required />
                                </div>
                                <div className="input-group full-width">
                                    <label>Credentials</label>
                                    <input name="credentials" value={formData.credentials} onChange={handleChange} placeholder="MBBS, MD" />
                                </div>
                                <div className="input-group full-width">
                                    <label>Languages (comma separated)</label>
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
                                    <input name="clinic_name" value={formData.clinic_name} onChange={handleChange} />
                                </div>

                                <div className="input-group">
                                    <label>City</label>
                                    <input name="city" value={formData.city} onChange={handleChange} required />
                                </div>

                                <div className="input-group">
                                    <label>Full Address</label>
                                    <div style={{ position: 'relative' }}>
                                        <MapPin size={18} className="input-icon" />
                                        <input name="clinic_address" value={formData.clinic_address} onChange={handleChange} style={{ paddingLeft: '40px' }} />
                                    </div>
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
                                        <input type="number" name="price_clinic" value={formData.price_clinic} onChange={handleChange} required={availability.clinic} />
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
                                        <input type="number" name="price_online" value={formData.price_online} onChange={handleChange} required={availability.online} />
                                    </div>
                                )}

                            </div>
                        </div>

                        {/* 4. Bio */}
                        <div className="form-section">
                            <h3 className="section-title">About You</h3>
                            <div className="input-group full-width">
                                <textarea name="bio" rows="4" value={formData.bio} onChange={handleChange} className="bio-input"></textarea>
                            </div>
                        </div>

                        <div className="action-footer">
                            <button type="submit" className="doc-btn-primary" disabled={isSubmitting}>
                                <Save size={20} /> {isSubmitting ? "Saving..." : "Save Changes"}
                            </button>
                        </div>

                    </form>
                </div>
            </div>

            {/* Image Viewer Modal */}
            {viewImage && (formData.profile_picture || formData.profile_image_url) && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999,
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    animation: 'fadeIn 0.2s ease-out'
                }} onClick={() => setViewImage(false)}>
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={e => e.stopPropagation()}>
                        <img
                            src={getDisplayPicture()}
                            alt="Full Size Profile"
                            style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', boxShadow: '0 4px 30px rgba(0,0,0,0.5)', border: '2px solid white' }}
                        />
                        <button
                            style={{
                                position: 'absolute', top: '-40px', right: '-10px',
                                background: 'white', border: 'none', color: '#333',
                                width: '30px', height: '30px', borderRadius: '50%', fontWeight: 'bold', cursor: 'pointer'
                            }}
                            onClick={() => setViewImage(false)}
                            title="Close"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorProfileEdit;
