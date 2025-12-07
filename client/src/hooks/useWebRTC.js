/**
 * useWebRTC Hook - Enhanced Version
 * 
 * Custom React hook that manages WebRTC peer connection.
 * Handles:
 * - Local media stream (camera/microphone)
 * - Peer connection setup and teardown
 * - Offer/Answer exchange via signaling server
 * - ICE candidate exchange for NAT traversal
 * - Screen sharing functionality
 * - Chat messaging
 * - Connection quality monitoring
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { connectSocket, disconnectSocket } from '../services/socketService';

// WebRTC configuration with multiple STUN/TURN servers for better connectivity
const RTC_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.stunprotocol.org:3478' }
    ],
    iceCandidatePoolSize: 10
};

// Media constraints for high-quality video
const MEDIA_CONSTRAINTS = {
    video: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 30, max: 60 },
        facingMode: 'user'
    },
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000
    }
};

const useWebRTC = (roomCode, userName) => {
    // State for local and remote streams
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);

    // State for call status
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(true);
    const [error, setError] = useState(null);

    // State for media controls
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    // State for remote user info
    const [remoteUser, setRemoteUser] = useState(null);
    const [remoteMuted, setRemoteMuted] = useState(false);
    const [remoteVideoOff, setRemoteVideoOff] = useState(false);

    // State for connection quality
    const [connectionQuality, setConnectionQuality] = useState('good'); // 'good' | 'medium' | 'poor'

    // Refs for persistent values across renders
    const socketRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const remoteSocketIdRef = useRef(null);
    const pendingIceCandidatesRef = useRef([]);
    const isInitiatorRef = useRef(false);
    const reconnectAttemptsRef = useRef(0);
    const statsIntervalRef = useRef(null);

    /**
     * Initialize local media stream (camera and microphone)
     */
    const initLocalStream = useCallback(async () => {
        try {
            // First try with ideal constraints
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);
            } catch (err) {
                // Fallback to basic constraints if ideal fails
                console.warn('[WebRTC] Falling back to basic media constraints');
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
            }

            localStreamRef.current = stream;
            setLocalStream(stream);
            console.log('[WebRTC] Local stream initialized successfully');
            return stream;
        } catch (err) {
            console.error('[WebRTC] Error accessing media devices:', err);

            let errorMessage = 'Could not access camera or microphone.';
            if (err.name === 'NotAllowedError') {
                errorMessage = 'Camera/microphone access denied. Please allow access in your browser settings.';
            } else if (err.name === 'NotFoundError') {
                errorMessage = 'No camera or microphone found. Please connect a device.';
            } else if (err.name === 'NotReadableError') {
                errorMessage = 'Camera/microphone is already in use by another application.';
            }

            setError(errorMessage);
            throw err;
        }
    }, []);

    /**
     * Monitor connection quality using WebRTC stats
     */
    const monitorConnectionQuality = useCallback(() => {
        if (!peerConnectionRef.current) return;

        statsIntervalRef.current = setInterval(async () => {
            try {
                const stats = await peerConnectionRef.current.getStats();
                let packetsLost = 0;
                let packetsReceived = 0;
                let jitter = 0;

                stats.forEach(report => {
                    if (report.type === 'inbound-rtp' && report.kind === 'video') {
                        packetsLost = report.packetsLost || 0;
                        packetsReceived = report.packetsReceived || 0;
                        jitter = report.jitter || 0;
                    }
                });

                // Calculate packet loss percentage
                const totalPackets = packetsLost + packetsReceived;
                const lossPercentage = totalPackets > 0 ? (packetsLost / totalPackets) * 100 : 0;

                // Determine connection quality
                if (lossPercentage > 10 || jitter > 0.1) {
                    setConnectionQuality('poor');
                } else if (lossPercentage > 5 || jitter > 0.05) {
                    setConnectionQuality('medium');
                } else {
                    setConnectionQuality('good');
                }
            } catch (err) {
                // Stats not available
            }
        }, 5000);
    }, []);

    /**
     * Create and configure peer connection
     */
    const createPeerConnection = useCallback((remoteSocketId) => {
        console.log('[WebRTC] Creating peer connection for:', remoteSocketId);

        // Close existing connection if any
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }

        const pc = new RTCPeerConnection(RTC_CONFIG);

        // Add local tracks to peer connection
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                console.log('[WebRTC] Adding local track:', track.kind);
                pc.addTrack(track, localStreamRef.current);
            });
        }

        // Handle incoming tracks from remote peer
        pc.ontrack = (event) => {
            console.log('[WebRTC] Received remote track:', event.track.kind);
            const [stream] = event.streams;
            setRemoteStream(stream);
            setIsConnected(true);
            setIsConnecting(false);
            reconnectAttemptsRef.current = 0;

            // Start monitoring connection quality
            monitorConnectionQuality();
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('[WebRTC] Sending ICE candidate');
                socketRef.current?.emit('ice-candidate', {
                    candidate: event.candidate,
                    to: remoteSocketId
                });
            }
        };

        // Handle ICE gathering state
        pc.onicegatheringstatechange = () => {
            console.log('[WebRTC] ICE gathering state:', pc.iceGatheringState);
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            console.log('[WebRTC] Connection state:', pc.connectionState);
            switch (pc.connectionState) {
                case 'connected':
                    setIsConnected(true);
                    setIsConnecting(false);
                    setError(null);
                    break;
                case 'disconnected':
                    setIsConnected(false);
                    // Attempt to reconnect
                    if (reconnectAttemptsRef.current < 3) {
                        reconnectAttemptsRef.current++;
                        console.log('[WebRTC] Attempting reconnection...');
                    }
                    break;
                case 'failed':
                    setIsConnected(false);
                    setError('Connection failed. Please try rejoining the room.');
                    break;
                case 'closed':
                    setIsConnected(false);
                    setRemoteStream(null);
                    if (statsIntervalRef.current) {
                        clearInterval(statsIntervalRef.current);
                    }
                    break;
            }
        };

        // Handle ICE connection state
        pc.oniceconnectionstatechange = () => {
            console.log('[WebRTC] ICE connection state:', pc.iceConnectionState);
            if (pc.iceConnectionState === 'failed') {
                // Attempt ICE restart
                console.log('[WebRTC] ICE failed, attempting restart...');
                pc.restartIce();
            }
        };

        // Handle negotiation needed (for renegotiation scenarios)
        pc.onnegotiationneeded = async () => {
            console.log('[WebRTC] Negotiation needed');
            // Only the initiator should create offers during renegotiation
            if (isInitiatorRef.current && remoteSocketIdRef.current) {
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socketRef.current?.emit('offer', {
                        offer: pc.localDescription,
                        to: remoteSocketIdRef.current
                    });
                } catch (err) {
                    console.error('[WebRTC] Error during renegotiation:', err);
                }
            }
        };

        peerConnectionRef.current = pc;
        return pc;
    }, [monitorConnectionQuality]);

    /**
     * Create and send offer to remote peer
     */
    const createOffer = useCallback(async (remoteSocketId) => {
        console.log('[WebRTC] Creating offer for:', remoteSocketId);

        const pc = createPeerConnection(remoteSocketId);
        remoteSocketIdRef.current = remoteSocketId;
        isInitiatorRef.current = true;

        try {
            const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });

            await pc.setLocalDescription(offer);

            socketRef.current?.emit('offer', {
                offer: pc.localDescription,
                to: remoteSocketId
            });
        } catch (err) {
            console.error('[WebRTC] Error creating offer:', err);
            setError('Failed to create call offer');
        }
    }, [createPeerConnection]);

    /**
     * Handle incoming offer and create answer
     */
    const handleOffer = useCallback(async ({ offer, from, userName: remoteUserName }) => {
        console.log('[WebRTC] Received offer from:', from);

        const pc = createPeerConnection(from);
        remoteSocketIdRef.current = from;
        isInitiatorRef.current = false;
        setRemoteUser(remoteUserName);

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));

            // Process any pending ICE candidates
            while (pendingIceCandidatesRef.current.length > 0) {
                const candidate = pendingIceCandidatesRef.current.shift();
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socketRef.current?.emit('answer', {
                answer: pc.localDescription,
                to: from
            });
        } catch (err) {
            console.error('[WebRTC] Error handling offer:', err);
            setError('Failed to answer call');
        }
    }, [createPeerConnection]);

    /**
     * Handle incoming answer
     */
    const handleAnswer = useCallback(async ({ answer, from }) => {
        console.log('[WebRTC] Received answer from:', from);

        try {
            if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== 'stable') {
                await peerConnectionRef.current.setRemoteDescription(
                    new RTCSessionDescription(answer)
                );

                // Process any pending ICE candidates
                while (pendingIceCandidatesRef.current.length > 0) {
                    const candidate = pendingIceCandidatesRef.current.shift();
                    await peerConnectionRef.current.addIceCandidate(
                        new RTCIceCandidate(candidate)
                    );
                }
            }
        } catch (err) {
            console.error('[WebRTC] Error handling answer:', err);
            setError('Failed to establish connection');
        }
    }, []);

    /**
     * Handle incoming ICE candidate
     */
    const handleIceCandidate = useCallback(async ({ candidate, from }) => {
        console.log('[WebRTC] Received ICE candidate from:', from);

        try {
            if (peerConnectionRef.current?.remoteDescription) {
                await peerConnectionRef.current.addIceCandidate(
                    new RTCIceCandidate(candidate)
                );
            } else {
                // Queue candidate if remote description not set yet
                pendingIceCandidatesRef.current.push(candidate);
            }
        } catch (err) {
            console.error('[WebRTC] Error adding ICE candidate:', err);
        }
    }, []);

    /**
     * Toggle microphone mute/unmute
     */
    const toggleAudio = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);

                // Notify remote peer about audio state
                socketRef.current?.emit('toggle-audio', { isMuted: !audioTrack.enabled });
            }
        }
    }, []);

    /**
     * Toggle camera on/off
     */
    const toggleVideo = useCallback(() => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);

                // Notify remote peer about video state
                socketRef.current?.emit('toggle-video', { isVideoOff: !videoTrack.enabled });
            }
        }
    }, []);

    /**
     * Toggle screen sharing
     */
    const toggleScreenShare = useCallback(async () => {
        if (isScreenSharing) {
            // Stop screen sharing, restore camera
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(track => track.stop());
                screenStreamRef.current = null;
            }

            // Restore camera track
            if (localStreamRef.current && peerConnectionRef.current) {
                const videoTrack = localStreamRef.current.getVideoTracks()[0];
                const sender = peerConnectionRef.current.getSenders().find(
                    s => s.track?.kind === 'video'
                );

                if (sender && videoTrack) {
                    await sender.replaceTrack(videoTrack);
                }
            }

            setIsScreenSharing(false);
            socketRef.current?.emit('toggle-screen-share', { isScreenSharing: false });
        } else {
            // Start screen sharing
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        cursor: 'always',
                        displaySurface: 'monitor'
                    },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true
                    }
                });

                screenStreamRef.current = screenStream;
                const screenTrack = screenStream.getVideoTracks()[0];

                // Replace video track in peer connection
                if (peerConnectionRef.current) {
                    const sender = peerConnectionRef.current.getSenders().find(
                        s => s.track?.kind === 'video'
                    );

                    if (sender) {
                        await sender.replaceTrack(screenTrack);
                    }
                }

                // Handle when user stops sharing via browser UI
                screenTrack.onended = () => {
                    toggleScreenShare();
                };

                setIsScreenSharing(true);
                socketRef.current?.emit('toggle-screen-share', { isScreenSharing: true });
            } catch (err) {
                console.error('[WebRTC] Error sharing screen:', err);
                if (err.name !== 'NotAllowedError') {
                    setError('Failed to share screen');
                }
            }
        }
    }, [isScreenSharing]);

    /**
     * End the call and cleanup
     */
    const endCall = useCallback(() => {
        console.log('[WebRTC] Ending call...');

        // Clear stats monitoring
        if (statsIntervalRef.current) {
            clearInterval(statsIntervalRef.current);
        }

        // Stop all local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        // Stop screen share if active
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }

        // Close peer connection
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        // Leave room via socket
        socketRef.current?.emit('leave-room');
        disconnectSocket();

        // Reset state
        setLocalStream(null);
        setRemoteStream(null);
        setIsConnected(false);
        setRemoteUser(null);
        setIsScreenSharing(false);
    }, []);

    /**
     * Initialize WebRTC connection when component mounts
     */
    useEffect(() => {
        let mounted = true;

        const init = async () => {
            try {
                // Initialize local media stream
                await initLocalStream();

                if (!mounted) return;

                // Connect to signaling server
                const socket = connectSocket();
                socketRef.current = socket;

                // Socket event handlers
                socket.on('connect', () => {
                    console.log('[Socket] Connected to signaling server');
                    socket.emit('join-room', { roomCode, userName });
                });

                socket.on('room-joined', ({ participantCount, isInitiator }) => {
                    console.log('[Socket] Joined room. Participants:', participantCount);
                    isInitiatorRef.current = isInitiator;

                    if (participantCount === 1) {
                        setIsConnecting(true);
                    }
                });

                socket.on('room-full', ({ message }) => {
                    console.log('[Socket] Room full:', message);
                    setError(message);
                    setIsConnecting(false);
                });

                // When another user joins, initiator creates offer
                socket.on('user-joined', ({ socketId, userName: remoteUserName }) => {
                    console.log('[Socket] User joined:', remoteUserName);
                    setRemoteUser(remoteUserName);
                    createOffer(socketId);
                });

                // When joining a room with existing user
                socket.on('existing-user', ({ socketId, userName: remoteUserName }) => {
                    console.log('[Socket] Existing user:', remoteUserName);
                    setRemoteUser(remoteUserName);
                    remoteSocketIdRef.current = socketId;
                });

                // Handle incoming offer
                socket.on('offer', handleOffer);

                // Handle incoming answer
                socket.on('answer', handleAnswer);

                // Handle ICE candidates
                socket.on('ice-candidate', handleIceCandidate);

                // Handle remote user audio toggle
                socket.on('peer-audio-toggle', ({ isMuted }) => {
                    setRemoteMuted(isMuted);
                });

                // Handle remote user video toggle
                socket.on('peer-video-toggle', ({ isVideoOff }) => {
                    setRemoteVideoOff(isVideoOff);
                });

                // Handle user leaving
                socket.on('user-left', ({ userName: leftUserName }) => {
                    console.log('[Socket] User left:', leftUserName);
                    setRemoteStream(null);
                    setRemoteUser(null);
                    setIsConnected(false);
                    setIsConnecting(true);

                    if (peerConnectionRef.current) {
                        peerConnectionRef.current.close();
                        peerConnectionRef.current = null;
                    }

                    if (statsIntervalRef.current) {
                        clearInterval(statsIntervalRef.current);
                    }
                });

                socket.on('disconnect', () => {
                    console.log('[Socket] Disconnected from signaling server');
                });

                socket.on('connect_error', (err) => {
                    console.error('[Socket] Connection error:', err);
                    setError('Failed to connect to server. Please check your connection.');
                    setIsConnecting(false);
                });

            } catch (err) {
                console.error('[WebRTC] Initialization error:', err);
                if (mounted) {
                    setIsConnecting(false);
                }
            }
        };

        init();

        // Cleanup on unmount
        return () => {
            mounted = false;
            if (statsIntervalRef.current) {
                clearInterval(statsIntervalRef.current);
            }
            endCall();
        };
    }, [roomCode, userName, initLocalStream, createOffer, handleOffer, handleAnswer, handleIceCandidate, endCall]);

    return {
        // Streams
        localStream,
        remoteStream,

        // Connection status
        isConnected,
        isConnecting,
        error,
        connectionQuality,

        // Local media controls
        isMuted,
        isVideoOff,
        isScreenSharing,
        toggleAudio,
        toggleVideo,
        toggleScreenShare,

        // Remote user info
        remoteUser,
        remoteMuted,
        remoteVideoOff,

        // Actions
        endCall,

        // Socket for chat
        socket: socketRef.current
    };
};

export default useWebRTC;
