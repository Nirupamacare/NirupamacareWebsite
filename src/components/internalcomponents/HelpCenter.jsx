import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HelpCenter.css';

const HelpCenter = () => {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      id: 1,
      question: "How does the AI understand my symptoms?",
      answer: "Our AI processes natural language in both English and Bengali to categorize your health concerns. You can describe how you feel in your own words."
    },
    {
      id: 2,
      question: "Is this a replacement for a real doctor?",
      answer: "No. Nirupama Care is an AI healthcare guide. It helps you assess symptoms and connects you with professional doctors for consultations."
    },
    {
      id: 3,
      question: "How do I book a lab test?",
      answer: "You can book lab tests directly through the app and get timely reminders on your phone."
    },
    {
      id: 4,
      question: "What if I don't receive my OTP?",
      answer: "Ensure your mobile number is correct. If the code doesn't arrive, click 'Resend Now' on the verification page."
    },
    {
      id: 5,
      question: "Is my health data secure?",
      answer: "Yes, we use industry-standard encryption to protect your personal and medical data. We never share your health records without your explicit consent."
    }
  ];

  // Filtering Logic
  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="help-container">
      <header className="help-header">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <h1>Help Centre</h1>
      </header>

      <div className="help-content">
        <div className="search-bar-container">
          <input 
            type="text" 
            placeholder="Search for help (e.g., 'OTP', 'Booking')..." 
            className="help-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="faq-list">
          <h3>{searchQuery ? `Search Results (${filteredFaqs.length})` : 'Frequently Asked Questions'}</h3>
          
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => (
              <div 
                key={faq.id} 
                className={`faq-item ${activeId === faq.id ? 'open' : ''}`}
                onClick={() => setActiveId(activeId === faq.id ? null : faq.id)}
              >
                <div className="faq-question">
                  <span>{faq.question}</span>
                  <span className="chevron">{activeId === faq.id ? '−' : '+'}</span>
                </div>
                {activeId === faq.id && <div className="faq-answer">{faq.answer}</div>}
              </div>
            ))
          ) : (
            <p className="no-results">No results found for "{searchQuery}"</p>
          )}
        </div>

        
      </div>
      {/* Updated Contact Support Section */}
        <div className="contact-support-section">
          <div className="support-header">
            <h3>Still need help?</h3>
            <p>Our support team is available 24/7 to assist you.</p>
          </div>
          
          <div className="support-grid">
            <div className="support-card" onClick={() => window.open('https://wa.me/1234567890')}>
              <div className="support-icon whatsapp">💬</div>
              <div className="support-info">
                <strong>WhatsApp</strong>
                <span>Chat with us</span>
              </div>
            </div>

            <div className="support-card" onClick={() => window.location.href = 'mailto:support@nirupama.care'}>
              <div className="support-icon email">📧</div>
              <div className="support-info">
                <strong>Email Support</strong>
                <span>Get a response in 2h</span>
              </div>
            </div>

            <div className="support-card" onClick={() => window.location.href = 'tel:+1234567890'}>
              <div className="support-icon phone">📞</div>
              <div className="support-info">
                <strong>Call Us</strong>
                <span>Direct helpline</span>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default HelpCenter;