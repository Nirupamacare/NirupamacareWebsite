import React, { useState } from 'react';
import { Upload, X, FileText, ImageIcon, Trash2, CheckCircle } from 'lucide-react';
import './AttachmentUploadModal.css';

const AttachmentUploadModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
    const [files, setFiles] = useState([]);
    const [dragActive, setDragActive] = useState(false);

    if (!isOpen) return null;

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    };

    const handleFiles = (fileList) => {
        const newFiles = Array.from(fileList);

        newFiles.forEach(file => {
            // Basic validation: Check size (e.g., max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert(`${file.name} is too large. Max 5MB allowed.`);
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFiles(prev => [...prev, {
                    name: file.name,
                    type: file.type,
                    data: reader.result // Base64 string
                }]);
            };

            if (file.type.startsWith('image/') || file.type === 'application/pdf') {
                reader.readAsDataURL(file);
            } else {
                alert("Only Images (JPG, PNG) and PDFs are allowed.");
            }
        });
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        // Extract just the base64 strings if that's what backend expects, 
        // or keep structured object if schema allows.
        // Based on requirement: "array of Base64 strings"
        const attachments = files.map(f => f.data);
        onSubmit(attachments);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content upload-modal">
                <div className="modal-header">
                    <h3>Upload Medical Documents</h3>
                    <button className="close-btn" onClick={onClose} disabled={isSubmitting}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <p className="modal-desc">
                        Upload prescriptions, lab reports, or other medical documents for the patient.
                        (Images & PDF, Max 5MB)
                    </p>

                    <div
                        className={`drop-zone ${dragActive ? "active" : ""}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <Upload size={32} className="upload-icon" />
                        <p>Drag & drop files here or <span className="browse-text">browse</span></p>
                        <input
                            type="file"
                            multiple
                            accept="image/*,application/pdf"
                            onChange={handleChange}
                            className="file-input"
                        />
                    </div>

                    {files.length > 0 && (
                        <div className="file-list">
                            <h4>Ready to Upload ({files.length})</h4>
                            <div className="file-grid">
                                {files.map((file, index) => (
                                    <div key={index} className="file-item">
                                        <div className="file-preview">
                                            {file.type.startsWith('image/') ? (
                                                <img src={file.data} alt="preview" />
                                            ) : (
                                                <div className="pdf-preview">
                                                    <FileText size={24} />
                                                    <span>PDF</span>
                                                </div>
                                            )}
                                            <button className="remove-file-btn" onClick={() => removeFile(index)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <span className="file-name" title={file.name}>{file.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </button>
                    <button
                        className="btn-submit"
                        onClick={handleSubmit}
                        disabled={files.length === 0 || isSubmitting}
                    >
                        {isSubmitting ? 'Uploading...' : 'Complete Appointment'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AttachmentUploadModal;
