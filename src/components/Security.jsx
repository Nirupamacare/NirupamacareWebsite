import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Server, Eye, FileKey, CheckCircle, AlertTriangle } from 'lucide-react';
import './Security.css';

const Security = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    // STRICT ISOLATION WRAPPER
    <div id="security-page-root">
      
      {/* --- Navbar (Scoped) --- */}
      <nav className="security-navbar">
        <div className="security-nav-container">
          <div className="security-logo" onClick={() => navigate('/')}>
             <img src="nirupama1.png" className="security-logo-img" alt="Logo" />   
          </div>
          
          <div className="security-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <div className={isMenuOpen ? "security-bar open" : "security-bar"}></div>
            <div className={isMenuOpen ? "security-bar open" : "security-bar"}></div>
            <div className={isMenuOpen ? "security-bar open" : "security-bar"}></div>
          </div>

          <ul className={isMenuOpen ? "security-nav-links active" : "security-nav-links"}>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About Us</a></li>
            <li><a href="/doctors">Find Doctors</a></li>
            <li><a href="/help">Help</a></li>
          </ul>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <header className="security-hero">
        <div className="hero-content fade-in-up">
          <div className="hero-icon-wrapper">
            <ShieldCheck size={64} className="hero-main-icon" />
          </div>
          <h1>Your Data, Our <span className="highlight">Fortress</span></h1>
          <p>
            At Nirupama, we treat your medical data with the same urgency as your health. 
            Protected by military-grade encryption and 24/7 monitoring.
          </p>
          <div className="hero-badges">
            <span className="badge">
                <CheckCircle size={16} /> ISO 27001 Certified
            </span>
            <span className="badge">
                <CheckCircle size={16} /> HIPAA Compliant
            </span>
          </div>
        </div>
      </header>

      {/* --- Key Security Features --- */}
      <section className="security-section">
        <div className="security-container">
            <div className="section-title">
                <h2>Uncompromising Security Layers</h2>
                <p>We use a multi-layered approach to keep your information safe.</p>
            </div>

            <div className="features-grid">
                <div className="feature-card delay-1">
                    <div className="icon-box"><Lock size={32} /></div>
                    <h3>End-to-End Encryption</h3>
                    <p>Your chats, prescriptions, and reports are encrypted in transit and at rest using AES-256 standards.</p>
                </div>
                <div className="feature-card delay-2">
                    <div className="icon-box"><Server size={32} /></div>
                    <h3>Secure Cloud Storage</h3>
                    <p>Data is stored in isolated, high-security data centers with redundant backups to prevent data loss.</p>
                </div>
                <div className="feature-card delay-3">
                    <div className="icon-box"><Eye size={32} /></div>
                    <h3>Access Control</h3>
                    <p>Strict role-based access ensures only you and your authorized doctors can view your medical history.</p>
                </div>
            </div>
        </div>
      </section>

      {/* --- Visual Explanation Section --- */}
      <section className="security-section bg-mint">
        <div className="security-container split-layout">
            <div className="split-image">
                <img 
                    src="https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" 
                    alt="Secure Technology" 
                    className="rounded-img"
                />
            </div>
            <div className="split-text">
                <h2>How we handle your data</h2>
                <ul className="data-list">
                    <li>
                        <FileKey className="list-icon"/>
                        <div>
                            <strong>Anonymized Analytics</strong>
                            <p>We only use stripped, anonymous data for improving our AI, never your personal identity.</p>
                        </div>
                    </li>
                    <li>
                        <AlertTriangle className="list-icon"/>
                        <div>
                            <strong>Breach Prevention</strong>
                            <p>Our systems undergo weekly penetration testing by ethical hackers to identify vulnerabilities.</p>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
      </section>

      {/* --- User Best Practices --- */}
      <section className="security-section">
        <div className="security-container">
            <div className="tips-box">
                <h3><ShieldCheck size={24}/> Security Tips for You</h3>
                <div className="tips-grid">
                    <div className="tip">
                        <span className="tip-num">1</span>
                        <p>Never share your OTP with anyone, including Nirupama staff.</p>
                    </div>
                    <div className="tip">
                        <span className="tip-num">2</span>
                        <p>Enable fingerprint or Face ID lock for the Nirupama App.</p>
                    </div>
                    <div className="tip">
                        <span className="tip-num">3</span>
                        <p>Log out if you are accessing the portal from a public computer.</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="security-footer">
        <p>© 2025 Nirupama Health. Secure & Trusted.</p>
      </footer>

    </div>
  );
};

export default Security;