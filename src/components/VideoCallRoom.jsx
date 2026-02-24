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
    const zpRef = useRef(null);

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    // Add state to store the token
    const [kitToken, setKitToken] = useState(null);

    // ---------------------------------------------
    // EFFECT 1: Fetch Token Only
    // ---------------------------------------------
    useEffect(() => {
        let isMounted = true;

        const fetchToken = async () => {
            if (!callId) {
                if (isMounted) {
                    setError('No call ID provided');
                    setLoading(false);
                }
                return;
            }

            try {
                const tokenResponse = await api.getVideoCallToken(callId, 'prebuilt');
                
                if (!isMounted) return;

                if (!tokenResponse.allowed) {
                    setError(tokenResponse.reason || 'Call is not available at this time');
                    setLoading(false);
                    return;
                }

                // Save token and stop loading. 
                // This forces a re-render, creating the <div ref={containerRef}>
                setKitToken(tokenResponse.token);
                setLoading(false);

            } catch (err) {
                console.error('Error fetching token:', err);
                if (isMounted) {
                    setError(err.message || 'Failed to initialize video call');
                    setLoading(false);
                }
            }
        };

        fetchToken();

        return () => { isMounted = false; };
    }, [callId]);

    const handleEndCall = () => {
        if (zpRef.current) {
            zpRef.current.destroy();
            zpRef.current = null;
        }
        
        api.recordCallEvent(callId, 'call_ended')
            .catch(err => console.error('Failed to record end event:', err));

        if (userType === 'doctor') {
            navigate('/doctor-dashboard');
        } else {
            navigate('/my-appointments');
        }
    };


    // ---------------------------------------------
    // EFFECT 2: Initialize Zego (Only when Token & Ref exist)
    // ---------------------------------------------
    useEffect(() => {
        // Only run if we have a token, the container DOM element exists, and we haven't already joined
        if (kitToken && containerRef.current && !zpRef.current) {
            console.log('🚀 Initializing Zego in container:', containerRef.current);

            const zp = ZegoUIKitPrebuilt.create(kitToken);
            zpRef.current = zp;

            zp.joinRoom({
                container: containerRef.current,
                scenario: {
                    mode: ZegoUIKitPrebuilt.OneONoneCall,
                },
                turnOnCameraWhenJoining: true,
                turnOnMicrophoneWhenJoining: true,
                showMyCameraToggleButton: true,
                showMyMicrophoneToggleButton: true,
                showAudioVideoSettingsButton: true,
                showPreJoinView: false, 
                showScreenSharingButton: true,
                showTextChat: true,
                showUserList: true,
                maxUsers: 2,
                layout: "Auto",
                showLayoutButton: false,
                
                onJoinRoom: () => {
                    console.log('Joined room successfully');
                    api.recordCallEvent(callId, 'participant_join')
                       .catch(err => console.error('Failed to record join event:', err));
                },
                
                onLeaveRoom: () => {
                    handleEndCall()
                },
            });
        }

        // Cleanup function for when component unmounts
        return () => {
            if (zpRef.current) {
                try {
                    zpRef.current.destroy();
                    zpRef.current = null;
                } catch (err) {
                    console.error('Error destroying Zego instance:', err);
                }
            }
        };
    // Run this effect when kitToken changes or when loading finishes
    }, [kitToken, userType, callId, navigate]);


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
            {/* 
                IMPORTANT: Ensure this div has width/height defined in CSS 
                (e.g., width: 100vw; height: 100vh;) 
            */}
            <div ref={containerRef} className="video-call-room" style={{ width: '100%', height: '100vh' }}></div>
            
            {/* Custom Overlay (Optional: Zego has its own end button, but if you keep this, position it absolutely) */}
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