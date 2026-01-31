import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Video, Phone, CheckCircle, XCircle, Clock, User, AlertCircle } from 'lucide-react';
import './DoctorVideoCall.css';

const DoctorVideoCall = () => {
    const navigate = useNavigate();
    const [incomingCalls, setIncomingCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingCallId, setProcessingCallId] = useState(null);

    useEffect(() => {
        loadIncomingCalls();

        // Poll for new incoming calls every 5 seconds
        const interval = setInterval(() => {
            loadIncomingCalls();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const loadIncomingCalls = async () => {
        try {
            const calls = await api.getDoctorPendingCalls();
            setIncomingCalls(calls);
            setLoading(false);
        } catch (err) {
            console.error('Error loading incoming calls:', err);
            setLoading(false);
        }
    };

    const handleApprove = async (callId) => {
        try {
            setProcessingCallId(callId);
            await api.approveCall(callId, 'approve');
            
            // Navigate to video call room
            navigate(`/video-call/${callId}`);
        } catch (err) {
            console.error('Error approving call:', err);
            alert('Failed to approve call. Please try again.');
            setProcessingCallId(null);
        }
    };

    const handleReject = async (callId) => {
        try {
            setProcessingCallId(callId);
            await api.approveCall(callId, 'reject');
            
            // Remove from list
            setIncomingCalls(incomingCalls.filter(call => call.id !== callId));
            setProcessingCallId(null);
        } catch (err) {
            console.error('Error rejecting call:', err);
            alert('Failed to reject call. Please try again.');
            setProcessingCallId(null);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return 'Just now';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="doctor-video-loading">
                <div className="spinner"></div>
                <p>Loading incoming calls...</p>
            </div>
        );
    }

    return (
        <div className="doctor-video-call-page">
            <div className="video-header">
                <div className="header-content">
                    <h1>
                        <Video size={32} />
                        Video Call Requests
                    </h1>
                    <p>Manage incoming video consultation requests from patients</p>
                </div>
                <button className="btn-back-dashboard" onClick={() => navigate('/doctor-dashboard')}>
                    Back to Dashboard
                </button>
            </div>

            <div className="calls-container">
                {incomingCalls.length === 0 ? (
                    <div className="empty-state">
                        <Phone size={64} />
                        <h3>No Incoming Calls</h3>
                        <p>When patients request video consultations, they will appear here.</p>
                    </div>
                ) : (
                    <div className="calls-grid">
                        {incomingCalls.map((call) => (
                            <div key={call.id} className="call-card">
                                <div className="call-header-info">
                                    <div className="patient-avatar">
                                        <User size={32} />
                                    </div>
                                    <div className="patient-info">
                                        <h3>{call.patient_name || 'Patient'}</h3>
                                        <p className="call-time">
                                            <Clock size={14} />
                                            {formatTime(call.requested_at)}
                                        </p>
                                    </div>
                                    <div className={`call-status status-${call.status}`}>
                                        {call.status === 'requested' && '● Waiting'}
                                        {call.status === 'approved' && '● Approved'}
                                        {call.status === 'started' && '● In Progress'}
                                    </div>
                                </div>

                                <div className="call-meta">
                                    <div className="meta-item">
                                        <strong>Call ID:</strong>
                                        <span>#{call.id?.slice(-8)}</span>
                                    </div>
                                    <div className="meta-item">
                                        <strong>Room:</strong>
                                        <span>{call.room_id?.slice(0, 12)}...</span>
                                    </div>
                                </div>

                                {call.status === 'requested' && (
                                    <div className="call-actions">
                                        <button
                                            className="btn-approve"
                                            onClick={() => handleApprove(call.id)}
                                            disabled={processingCallId === call.id}
                                        >
                                            <CheckCircle size={18} />
                                            {processingCallId === call.id ? 'Approving...' : 'Approve & Join'}
                                        </button>
                                        <button
                                            className="btn-reject"
                                            onClick={() => handleReject(call.id)}
                                            disabled={processingCallId === call.id}
                                        >
                                            <XCircle size={18} />
                                            Reject
                                        </button>
                                    </div>
                                )}

                                {call.status === 'approved' && (
                                    <div className="call-actions">
                                        <button
                                            className="btn-join"
                                            onClick={() => navigate(`/video-call/${call.id}`)}
                                        >
                                            <Video size={18} />
                                            Join Call
                                        </button>
                                    </div>
                                )}

                                {call.status === 'started' && (
                                    <div className="call-actions">
                                        <button
                                            className="btn-join active"
                                            onClick={() => navigate(`/video-call/${call.id}`)}
                                        >
                                            <Video size={18} />
                                            Rejoin Call
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {incomingCalls.length > 0 && (
                <div className="calls-footer">
                    <AlertCircle size={16} />
                    <span>Calls are automatically refreshed every 5 seconds</span>
                </div>
            )}
        </div>
    );
};

export default DoctorVideoCall;