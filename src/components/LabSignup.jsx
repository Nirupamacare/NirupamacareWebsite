import { useState } from "react";
import { api } from "../api";

const TESTS_POOL = [
  "Complete Blood Count (CBC)",
  "Lipid Panel",
  "HbA1c",
  "Thyroid Function (TSH)",
  "Liver Function Test",
  "Kidney Function Test",
  "Blood Glucose (Fasting)",
  "Urine Routine",
  "Vitamin D",
  "Vitamin B12",
  "Iron Studies",
  "Dengue NS1",
  "Malaria Test",
  "COVID-19 RT-PCR",
  "ECG",
  "X-Ray",
  "Ultrasound",
  "MRI Scan",
  "CT Scan",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const STEP_LABELS = ["Account", "Profile", "Tests & Hours", "Review"];

export default function LabSignup() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Step 0 — auth
  const [auth, setAuth] = useState({ email: "", password: "", labName: "" });

  // Step 1 — profile
  const [profile, setProfile] = useState({
    description: "",
    city: "",
    address: "",
    pin_code: "",
    phone: "",
    logo_url: "",
  });

  // Step 2 — tests & hours
  const [selectedTests, setSelectedTests] = useState([]);
  const [testSearch, setTestSearch] = useState("");
  const [customTest, setCustomTest] = useState("");
  const [availability, setAvailability] = useState(
    DAYS.map((d) => ({ day: d, open_time: "08:00 AM", close_time: "06:00 PM", enabled: false }))
  );

  const toggleTest = (t) =>
    setSelectedTests((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const addCustomTest = () => {
    const t = customTest.trim();
    if (t && !selectedTests.includes(t)) setSelectedTests((prev) => [...prev, t]);
    setCustomTest("");
  };

  const toggleDay = (i) =>
    setAvailability((prev) => prev.map((a, idx) => (idx === i ? { ...a, enabled: !a.enabled } : a)));

  const updateSlot = (i, field, val) =>
    setAvailability((prev) => prev.map((a, idx) => (idx === i ? { ...a, [field]: val } : a)));

  const filteredTests = TESTS_POOL.filter(
    (t) => !selectedTests.includes(t) && t.toLowerCase().includes(testSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      await api.registerLab({ email: auth.email, password: auth.password, labName: auth.labName });
      await api.createLabProfile({
        name: auth.labName,
        description: profile.description,
        city: profile.city,
        address: profile.address,
        pin_code: profile.pin_code,
        phone: profile.phone,
        logo_url: profile.logo_url || undefined,
        tests_offered: selectedTests,
        availabilities: availability
          .filter((a) => a.enabled)
          .map(({ day, open_time, close_time }) => ({ day, open_time, close_time })),
      });
      setDone(true);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={styles.page}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successTitle}>Lab registered!</h2>
          <p style={styles.successSub}>
            Your lab profile is live. Head to your dashboard to manage bookings.
          </p>
          <a href="/lab/dashboard" style={styles.btn}>
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Left panel */}
      <div style={styles.left}>
        <div style={styles.brand}>
          <span style={styles.brandDot} />
         
        </div>
        <h1 style={styles.hero}>Register your laboratory</h1>
        <p style={styles.heroSub}>
          Join thousands of diagnostic centres already managing bookings, results, and schedules
          digitally.
        </p>
        <div style={styles.steps}>
          {STEP_LABELS.map((label, i) => (
            <div key={i} style={styles.stepRow}>
              <div style={{ ...styles.stepDot, ...(i <= step ? styles.stepDotActive : {}) }}>
                {i < step ? "✓" : i + 1}
              </div>
              <span style={{ ...styles.stepLabel, ...(i === step ? styles.stepLabelActive : {}) }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={styles.right}>
        <div style={styles.card}>
          <p style={styles.stepTag}>Step {step + 1} of {STEP_LABELS.length}</p>
          <h2 style={styles.cardTitle}>{STEP_LABELS[step]}</h2>

          {error && <div style={styles.errorBox}>{error}</div>}

          {/* STEP 0 */}
          {step === 0 && (
            <div style={styles.fields}>
              <Field
                label="Lab / Diagnostic Centre Name"
                value={auth.labName}
                onChange={(v) => setAuth({ ...auth, labName: v })}
                placeholder="e.g. Sunrise Diagnostics"
              />
              <Field
                label="Email Address"
                type="email"
                value={auth.email}
                onChange={(v) => setAuth({ ...auth, email: v })}
                placeholder="admin@yourlabname.com"
              />
              <Field
                label="Password"
                type="password"
                value={auth.password}
                onChange={(v) => setAuth({ ...auth, password: v })}
                placeholder="Min. 8 characters"
              />
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div style={styles.fields}>
              <Field
                label="About your lab"
                type="textarea"
                value={profile.description}
                onChange={(v) => setProfile({ ...profile, description: v })}
                placeholder="NABL accredited, ISO certified, home sample collection..."
              />
              <div style={styles.row2}>
                <Field
                  label="City"
                  value={profile.city}
                  onChange={(v) => setProfile({ ...profile, city: v })}
                  placeholder="Kolkata"
                />
                <Field
                  label="PIN Code"
                  value={profile.pin_code}
                  onChange={(v) => setProfile({ ...profile, pin_code: v })}
                  placeholder="700001"
                />
              </div>
              <Field
                label="Full Address"
                value={profile.address}
                onChange={(v) => setProfile({ ...profile, address: v })}
                placeholder="123, Park Street, Kolkata"
              />
              <Field
                label="Phone Number"
                value={profile.phone}
                onChange={(v) => setProfile({ ...profile, phone: v })}
                placeholder="+91 98765 43210"
              />
              <Field
                label="Logo URL (optional)"
                value={profile.logo_url}
                onChange={(v) => setProfile({ ...profile, logo_url: v })}
                placeholder="https://..."
              />
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div style={styles.fields}>
              <label style={styles.label}>Tests Offered</label>
              {selectedTests.length > 0 && (
                <div style={styles.tagRow}>
                  {selectedTests.map((t) => (
                    <span key={t} style={styles.tag} onClick={() => toggleTest(t)}>
                      {t} ×
                    </span>
                  ))}
                </div>
              )}
              <div style={styles.row2}>
                <input
                  style={styles.input}
                  placeholder="Search tests..."
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                />
                <div style={styles.row2}>
                  <input
                    style={styles.input}
                    placeholder="Add custom test"
                    value={customTest}
                    onChange={(e) => setCustomTest(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustomTest()}
                  />
                  <button style={styles.addBtn} onClick={addCustomTest}>
                    +
                  </button>
                </div>
              </div>
              <div style={styles.testGrid}>
                {filteredTests.map((t) => (
                  <button key={t} style={styles.testChip} onClick={() => toggleTest(t)}>
                    + {t}
                  </button>
                ))}
              </div>

              <label style={{ ...styles.label, marginTop: 24 }}>Operating Hours</label>
              {availability.map((slot, i) => (
                <div key={slot.day} style={styles.slotRow}>
                  <label style={styles.dayCheck}>
                    <input
                      type="checkbox"
                      checked={slot.enabled}
                      onChange={() => toggleDay(i)}
                      style={{ accentColor: "#0066ff" }}
                    />
                    <span style={{ ...styles.dayName, opacity: slot.enabled ? 1 : 0.4 }}>
                      {slot.day.slice(0, 3)}
                    </span>
                  </label>
                  {slot.enabled && (
                    <div style={styles.timeRow}>
                      <input
                        style={styles.timeInput}
                        value={slot.open_time}
                        onChange={(e) => updateSlot(i, "open_time", e.target.value)}
                        placeholder="08:00 AM"
                      />
                      <span style={styles.timeSep}>→</span>
                      <input
                        style={styles.timeInput}
                        value={slot.close_time}
                        onChange={(e) => updateSlot(i, "close_time", e.target.value)}
                        placeholder="06:00 PM"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* STEP 3 — Review */}
          {step === 3 && (
            <div style={styles.review}>
              <ReviewRow label="Lab Name" value={auth.labName} />
              <ReviewRow label="Email" value={auth.email} />
              <ReviewRow label="City" value={`${profile.city} - ${profile.pin_code}`} />
              <ReviewRow label="Address" value={profile.address} />
              <ReviewRow label="Phone" value={profile.phone} />
              <ReviewRow label="Tests" value={selectedTests.length + " tests selected"} />
              <ReviewRow
                label="Open Days"
                value={availability.filter((a) => a.enabled).map((a) => a.day.slice(0, 3)).join(", ") || "None"}
              />
            </div>
          )}

          <div style={styles.navRow}>
            {step > 0 && (
              <button style={styles.backBtn} onClick={() => setStep((s) => s - 1)}>
                ← Back
              </button>
            )}
            {step < 3 ? (
              <button style={styles.nextBtn} onClick={() => setStep((s) => s + 1)}>
                Continue →
              </button>
            ) : (
              <button style={styles.nextBtn} onClick={handleSubmit} disabled={loading}>
                {loading ? "Registering..." : "Register Lab ✓"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  const s = { ...styles.input, width: "100%", boxSizing: "border-box" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={styles.label}>{label}</label>
      {type === "textarea" ? (
        <textarea
          style={{ ...s, height: 90, resize: "vertical" }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          style={s}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div style={styles.reviewRow}>
      <span style={styles.reviewLabel}>{label}</span>
      <span style={styles.reviewValue}>{value || "—"}</span>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'DM Sans', sans-serif",
    background: "#f5f6fa",
  },
  left: {
    width: 340,
    minHeight: "100vh",
    background: "#0a0f1e",
    padding: "48px 36px",
    display: "flex",
    flexDirection: "column",
    gap: 32,
    position: "sticky",
    top: 0,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#fff",
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: "-0.5px",
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#0066ff",
    display: "inline-block",
  },
  hero: {
    color: "#fff",
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.25,
    margin: 0,
    letterSpacing: "-0.5px",
  },
  heroSub: {
    color: "#8892a4",
    fontSize: 14,
    lineHeight: 1.6,
    margin: 0,
  },
  steps: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    marginTop: "auto",
  },
  stepRow: { display: "flex", alignItems: "center", gap: 14 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#1e2535",
    border: "1px solid #2e3a50",
    color: "#556",
    fontSize: 12,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.2s",
  },
  stepDotActive: {
    background: "#0066ff",
    border: "1px solid #0066ff",
    color: "#fff",
  },
  stepLabel: { color: "#556", fontSize: 13, fontWeight: 500 },
  stepLabelActive: { color: "#fff" },

  right: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: "40px 40px",
    width: "100%",
    maxWidth: 540,
    boxShadow: "0 4px 40px rgba(0,0,0,0.08)",
  },
  stepTag: { color: "#0066ff", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: 0 },
  cardTitle: { fontSize: 22, fontWeight: 700, color: "#0a0f1e", margin: "8px 0 24px", letterSpacing: "-0.3px" },
  fields: { display: "flex", flexDirection: "column", gap: 18 },
  label: { fontSize: 13, fontWeight: 600, color: "#3d4a5c", letterSpacing: "0.1px" },
  input: {
    border: "1.5px solid #e2e6ed",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 14,
    color: "#0a0f1e",
    outline: "none",
    background: "#fafbfc",
    transition: "border-color 0.15s",
  },
  row2: { display: "flex", gap: 12 },
  tagRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  tag: {
    background: "#e8f0fe",
    color: "#0066ff",
    borderRadius: 20,
    padding: "4px 12px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    userSelect: "none",
  },
  testGrid: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 },
  testChip: {
    border: "1.5px solid #e2e6ed",
    borderRadius: 20,
    padding: "4px 12px",
    fontSize: 12,
    fontWeight: 500,
    color: "#3d4a5c",
    background: "#fff",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  addBtn: {
    background: "#0066ff",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    width: 40,
    fontSize: 20,
    cursor: "pointer",
    flexShrink: 0,
  },
  slotRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    paddingBottom: 10,
    borderBottom: "1px solid #f0f2f5",
  },
  dayCheck: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer", width: 70, flexShrink: 0 },
  dayName: { fontSize: 13, fontWeight: 600, color: "#0a0f1e", transition: "opacity 0.2s" },
  timeRow: { display: "flex", alignItems: "center", gap: 8, flex: 1 },
  timeInput: {
    border: "1.5px solid #e2e6ed",
    borderRadius: 6,
    padding: "6px 10px",
    fontSize: 13,
    color: "#0a0f1e",
    background: "#fafbfc",
    width: 100,
    outline: "none",
  },
  timeSep: { color: "#aab", fontSize: 14 },

  review: { display: "flex", flexDirection: "column", gap: 0 },
  reviewRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "14px 0",
    borderBottom: "1px solid #f0f2f5",
    gap: 16,
  },
  reviewLabel: { fontSize: 13, color: "#8892a4", fontWeight: 500 },
  reviewValue: { fontSize: 13, color: "#0a0f1e", fontWeight: 600, textAlign: "right" },

  navRow: { display: "flex", gap: 12, marginTop: 32, justifyContent: "flex-end" },
  backBtn: {
    border: "1.5px solid #e2e6ed",
    borderRadius: 8,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    color: "#3d4a5c",
    background: "#fff",
    cursor: "pointer",
  },
  nextBtn: {
    background: "#0066ff",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 24px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.2px",
  },

  errorBox: {
    background: "#fff0f0",
    border: "1px solid #fcc",
    borderRadius: 8,
    padding: "12px 16px",
    color: "#c00",
    fontSize: 13,
    marginBottom: 16,
  },
  successCard: {
    background: "#fff",
    borderRadius: 20,
    padding: "64px 48px",
    textAlign: "center",
    boxShadow: "0 4px 40px rgba(0,0,0,0.08)",
    maxWidth: 420,
    margin: "auto",
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "#0066ff",
    color: "#fff",
    fontSize: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px",
  },
  successTitle: { fontSize: 24, fontWeight: 700, color: "#0a0f1e", margin: "0 0 8px" },
  successSub: { fontSize: 14, color: "#8892a4", lineHeight: 1.6, margin: "0 0 32px" },
  btn: {
    display: "inline-block",
    background: "#0066ff",
    color: "#fff",
    padding: "12px 28px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    textDecoration: "none",
  },
};