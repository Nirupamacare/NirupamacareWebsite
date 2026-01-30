import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { ArrowLeft, FileText, Download, Eye, X, Calendar, Clock } from 'lucide-react';
import './MedicalRecords.css';

const MedicalRecords = () => {
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            const appointments = await api.getPatientAppointments();
            // Filter only completed appointments with attachments
            const completedWithDocs = appointments.filter(
                apt => apt.status === 'Completed' && apt.attachments && apt.attachments.length > 0
            );
            setRecords(completedWithDocs);
        } catch (err) {
            console.error('Failed to fetch medical records:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="medical-records-page">
            <div className="records-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <h2>My Medical Records</h2>
            </div>

            {loading ? (
                <div className="loading-state">Loading your medical records...</div>
            ) : records.length === 0 ? (
                <div className="empty-state">
                    <FileText size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <p>No medical records available yet.</p>
                    <p className="empty-subtitle">Documents will appear here after your appointments are completed.</p>
                </div>
            ) : (
                <div className="records-list">
                    {records.map((record) => (
                        <div key={record.id} className="record-card">
                            <div className="record-header">
                                <div className="record-info">
                                    <h3>Appointment on {record.date}</h3>
                                    <div className="record-meta">
                                        <span><Calendar size={14} /> {record.date}</span>
                                        <span><Clock size={14} /> {record.time}</span>
                                        <span className="record-type">{record.type}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="documents-section">
                                <h4>📄 Medical Documents ({record.attachments.length})</h4>
                                <div className="documents-grid">
                                    {record.attachments.map((fileData, index) => {
                                        const isPdf = fileData.startsWith('data:application/pdf');
                                        const isImage = fileData.startsWith('data:image');

                                        return (
                                            <div key={index} className="document-item">
                                                {isImage ? (
                                                    <div className="doc-preview-box" onClick={() => setPreviewImage(fileData)}>
                                                        <img src={fileData} alt={`Document ${index + 1}`} />
                                                        <div className="doc-overlay">
                                                            <Eye size={20} />
                                                            <span>View</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="doc-pdf-box">
                                                        <FileText size={32} />
                                                        <span className="doc-label">Prescription PDF</span>
                                                        <a
                                                            href={fileData}
                                                            download={`Prescription-${record.date}-${index + 1}.pdf`}
                                                            className="doc-download-btn"
                                                        >
                                                            <Download size={16} />
                                                            Download
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox for Image Preview */}
            {previewImage && (
                <div className="lightbox-overlay" onClick={() => setPreviewImage(null)}>
                    <button className="lightbox-close">
                        <X size={24} />
                    </button>
                    <img src={previewImage} alt="Full Preview" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </div>
    );
};

export default MedicalRecords;
