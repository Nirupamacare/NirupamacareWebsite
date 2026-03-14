import React, { useState, useEffect } from 'react';
import { MapPin, User, Users, Plus, Trash2, Save, Navigation, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import './Userprofilesetup.css'; 

const UserProfileSetup = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [isEditMode, setIsEditMode] = useState(false); // To change title text

  // Form States
  const [formData, setFormData] = useState({
    fullName: '', age: '', gender: '', city: '', pincode: '',
  });
  const [familyMembers, setFamilyMembers] = useState([]);
  const [currentMember, setCurrentMember] = useState({ name: '', age: '', relationship: 'Spouse' });

  // ✅ NEW: Fetch Existing Data on Load
  useEffect(() => {
    const fetchExistingProfile = async () => {
        try {
            const data = await api.getPatientProfile();
            console.log("Found existing profile:", data);
            
            // 1. Pre-fill Personal Info
            setFormData({
                fullName: data.full_name || '',
                age: data.age || '',
                gender: data.gender || '',
                city: data.city || '',
                pincode: data.pin_code || '' // Note: Backend uses 'pin_code', Frontend 'pincode'
            });

            // 2. Pre-fill Family Members
            if (data.family_members && data.family_members.length > 0) {
                const formattedMembers = data.family_members.map(m => ({
                    id: Date.now() + Math.random(), // Generate ID for UI list
                    name: m.full_name, // Backend uses 'full_name'
                    age: m.age,
                    relationship: m.relationship
                }));
                setFamilyMembers(formattedMembers);
            }

            setIsEditMode(true); // Change UI title to "Edit Profile"

        } catch (error) {
            // If 404, it means new user. Do nothing.
            console.log("No existing profile found. Starting fresh.");
        }
    };

    fetchExistingProfile();
  }, []);

  // Handlers
  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleMemberChange = (e) => setCurrentMember({ ...currentMember, [e.target.name]: e.target.value });
  
  const handleUseLocation = () => {
    // 1. Check if browser supports Geolocation
    if (!("geolocation" in navigator)) {
      showToast('Geolocation is not supported by your browser.', 'warning');
      return;
    }

    // 2. Start Loading Visuals (Re-using your existing isSubmitting state)
    setIsSubmitting(true);

    // 3. Define options (Critical for Mobile)
    const options = {
      enableHighAccuracy: true, // Forces GPS usage on phones
      timeout: 10000,           // Wait up to 10s for satellite lock
      maximumAge: 0             // Force fresh data
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // 4. Fetch address from OpenStreetMap (Nominatim)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          // 5. Extract City/Town/Village safely
          const city = data.address.city || data.address.town || data.address.village || data.address.county || "";
          const pincode = data.address.postcode || "";

          // 6. Update Form Data
          setFormData(prev => ({ ...prev, city: city, pincode: pincode }));
          
        } catch (error) {
          console.error('Geocoding error:', error);
          showToast('Could not fetch address details from coordinates.', 'error');
        } finally {
          // 7. Stop Loading (Runs whether fetch succeeds or fails)
          setIsSubmitting(false);
        }
      },
      (error) => {
        // 8. Stop Loading immediately if GPS fails
        setIsSubmitting(false);

        // 9. Handle specific mobile errors
        switch(error.code) {
          case error.PERMISSION_DENIED:
            showToast('Permission denied. Please enable Location Services in your browser settings.', 'warning');
            break;
          case error.POSITION_UNAVAILABLE:
            showToast('Location unavailable. Please ensure your GPS is turned on.', 'warning');
            break;
          case error.TIMEOUT:
            showToast('Location request timed out. Please try again in an open area.', 'warning');
            break;
          default:
            showToast('An unknown location error occurred.', 'error');
            break;
        }
      },
      options // <--- Important: Pass the mobile options here
    );
  };

  const addFamilyMember = () => {
    if (currentMember.name && currentMember.age) {
      setFamilyMembers([...familyMembers, { ...currentMember, id: Date.now() }]);
      setCurrentMember({ name: '', age: '', relationship: 'Spouse' });
    }
  };

  const removeFamilyMember = (id) => setFamilyMembers(familyMembers.filter(m => m.id !== id));
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const profileData = {
          ...formData,
          familyMembers: familyMembers
      };

      await api.createPatientProfile(profileData);
      
      localStorage.setItem('profileCompleted', 'true');
      localStorage.setItem('user_name', formData.fullName.split(' ')[0]);
      
      showToast('Profile saved successfully!', 'success');
      navigate('/home', { replace: true });

    } catch (error) {
      console.error('Failed to save profile:', error);
      showToast('Failed to save profile. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="setup-page-root">
      
      <nav className="setup-navbar">
        <div className="setup-nav-container">
          <div className="setup-logo" onClick={() => navigate('/home')}>
             <img src="nirupama1.png" className="setup-logo-img" alt="Logo" />   
          </div>
          <div className="setup-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <div className={isMenuOpen ? "setup-bar open" : "setup-bar"}></div>
            <div className={isMenuOpen ? "setup-bar open" : "setup-bar"}></div>
            <div className={isMenuOpen ? "setup-bar open" : "setup-bar"}></div>
          </div>
          <ul className={isMenuOpen ? "setup-nav-links active" : "setup-nav-links"}>
            <li><a href="/">Home</a></li>
            <li><a href="/about">About Us</a></li>
          </ul>
        </div>
      </nav>

      <div className="setup-content-container">
        <div className="setup-card">
          <div className="setup-header">
             {/* Back Button for Convenience */}
             {isEditMode && (
                 <button onClick={() => navigate('/view-profile')} style={{marginBottom: '10px', background: 'none', border:'none', cursor:'pointer', color:'#666', display:'flex', alignItems:'center', gap:'5px'}}>
                     <ArrowLeft size={16}/> Cancel
                 </button>
             )}
            <h2><User className="icon-green" /> {isEditMode ? "Edit Your Profile" : "Complete Your Profile"}</h2>
            <p className="sub-text">Please provide your details to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="setup-form">
            <div className="form-section">
              <h3 className="section-title">Personal Information</h3>
              <div className="form-grid">
                <div className="input-group full-width">
                  <label>Full Name</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="John Doe" required />
                </div>
                <div className="input-group">
                  <label>Age</label>
                  <input type="number" name="age" value={formData.age} onChange={handleInputChange} placeholder="25" required />
                </div>
                <div className="input-group">
                  <label>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} required>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="section-title-row">
                <h3 className="section-title">Location Details</h3>
                <button type="button" onClick={handleUseLocation} className="btn-text-action">
                  <Navigation size={16} /> Use Current Location
                </button>
              </div>
              <div className="form-grid">
                <div className="input-group icon-input">
                  <MapPin size={18} className="input-icon" />
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="City" style={{paddingLeft: '40px'}} required />
                </div>
                <div className="input-group">
                  <input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} placeholder="Pincode" required />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title"><Users size={20} style={{marginRight: '8px', color: 'var(--setup-primary)'}}/> Add Family Members</h3>
              <div className="family-box">
                <div className="family-grid">
                  <div className="input-group mb-0">
                    <label className="label-sm">Name</label>
                    <input type="text" name="name" value={currentMember.name} onChange={handleMemberChange} placeholder="Name" />
                  </div>
                  <div className="input-group mb-0">
                    <label className="label-sm">Age</label>
                    <input type="number" name="age" value={currentMember.age} onChange={handleMemberChange} placeholder="Age" />
                  </div>
                  <div className="input-group mb-0">
                    <label className="label-sm">Relation</label>
                    <select name="relationship" value={currentMember.relationship} onChange={handleMemberChange}>
                      <option value="Spouse">Spouse</option>
                      <option value="Child">Child</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                    </select>
                  </div>
                  <button type="button" onClick={addFamilyMember} className="setup-btn-add">
                    <Plus size={18} /> Add
                  </button>
                </div>

                {familyMembers.length > 0 && (
                  <div className="family-list">
                    {familyMembers.map((member) => (
                      <div key={member.id} className="family-item">
                        <div className="family-info">
                          <div className="avatar-circle">{member.relationship[0]}</div>
                          <div>
                            <p className="f-name">{member.name}</p>
                            <p className="f-meta">{member.relationship}, {member.age} yrs</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => removeFamilyMember(member.id)} className="setup-btn-delete">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="action-footer">
              <button type="submit" className="setup-btn-primary" disabled={isSubmitting}>
                <Save size={20} /> {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfileSetup;