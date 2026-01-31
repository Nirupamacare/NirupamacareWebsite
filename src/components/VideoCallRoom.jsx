import React, { useEffect, useRef, useState } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { PhoneOff, AlertCircle } from 'lucide-react';
import './VideoCallRoom.css';

const VideoCallRoom = ({ userType = 'patient' }) => {
    const { callId } = useParams();
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [callData, setCallData] = useState(null);
    const zpRef = useRef(null);

    useEffect(() => {
        if (!callId) {
            setError('No call ID provided');
            setLoading(false);
            return;
        }

        initializeCall();

        // Cleanup on unmount
        return () => {
            if (zpRef.current) {
                try {
                    zpRef.current.destroy();
                } catch (err) {
                    console.error('Error destroying Zego instance:', err);
                }
            }
        };
    }, [callId]);

    const initializeCall = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get video call token from backend
            const tokenResponse = await api.getVideoCallToken(callId, 'prebuilt');

            if (!tokenResponse.allowed) {
                setError(tokenResponse.reason || 'Call is not available at this time');
                setLoading(false);
                return;
            }

            if (!tokenResponse.token) {
                setError('Unable to generate video call token. Please contact support.');
                setLoading(false);
                return;
            }

            setCallData(tokenResponse);

            // Initialize Zego UIKit
            const appID = parseInt(tokenResponse.app_id);
            const serverSecret = tokenResponse.token;
            const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                appID,
                serverSecret,
                tokenResponse.room_id,
                tokenResponse.user_id,
                tokenResponse.user_name || tokenResponse.user_id
            );

            // Create instance
            const zp = ZegoUIKitPrebuilt.create(kitToken);
            zpRef.current = zp;

            // Join the room
            zp.joinRoom({
                container: containerRef.current,
                scenario: {
                    mode: ZegoUIKitPrebuilt.OneONoneCall,
                },
                showPreJoinView: true,
                showScreenSharingButton: true,
                showTextChat: true,
                showUserList: true,
                maxUsers: 2,
                layout: "Auto",
                showLayoutButton: false,
                
                onJoinRoom: () => {
                    console.log('Joined room successfully');
                    // Record participant join event
                    api.recordCallEvent(callId, 'participant_join')
                        .catch(err => console.error('Failed to record join event:', err));
                },
                
                onLeaveRoom: () => {
                    console.log('Left room');
                    // Record participant leave event
                    api.recordCallEvent(callId, 'participant_leave')
                        .catch(err => console.error('Failed to record leave event:', err));
                    
                    // Navigate back after leaving
                    setTimeout(() => {
                        if (userType === 'doctor') {
                            navigate('/doctor-dashboard');
                        } else {
                            navigate('/my-appointments');
                        }
                    }, 1000);
                },

                onReturnToHomeScreenClicked: () => {
                    // Handle the back button in pre-join view
                    if (userType === 'doctor') {
                        navigate('/doctor-dashboard');
                    } else {
                        navigate('/my-appointments');
                    }
                },
            });

            setLoading(false);

        } catch (err) {
            console.error('Error initializing call:', err);
            setError(err.message || 'Failed to initialize video call');
            setLoading(false);
        }
    };

    const handleEndCall = () => {
        if (zpRef.current) {
            zpRef.current.destroy();
        }
        
        // Record call ended event
        api.recordCallEvent(callId, 'call_ended')
            .catch(err => console.error('Failed to record end event:', err));

        if (userType === 'doctor') {
            navigate('/doctor-dashboard');
        } else {
            navigate('/my-appointments');
        }
    };

    if (loading) {
        return (
            <div className="video-call-loading">
                <div className="spinner"></div>
                <p>Connecting to video call...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="video-call-error">
                <AlertCircle size={64} color="#ef4444" />
                <h2>Unable to Join Call</h2>
                <p>{error}</p>
                <button 
                    className="btn-back"
                    onClick={() => navigate(userType === 'doctor' ? '/doctor-dashboard' : '/my-appointments')}
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="video-call-container">
            <div ref={containerRef} className="video-call-room"></div>
            <div className="video-call-overlay">
                <button className="btn-end-call" onClick={handleEndCall}>
                    <PhoneOff size={20} />
                    End Call
                </button>
            </div>
        </div>
    );
};

export default VideoCallRoom;