import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import './Doctors.css';
import { MapPin, Clock, Star, Award, GraduationCap, Globe } from 'lucide-react';

const DoctorProfileView = () => {
    const { doctorId } = useParams();
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDoc = async () => {
            try {
                const data = await api.getDoctorById(doctorId);
                if (data) {
                    setDoctor({
                        ...data,
                        id: data._id || data.id,
                        name: data.display_name || data.name || "Doctor",
                        profile_image_url: data.profile_image_url || "", // Added mapping
                        specialization: data.specialty || data.specialization || "General",
                        clinicName: data.clinic_name || "Clinic Info Not Available",
                        location: data.clinic_address || data.location || data.city || "Location Not Available",
                        rating: data.rating !== undefined ? data.rating : "New",
                        experience: data.experience_years ? `${data.experience_years} Years` : "New",
                        about: data.bio || "No biography available for this doctor.",
                        languages: Array.isArray(data.languages) ? data.languages : [],
                        credentials: data.credentials || "",
                        fee: data.price_clinic !== undefined ? data.price_clinic : "N/A",
                        feeOnline: data.price_online
                    });
                }
            } catch (err) {
                console.error("Failed to fetch doctor profile", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDoc();
    }, [doctorId]);

    if (loading) return <div className="loading-state">Loading Profile...</div>;
    if (!doctor) return <div className="empty-state">Doctor not found.</div>;

    return (
        <div className="doctor-profile-view">
            <header className="profile-header">
                <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
            </header>

            <div className="profile-card-large">
                <div className="profile-top">
                    <img
                        src={doctor.profile_image_url || `https://ui-avatars.com/api/?name=${doctor.name}&background=random&size=128`}
                        alt={doctor.name}
                        className="profile-avatar-large"
                        style={{ objectFit: 'cover' }}
                    />
                    <div className="profile-info-large">
                        <div className="name-row">
                            <h1>{doctor.name}</h1>
                            {doctor.credentials && <span className="cred-badge">{doctor.credentials}</span>}
                        </div>
                        <p className="profile-spec">{doctor.specialization}</p>
                        <p className="profile-loc"><MapPin size={16} /> {doctor.location}</p>

                        <div className="profile-stats">
                            <div className="stat-badge">
                                <Star size={16} fill="#FFD700" color="#FFD700" />
                                <span>{doctor.rating} Rating</span>
                            </div>
                            <div className="stat-badge">
                                <Award size={16} />
                                <span>{doctor.experience} Exp.</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="profile-body">
                    <h3>About Doctor</h3>
                    <p className="profile-about">{doctor.about}</p>

                    {doctor.languages.length > 0 && (
                        <div className="languages-section">
                            <p className="lang-list">
                                <Globe size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                <strong>Languages:</strong> {doctor.languages.join(", ")}
                            </p>
                        </div>
                    )}

                    <div className="divider"></div>

                    <h3>Clinic Info</h3>
                    <p><strong>{doctor.clinicName}</strong></p>
                    <p style={{ color: '#666' }}>{doctor.location}</p>

                    <div className="fees-grid">
                        {doctor.fee > 0 && (
                            <div className="fee-box">
                                <span>Clinic Visit</span>
                                <p className="fee-large">₹{doctor.fee}</p>
                            </div>
                        )}
                        {doctor.feeOnline > 0 && (
                            <div className="fee-box">
                                <span>Online Consult</span>
                                <p className="fee-large">₹{doctor.feeOnline}</p>
                            </div>
                        )}
                        {!(doctor.fee > 0) && !(doctor.feeOnline > 0) && (
                            <p style={{ color: '#666' }}>No fees listed.</p>
                        )}
                    </div>
                </div>

                <div className="profile-actions-sticky">
                    <button
                        className="btn-book-large"
                        onClick={() => navigate(`/book-appointment/${doctor.id}`)}
                    >
                        Book Appointment
                    </button>
                </div>
            </div>

            <style jsx>{`
                .doctor-profile-view {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 24px;
                    padding-bottom: 100px;
                }
                .profile-header { margin-bottom: 20px; }
                .back-btn { background:none; border:none; font-size: 1.1rem; cursor: pointer; color: #0f9d58; }
                
                .profile-card-large {
                    background: white;
                    border-radius: 16px;
                    border: 1px solid #eee;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                .profile-top {
                    background: linear-gradient(to bottom right, #f0fdf4, #ffffff);
                    padding: 32px;
                    display: flex;
                    gap: 24px;
                    align-items: center;
                }
                .profile-avatar-large {
                    width: 100px; height: 100px; border-radius: 50%;
                    border: 4px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .profile-info-large { flex: 1; }
                .name-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
                .profile-info-large h2 h1 { margin: 0; font-size: 1.5rem; line-height: 1.2; }
                .cred-badge {
                    background: #e0e7ff; color: #3730a3; padding: 2px 8px; 
                    border-radius: 4px; font-size: 0.8rem; font-weight: 600;
                }
                
                .profile-spec { color: #0f9d58; font-weight: 600; margin: 0 0 8px 0; }
                .profile-loc { color: #666; display: flex; align-items: center; gap: 6px; margin: 0 0 16px 0; }
                
                .profile-stats { display: flex; gap: 12px; }
                .stat-badge {
                    background: white; padding: 6px 12px; border-radius: 20px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    display: flex; align-items: center; gap: 6px; font-size: 0.9rem; font-weight: 600;
                }

                .profile-body { padding: 32px; }
                .profile-body h3 { margin: 24px 0 12px 0; font-size: 1.1rem; color: #333; }
                .profile-body h3:first-child { margin-top: 0; }
                .profile-about { line-height: 1.6; color: #555; }
                
                .lang-list { color: #555; display: flex; align-items: center; }

                .divider { height: 1px; background: #eee; margin: 24px 0; }
                
                .fees-grid { display: flex; gap: 24px; margin-top: 16px; }
                .fee-box { 
                    border: 1px solid #eee; padding: 16px; border-radius: 8px; min-width: 140px;
                    background: #fafafa;
                }
                .fee-box span { font-size: 0.9rem; color: #666; display: block; margin-bottom: 4px; }
                .fee-large { font-size: 1.4rem; font-weight: 700; color: #0f9d58; margin: 0; }

                .profile-actions-sticky {
                    position: fixed; bottom: 0; left: 0; width: 100%;
                    background: white; padding: 16px 24px;
                    border-top: 1px solid #eee;
                    display: flex; justify-content: center;
                    box-shadow: 0 -4px 12px rgba(0,0,0,0.05);
                }
                .btn-book-large {
                    background: #0f9d58; color: white; border: none;
                    padding: 14px 40px; border-radius: 30px;
                    font-size: 1.1rem; font-weight: 600; cursor: pointer;
                    width: 100%; max-width: 400px;
                    box-shadow: 0 4px 12px rgba(15, 157, 88, 0.3);
                }
                .btn-book-large:hover { background: #0c8c4e; transform: translateY(-2px); }

                @media(max-width: 600px) {
                    .profile-top { flex-direction: column; text-align: center; }
                    .name-row { justify-content: center; }
                    .profile-loc { justify-content: center; }
                    .profile-stats { justify-content: center; }
                }
            `}</style>
        </div>
    );
};

export default DoctorProfileView;
