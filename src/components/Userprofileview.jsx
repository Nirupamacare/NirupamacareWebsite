import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Calendar, Users, ArrowLeft, Edit3, ShieldCheck, Activity } from 'lucide-react';
import { api } from '../api';
import './UserprofileView.css'; 

const UserProfileView = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getPatientProfile()
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading profile:", err);
        setError("Could not load profile. Please try again.");
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="profile-loading-container">
        <div className="spinner"></div>
        <p>Loading Profile...</p>
    </div>
  );
  
  if (error) return (
    <div className="profile-error-container">
        <p>{error}</p>
        <button onClick={() => navigate('/home')} className="back-btn">Go Home</button>
    </div>
  );

  return (
    <div className="profile-view-container">
      {/* Top Navigation Bar */}
      <div className="profile-header-nav">
        <button onClick={() => navigate('/home')} className="nav-btn-secondary">
          <ArrowLeft size={18} /> <span>Back</span>
        </button>
        <h2 className="page-title">Profile</h2>
        <button className="nav-btn-primary" onClick={() => navigate('/userprofilesetup')}>
          <Edit3 size={16} /> <span>Edit</span>
        </button>
      </div>

      <div className="profile-content-wrapper">
        
        {/* Main Profile Card */}
        <div className="profile-main-card">
          {/* Decorative Banner */}
          <div className="profile-banner"></div>
          
          <div className="profile-identity">
            <div className="profile-avatar-wrapper">
                <div className="profile-avatar-large">
                    {profile.full_name.charAt(0)}
                </div>
                
            </div>
            <h1 className="profile-fullname">{profile.full_name}</h1>
            <p className="profile-status">Verified Patient Account</p>
          </div>

          <div className="profile-divider"></div>
          
          {/* Personal Details Grid */}
          <div className="profile-info-grid">
            <div className="info-box">
              <div className="icon-wrapper blue">
                <User size={20} />
              </div>
              <div className="info-text">
                <span className="label">Age & Gender</span>
                <p>{profile.age} Years, {profile.gender}</p>
              </div>
            </div>

            <div className="info-box">
              <div className="icon-wrapper green">
                <MapPin size={20} />
              </div>
              <div className="info-text">
                <span className="label">Location</span>
                <p>{profile.city}, {profile.pin_code}</p>
              </div>
            </div>

            <div className="info-box">
              <div className="icon-wrapper purple">
                <Calendar size={20} />
              </div>
              <div className="info-text">
                <span className="label">Member Since</span>
                <p>{new Date(profile.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
            
            <div className="info-box">
              <div className="icon-wrapper orange">
                <Activity size={20} />
              </div>
              <div className="info-text">
                <span className="label">Health ID</span>
                {/* Simulated Health ID based on Account ID */}
                <p>NIR-{profile.account_id ? profile.account_id.substring(0, 6).toUpperCase() : 'GEN'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Family Section */}
        {profile.family_members && profile.family_members.length > 0 && (
          <div className="family-section-container">
            <h3 className="section-heading"><Users size={20} /> Family Members</h3>
            <div className="family-list-grid">
              {profile.family_members.map((member, index) => (
                <div key={index} className="family-member-card">
                  <div className="family-avatar-small">{member.relationship[0]}</div>
                  <div className="family-info">
                    <p className="mem-name">{member.full_name}</p>
                    <div className="mem-meta">
                        <span className="badge-rel">{member.relationship}</span>
                        <span className="text-age">{member.age} Yrs</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default UserProfileView;