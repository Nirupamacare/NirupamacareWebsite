import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import LanguageSelect from "./components/LanguageSelect";
import Splashscreen from "./components/Splashscreen";
import Intro from "./components/Intro";
import HelpCenter from "./components/internalcomponents/HelpCenter";
import Home from "./components/Home";
import UserProfileSetup from "./components/Userprofilesetup";
import Login from "./components/Login";
import About from "./components/About";
import Security from "./components/Security";
import Otp from "./components/Otp";
import Doctors from "./components/Doctors";
import AppointmentBooking from "./components/AppointmentBooking";
import "./App.css";

const SplashWrapper = () => {
  const navigate = useNavigate();
  return <Splashscreen onLoadingComplete={() => navigate("/language-select")} />;
};

function App() {
  return (
    <Router>
      <div className="app-container">

        {/* MAIN CONTENT */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<SplashWrapper />} />
            <Route path="/language" element={<LanguageSelect />} />
            <Route path="/home" element={<Home />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/book-appointment/:doctorId" element={<AppointmentBooking />} />
            <Route path="/intro" element={<Intro />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/security" element={<Security />} />
            <Route path="/userprofilesetup" element={<UserProfileSetup />} />
            <Route path="/verify-otp" element={<Otp />} />
          </Routes>
        </main>

        {/* GLOBAL FOOTER */}
        <footer className="footer">
          <div className="footer-links">
            <a href="/about">About</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms</a>
          </div>

          <div className="footer-text">
            © 2025 Nirupamacare. All rights reserved.
          </div>
        </footer>

      </div>
    </Router>
  );
}

export default App;
