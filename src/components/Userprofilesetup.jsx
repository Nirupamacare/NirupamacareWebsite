import React, { useState } from 'react';
import { MapPin, User, Users, Plus, Trash2, Save, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './UserProfilesetup.css'; 

const UserProfileSetup = () => {
  const navigate = useNavigate();
  
  // Navbar State
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    fullName: '', age: '', gender: '', city: '', pincode: '',
  });
  const [familyMembers, setFamilyMembers] = useState([]);
  const [currentMember, setCurrentMember] = useState({ name: '', age: '', relationship: 'Spouse' });

  // Handlers
  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleMemberChange = (e) => setCurrentMember({ ...currentMember, [e.target.name]: e.target.value });
  
  const handleUseLocation = () => {
     if ("geolocation" in navigator) {
       setFormData(prev => ({ ...prev, city: 'Hyderabad', pincode: '500081' }));
       alert("Location detected!");
     } else { alert("Geolocation not available"); }
  };

  const addFamilyMember = () => {
    if (currentMember.name && currentMember.age) {
      setFamilyMembers([...familyMembers, { ...currentMember, id: Date.now() }]);
      setCurrentMember({ name: '', age: '', relationship: 'Spouse' });
    }
  };

  const removeFamilyMember = (id) => setFamilyMembers(familyMembers.filter(m => m.id !== id));
  
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting:", { user: formData, family: familyMembers });
    navigate('/home');
  };

  return (
    <div className="page-wrapper">
      
      {/* --- Navbar (Identical to Login) --- */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">
             <img src="nirupama1.png" className="logo-icon-img" alt="Logo" />   
          </div>
          
          <div className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <div className={isMenuOpen ? "bar open" : "bar"}></div>
            <div className={isMenuOpen ? "bar open" : "bar"}></div>
            <div className={isMenuOpen ? "bar open" : "bar"}></div>
          </div>

          <ul className={isMenuOpen ? "nav-links active" : "nav-links"}>
            <li><a href="/">Home</a></li>
            <li><a href="/about">About Us</a></li>
            <li><a href="/doctors">Find Doctors</a></li>
            <li><a href="/help">Help</a></li>
          </ul>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <div className="content-container">
        <div className="setup-card">
          
          <div className="setup-header">
            <h2><User className="icon-green" /> Complete Your Profile</h2>
            <p className="sub-text">Please provide your details to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="setup-form">
            
            {/* Section 1: Personal Info */}
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
                  <select name="gender" value={formData.gender} onChange={handleInputChange}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Location */}
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
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="City" style={{paddingLeft: '40px'}} />
                </div>
                <div className="input-group">
                  <input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} placeholder="Pincode" />
                </div>
              </div>
            </div>

            {/* Section 3: Family */}
            <div className="form-section">
              <h3 className="section-title"><Users size={20} style={{marginRight: '8px', color: 'var(--primary-green)'}}/> Add Family Members</h3>
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
                    </select>
                  </div>
                  <button type="button" onClick={addFamilyMember} className="btn-secondary btn-add">
                    <Plus size={18} /> Add
                  </button>
                </div>

                {/* List */}
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
                        <button type="button" onClick={() => removeFamilyMember(member.id)} className="btn-delete">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="action-footer">
              <button type="submit" className="btn-primary">
                <Save size={20} /> Save & Continue
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfileSetup;