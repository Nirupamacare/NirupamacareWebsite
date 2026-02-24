import { useState, useEffect } from "react";
import { api } from "../api";

const STATUS_COLORS = {
  Pending: { bg: "#fff7e6", color: "#b45309", border: "#fde68a" },
  Confirmed: { bg: "#e8f5e9", color: "#166534", border: "#86efac" },
  Cancelled: { bg: "#fef2f2", color: "#991b1b", border: "#fca5a5" },
  Completed: { bg: "#eff6ff", color: "#1e40af", border: "#93c5fd" },
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const NEXT_STATUS = { Pending: ["Confirmed", "Cancelled"], Confirmed: ["Completed", "Cancelled"], Completed: [], Cancelled: [] };
const TABS = ["Overview", "Bookings", "Profile", "Hours"];

export default function LabDashboard() {
  const [tab, setTab] = useState("Overview");
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  // Profile edit state
  const [editProfile, setEditProfile] = useState(null);
  const [editSlots, setEditSlots] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [p, b] = await Promise.all([api.getLabProfile(), api.getLabBookings()]);
        setProfile(p);
        setBookings(b);
        initEdit(p);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const initEdit = (p) => {
    setEditProfile({
      name: p.name || "",
      description: p.description || "",
      city: p.city || "",
      address: p.address || "",
      pin_code: p.pin_code || "",
      phone: p.phone || "",
      logo_url: p.logo_url || "",
      tests_offered: p.tests_offered || [],
    });
    setEditSlots(
      DAYS.map((day) => {
        const found = (p.availabilities || []).find((a) => a.day === day);
        return found
          ? { day, open_time: found.open_time, close_time: found.close_time, enabled: true }
          : { day, open_time: "08:00 AM", close_time: "06:00 PM", enabled: false };
      })
    );
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      await api.updateLabBookingStatus(bookingId, status);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status } : b)));
      showToast(`Booking marked as ${status}`);
    } catch (e) {
      showToast("Failed to update status");
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await api.createLabProfile({
        ...editProfile,
        availabilities: editSlots
          .filter((s) => s.enabled)
          .map(({ day, open_time, close_time }) => ({ day, open_time, close_time })),
      });
      setProfile(updated);
      showToast("Profile saved!");
    } catch (e) {
      showToast("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (i) =>
    setEditSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, enabled: !s.enabled } : s)));
  const updateSlot = (i, field, val) =>
    setEditSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)));
  const removeTest = (t) =>
    setEditProfile((p) => ({ ...p, tests_offered: p.tests_offered.filter((x) => x !== t) }));
  const addTest = (t) =>
    setEditProfile((p) => ({ ...p, tests_offered: [...(p.tests_offered || []), t] }));

  // Stats
  const total = bookings.length;
  const pending = bookings.filter((b) => b.status === "Pending").length;
  const confirmed = bookings.filter((b) => b.status === "Confirmed").length;
  const completed = bookings.filter((b) => b.status === "Completed").length;

  if (loading) return <div style={styles.loadingPage}><Spinner />Loading your dashboard…</div>;

  return (
    <div style={styles.page}>
      {toast && <div style={styles.toast}>{toast}</div>}

      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sideTop}>
          {profile?.logo_url ? (
            <img src={profile.logo_url} alt="logo" style={styles.logo} />
          ) : (
            <div style={styles.logoPlaceholder}>{(profile?.name || "L")[0]}</div>
          )}
          <span style={styles.labName}>{profile?.name || "Your Lab"}</span>
          <span style={styles.labCity}>{profile?.city}</span>
        </div>
        <nav style={styles.nav}>
          {TABS.map((t) => (
            <button
              key={t}
              style={{ ...styles.navBtn, ...(tab === t ? styles.navBtnActive : {}) }}
              onClick={() => setTab(t)}
            >
              <span>{NAV_ICONS[t]}</span>
              {t}
            </button>
          ))}
        </nav>
        <button onClick={api.logout} style={styles.logoutBtn}>Log out</button>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.pageTitle}>{tab}</h1>
        </header>

        {/* OVERVIEW */}
        {tab === "Overview" && (
          <div style={styles.content}>
            <div style={styles.statsGrid}>
              <StatCard label="Total Bookings" value={total} color="#0066ff" />
              <StatCard label="Pending" value={pending} color="#b45309" />
              <StatCard label="Confirmed" value={confirmed} color="#166534" />
              <StatCard label="Completed" value={completed} color="#1e40af" />
            </div>

            <h2 style={styles.sectionTitle}>Recent Bookings</h2>
            <BookingTable bookings={bookings.slice(0, 8)} onStatus={handleStatusUpdate} />
          </div>
        )}

        {/* BOOKINGS */}
        {tab === "Bookings" && (
          <div style={styles.content}>
            <BookingTable bookings={bookings} onStatus={handleStatusUpdate} />
            {bookings.length === 0 && <EmptyState message="No bookings yet. Patients will appear here once they book." />}
          </div>
        )}

        {/* PROFILE */}
        {tab === "Profile" && editProfile && (
          <div style={styles.content}>
            <div style={styles.formCard}>
              <div style={styles.formGrid}>
                <FormField label="Lab Name" value={editProfile.name} onChange={(v) => setEditProfile((p) => ({ ...p, name: v }))} />
                <FormField label="City" value={editProfile.city} onChange={(v) => setEditProfile((p) => ({ ...p, city: v }))} />
                <FormField label="PIN Code" value={editProfile.pin_code} onChange={(v) => setEditProfile((p) => ({ ...p, pin_code: v }))} />
                <FormField label="Phone" value={editProfile.phone} onChange={(v) => setEditProfile((p) => ({ ...p, phone: v }))} />
                <FormField label="Address" value={editProfile.address} onChange={(v) => setEditProfile((p) => ({ ...p, address: v }))} span={2} />
                <FormField label="Logo URL" value={editProfile.logo_url} onChange={(v) => setEditProfile((p) => ({ ...p, logo_url: v }))} span={2} />
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={styles.label}>About</label>
                  <textarea
                    style={{ ...styles.input, width: "100%", height: 90, resize: "vertical", boxSizing: "border-box" }}
                    value={editProfile.description}
                    onChange={(e) => setEditProfile((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={styles.label}>Tests Offered</label>
                  <div style={styles.tagRow}>
                    {(editProfile.tests_offered || []).map((t) => (
                      <span key={t} style={styles.tag} onClick={() => removeTest(t)}>{t} ×</span>
                    ))}
                  </div>
                  <AddTestInput onAdd={addTest} existing={editProfile.tests_offered || []} />
                </div>
              </div>
              <button style={styles.saveBtn} onClick={handleSaveProfile} disabled={saving}>
                {saving ? "Saving…" : "Save Profile"}
              </button>
            </div>
          </div>
        )}

        {/* HOURS */}
        {tab === "Hours" && (
          <div style={styles.content}>
            <div style={styles.formCard}>
              <p style={styles.sectionSub}>Set your operating hours. Patients will see these when booking.</p>
              {editSlots.map((slot, i) => (
                <div key={slot.day} style={styles.slotRow}>
                  <label style={styles.dayCheck}>
                    <input type="checkbox" checked={slot.enabled} onChange={() => toggleDay(i)} style={{ accentColor: "#0066ff" }} />
                    <span style={{ ...styles.dayName, opacity: slot.enabled ? 1 : 0.35 }}>{slot.day}</span>
                  </label>
                  {slot.enabled && (
                    <div style={styles.timeRow}>
                      <input style={styles.timeInput} value={slot.open_time} onChange={(e) => updateSlot(i, "open_time", e.target.value)} />
                      <span style={styles.timeSep}>to</span>
                      <input style={styles.timeInput} value={slot.close_time} onChange={(e) => updateSlot(i, "close_time", e.target.value)} />
                    </div>
                  )}
                </div>
              ))}
              <button style={{ ...styles.saveBtn, marginTop: 24 }} onClick={handleSaveProfile} disabled={saving}>
                {saving ? "Saving…" : "Save Hours"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function BookingTable({ bookings, onStatus }) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            {["Patient", "Test", "Date", "Time", "Status", "Actions"].map((h) => (
              <th key={h} style={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => {
            const sc = STATUS_COLORS[b.status] || STATUS_COLORS.Pending;
            const nextOptions = NEXT_STATUS[b.status] || [];
            return (
              <tr key={b.id} style={styles.tr}>
                <td style={styles.td}>
                  <span style={styles.patientName}>{b.patient_name}</span>
                </td>
                <td style={styles.td}>{b.test_name}</td>
                <td style={styles.td}>{b.scheduled_date}</td>
                <td style={styles.td}>{b.scheduled_time}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                    {b.status}
                  </span>
                </td>
                <td style={styles.td}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {nextOptions.map((s) => (
                      <button key={s} style={styles.actionBtn} onClick={() => onStatus(b.id, s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={styles.statCard}>
      <span style={{ ...styles.statValue, color }}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

function FormField({ label, value, onChange, span }) {
  return (
    <div style={{ gridColumn: span === 2 ? "1/-1" : undefined }}>
      <label style={styles.label}>{label}</label>
      <input style={{ ...styles.input, width: "100%", boxSizing: "border-box" }} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function AddTestInput({ onAdd, existing }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
      <input
        style={{ ...styles.input, flex: 1 }}
        placeholder="Add a test…"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) { onAdd(val.trim()); setVal(""); } }}
      />
      <button style={styles.addBtn} onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal(""); } }}>+ Add</button>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div style={styles.empty}>
      <span style={styles.emptyIcon}>📋</span>
      <p>{message}</p>
    </div>
  );
}

function Spinner() {
  return <div style={styles.spinner} />;
}

const NAV_ICONS = {
  Overview: "◼",
  Bookings: "📋",
  Profile: "🏥",
  Hours: "🕐",
};

const styles = {
  page: { display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#f5f6fa" },
  loadingPage: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 16, color: "#8892a4", fontSize: 15 },
  spinner: { width: 32, height: 32, border: "3px solid #e2e6ed", borderTop: "3px solid #0066ff", borderRadius: "50%", animation: "spin 0.8s linear infinite" },

  sidebar: {
    width: 240,
    minHeight: "100vh",
    background: "#0a0f1e",
    display: "flex",
    flexDirection: "column",
    padding: "32px 0 24px",
    position: "sticky",
    top: 0,
  },
  sideTop: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "0 24px 32px", borderBottom: "1px solid #1e2535" },
  logo: { width: 64, height: 64, borderRadius: 12, objectFit: "cover" },
  logoPlaceholder: {
    width: 64, height: 64, borderRadius: 12, background: "#0066ff",
    color: "#fff", fontSize: 24, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
  },
  labName: { color: "#fff", fontSize: 15, fontWeight: 700, textAlign: "center", marginTop: 4 },
  labCity: { color: "#556", fontSize: 12 },
  nav: { display: "flex", flexDirection: "column", gap: 4, padding: "24px 16px", flex: 1 },
  navBtn: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 14px", borderRadius: 8, border: "none",
    background: "transparent", color: "#8892a4", fontSize: 14, fontWeight: 500,
    cursor: "pointer", textAlign: "left", transition: "all 0.15s",
  },
  navBtnActive: { background: "#111827", color: "#fff" },
  logoutBtn: {
    margin: "0 16px", padding: "10px 14px", borderRadius: 8, border: "1px solid #1e2535",
    background: "transparent", color: "#556", fontSize: 13, cursor: "pointer",
  },

  main: { flex: 1, display: "flex", flexDirection: "column" },
  header: { padding: "32px 40px 0", borderBottom: "1px solid #e8eaf0", background: "#fff" },
  pageTitle: { fontSize: 22, fontWeight: 700, color: "#0a0f1e", margin: "0 0 24px", letterSpacing: "-0.3px" },
  content: { padding: 40, flex: 1 },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 40 },
  statCard: {
    background: "#fff", borderRadius: 12, padding: "24px 20px",
    boxShadow: "0 1px 6px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 8,
  },
  statValue: { fontSize: 36, fontWeight: 800, letterSpacing: "-1px" },
  statLabel: { fontSize: 13, color: "#8892a4", fontWeight: 500 },

  sectionTitle: { fontSize: 16, fontWeight: 700, color: "#0a0f1e", margin: "0 0 16px", letterSpacing: "-0.2px" },
  sectionSub: { fontSize: 14, color: "#8892a4", margin: "0 0 24px" },

  tableWrap: { overflowX: "auto", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff" },
  th: { padding: "14px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#8892a4", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #f0f2f5" },
  tr: { borderBottom: "1px solid #f8f9fb", transition: "background 0.1s" },
  td: { padding: "14px 16px", fontSize: 14, color: "#1a2233" },
  patientName: { fontWeight: 600 },
  badge: { padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  actionBtn: {
    border: "1.5px solid #e2e6ed", borderRadius: 6, padding: "4px 10px",
    fontSize: 12, fontWeight: 600, color: "#3d4a5c", background: "#fff", cursor: "pointer",
  },

  formCard: { background: "#fff", borderRadius: 12, padding: 32, boxShadow: "0 1px 6px rgba(0,0,0,0.06)", maxWidth: 720 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#3d4a5c", marginBottom: 6 },
  input: {
    border: "1.5px solid #e2e6ed", borderRadius: 8, padding: "10px 14px",
    fontSize: 14, color: "#0a0f1e", outline: "none", background: "#fafbfc",
  },
  tagRow: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  tag: {
    background: "#e8f0fe", color: "#0066ff", borderRadius: 20,
    padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
  },
  addBtn: { background: "#0066ff", color: "#fff", border: "none", borderRadius: 8, padding: "0 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  saveBtn: {
    background: "#0066ff", color: "#fff", border: "none", borderRadius: 8,
    padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer",
  },

  slotRow: { display: "flex", alignItems: "center", gap: 20, padding: "14px 0", borderBottom: "1px solid #f0f2f5" },
  dayCheck: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer", width: 110, flexShrink: 0 },
  dayName: { fontSize: 14, fontWeight: 600, color: "#0a0f1e" },
  timeRow: { display: "flex", alignItems: "center", gap: 10 },
  timeInput: { border: "1.5px solid #e2e6ed", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: "#0a0f1e", background: "#fafbfc", width: 110, outline: "none" },
  timeSep: { color: "#aab", fontSize: 13 },

  toast: {
    position: "fixed", bottom: 32, right: 32, background: "#0a0f1e", color: "#fff",
    padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600,
    boxShadow: "0 8px 30px rgba(0,0,0,0.2)", zIndex: 9999, animation: "fadeIn 0.2s ease",
  },

  empty: { textAlign: "center", padding: "64px 0", color: "#8892a4" },
  emptyIcon: { fontSize: 40, display: "block", marginBottom: 12 },
};