import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Stethoscope, ArrowRight } from 'lucide-react';
import { api } from '../api'; // Ensure this points to your api.js file
import './DoctorAuth.css';

const DoctorAuth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true); // Toggles between Login & Signup
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Navbar state

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',       // Only for Signup
    email: '',
    password: '',
    confirmPassword: ''  // Only for Signup
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Clear errors when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // --- LOGIN LOGIC ---
        const response = await api.login(formData.email, formData.password);

        // Security Check: Ensure the user is actually a doctor
        // (Assuming your login response includes the role, otherwise check /me endpoint)
        if (response.role && response.role !== 'doctor') {
          throw new Error("Access Denied. This portal is for Doctors only.");
        }

        // Redirect to Dashboard
        navigate('/doctor-dashboard');

      } else {
        // --- SIGN UP LOGIC ---
        if (formData.password.length < 8) {
          throw new Error('Password must be at least 8 characters.');
        }
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match");
        }

        // 1. Register the Doctor
        await api.register({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: 'doctor' // Critical: Registers them as a doctor
        });

        // 2. Auto-login immediately after signup
        await api.login(formData.email, formData.password);

        // 3. Redirect to Setup Page (First-time flow)
        navigate('/doctor-setup');
      }

    } catch (err) {
      console.error(err);
      setError(err.message || "Authentication failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="doctor-auth-root">
      <nav className="auth-navbar">
        <div className="auth-nav-container">
          <div className="auth-logo">
            <img src="nirupama1.png" className="auth-logo-icon" alt="Logo" />
          </div>
          <div className="auth-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <div className={isMenuOpen ? "auth-bar open" : "auth-bar"}></div>
            <div className={isMenuOpen ? "auth-bar open" : "auth-bar"}></div>
            <div className={isMenuOpen ? "auth-bar open" : "auth-bar"}></div>
          </div>
          <ul className={isMenuOpen ? "auth-nav-links active" : "auth-nav-links"}>
            <li><a href="/home">Home</a></li>
            <li><a href="/about">About Us</a></li>
          </ul>
        </div>
      </nav>

      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="brand-badge">
            <Stethoscope size={20} />
            <span>Nirupama For Doctors</span>
          </div>
          <h2>{isLogin ? 'Welcome Back, Doctor' : 'Join Our Network'}</h2>
          <p className="sub-text">
            {isLogin
              ? 'Login to manage your patients and appointments.'
              : 'Create your clinic profile today.'}
          </p>
        </div>

        {/* Error Message Display */}
        {error && <div className="auth-error">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">

          {/* Full Name - Signup Only */}
          {!isLogin && (
            <div className="input-group">
              <User size={18} className="input-icon" />
              <input
                type="text"
                name="full_name"
                placeholder="Full Name (e.g. Dr. John Doe)"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>
          )}

          {/* Email */}
          <div className="input-group">
            <Mail size={18} className="input-icon" />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password */}
          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Confirm Password - Signup Only */}
          {!isLogin && (
            <div className="input-group">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Login to Dashboard' : 'Create Account')}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Toggle Login/Signup */}
        <div className="auth-footer">
          <p>
            {isLogin ? "New to Nirupama Care?" : "Already have an account?"}
            <button
              type="button"
              className="link-btn"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
            >
              {isLogin ? "Register Here" : "Login Here"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorAuth;