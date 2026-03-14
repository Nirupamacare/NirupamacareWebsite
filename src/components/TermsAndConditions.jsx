import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TermsAndConditions.css';

const sections = [
  { title: 'Acceptance of Terms' },
  { title: 'User Registration & Accounts' },
  { title: 'Use of Medical Services' },
  { title: 'Doctor Responsibilities' },
  { title: 'Payment & Cancellations' },
  { title: 'Limitation of Liability' },
  { title: 'Modifications to Terms' },
  { title: 'Contact Information' },
];

const TermsAndConditions = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div id="terms-page-root">
      
      {/* Navbar */}
      <nav className="terms-navbar">
        <div className="terms-nav-container">
          <div className="terms-logo" onClick={() => navigate('/home')}>
             <img src="nirupama1.png" className="terms-logo-img" alt="Logo" />   
          </div>
          <div className="terms-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <div className={isMenuOpen ? "terms-bar open" : "terms-bar"}></div>
            <div className={isMenuOpen ? "terms-bar open" : "terms-bar"}></div>
            <div className={isMenuOpen ? "terms-bar open" : "terms-bar"}></div>
          </div>
          <ul className={isMenuOpen ? "terms-nav-links active" : "terms-nav-links"}>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About Us</a></li>
            <li><a href="/doctors">Find Doctors</a></li>
            <li><a href="/help">Help</a></li>
          </ul>
        </div>
      </nav>

      <div className="terms-card">

        {/* Page Header */}
        <div className="terms-header">
          <div className="terms-header-badge">Legal Agreement</div>
          <h1>Terms & Conditions</h1>
          <p className="terms-last-updated">Last Updated: March 14, 2026</p>
        </div>

        {/* Table of Contents */}
        <div className="terms-toc">
          {sections.map((s, i) => (
            <a
              key={i}
              href={`#terms-section-${i + 1}`}
              className="terms-toc-item"
            >
              {i + 1}. {s.title}
            </a>
          ))}
        </div>

        {/* Sections */}
        <div className="terms-sections">

          <div className="terms-section" id="terms-section-1">
            <div className="terms-section-title">
              <h2>1. Acceptance of Terms</h2>
            </div>
            <p>
              By accessing and using the Nirupama Care platform ("Service"), you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our Service. These terms apply to all visitors, users, doctors, and others who access or use the Service.
            </p>
          </div>

          <div className="terms-section" id="terms-section-2">
            <div className="terms-section-title">
              <h2>2. User Registration & Accounts</h2>
            </div>
            <ul>
              <li><strong>Accuracy:</strong> You must provide accurate, complete, and current information upon registration.</li>
              <li><strong>Security:</strong> You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.</li>
              <li><strong>Termination:</strong> We reserve the right to suspend or terminate accounts that provide false information, impersonate others, or violate these terms.</li>
            </ul>
          </div>

          <div className="terms-section" id="terms-section-3">
            <div className="terms-section-title">
              <h2>3. Use of Medical Services</h2>
            </div>
            <p>Nirupama Care acts as an intermediary linking patients with medical professionals. Please note:</p>
            <ul>
              <li>Our platform provides a medium for online consultations but does not replace emergency medical services. In severe emergencies, please visit your nearest hospital immediately.</li>
              <li>Prescriptions are generated based on the information you provide during consultation. Ensure you disclose all relevant medical history.</li>
            </ul>
          </div>

          <div className="terms-section" id="terms-section-4">
            <div className="terms-section-title">
              <h2>4. Doctor Responsibilities</h2>
            </div>
            <p>
              Doctors registered on the platform are independent practitioners. They must:
            </p>
            <ul>
              <li>Maintain valid licenses and registrations according to the medical council of their respective jurisdiction.</li>
              <li>Ensure that tele-consultations and digital prescriptions conform to standard medical procedures.</li>
              <li>Maintain patient confidentiality and properly handle sensitive health data.</li>
            </ul>
          </div>

          <div className="terms-section" id="terms-section-5">
            <div className="terms-section-title">
              <h2>5. Payment & Cancellations</h2>
            </div>
            <p>
              Nirupama Care strictly enforces its payment policies:
            </p>
            <ul>
              <li><strong>Payments:</strong> All consultation and booking fees must be paid in advance through our authorized payment gateways.</li>
              <li><strong>Cancellations:</strong> Users can cancel appointments up to 12 hours before the scheduled time for a full refund. Cancellations made within 12 hours may incur a penalty.</li>
            </ul>
          </div>

          <div className="terms-section" id="terms-section-6">
            <div className="terms-section-title">
              <h2>6. Limitation of Liability</h2>
            </div>
            <p>
              Nirupama Care, its directors, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential or punitive damages, including loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of (or inability to access or use) the service.
            </p>
          </div>
          
          <div className="terms-section" id="terms-section-7">
            <div className="terms-section-title">
              <h2>7. Modifications to Terms</h2>
            </div>
            <p>
              We reserve the right to modify or replace these Terms at any time at our sole discretion. It is your responsibility to review these Terms periodically for changes. Your continued use of the platform following the posting of any changes constitutes acceptance of those changes.
            </p>
          </div>

          <div className="terms-section" id="terms-section-8">
            <div className="terms-section-title">
              <h2>8. Contact Information</h2>
            </div>
            <p>
              If you have any questions, concerns, or legal inquiries regarding these Terms and Conditions, please contact us:
            </p>
            <div className="terms-contact-box">
              <p>Email our Legal Team</p>
              <span className="terms-contact-email">nirupamacare@gmail.com</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default TermsAndConditions;
