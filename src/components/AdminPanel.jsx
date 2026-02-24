import React, { useState, useEffect } from 'react';
import { api, BACKEND_URL } from '../api';

// ─── Hardcoded admin credentials (frontend gate only) ───────────────────────
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

// ─── Login Page ──────────────────────────────────────────────────────────────
const AdminLogin = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setTimeout(() => {
            if (username === ADMIN_USER && password === ADMIN_PASS) {
                sessionStorage.setItem('admin_auth', 'true');
                onLogin();
            } else {
                setError('Invalid username or password.');
            }
            setLoading(false);
        }, 600);
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            fontFamily: 'Inter, system-ui, sans-serif', padding: '16px'
        }}>
            <div style={{
                background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
                padding: '48px 40px', width: '100%', maxWidth: '420px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }}>
                {/* Logo / Icon */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '16px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '28px', margin: '0 auto 16px'
                    }}>🛡️</div>
                    <h1 style={{ color: 'white', fontSize: '1.6rem', fontWeight: '700', margin: 0 }}>
                        Admin Portal
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '6px' }}>
                        Nirupamacare — Restricted Access
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>
                            Username
                        </label>
                        <input
                            id="admin-username"
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="Enter username"
                            required
                            style={{
                                width: '100%', padding: '12px 16px', borderRadius: '10px',
                                border: '1px solid rgba(255,255,255,0.15)',
                                background: 'rgba(255,255,255,0.08)', color: 'white',
                                fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                                transition: 'border 0.2s'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>
                            Password
                        </label>
                        <input
                            id="admin-password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                            style={{
                                width: '100%', padding: '12px 16px', borderRadius: '10px',
                                border: '1px solid rgba(255,255,255,0.15)',
                                background: 'rgba(255,255,255,0.08)', color: 'white',
                                fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
                            borderRadius: '10px', padding: '12px 16px', color: '#fca5a5',
                            fontSize: '0.88rem', marginBottom: '20px', textAlign: 'center'
                        }}>
                            ❌ {error}
                        </div>
                    )}

                    <button
                        id="admin-login-btn"
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
                            background: loading ? '#4338ca' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: 'white', fontWeight: '700', fontSize: '1rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'opacity 0.2s', opacity: loading ? 0.8 : 1
                        }}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// ─── Main Admin Panel ─────────────────────────────────────────────────────────
const AdminPanel = () => {
    const [authenticated, setAuthenticated] = useState(
        sessionStorage.getItem('admin_auth') === 'true'
    );
    const [activeTab, setActiveTab] = useState('pending');
    const [pendingDoctors, setPendingDoctors] = useState([]);
    const [verifiedDoctors, setVerifiedDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState({});
    const [rejectNote, setRejectNote] = useState({});
    const [showRejectInput, setShowRejectInput] = useState({});

    useEffect(() => {
        if (!authenticated) return;
        const load = async () => {
            try {
                const [pendingRes, verifiedRes] = await Promise.all([
                    api.listPendingDoctors(),
                    api.listVerifiedDoctors()
                ]);
                setPendingDoctors(pendingRes.pending || []);
                setVerifiedDoctors(verifiedRes.verified || []);
            } catch (e) {
                const status = e.response?.status;
                if (status === 403) setError('Backend returned 403 — make sure your Firebase account has the admin role.');
                else setError('Failed to load doctors. Check that the backend is running.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [authenticated]);

    if (!authenticated) return <AdminLogin onLogin={() => setAuthenticated(true)} />;

    const handleAction = async (doctorId, action) => {
        const note = rejectNote[doctorId] || '';
        if (action === 'reject' && !note.trim()) {
            alert('Please provide a rejection reason before confirming.');
            return;
        }
        setActionLoading(prev => ({ ...prev, [doctorId]: true }));
        try {
            await api.verifyDoctor(doctorId, action, note);
            setPendingDoctors(prev => prev.filter(d => d._id !== doctorId));
        } catch (e) {
            alert(e.response?.data?.detail || 'Action failed. Please try again.');
        } finally {
            setActionLoading(prev => ({ ...prev, [doctorId]: false }));
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('admin_auth');
        setAuthenticated(false);
    };

    const s = {
        root: { minHeight: '100vh', background: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif' },
        topbar: {
            background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '16px 32px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 2px 12px rgba(0,0,0,0.3)'
        },
        container: { maxWidth: '960px', margin: '0 auto', padding: '32px 16px' },
        card: {
            background: 'white', borderRadius: '16px', padding: '24px',
            marginBottom: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
            border: '1px solid #e2e8f0'
        },
        btn: (bg, text = 'white') => ({
            padding: '9px 22px', borderRadius: '9px', border: 'none',
            background: bg, color: text, fontWeight: '600',
            cursor: 'pointer', fontSize: '0.88rem', transition: 'opacity 0.2s'
        }),
        textarea: {
            width: '100%', minHeight: '70px', padding: '10px', borderRadius: '10px',
            border: '1px solid #d1d5db', fontSize: '0.88rem', marginTop: '10px',
            resize: 'vertical', boxSizing: 'border-box', outline: 'none'
        },
        field: { margin: '4px 0', color: '#374151', fontSize: '0.9rem' },
    };

    return (
        <div style={s.root}>
            {/* Top Bar */}
            <div style={s.topbar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.4rem' }}>🛡️</span>
                    <div>
                        <div style={{ color: 'white', fontWeight: '700', fontSize: '1.05rem' }}>Admin Portal</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Doctor Verification Management</div>
                    </div>
                </div>
                <button onClick={handleLogout} style={s.btn('rgba(255,255,255,0.1)', '#cbd5e1')}>
                    🚪 Logout
                </button>
            </div>

            <div style={s.container}>
                <div style={{ marginBottom: '28px' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>
                        Doctor Profiles
                    </h1>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '0.92rem' }}>
                        Review pending applications or browse fully verified doctors.
                    </p>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                    <button
                        onClick={() => setActiveTab('pending')}
                        style={{
                            ...s.btn(activeTab === 'pending' ? '#ef4444' : 'transparent', activeTab === 'pending' ? 'white' : '#64748b'),
                            border: activeTab === 'pending' ? 'none' : '1px solid #cbd5e1'
                        }}
                    >
                        ⏳ Pending Requests ({pendingDoctors.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('verified')}
                        style={{
                            ...s.btn(activeTab === 'verified' ? '#22c55e' : 'transparent', activeTab === 'verified' ? 'white' : '#64748b'),
                            border: activeTab === 'verified' ? 'none' : '1px solid #cbd5e1'
                        }}
                    >
                        ✅ Verified Doctors ({verifiedDoctors.length})
                    </button>
                </div>

                {loading && (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                        ⏳ Loading pending requests...
                    </div>
                )}

                {error && (
                    <div style={{ ...s.card, background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c' }}>
                        ❌ {error}
                    </div>
                )}

                {!loading && !error && activeTab === 'pending' && pendingDoctors.length === 0 && (
                    <div style={{ ...s.card, textAlign: 'center', padding: '60px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
                        <h3 style={{ color: '#0f172a', margin: '0 0 8px 0' }}>All caught up!</h3>
                        <p style={{ color: '#64748b', margin: 0 }}>No doctors are awaiting verification right now.</p>
                    </div>
                )}

                {!loading && !error && activeTab === 'verified' && verifiedDoctors.length === 0 && (
                    <div style={{ ...s.card, textAlign: 'center', padding: '60px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏥</div>
                        <h3 style={{ color: '#0f172a', margin: '0 0 8px 0' }}>No Verified Doctors yet</h3>
                        <p style={{ color: '#64748b', margin: 0 }}>Approved profiles will appear here.</p>
                    </div>
                )}

                {(activeTab === 'pending' ? pendingDoctors : verifiedDoctors).map(doc => (
                    <div key={doc._id} style={s.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                            <div>
                                <h2 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: '#0f172a' }}>
                                    {doc.display_name || `${doc.first_name || ''} ${doc.last_name || ''}`.trim() || 'Unknown Doctor'}
                                </h2>
                                <span style={{
                                    display: 'inline-block', padding: '3px 12px', borderRadius: '20px',
                                    fontSize: '0.78rem', fontWeight: '600',
                                    background: activeTab === 'pending' ? '#fef3c7' : '#d1fae5',
                                    color: activeTab === 'pending' ? '#b45309' : '#065f46'
                                }}>
                                    {activeTab === 'pending' ? '⏳ Pending Review' : '✅ Verified'}
                                </span>
                            </div>
                            <code style={{ fontSize: '0.72rem', color: '#94a3b8', background: '#f8fafc', padding: '4px 8px', borderRadius: '6px' }}>
                                {doc._id}
                            </code>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '6px 24px' }}>
                            <p style={s.field}><strong>Specialty:</strong> {doc.specialty || '—'}</p>
                            <p style={s.field}><strong>City:</strong> {doc.city || '—'}</p>
                            <p style={s.field}><strong>Clinic:</strong> {doc.clinic_name || '—'}</p>
                            <p style={s.field}><strong>Experience:</strong> {doc.experience_years != null ? `${doc.experience_years} yrs` : '—'}</p>
                            <p style={s.field}><strong>Education:</strong> {doc.education || '—'}</p>
                            <p style={s.field}><strong>Price (Clinic):</strong> {doc.price_clinic != null ? `₹${doc.price_clinic}` : '—'}</p>
                        </div>

                        {doc.bio && (
                            <p style={{ ...s.field, marginTop: '12px', background: '#f8fafc', padding: '12px', borderRadius: '10px', lineHeight: '1.5' }}>
                                <strong>Bio:</strong> {doc.bio}
                            </p>
                        )}

                        {/* Verification Documents */}
                        {doc.verification_documents && doc.verification_documents.length > 0 && (
                            <div style={{ marginTop: '16px' }}>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#0f172a' }}>📄 Uploaded Documents ({doc.verification_documents.length})</h4>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {doc.verification_documents.map((url, i) => {
                                        // Determine simple name based on loop index
                                        const docName = `Document ${i + 1}`;
                                        // Use correct URL for backend static path
                                        let finalUrl = url;
                                        if (url.startsWith('/static/')) {
                                            // Ensure correct backend URL mapping using the configured backend URL
                                            finalUrl = `${BACKEND_URL}${url}`;
                                        }

                                        return (
                                            <a
                                                key={i}
                                                href={finalUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                    padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1',
                                                    borderRadius: '6px', textDecoration: 'none', color: '#334155',
                                                    fontSize: '0.85rem', fontWeight: '500'
                                                }}
                                            >
                                                🔗 {docName}
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons (Only for pending) */}
                        {activeTab === 'pending' && (
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                                <button
                                    style={{ ...s.btn('#22c55e'), opacity: actionLoading[doc._id] ? 0.7 : 1 }}
                                    disabled={actionLoading[doc._id]}
                                    onClick={() => handleAction(doc._id, 'approve')}
                                >
                                    {actionLoading[doc._id] ? 'Processing...' : '✅ Approve'}
                                </button>
                                <button
                                    style={{ ...s.btn('#ef4444'), opacity: actionLoading[doc._id] ? 0.7 : 1 }}
                                    disabled={actionLoading[doc._id]}
                                    onClick={() => setShowRejectInput(prev => ({ ...prev, [doc._id]: !prev[doc._id] }))}
                                >
                                    ❌ Reject
                                </button>
                            </div>
                        )}

                        {activeTab === 'pending' && showRejectInput[doc._id] && (
                            <div style={{ marginTop: '14px' }}>
                                <textarea
                                    style={s.textarea}
                                    placeholder="Reason for rejection (required — this message will be shown to the doctor)"
                                    value={rejectNote[doc._id] || ''}
                                    onChange={e => setRejectNote(prev => ({ ...prev, [doc._id]: e.target.value }))}
                                />
                                <button
                                    style={{ ...s.btn('#dc2626'), marginTop: '8px', opacity: actionLoading[doc._id] ? 0.7 : 1 }}
                                    disabled={actionLoading[doc._id]}
                                    onClick={() => handleAction(doc._id, 'reject')}
                                >
                                    {actionLoading[doc._id] ? 'Rejecting...' : 'Confirm Rejection'}
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminPanel;
