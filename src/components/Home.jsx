import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { api } from '../api'; // ✅ 1. IMPORT API (This was missing)
import './Home.css';

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  // --- Dropdown State ---
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // --- Symptom Checker State ---
  const [symptomDesc, setSymptomDesc] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- Search State ---
  const [location, setLocation] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // --- Auth & Profile State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [userProfile, setUserProfile] = useState({ name: 'User', avatar: '' });
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    setLoaded(true);

    // 1. Check Login Token
    const token = localStorage.getItem('token');
    const storedName = localStorage.getItem('user_name');

    if (token) {
      setIsLoggedIn(true);

      // 2. Set Initial Optimistic Name (Fast, but might be "User")
      let finalName = "User";
      if (storedName) {
        finalName = storedName;
      } else if (auth.currentUser && auth.currentUser.displayName) {
        finalName = auth.currentUser.displayName;
      }

      setUserProfile({
        name: finalName,
        avatar: auth.currentUser?.photoURL || ""
      });

      // ✅ 3. THE TRAFFIC COP LOGIC (Crucial Integration Step)
      // We ask the backend: "Does this user have a profile?"
      api.getPatientProfile()
        .then((profile) => {
          // SUCCESS: Profile exists! Show real name.
          console.log("✅ Profile Verified:", profile);
          const realName = profile.full_name.split(' ')[0];

          setUserProfile(prev => ({ ...prev, name: realName }));
          localStorage.setItem('user_name', realName);
          localStorage.setItem('profileCompleted', 'true');
        })
        .catch((err) => {
          // FAILURE: Check if it's a 404 (Missing Profile)
          console.log("Profile check failed:", err);

          if (err.response && err.response.status === 404) {
            console.log("🚨 No profile found! Redirecting to setup...");
            // Force user to create a profile immediately
            navigate('/userprofilesetup');
          }
        });

      // ✅ 4. Check for confirmed appointments
      api.getPatientAppointments()
        .then((appointments) => {
          checkForNewConfirmations(appointments);
        })
        .catch((err) => {
          console.log("Could not fetch appointments:", err);
        });
    }

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);

  }, [navigate]); // Added navigate dependency

  // Check for newly confirmed appointments
  const checkForNewConfirmations = (appointments) => {
    // Get previously seen confirmed appointments from localStorage
    const seenConfirmations = JSON.parse(localStorage.getItem('seenConfirmations') || '[]');

    // Find confirmed appointments that haven't been seen yet
    const newConfirmations = appointments.filter(apt =>
      apt.status === 'Confirmed' && !seenConfirmations.includes(apt.id)
    );

    if (newConfirmations.length > 0) {
      // Show notification for the first new confirmation
      const apt = newConfirmations[0];
      setNotification({
        message: `Your appointment is confirmed by the doctor at ${apt.time} on ${apt.date}`,
        type: 'success',
        appointmentId: apt.id
      });

      // Mark this appointment as seen
      const updatedSeen = [...seenConfirmations, apt.id];
      localStorage.setItem('seenConfirmations', JSON.stringify(updatedSeen));
    }
  };

  // Close notification
  const closeNotification = () => {
    setNotification(null);
  };

  // ... (Rest of your code stays exactly the same) ...
  // ... Paste the rest of your component below (Helper functions + Return statement) ...

  // --- Helper: Get Greeting based on time ---
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const handleAnalyzeSymptoms = async () => {
    if (!isLoggedIn) {
      alert("You need to login to use the AI Symptom Checker.");
      navigate('/login');
      return;
    }
    if (!symptomDesc.trim()) {
      alert("Please describe your symptoms.");
      return;
    }

    setIsAnalyzing(true);
    setSuggestion(null);

    setTimeout(() => {
      const text = symptomDesc.toLowerCase();
      let doctorType = "General Physician";
      let reason = "For a general checkup and initial diagnosis.";

      if (text.includes('tooth') || text.includes('gum') || text.includes('jaw') || text.includes('cavity') || text.includes('oral')) {
        doctorType = "Dentist";
        reason = "It sounds like a dental issue.";
      } else if (text.includes('heart') || text.includes('chest') || text.includes('beat') || text.includes('palpitation') || text.includes('breathing')) {
        doctorType = "Cardiologist";
        reason = "Chest or heart issues require a specialist.";
      } else if (text.includes('skin') || text.includes('rash') || text.includes('itch') || text.includes('acne') || text.includes('spot')) {
        doctorType = "Dermatologist";
        reason = "For skin related conditions.";
      } else if (text.includes('bone') || text.includes('fracture') || text.includes('joint') || text.includes('knee') || text.includes('back') || text.includes('muscle')) {
        doctorType = "Orthopedic";
        reason = "For bone and joint health.";
      } else if (text.includes('stomach') || text.includes('digest') || text.includes('vomit') || text.includes('belly') || text.includes('acid') || text.includes('gas')) {
        doctorType = "Gastroenterologist";
        reason = "For digestive system issues.";
      }

      setSuggestion({ type: doctorType, message: reason });
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.append('location', location);
    if (searchQuery) params.append('specialization', searchQuery);
    navigate(`/doctors?${params.toString()}`);
  };

  const handleLogout = async () => {
    await api.logout();
    setIsLoggedIn(false);
    setIsMenuOpen(false);
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <div id="home-page-root">

      <nav className="home-navbar">
        <div className="home-nav-container">
          <div className="home-nav-left">
            <div className="home-logo" onClick={() => navigate('/')}>
              <img src="nirupama1.png" alt="" className='home-logo-img' />
            </div>

            <ul className="home-primary-nav desktop-only">
              <li><a href="/doctors" className="active-link">Get Doctor</a></li>
              <li><a href="/video-consult">Video Consult</a></li>
              <li><a href="/lab-book">Book Lab Test</a></li>
            </ul>
          </div>

          <div className="home-nav-right desktop-only">

            {!isLoggedIn && (
              <>
                <a href="/doctor-login" className="nav-link-secondary">For doctors/labs</a>
                <a href="/security" className="nav-link-secondary">Security</a>
                <a href="/help" className="nav-link-secondary">Help</a>
              </>
            )}

            {isLoggedIn ? (
              <div className="nav-profile-container" ref={profileMenuRef}>
                <div
                  className={`nav-profile-widget ${showProfileMenu ? 'active' : ''}`}
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                  <div className="nav-profile-text">
                    <span className="nav-greeting">{getGreeting()},</span>
                    <span className="nav-username">{userProfile.name}</span>
                  </div>
                  <div className="nav-profile-avatar">
                    {userProfile.avatar ? (
                      <img src={userProfile.avatar} alt="Profile" />
                    ) : (
                      <div className="avatar-placeholder">
                        {userProfile.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>

                {showProfileMenu && (
                  <div className="profile-dropdown-menu fade-in-fast">
                    <div className="dropdown-item" onClick={() => navigate('/view-profile')}>
                      <span>👤</span> View My Profile
                    </div>
                    <div className="dropdown-item" onClick={() => navigate('/my-appointments')}>
                      <span>📅</span> My Appointments
                    </div>
                    <div className="dropdown-item" onClick={() => navigate('/medical-records')}>
                      <span>📄</span> Medical Records
                    </div>
                    <div className="dropdown-item" onClick={() => navigate('/security')}>
                      <span>🛡️</span> Security
                    </div>
                    <div className="dropdown-item" onClick={() => navigate('/help')}>
                      <span>❓</span> Help
                    </div>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-item logout" onClick={handleLogout}>
                      <span>🚪</span> Logout
                    </div>


                  </div>
                )}
              </div>
            ) : (
              <button className="home-btn-login" onClick={() => navigate('/login')}>
                Login / Signup
              </button>
            )}
          </div>

          <div className="home-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <div className={isMenuOpen ? "home-bar open" : "home-bar"}></div>
            <div className={isMenuOpen ? "home-bar open" : "home-bar"}></div>
            <div className={isMenuOpen ? "home-bar open" : "home-bar"}></div>
          </div>
        </div>

        <div className={`home-mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          {isLoggedIn && (
            <div className="mobile-profile-header">
              <div className="avatar-placeholder small">{userProfile.name.charAt(0)}</div>
              <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>{userProfile.name}</span>
            </div>
          )}

          {/* Primary Nav Items */}
          <a onClick={() => handleNavigation('/doctors')}>Get Doctor</a>
          <a onClick={() => handleNavigation('/video-consult')}>Video Consult</a>
          <a onClick={() => handleNavigation('/lab-tests')}>Book Lab Test</a>

          <hr className="mobile-divider" />

          {/* Conditional Items */}
          {isLoggedIn ? (
            <>
              <a onClick={() => handleNavigation('/view-profile')}>View My Profile</a>
              <a onClick={() => handleNavigation('/my-appointments')}>My Appointments</a>
              <a onClick={() => handleNavigation('/medical-records')}>Medical Records</a>
              <a onClick={() => handleNavigation('/security')}>Security</a>
              <a onClick={() => handleNavigation('/help')}>Help</a>
              <div className="mobile-auth-btn">
                <button className="home-btn-login full-width" onClick={handleLogout}>Logout</button>
              </div>
            </>
          ) : (
            <>
              <a onClick={() => handleNavigation('/doctor-login')}>For doctors/labs</a>
              <a onClick={() => handleNavigation('/security')}>Security</a>
              <a onClick={() => handleNavigation('/help')}>Help</a>
              <div className="mobile-auth-btn">
                <button className="home-btn-login full-width" onClick={() => handleNavigation('/login')}>Login / Signup</button>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Notification Banner */}
      {notification && (
        <div className={`home-notification-banner ${notification.type}`}>
          <div className="home-notification-content">
            <span className="notification-icon">✓</span>
            <span>{notification.message}</span>
          </div>
          <button className="home-notification-close" onClick={closeNotification}>×</button>
        </div>
      )}

      <header className="hero-section">
        <div className={`hero-content ${loaded ? 'fade-in-up' : ''}`}>
          <div className="hero-text">
            <h1>Your Health, <br /> Our <span className="highlight">Priority</span></h1>
            <p>
              Experience the future of healthcare. Book appointments with top
              specialists, consult online/offline, or book lab tests—all in one place.
            </p>

            <div className="search-box-container">
              <div className="search-box">
                <div className="search-input location">
                  <span className="icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg></span>
                  <input
                    type="text"
                    placeholder="West Bengal"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="search-input main-search">
                  <span className="icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg></span>
                  <input
                    type="text"
                    placeholder="Search doctors (e.g. Dentist)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button className="btn-search" onClick={handleSearch}>Search</button>
              </div>
            </div>

            <div className="hero-stats">
              <div className="hero-badges">
                <div className="badge-item">
                  <span className="badge-icon">🛡️</span> <span>Data Privacy</span>
                </div>
                <div className="badge-item">
                  <span className="badge-icon">👨‍⚕️</span> <span>Verified Doctors</span>
                </div>
                <div className="badge-item">
                  <span className="badge-icon">⚡</span> <span>Instant Booking</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-image">
            <div className="image-bg-blob"></div>
            <img
              src="doctorandpatient.png"
              alt="Doctor and Patient"
              className="main-img"
            />
          </div>
        </div>
      </header>

      <section className="symptom-section">
        <div className="symptom-container">
          {/* LEFT SIDE: INPUT */}
          <div className="symptom-left">
            <h2>Chat with Dr. Nirupama 👩‍⚕️</h2>
            <p>Describe your symptoms, and our junior assistant will guide you to the right specialist.</p>

            <textarea
              className="symptom-input"
              rows="3"
              placeholder={isLoggedIn
                ? "E.g., I have a severe toothache and sensitivity to cold water..."
                : "Please login to consult with Nirupama..."}
              value={symptomDesc}
              onChange={(e) => setSymptomDesc(e.target.value)}
            ></textarea>

            <button
              className="btn-analyze"
              onClick={handleAnalyzeSymptoms}
              disabled={isAnalyzing}
            >
              {isAnalyzing
                ? 'Consulting Database...'
                : (isLoggedIn ? 'Ask Nirupama' : 'Login to Ask')}
            </button>
          </div>

          {/* RIGHT SIDE: CHARACTER & SPEECH BUBBLE */}
          <div className="symptom-right">

            {/* 1. The Speech Bubble */}
            <div className={`speech-bubble ${suggestion ? 'has-result' : ''}`}>
              {isAnalyzing ? (
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              ) : suggestion ? (
                /* Result View */
                <div className="bubble-content fade-in">
                  <span className="bubble-title">I suggest seeing a:</span>
                  <h3 className="bubble-specialist">{suggestion.type}</h3>
                  <p className="bubble-desc">"{suggestion.message}"</p>
                  <button className="btn-bubble-action" onClick={() => navigate(`/doctors?specialization=${suggestion.type}`)}>
                    Find {suggestion.type}s
                  </button>
                </div>
              ) : (
                /* Idle View */
                <div className="bubble-content">
                  <p><strong>"Hi, I'm Nirupama!"</strong><br /> I'm here to help. Tell me how you're feeling today!</p>
                </div>
              )}
              {/* Little triangle for speech bubble */}
              <div className="bubble-arrow"></div>
            </div>

            {/* 2. The Girl Character Image */}
            <div className="character-wrapper">
              {/* Using a 3D cartoon doctor image */}
              <img
                src="image-removebg-preview.png"
                alt="Dr Nirupama"
                className={`ai-character ${isAnalyzing ? 'thinking' : ''}`}
              />
              <div className="character-shadow"></div>
            </div>

          </div>
        </div>
      </section>

      <section className="services-section">
        <div className="section-header">
          <h2>Top Specialties</h2>
          <p>Consult with experts in various fields</p>
        </div>

        <div className="services-grid">
          <div className="service-card">
            <img src="https://cdn-icons-png.flaticon.com/512/3004/3004458.png" alt="Dentist" />
            <h3>Dentist</h3>
            <p>Teething troubles?</p>
          </div>
          <div className="service-card">
            <img src="https://cdn-icons-png.flaticon.com/512/2966/2966486.png" alt="Cardiology" />
            <h3>Cardiology</h3>
            <p>For a healthy heart</p>
          </div>
          <div className="service-card">
            <img src="https://cdn-icons-png.flaticon.com/512/3209/3209045.png" alt="Nutrition" />
            <h3>Nutrition</h3>
            <p>Diet & Wellness</p>
          </div>
          <div className="service-card">
            <img src="https://cdn-icons-png.flaticon.com/512/387/387561.png" alt="Surgery" />
            <h3>General Medecine</h3>
            <p>Safe procedures</p>
          </div>
        </div>
      </section>

      <section className="cta-banner">
        <div className="cta-content">
          <h2>Download the Nirupama Care App</h2>
          <p>Get access to doctors, lab reports, and prescriptions on the go.</p>
          <div className="app-buttons">
            <button className="btn-store">App Store</button>
            <button className="btn-store">Google Play</button>
          </div>
        </div>
        <div className="cta-image">
          <img src="https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=600&q=80" alt="Mobile App" />
        </div>
      </section>
    </div>
  );
};

export default Home;