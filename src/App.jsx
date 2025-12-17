import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import LanguageSelect from "./components/LanguageSelect";
import Splashscreen from "./components/Splashscreen";
import Intro from "./components/Intro";
import HelpCenter from "./components/internalcomponents/HelpCenter";
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
            <Route path="/language-select" element={<LanguageSelect />} />
            <Route path="/intro" element={<Intro />} />
            <Route path="/help" element={<HelpCenter />} />
          </Routes>
        </main>

      {/* GLOBAL FOOTER */}
      <footer className="footer">
        <div className="footer-links">
          <a href="#">About</a>
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
