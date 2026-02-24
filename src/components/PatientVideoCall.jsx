import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { Video, Clock, CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import './PatientVideoCall.css';

const PatientVideoCall = () => {
    const navigate = useNavigate();
    const { doctorId } = useParams();
    const [loading, setLoading] = useState(false);
    const [callStatus, setCallStatus] = useState(null); // 'requesting', 'waiting', 'approved', 'rejected'
    const [callData, setCallData] = useState(null);
    const [error, setError] = useState(null);
    const [pollingInterval, setPollingInterval] = useState(null);

    useEffect(() => {
        // Cleanup polling on unmount
        return () => {
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
        };
    }, [pollingInterval]);

    const requestCall = async () => {
        try {
            setLoading(true);
            setError(null);

            // Request a call with the doctor
            const response = await api.requestCall({
                doctor_id: doctorId
            });

            setCallData(response);
            setCallStatus('waiting');
            setLoading(false);

            // Start polling for call approval
            const interval = setInterval(async () => {
                try {
                    // Get updated call status (you may need to add this endpoint)
                    const tokenResponse = await api.getVideoCallToken(response.id, 'prebuilt');
                    
                    if (tokenResponse.allowed) {
                        clearInterval(interval);
                        setCallStatus('approved');
                    }
                } catch (err) {
                    // If we get a 403 or specific error, the call was rejected
                    if (err.response?.status === 403 || err.response?.data?.detail?.includes('rejected')) {
                        clearInterval(interval);
                        setCallStatus('rejected');
                    }
                }
            }, 3000); // Poll every 3 seconds

            setPollingInterval(interval);

        } catch (err) {
            console.error('Error requesting call:', err);
            setError(err.response?.data?.detail || 'Failed to request video call');
            setLoading(false);
        }
    };

    const joinCall = () => {
        if (callData && callData.id) {
            navigate(`/video-call/${callData.id}`);
        }
    };

    const cancelRequest = () => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }
        setCallStatus(null);
        setCallData(null);
    };

    return (
        <div className="patient-video-call-page">
            <div className="call-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <h2>Video Consultation</h2>
            </div>

            <div className="call-content">
                {!callStatus ? (
                    <div className="call-request-card">
                        <div className="call-icon-wrapper">
                            <Video size={64} />
                        </div>
                        <h3>Start Video Consultation</h3>
                        <p>Request a video call with your doctor. They will be notified and can approve your request.</p>
                        
                        {error && (
                            <div className="error-message">
                                <AlertCircle size={20} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button 
                            className="btn-request-call"
                            onClick={requestCall}
                            disabled={loading}
                        >
                            {loading ? 'Requesting...' : 'Request Video Call'}
                        </button>
                    </div>
                ) : callStatus === 'waiting' ? (
                    <div className="call-waiting-card">
                        <div className="waiting-animation">
                            <div className="pulse-ring"></div>
                            <div className="pulse-ring delay-1"></div>
                            <div className="pulse-ring delay-2"></div>
                            <Clock size={48} />
                        </div>
                        <h3>Waiting for Doctor</h3>
                        <p>Your call request has been sent. The doctor will approve it shortly.</p>
                        <p className="call-id">Call ID: #{callData?.id?.slice(-8)}</p>
                        
                        <button 
                            className="btn-cancel"
                            onClick={cancelRequest}
                        >
                            Cancel Request
                        </button>
                    </div>
                ) : callStatus === 'approved' ? (
                    <div className="call-approved-card">
                        <div className="success-icon">
                            <CheckCircle size={64} />
                        </div>
                        <h3>Call Approved!</h3>
                        <p>The doctor has approved your call request. You can now join the video consultation.</p>
                        
                        <button 
                            className="btn-join-call"
                            onClick={joinCall}
                        >
                            <Video size={20} />
                            Join Video Call
                        </button>
                    </div>
                ) : callStatus === 'rejected' ? (
                    <div className="call-rejected-card">
                        <div className="rejected-icon">
                            <XCircle size={64} />
                        </div>
                        <h3>Call Not Available</h3>
                        <p>The doctor is currently unavailable. Please try booking an appointment instead.</p>
                        
                        <button 
                            className="btn-back-home"
                            onClick={() => navigate('/doctors')}
                        >
                            Find Doctors
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default PatientVideoCall;