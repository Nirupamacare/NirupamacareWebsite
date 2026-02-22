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
import DoctorProfileView from './components/DoctorProfileView';
import DoctorProfileSetup from './components/DoctorProfileSetup';
import DoctorAuth from './components/DoctorAuth';
import DoctorDashboard from './components/DoctorDashboard';
import DoctorProfileEdit from './components/DoctorProfileEdit';
import UserProfileView from "./components/UserProfileView";
import AppointmentBooking from "./components/AppointmentBooking";
import MyAppointments from "./components/MyAppointments";
import MedicalRecords from "./components/MedicalRecords";
import AdminPanel from "./components/AdminPanel";
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
            <Route path="/doctor-profile/:doctorId" element={<DoctorProfileView />} />
            <Route path="/book-appointment/:doctorId" element={<AppointmentBooking />} />
            <Route path="/my-appointments" element={<MyAppointments />} />
            <Route path="/medical-records" element={<MedicalRecords />} />
            <Route path="/intro" element={<Intro />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/security" element={<Security />} />
            <Route path="/doctor-login" element={<DoctorAuth />} />
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/userprofilesetup" element={<UserProfileSetup />} />
            <Route path="/doctor-setup" element={<DoctorProfileSetup />} />
            <Route path="/doctor-edit" element={<DoctorProfileEdit />} />
            <Route path="/view-profile" element={<UserProfileView />} />
            <Route path="/verify-otp" element={<Otp />} />
            <Route path="/admin" element={<AdminPanel />} />
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
