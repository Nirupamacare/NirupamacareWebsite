import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PrivacyPolicy.css';

const sections = [
  { icon: '✦', title: 'Introduction' },
  { icon: '✦', title: 'Information We Collect' },
  { icon: '✦', title: 'How We Use Your Data' },
  { icon: '✦', title: 'Data Security & Encryption' },
  { icon: '✦', title: 'Your Rights' },
  { icon: '✦', title: 'Contact Us' },
];

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div id="privacy-page-root">

      {/* Navbar (matching Setup/Home pages) */}
      <nav className="privacy-navbar">
        <div className="privacy-nav-container">
          <div className="privacy-logo" onClick={() => navigate('/home')}>
            <img src="nirupama1.png" className="privacy-logo-img" alt="Logo" />
          </div>
          <div className="privacy-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <div className={isMenuOpen ? "privacy-bar open" : "privacy-bar"}></div>
            <div className={isMenuOpen ? "privacy-bar open" : "privacy-bar"}></div>
            <div className={isMenuOpen ? "privacy-bar open" : "privacy-bar"}></div>
          </div>
          <ul className={isMenuOpen ? "privacy-nav-links active" : "privacy-nav-links"}>

            <li><a href="/about">About Us</a></li>
            <li><a href="/help">Help</a></li>
          </ul>
        </div>
      </nav>

      <div className="privacy-card">

        {/* Page Header */}
        <div className="privacy-header">

          <h1>Privacy Policy</h1>
          <p className="privacy-last-updated">Last Updated: March 14, 2026</p>
        </div>

        {/* Table of Contents */}
        <div className="privacy-toc">
          {sections.map((s, i) => (
            <a
              key={i}
              href={`#privacy-section-${i + 1}`}
              className="privacy-toc-item"
            >
              {i + 1}. {s.title}
            </a>
          ))}
        </div>

        {/* Sections */}
        <div className="privacy-sections">

          <div className="privacy-section" id="privacy-section-1">
            <div className="privacy-section-title">
              <h2>1. Introduction</h2>
            </div>
            <p>
              Welcome to Nirupama Care. We are committed to protecting the personal and medical data of our users,
              including doctors and patients, in compliance with the Digital Personal Data Protection (DPDP) Act of India.
            </p>
          </div>

          <div className="privacy-section" id="privacy-section-2">
            <div className="privacy-section-title">
              <h2>2. Information We Collect</h2>
            </div>
            <ul>
              <li><strong>For Doctors:</strong> Professional qualifications, registration numbers, clinic details, and experience.</li>
              <li><strong>For Patients:</strong> Name, contact details, appointment history, and medical records.</li>
              <li><strong>Medical Data:</strong> Digital prescriptions, diagnosis notes, and health-related documents.</li>
            </ul>
          </div>

          <div className="privacy-section" id="privacy-section-3">
            <div className="privacy-section-title">
              <h2>3. How We Use Your Data</h2>
            </div>
            <p>We process your data for the following purposes:</p>
            <ul>
              <li>To facilitate medical appointments and digital consultations.</li>
              <li>To manage digital prescriptions and patient medical histories.</li>
              <li>To verify the credentials of registered medical practitioners.</li>
              <li>To comply with regulatory healthcare record-keeping requirements.</li>
            </ul>
          </div>

          <div className="privacy-section" id="privacy-section-4">
            <div className="privacy-section-title">
              <h2>4. Data Security &amp; Encryption</h2>
            </div>
            <p>
              Your health information is sensitive personal data. We implement industry-standard AES-256 encryption
              for all stored medical records and prescriptions. Access is strictly role-based, ensuring that only
              authorized personnel can view your data.
            </p>
          </div>

          <div className="privacy-section" id="privacy-section-5">
            <div className="privacy-section-title">
              <h2>5. Your Rights</h2>
            </div>
            <p>Under the DPDP Act, you have the right to:</p>
            <ul>
              <li>Access your personal data held by us.</li>
              <li>Request corrections to inaccurate information.</li>
              <li>Withdraw your consent for data processing at any time.</li>
              <li>Request the deletion of your data once it is no longer required for legal or clinical purposes.</li>
            </ul>
          </div>

          <div className="privacy-section" id="privacy-section-6">
            <div className="privacy-section-title">
              <h2>6. Contact Us</h2>
            </div>
            <p>
              Questions about this policy or wish to exercise your rights? Contact our Data Protection Officer below:
            </p>
            <div className="privacy-contact-box">
              <p>Email our Data Protection Officer</p>
              <span className="privacy-contact-email">nirupamacare@gmail.com</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicy;

