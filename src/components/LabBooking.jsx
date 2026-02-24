import { useState, useEffect } from "react";
import { api } from "../api";

const STATUS_COLORS = {
  Pending: { bg: "#fff7e6", color: "#b45309" },
  Confirmed: { bg: "#e8f5e9", color: "#166534" },
  Cancelled: { bg: "#fef2f2", color: "#991b1b" },
  Completed: { bg: "#eff6ff", color: "#1e40af" },
};

export default function BookLab() {
  const [view, setView] = useState("search"); // search | detail | book | mybookings
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  // Search
  const [city, setCity] = useState("");
  const [test, setTest] = useState("");

  // Booking form
  const [form, setForm] = useState({ test_name: "", scheduled_date: "", scheduled_time: "", notes: "" });
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await api.searchLabs({ city, test });
      setLabs(res);
    } catch (e) {
      showToast("Search failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { handleSearch(); }, []);

  const loadMyBookings = async () => {
    setLoading(true);
    try {
      const res = await api.getPatientLabBookings();
      setMyBookings(res);
    } catch (e) {
      showToast("Could not load bookings");
    } finally {
      setLoading(false);
    }
  };

  const openBookingView = () => {
    setForm({ test_name: selectedLab.tests_offered?.[0] || "", scheduled_date: "", scheduled_time: "", notes: "" });
    setBooked(false);
    setView("book");
  };

  const handleBook = async () => {
    if (!form.test_name || !form.scheduled_date || !form.scheduled_time) {
      showToast("Please fill in all required fields");
      return;
    }
    setBooking(true);
    try {
      await api.bookLabTest({ lab_id: selectedLab.id, ...form });
      setBooked(true);
      showToast("Booking confirmed!");
    } catch (e) {
      showToast(e?.response?.data?.detail || "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div style={styles.page}>
      {toast && <div style={styles.toast}>{toast}</div>}

      {/* Top Nav */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.brand}>
         
          </div>
          <nav style={styles.headerNav}>
            <button style={{ ...styles.navLink, ...(["search", "detail", "book"].includes(view) ? styles.navLinkActive : {}) }} onClick={() => setView("search")}>
              Find Labs
            </button>
            <button
              style={{ ...styles.navLink, ...(view === "mybookings" ? styles.navLinkActive : {}) }}
              onClick={() => { setView("mybookings"); loadMyBookings(); }}
            >
              My Bookings
            </button>
          </nav>
        </div>
      </header>

      <div style={styles.body}>

        {/* ===== SEARCH ===== */}
        {view === "search" && (
          <div style={styles.searchView}>
            <div style={styles.hero}>
              <h1 style={styles.heroTitle}>Find a diagnostic lab near you</h1>
              <p style={styles.heroSub}>Search across hundreds of labs. Book tests instantly.</p>
              <div style={styles.searchBar}>
                <div style={styles.searchField}>
                  <span style={styles.searchIcon}>📍</span>
                  <input
                    style={styles.searchInput}
                    placeholder="City or area"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <div style={styles.searchDivider} />
                <div style={styles.searchField}>
                  <span style={styles.searchIcon}>🔬</span>
                  <input
                    style={styles.searchInput}
                    placeholder="Test name (e.g. HbA1c)"
                    value={test}
                    onChange={(e) => setTest(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <button style={styles.searchBtn} onClick={handleSearch}>
                  {loading ? "…" : "Search"}
                </button>
              </div>
            </div>

            {loading && <div style={styles.loadingRow}><div style={styles.spinner} /></div>}

            {!loading && labs.length === 0 && (
              <div style={styles.empty}>
                <span style={{ fontSize: 40 }}>🔭</span>
                <p>No labs found. Try a different city or test.</p>
              </div>
            )}

            <div style={styles.labGrid}>
              {labs.map((lab) => (
                <LabCard
                  key={lab.id}
                  lab={lab}
                  onClick={() => { setSelectedLab(lab); setView("detail"); }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ===== DETAIL ===== */}
        {view === "detail" && selectedLab && (
          <div style={styles.detailView}>
            <button style={styles.backBtn} onClick={() => setView("search")}>← Back to results</button>
            <div style={styles.detailCard}>
              <div style={styles.detailHeader}>
                {selectedLab.logo_url ? (
                  <img src={selectedLab.logo_url} alt="logo" style={styles.detailLogo} />
                ) : (
                  <div style={styles.detailLogoPlaceholder}>{(selectedLab.name || "L")[0]}</div>
                )}
                <div>
                  <h2 style={styles.detailName}>{selectedLab.name}</h2>
                  <p style={styles.detailAddr}>📍 {selectedLab.address}, {selectedLab.city} - {selectedLab.pin_code}</p>
                  {selectedLab.phone && <p style={styles.detailPhone}>📞 {selectedLab.phone}</p>}
                </div>
                <button style={styles.bookNowBtn} onClick={openBookingView}>Book Now →</button>
              </div>

              {selectedLab.description && (
                <div style={styles.detailSection}>
                  <h3 style={styles.detailSectionTitle}>About</h3>
                  <p style={styles.detailText}>{selectedLab.description}</p>
                </div>
              )}

              {selectedLab.tests_offered?.length > 0 && (
                <div style={styles.detailSection}>
                  <h3 style={styles.detailSectionTitle}>Tests Offered</h3>
                  <div style={styles.testTagGrid}>
                    {selectedLab.tests_offered.map((t) => (
                      <span key={t} style={styles.testTag}>{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedLab.availabilities?.length > 0 && (
                <div style={styles.detailSection}>
                  <h3 style={styles.detailSectionTitle}>Operating Hours</h3>
                  <div style={styles.hoursGrid}>
                    {selectedLab.availabilities.map((a) => (
                      <div key={a.day} style={styles.hoursRow}>
                        <span style={styles.hoursDay}>{a.day}</span>
                        <span style={styles.hoursTime}>{a.open_time} – {a.close_time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== BOOK ===== */}
        {view === "book" && selectedLab && (
          <div style={styles.bookView}>
            <button style={styles.backBtn} onClick={() => setView("detail")}>← Back</button>

            {booked ? (
              <div style={styles.successCard}>
                <div style={styles.successIcon}>✓</div>
                <h2 style={styles.successTitle}>Booking confirmed!</h2>
                <p style={styles.successSub}>
                  Your appointment at <strong>{selectedLab.name}</strong> has been received. You'll hear back once they confirm.
                </p>
                <div style={styles.successActions}>
                  <button style={styles.bookNowBtn} onClick={() => { setView("mybookings"); loadMyBookings(); }}>
                    View My Bookings
                  </button>
                  <button style={styles.outlineBtn} onClick={() => setView("search")}>
                    Find More Labs
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.bookCard}>
                <div style={styles.bookLabInfo}>
                  <span style={styles.bookLabName}>{selectedLab.name}</span>
                  <span style={styles.bookLabAddr}>{selectedLab.city}</span>
                </div>
                <h2 style={styles.bookTitle}>Book a test</h2>

                <div style={styles.bookFields}>
                  <div>
                    <label style={styles.label}>Test Name *</label>
                    {selectedLab.tests_offered?.length > 0 ? (
                      <select
                        style={styles.select}
                        value={form.test_name}
                        onChange={(e) => setForm({ ...form, test_name: e.target.value })}
                      >
                        <option value="">Select a test</option>
                        {selectedLab.tests_offered.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                        <option value="__custom__">Other (type below)</option>
                      </select>
                    ) : null}
                    {(!selectedLab.tests_offered?.length || form.test_name === "__custom__") && (
                      <input
                        style={{ ...styles.input, marginTop: 8 }}
                        placeholder="Enter test name"
                        value={form.test_name === "__custom__" ? "" : form.test_name}
                        onChange={(e) => setForm({ ...form, test_name: e.target.value })}
                      />
                    )}
                  </div>

                  <div style={styles.row2}>
                    <div style={{ flex: 1 }}>
                      <label style={styles.label}>Date *</label>
                      <input
                        type="date"
                        style={styles.input}
                        value={form.scheduled_date}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={styles.label}>Time *</label>
                      <input
                        type="time"
                        style={styles.input}
                        value={form.scheduled_time}
                        onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={styles.label}>Notes (optional)</label>
                    <textarea
                      style={{ ...styles.input, height: 80, resize: "vertical", width: "100%", boxSizing: "border-box" }}
                      placeholder="Any special instructions, fasting requirements, etc."
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                  </div>
                </div>

                <button style={styles.bookSubmitBtn} onClick={handleBook} disabled={booking}>
                  {booking ? "Booking…" : "Confirm Booking"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== MY BOOKINGS ===== */}
        {view === "mybookings" && (
          <div style={styles.myBookingsView}>
            <h2 style={styles.viewTitle}>My Lab Bookings</h2>
            {loading && <div style={styles.loadingRow}><div style={styles.spinner} /></div>}
            {!loading && myBookings.length === 0 && (
              <div style={styles.empty}>
                <span style={{ fontSize: 40 }}>📋</span>
                <p>No bookings yet. <button style={styles.linkBtn} onClick={() => setView("search")}>Find a lab</button></p>
              </div>
            )}
            <div style={styles.bookingsList}>
              {myBookings.map((b) => {
                const sc = STATUS_COLORS[b.status] || STATUS_COLORS.Pending;
                return (
                  <div key={b.id} style={styles.bookingItem}>
                    <div style={styles.bookingTop}>
                      <div>
                        <span style={styles.bookingTest}>{b.test_name}</span>
                        <span style={styles.bookingLab}>{b.lab_name}</span>
                      </div>
                      <span style={{ ...styles.statusBadge, background: sc.bg, color: sc.color }}>
                        {b.status}
                      </span>
                    </div>
                    <div style={styles.bookingMeta}>
                      <span>📅 {b.scheduled_date}</span>
                      <span>🕐 {b.scheduled_time}</span>
                      {b.notes && <span>📝 {b.notes}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LabCard({ lab, onClick }) {
  return (
    <div style={styles.labCard} onClick={onClick}>
      <div style={styles.labCardTop}>
        {lab.logo_url ? (
          <img src={lab.logo_url} alt="" style={styles.cardLogo} />
        ) : (
          <div style={styles.cardLogoPlaceholder}>{(lab.name || "L")[0]}</div>
        )}
        <div>
          <h3 style={styles.cardName}>{lab.name}</h3>
          <p style={styles.cardCity}>📍 {lab.city}</p>
        </div>
      </div>
      {lab.tests_offered?.length > 0 && (
        <div style={styles.cardTests}>
          {lab.tests_offered.slice(0, 4).map((t) => (
            <span key={t} style={styles.cardTestTag}>{t}</span>
          ))}
          {lab.tests_offered.length > 4 && (
            <span style={styles.cardTestMore}>+{lab.tests_offered.length - 4} more</span>
          )}
        </div>
      )}
      <button style={styles.cardBookBtn}>Book Now →</button>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#f5f6fa" },

  header: { background: "#fff", borderBottom: "1px solid #e8eaf0", position: "sticky", top: 0, zIndex: 100 },
  headerInner: { maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" },
  brand: { display: "flex", alignItems: "center", gap: 8, fontSize: 17, fontWeight: 700, color: "#0a0f1e" },
  brandDot: { width: 8, height: 8, borderRadius: "50%", background: "#0066ff", display: "inline-block" },
  headerNav: { display: "flex", gap: 4 },
  navLink: { padding: "6px 16px", borderRadius: 20, border: "none", background: "transparent", fontSize: 14, fontWeight: 600, color: "#8892a4", cursor: "pointer" },
  navLinkActive: { background: "#eff3ff", color: "#0066ff" },

  body: { maxWidth: 1100, margin: "0 auto", padding: "0 24px" },

  // Search view
  searchView: {},
  hero: { padding: "60px 0 40px", textAlign: "center" },
  heroTitle: { fontSize: 40, fontWeight: 800, color: "#0a0f1e", margin: "0 0 12px", letterSpacing: "-1px" },
  heroSub: { fontSize: 16, color: "#8892a4", margin: "0 0 32px" },
  searchBar: {
    display: "flex", alignItems: "center",
    background: "#fff", borderRadius: 50,
    boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
    padding: "6px 6px 6px 20px",
    maxWidth: 700, margin: "0 auto",
  },
  searchField: { display: "flex", alignItems: "center", gap: 8, flex: 1 },
  searchIcon: { fontSize: 16, flexShrink: 0 },
  searchInput: { border: "none", outline: "none", fontSize: 15, color: "#0a0f1e", background: "transparent", flex: 1, padding: "8px 0" },
  searchDivider: { width: 1, height: 28, background: "#e2e6ed", margin: "0 16px" },
  searchBtn: { background: "#0066ff", color: "#fff", border: "none", borderRadius: 50, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },

  loadingRow: { display: "flex", justifyContent: "center", padding: "48px 0" },
  spinner: { width: 32, height: 32, border: "3px solid #e2e6ed", borderTop: "3px solid #0066ff", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  empty: { textAlign: "center", padding: "64px 0", color: "#8892a4", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },

  labGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20, paddingBottom: 48 },
  labCard: {
    background: "#fff", borderRadius: 16, padding: 24, cursor: "pointer",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)", transition: "transform 0.15s, box-shadow 0.15s",
    display: "flex", flexDirection: "column", gap: 16,
  },
  labCardTop: { display: "flex", gap: 14, alignItems: "flex-start" },
  cardLogo: { width: 48, height: 48, borderRadius: 10, objectFit: "cover", flexShrink: 0 },
  cardLogoPlaceholder: { width: 48, height: 48, borderRadius: 10, background: "#0066ff", color: "#fff", fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardName: { fontSize: 16, fontWeight: 700, color: "#0a0f1e", margin: 0 },
  cardCity: { fontSize: 13, color: "#8892a4", margin: "4px 0 0" },
  cardTests: { display: "flex", flexWrap: "wrap", gap: 6 },
  cardTestTag: { background: "#f0f4ff", color: "#3b5bdb", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 },
  cardTestMore: { color: "#aab", fontSize: 11, padding: "3px 0" },
  cardBookBtn: { marginTop: "auto", border: "none", background: "none", color: "#0066ff", fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "left", padding: 0 },

  // Detail view
  detailView: { padding: "32px 0 64px" },
  backBtn: { border: "none", background: "none", color: "#0066ff", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 20px", display: "block" },
  detailCard: { background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", overflow: "hidden" },
  detailHeader: { display: "flex", gap: 20, alignItems: "center", padding: "28px 32px", borderBottom: "1px solid #f0f2f5" },
  detailLogo: { width: 72, height: 72, borderRadius: 14, objectFit: "cover", flexShrink: 0 },
  detailLogoPlaceholder: { width: 72, height: 72, borderRadius: 14, background: "#0066ff", color: "#fff", fontSize: 28, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  detailName: { fontSize: 22, fontWeight: 700, color: "#0a0f1e", margin: "0 0 6px", letterSpacing: "-0.3px" },
  detailAddr: { fontSize: 14, color: "#8892a4", margin: "0 0 4px" },
  detailPhone: { fontSize: 14, color: "#8892a4", margin: 0 },
  bookNowBtn: { marginLeft: "auto", background: "#0066ff", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 },
  detailSection: { padding: "24px 32px", borderBottom: "1px solid #f0f2f5" },
  detailSectionTitle: { fontSize: 14, fontWeight: 700, color: "#0a0f1e", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.5px" },
  detailText: { fontSize: 15, color: "#3d4a5c", lineHeight: 1.6, margin: 0 },
  testTagGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  testTag: { background: "#f0f4ff", color: "#3b5bdb", borderRadius: 20, padding: "5px 14px", fontSize: 13, fontWeight: 600 },
  hoursGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 },
  hoursRow: { display: "flex", justifyContent: "space-between", padding: "8px 14px", background: "#f8f9fb", borderRadius: 8 },
  hoursDay: { fontSize: 13, fontWeight: 600, color: "#3d4a5c" },
  hoursTime: { fontSize: 13, color: "#8892a4" },

  // Book view
  bookView: { padding: "32px 0 64px", maxWidth: 560, margin: "0 auto" },
  bookCard: { background: "#fff", borderRadius: 16, padding: "32px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" },
  bookLabInfo: { display: "flex", flexDirection: "column", gap: 2, marginBottom: 24, padding: "14px 18px", background: "#f0f4ff", borderRadius: 10 },
  bookLabName: { fontSize: 15, fontWeight: 700, color: "#0a0f1e" },
  bookLabAddr: { fontSize: 13, color: "#8892a4" },
  bookTitle: { fontSize: 22, fontWeight: 700, color: "#0a0f1e", margin: "0 0 24px", letterSpacing: "-0.3px" },
  bookFields: { display: "flex", flexDirection: "column", gap: 18, marginBottom: 28 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#3d4a5c", marginBottom: 6 },
  input: { border: "1.5px solid #e2e6ed", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#0a0f1e", outline: "none", background: "#fafbfc", width: "100%", boxSizing: "border-box" },
  select: { border: "1.5px solid #e2e6ed", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#0a0f1e", background: "#fafbfc", width: "100%", outline: "none" },
  row2: { display: "flex", gap: 14 },
  bookSubmitBtn: { width: "100%", background: "#0066ff", color: "#fff", border: "none", borderRadius: 8, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer" },

  successCard: { background: "#fff", borderRadius: 16, padding: "64px 40px", textAlign: "center", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" },
  successIcon: { width: 64, height: 64, borderRadius: "50%", background: "#0066ff", color: "#fff", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" },
  successTitle: { fontSize: 24, fontWeight: 700, color: "#0a0f1e", margin: "0 0 10px" },
  successSub: { fontSize: 15, color: "#8892a4", lineHeight: 1.6, margin: "0 0 32px" },
  successActions: { display: "flex", gap: 12, justifyContent: "center" },
  outlineBtn: { border: "1.5px solid #e2e6ed", borderRadius: 8, padding: "12px 22px", fontSize: 14, fontWeight: 600, color: "#3d4a5c", background: "#fff", cursor: "pointer" },

  // My Bookings
  myBookingsView: { padding: "40px 0 64px" },
  viewTitle: { fontSize: 24, fontWeight: 700, color: "#0a0f1e", margin: "0 0 28px", letterSpacing: "-0.3px" },
  bookingsList: { display: "flex", flexDirection: "column", gap: 14 },
  bookingItem: { background: "#fff", borderRadius: 14, padding: "20px 24px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" },
  bookingTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  bookingTest: { display: "block", fontSize: 16, fontWeight: 700, color: "#0a0f1e" },
  bookingLab: { display: "block", fontSize: 13, color: "#8892a4", marginTop: 2 },
  statusBadge: { borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, flexShrink: 0 },
  bookingMeta: { display: "flex", gap: 20, fontSize: 13, color: "#8892a4" },

  linkBtn: { border: "none", background: "none", color: "#0066ff", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  toast: { position: "fixed", bottom: 32, right: 32, background: "#0a0f1e", color: "#fff", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,0.2)", zIndex: 9999 },
};