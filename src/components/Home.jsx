import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  // --- Symptom Checker State ---
  const [symptomDesc, setSymptomDesc] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- Search State ---
  const [location, setLocation] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // --- Auth State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    setLoaded(true);
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

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

    // Mock API call simulation
    setTimeout(() => {
        const text = symptomDesc.toLowerCase();
        let doctorType = "General Physician";
        let reason = "For a general checkup and initial diagnosis.";
  
        if (text.includes('tooth') || text.includes('gum') || text.includes('jaw')) {
          doctorType = "Dentist";
          reason = "It sounds like a dental issue.";
        } else if (text.includes('heart') || text.includes('chest') || text.includes('beat')) {
          doctorType = "Cardiologist";
          reason = "Chest or heart issues require a specialist.";
        } else if (text.includes('skin') || text.includes('rash') || text.includes('itch')) {
          doctorType = "Dermatologist";
          reason = "For skin related conditions.";
        } else if (text.includes('bone') || text.includes('fracture') || text.includes('joint')) {
          doctorType = "Orthopedic";
          reason = "For bone and joint health.";
        } else if (text.includes('stomach') || text.includes('digest') || text.includes('vomit')) {
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

  const handleLogout = () => {
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      setIsMenuOpen(false); // Close menu on logout
      navigate('/login');
  };

  const handleNavigation = (path) => {
      navigate(path);
      setIsMenuOpen(false); // Close menu on navigate
  };

  return (
    // STRICT ISOLATION WRAPPER
    <div id="home-page-root">
      
      {/* --- Navbar (Scoped Classes) --- */}
      <nav className="home-navbar">
        <div className="home-nav-container">
          <div className="home-nav-left">
            <div className="home-logo" onClick={() => navigate('/')}>
              <img src="nirupama1.png" alt="" className='home-logo-img'/>
            </div>
            
            {/* Desktop Links */}
            <ul className="home-primary-nav desktop-only">
              <li><a href="/doctors" className="active-link">Get Doctor</a></li>
              <li><a href="/video-consult">Video Consult</a></li>
              <li><a href="/lab-tests">Book Lab Test</a></li>
            </ul>
          </div>

          {/* Desktop Right Side */}
          <div className="home-nav-right desktop-only">
            <a href="/for-doctors" className="nav-link-secondary">For doctors</a>
            <a href="/security" className="nav-link-secondary">Security</a>
            <a href="/help" className="nav-link-secondary">Help</a>
            
            {isLoggedIn ? (
                <button className="home-btn-login" onClick={handleLogout}>
                  Logout
                </button>
            ) : (
                <button className="home-btn-login" onClick={() => navigate('/login')}>
                  Login / Signup
                </button>
            )}
          </div>

          {/* Mobile Hamburger */}
          <div className="home-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <div className={isMenuOpen ? "home-bar open" : "home-bar"}></div>
            <div className={isMenuOpen ? "home-bar open" : "home-bar"}></div>
            <div className={isMenuOpen ? "home-bar open" : "home-bar"}></div>
          </div>
        </div>

        {/* --- MOBILE MENU DROPDOWN (New) --- */}
        <div className={`home-mobile-menu ${isMenuOpen ? 'open' : ''}`}>
            <a onClick={() => handleNavigation('/doctors')}>Get Doctor</a>
            <a onClick={() => handleNavigation('/video-consult')}>Video Consult</a>
            <a onClick={() => handleNavigation('/lab-tests')}>Book Lab Test</a>
            <hr className="mobile-divider"/>
            <a onClick={() => handleNavigation('/for-doctors')}>For Doctors</a>
            <a onClick={() => handleNavigation('/security')}>Security</a>
            <a onClick={() => handleNavigation('/help')}>Help</a>
            <div className="mobile-auth-btn">
                {isLoggedIn ? (
                    <button className="home-btn-login full-width" onClick={handleLogout}>Logout</button>
                ) : (
                    <button className="home-btn-login full-width" onClick={() => handleNavigation('/login')}>Login / Signup</button>
                )}
            </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="hero-section">
        <div className={`hero-content ${loaded ? 'fade-in-up' : ''}`}>
          <div className="hero-text">
            <h1>Your Health, <br /> Our <span className="highlight">Priority</span></h1>
            <p>
              Experience the future of healthcare. Book appointments with top 
              specialists, consult online, or order medicines—all in one place.
            </p>
            
            <div className="search-box-container">
              <div className="search-box">
                <div className="search-input location">
                  <span className="icon">📍</span>
                  <input 
                    type="text" 
                    placeholder="West Bengal" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="search-input main-search">
                  <span className="icon">🔍</span>
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
              src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1000&auto=format&fit=crop" 
              alt="Doctor and Patient" 
              className="main-img"
            />
          </div>
        </div>
      </header>

      {/* --- SYMPTOM CHECKER --- */}
      <section className="symptom-section">
        <div className="symptom-container">
          <div className="symptom-left">
            <h2>Not sure who to consult?</h2>
            <p>Describe your symptoms below and our AI assistant will suggest the right specialist for you.</p>
            
            <textarea 
              className="symptom-input" 
              rows="3"
              placeholder={isLoggedIn 
                ? "E.g., I have a severe toothache and sensitivity to cold water..." 
                : "Please login to describe your symptoms..."}
              value={symptomDesc}
              onChange={(e) => setSymptomDesc(e.target.value)}
            ></textarea>

            <button 
              className="btn-analyze" 
              onClick={handleAnalyzeSymptoms}
              disabled={isAnalyzing}
            >
              {isAnalyzing 
                ? 'Analyzing...' 
                : (isLoggedIn ? 'Analyze Symptoms' : 'Login to Analyze')}
            </button>
          </div>

          <div className="symptom-right">
            {suggestion ? (
              <div className="suggestion-card fade-in">
                <div className="suggestion-icon">🩺</div>
                <h3>You should see a:</h3>
                <h2 className="doctor-type">{suggestion.type}</h2>
                <p>{suggestion.message}</p>
                <button className="btn-book-now" onClick={() => navigate(`/doctors?specialization=${suggestion.type}`)}>
                  Book {suggestion.type}
                </button>
              </div>
            ) : (
              <div className="suggestion-placeholder">
                <span style={{fontSize: '3rem'}}>🤖</span>
                <p>Results will appear here</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- SERVICES --- */}
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
            <h3>Surgery</h3>
            <p>Safe procedures</p>
          </div>
        </div>
      </section>

      {/* --- CTA BANNER --- */}
      <section className="cta-banner">
        <div className="cta-content">
          <h2>Download the Nirupama App</h2>
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