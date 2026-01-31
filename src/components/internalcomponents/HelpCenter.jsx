import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ChevronUp, MessageCircle, Mail, Phone, HelpCircle, Send, X, MessageSquare } from 'lucide-react';
import './HelpCenter.css';

const HelpCenter = () => {
  const navigate = useNavigate();

  // --- Navbar State ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // --- Help Center Logic ---
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
      answer: "You can book lab tests directly through the app services section. Select 'Lab Tests', choose your package, and schedule a home collection."
    },
    {
      id: 4,
      question: "What if I don't receive my OTP?",
      answer: "Ensure your mobile number is correct. If the code doesn't arrive within 60 seconds, click 'Resend Now' on the verification page."
    },
    {
      id: 5,
      question: "Is my health data secure?",
      answer: "Yes, we use industry-standard 256-bit encryption to protect your personal and medical data. We never share your health records without your explicit consent."
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- CHATBOT LOGIC ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi there! 👋 I'm the Nirupama. How can I help you today?", sender: 'bot' }
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isChatOpen]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    // Add User Message
    const newMsg = { id: Date.now(), text: inputMsg, sender: 'user' };
    setMessages(prev => [...prev, newMsg]);
    setInputMsg("");
    setIsTyping(true);

    // Simulate AI Response
    setTimeout(() => {
      const botResponse = generateBotResponse(newMsg.text);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: botResponse, sender: 'bot' }]);
      setIsTyping(false);
    }, 1000);
  };

  // Simple Keyword Matcher for "AI" Logic
  const generateBotResponse = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('hello') || lower.includes('hi')) return "Hello! How can I assist you with your health journey today?";
    if (lower.includes('otp') || lower.includes('login')) return "If you're having trouble with OTP, please check your signal or try the 'Resend' button after 60 seconds.";
    if (lower.includes('book') || lower.includes('appointment')) return "To book an appointment, go to the 'Find Doctors' page, select a specialist, and choose a time slot.";
    if (lower.includes('doctor')) return "We have verified specialists. You can filter them by location and specialty.";
    if (lower.includes('price') || lower.includes('cost') || lower.includes('fee')) return "Consultation fees vary by doctor, starting from ₹299. Lab tests have their own specific pricing.";
    if (lower.includes('lab') || lower.includes('test')) return "You can book home sample collections for lab tests from the 'Services' section.";
    return "I'm not sure about that. Please try searching in our Help Center or contact our support team via WhatsApp.";
  };

  return (
    // STRICT ISOLATION WRAPPER
    <div id="help-page-root">

      {/* --- Navbar (Scoped Classes) --- */}
      <nav className="help-navbar">
        <div className="help-nav-container">
          <div className="help-logo">
            <img src="nirupama1.png" className="help-logo-img" alt="Logo" />
          </div>
          <div className="help-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <div className={isMenuOpen ? "help-bar open" : "help-bar"}></div>
            <div className={isMenuOpen ? "help-bar open" : "help-bar"}></div>
            <div className={isMenuOpen ? "help-bar open" : "help-bar"}></div>
          </div>
          <ul className={isMenuOpen ? "help-nav-links active" : "help-nav-links"}>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About Us</a></li>
            <li><a href="/doctors">Find Doctors</a></li>
            <li><a href="/help" className="help-active-nav-item">Help</a></li>
          </ul>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <div className="help-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="fade-in-up">How can we help you?</h1>
          <p className="fade-in-up delay-1">Search our knowledge base or get in touch.</p>
          <div className="search-wrapper fade-in-up delay-2">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search for answers (e.g., 'OTP', 'Booking')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="help-body">
        {/* FAQ Section */}
        <div className="faq-section fade-in-up delay-3">
          <div className="section-header">
            <HelpCircle size={24} className="section-icon" />
            <h3>{searchQuery ? `Search Results (${filteredFaqs.length})` : 'Frequently Asked Questions'}</h3>
          </div>
          <div className="faq-list">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className={`faq-item ${activeId === faq.id ? 'active' : ''}`}
                  onClick={() => setActiveId(activeId === faq.id ? null : faq.id)}
                >
                  <div className="faq-question">
                    <span>{faq.question}</span>
                    {activeId === faq.id ? <ChevronUp size={20} className="chevron" /> : <ChevronDown size={20} className="chevron" />}
                  </div>
                  <div className={`faq-answer ${activeId === faq.id ? 'show' : ''}`}>
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                <p>No results found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Support Section */}
        <div className="support-section fade-in-up delay-4">
          <div className="support-header">
            <h3>Still need help?</h3>
            <p>Our support team is available 24/7 to assist you.</p>
          </div>
          <div className="support-grid">
            <div className="support-card whatsapp" onClick={() => window.open('https://wa.me/1234567890')}>
              <div className="icon-circle"><MessageCircle size={24} /></div>
              <div className="card-info">
                <strong>WhatsApp</strong>
                <span>Chat instantly</span>
              </div>
            </div>
            <div className="support-card email" onClick={() => window.location.href = 'mailto:support@nirupama.care'}>
              <div className="icon-circle"><Mail size={24} /></div>
              <div className="card-info">
                <strong>Email Us</strong>
                <span>Response in 2h</span>
              </div>
            </div>
            <div className="support-card phone" onClick={() => window.location.href = 'tel:+1234567890'}>
              <div className="icon-circle"><Phone size={24} /></div>
              <div className="card-info">
                <strong>Call Now</strong>
                <span>Direct helpline</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CHATBOT WIDGET --- */}
      <div className="chatbot-wrapper">
        {/* Toggle Button */}
        <button
          className={`chat-toggle-btn ${isChatOpen ? 'hide' : ''}`}
          onClick={() => setIsChatOpen(true)}
        >
          <MessageSquare size={24} />
          <span>Chat Help</span>
        </button>

        {/* Chat Window */}
        <div className={`chat-window ${isChatOpen ? 'open' : ''}`}>
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="status-dot"></div>
              <span>Nirupama</span>
            </div>
            <button className="close-chat" onClick={() => setIsChatOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                <div className="message-bubble">{msg.text}</div>
              </div>
            ))}
            {isTyping && (
              <div className="message bot">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Type a question..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
            />
            <button type="submit" className="send-btn">
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};

export default HelpCenter;