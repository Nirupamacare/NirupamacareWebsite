import React, { useState } from 'react';
import './About.css';
import { Heart, Shield, Activity, Search, Calendar, Smile, ShieldCheck, Lock, Headphones } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const About = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    // WRAPPER ID to isolate styles
    <div id="about-page-root">

      {/* --- Navbar (Scoped Classes) --- */}
      <nav className="about-navbar">
        <div className="about-nav-container">
          <div className="about-logo" onClick={() => navigate('/')}>
            <img src="nirupama1.png" className="about-logo-img" alt="Logo" />
          </div>

          <div className="about-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <div className={isMenuOpen ? "about-bar open" : "about-bar"}></div>
            <div className={isMenuOpen ? "about-bar open" : "about-bar"}></div>
            <div className={isMenuOpen ? "about-bar open" : "about-bar"}></div>
          </div>

          <ul className={isMenuOpen ? "about-nav-links active" : "about-nav-links"}>
            <li><a href="/home">Home</a></li>
            <li><a href="/about" className="about-active-link">About Us</a></li>
            <li><a href="/doctors">Find Doctors</a></li>
            <li><a href="/help">Help</a></li>
          </ul>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <header className="about-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Healing with <span className="highlight">Compassion</span></h1>
          <p>Bridging the gap between patients and world-class healthcare.</p>
        </div>
      </header>

      {/* --- Values Section --- */}
      <section className="about-section bg-white">
        <div className="about-container">
          <div className="value-grid">
            <div className="value-card">
              <div className="icon-box"><Heart size={32} /></div>
              <h3>Patient First</h3>
              <p>Your health and comfort are our top priorities. We listen, we care, and we heal.</p>
            </div>
            <div className="value-card">
              <div className="icon-box"><Shield size={32} /></div>
              <h3>Trusted Care</h3>
              <p>Verified doctors and secure health records you can rely on, 24/7.</p>
            </div>
            <div className="value-card">
              <div className="icon-box"><Activity size={32} /></div>
              <h3>Modern Tech</h3>
              <p>Leveraging AI and digital tools to simplify appointments and diagnosis.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Story Section --- */}
      <section className="about-section bg-gray">
        <div className="about-container split-layout">
          <div className="story-image-wrapper">
            <img
              src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
              alt="Our Beginning"
              className="story-img"
            />
          </div>
          <div className="story-content">
            <h2>Our Journey</h2>
            <p>
              Founded in 2025, Nirupama Health started with a simple idea:
              <strong> Healthcare should be accessible to everyone, everywhere.</strong>
            </p>
            <p>
              What began as a small project to digitize patient records has grown into a
              comprehensive ecosystem. We believe in a future where quality medical advice is just a click away.
            </p>
          </div>
        </div>
      </section>

      {/* --- Standards Section --- */}
      <section className="about-section bg-white">
        <div className="about-container">
          <div className="section-header">
            <h2>Our Standards</h2>
            <p>We refuse to compromise on quality, security, or trust.</p>
          </div>

          <div className="standards-grid">
            <div className="standard-card">
              <div className="s-icon"><ShieldCheck size={36} /></div>
              <h3>100% Verified</h3>
              <p>Every doctor on Nirupama undergoes a rigorous 3-step verification process covering degrees, medical registration, and practice history.</p>
            </div>
            <div className="standard-card">
              <div className="s-icon"><Lock size={36} /></div>
              <h3>Data Privacy</h3>
              <p>Your health data is sacred. We use military-grade 256-bit encryption and are fully compliant with digital health data protection laws.</p>
            </div>
            <div className="standard-card">
              <div className="s-icon"><Headphones size={36} /></div>
              <h3>24/7 Support</h3>
              <p>Healthcare doesn't stop at 5 PM. Our dedicated support team is available round the clock to assist with bookings and urgent queries.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- How It Works --- */}
      <section className="about-section bg-gray process-section">
        <div className="about-container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Simplified healthcare in three easy steps.</p>
          </div>

          <div className="process-grid">
            {/* Step 1 */}
            <div className="process-step">
              <div className="step-icon-wrapper">
                <Search size={40} />
                <span className="step-number">1</span>
              </div>
              <h3>Find a Specialist</h3>
              <p>Search by symptoms, specialty, or doctor name. Filter by location and availability.</p>
            </div>

            {/* Step 2 */}
            <div className="process-step">
              <div className="step-icon-wrapper">
                <Calendar size={40} />
                <span className="step-number">2</span>
              </div>
              <h3>Book Instantly</h3>
              <p>Choose a time slot that works for you and confirm your appointment in seconds.</p>
            </div>

            {/* Step 3 */}
            <div className="process-step">
              <div className="step-icon-wrapper">
                <Smile size={40} />
                <span className="step-number">3</span>
              </div>
              <h3>Get Better</h3>
              <p>Visit the clinic or consult online. Access your prescriptions digitally anytime.</p>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
};

export default About;