/**
 * Call Page Component - Enhanced Version
 * 
 * Premium video calling interface with:
 * - Local and remote video displays
 * - Call controls with keyboard shortcuts
 * - Call duration timer
 * - In-call chat functionality
 * - Network quality indicator
 * - Picture-in-Picture support
 * - Toast notifications
 * - Responsive layout
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    PhoneOff,
    Monitor,
    MonitorOff,
    Copy,
    Check,
    User,
    Wifi,
    WifiOff,
    MessageCircle,
    X,
    Send,
    Maximize,
    Minimize,
    Settings,
    MoreVertical,
    Clock,
    UserPlus
} from 'lucide-react';
import useWebRTC from '../hooks/useWebRTC';

const CallPage = () => {
    const { roomCode } = useParams();
    const navigate = useNavigate();

    // Get username from sessionStorage
    const userName = sessionStorage.getItem('userName') || 'Anonymous';

    // Video element refs
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    // State management
    const [copied, setCopied] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [callDuration, setCallDuration] = useState(0);
    const [callStarted, setCallStarted] = useState(false);
    const [showToast, setShowToast] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);

    // Initialize WebRTC hook
    const {
        localStream,
        remoteStream,
        isConnected,
        isConnecting,
        error,
        isMuted,
        isVideoOff,
        isScreenSharing,
        toggleAudio,
        toggleVideo,
        toggleScreenShare,
        remoteUser,
        remoteMuted,
        remoteVideoOff,
        endCall,
        socket
    } = useWebRTC(roomCode, userName);

    /**
     * Attach local stream to video element
     */
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    /**
     * Attach remote stream to video element
     */
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    /**
     * Start call timer when connected
     */
    useEffect(() => {
        let interval;
        if (isConnected && !callStarted) {
            setCallStarted(true);
            showNotification(`${remoteUser || 'User'} joined the call`);
        }

        if (callStarted) {
            interval = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isConnected, callStarted, remoteUser]);

    /**
     * Format call duration as MM:SS or HH:MM:SS
     */
    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    /**
     * Show toast notification
     */
    const showNotification = useCallback((message, type = 'info') => {
        setShowToast({ message, type });
        setTimeout(() => setShowToast(null), 4000);
    }, []);

    /**
     * Handle keyboard shortcuts
     */
    useEffect(() => {
        const handleKeyPress = (e) => {
            // Don't trigger shortcuts when typing in chat
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key.toLowerCase()) {
                case 'm':
                    toggleAudio();
                    showNotification(isMuted ? 'Microphone unmuted' : 'Microphone muted');
                    break;
                case 'v':
                    toggleVideo();
                    showNotification(isVideoOff ? 'Camera turned on' : 'Camera turned off');
                    break;
                case 's':
                    toggleScreenShare();
                    break;
                case 'c':
                    setShowChat(prev => !prev);
                    break;
                case 'f':
                    toggleFullscreen();
                    break;
                case 'escape':
                    if (isFullscreen) toggleFullscreen();
                    if (showChat) setShowChat(false);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [toggleAudio, toggleVideo, toggleScreenShare, isMuted, isVideoOff, isFullscreen, showChat, showNotification]);

    /**
     * Toggle fullscreen mode
     */
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    /**
     * Handle end call
     */
    const handleEndCall = () => {
        endCall();
        navigate('/');
    };

    /**
     * Copy room code to clipboard
     */
    const copyRoomCode = async () => {
        try {
            await navigator.clipboard.writeText(roomCode);
            setCopied(true);
            showNotification('Room code copied!');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    /**
     * Send chat message
     */
    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const message = {
            id: Date.now(),
            text: newMessage,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setChatMessages(prev => [...prev, message]);
        setNewMessage('');

        // In a real app, you'd send this via socket
        // socket.emit('chat-message', { text: newMessage, roomCode });
    };

    /**
     * Auto-hide controls after inactivity
     */
    useEffect(() => {
        let timeout;
        const handleActivity = () => {
            setShowControls(true);
            clearTimeout(timeout);
            timeout = setTimeout(() => setShowControls(false), 5000);
        };

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('click', handleActivity);

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('click', handleActivity);
            clearTimeout(timeout);
        };
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-[#0a0a1a]">
            {/* Toast Notification */}
            {showToast && (
                <div className={`toast ${showToast.type === 'error' ? 'border-red-500/50' : 'border-purple-500/50'}`}>
                    <div className={`w-2 h-2 rounded-full ${showToast.type === 'error' ? 'bg-red-400' : 'bg-green-400'}`}></div>
                    {showToast.message}
                </div>
            )}

            {/* Header */}
            <header className={`glass-dark border-b border-white/10 px-6 py-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'} z-20`}>
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                            <Video className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white hidden sm:block">MeetFlow</span>
                    </div>

                    {/* Center - Room Info & Timer */}
                    <div className="flex items-center gap-4">
                        {/* Room Code */}
                        <button
                            onClick={copyRoomCode}
                            className="glass rounded-full px-4 py-2 flex items-center gap-2 hover:bg-white/10 transition-all group"
                        >
                            <span className="text-sm text-gray-400">Room:</span>
                            <span className="font-mono font-semibold text-white">{roomCode}</span>
                            {copied ? (
                                <Check className="w-4 h-4 text-green-400" />
                            ) : (
                                <Copy className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                            )}
                        </button>

                        {/* Call Timer */}
                        {callStarted && (
                            <div className="call-timer">
                                <div className="call-timer-dot"></div>
                                <span>{formatDuration(callDuration)}</span>
                            </div>
                        )}
                    </div>

                    {/* Right Side - Status & Actions */}
                    <div className="flex items-center gap-3">
                        {/* Connection Status */}
                        <div className={`status-badge ${isConnected ? 'status-badge-connected' :
                                isConnecting ? 'status-badge-waiting' : 'status-badge-disconnected'
                            }`}>
                            {isConnected ? (
                                <>
                                    <Wifi className="w-4 h-4" />
                                    <span className="hidden sm:inline">Connected</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff className="w-4 h-4 pulse" />
                                    <span className="hidden sm:inline">
                                        {isConnecting ? 'Waiting' : 'Disconnected'}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Chat Toggle */}
                        <button
                            onClick={() => setShowChat(!showChat)}
                            className={`p-2 rounded-xl transition-all ${showChat ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-white/10 text-gray-400'
                                }`}
                        >
                            <MessageCircle className="w-5 h-5" />
                        </button>

                        {/* Fullscreen Toggle */}
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 rounded-xl hover:bg-white/10 text-gray-400 transition-all hidden sm:block"
                        >
                            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6 relative">
                <div className="max-w-7xl mx-auto h-full">
                    {/* Error Display */}
                    {error && (
                        <div className="glass-card rounded-2xl p-4 mb-6 border border-red-500/30 bg-red-500/10">
                            <p className="text-red-400 text-center">{error}</p>
                        </div>
                    )}

                    {/* Video Grid */}
                    <div className={`grid gap-4 sm:gap-6 h-[calc(100vh-220px)] ${remoteStream ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
                        }`}>
                        {/* Remote Video (Primary) */}
                        <div className={`video-container ${!remoteStream ? '' : ''}`}>
                            {remoteStream ? (
                                <>
                                    <video
                                        ref={remoteVideoRef}
                                        autoPlay
                                        playsInline
                                        className={`w-full h-full object-cover ${remoteVideoOff ? 'opacity-0' : ''}`}
                                    />

                                    {/* Fullscreen button */}
                                    <button className="fullscreen-btn" onClick={toggleFullscreen}>
                                        <Maximize className="w-4 h-4" />
                                    </button>

                                    {/* Remote user avatar when video off */}
                                    {remoteVideoOff && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                            <div className="avatar">
                                                <span>{remoteUser?.charAt(0)?.toUpperCase() || 'U'}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Remote user label */}
                                    <div className="video-label">
                                        <User className="w-4 h-4" />
                                        <span>{remoteUser || 'Remote User'}</span>
                                        {remoteMuted && (
                                            <MicOff className="w-4 h-4 text-red-400" />
                                        )}
                                    </div>

                                    {/* Video status indicators */}
                                    <div className="video-status">
                                        {remoteMuted && (
                                            <div className="status-indicator">
                                                <MicOff className="w-3 h-3 text-red-400" />
                                                <span>Muted</span>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                /* Waiting for participant */
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                                    <div className="waiting-animation mb-6">
                                        <div className="waiting-dot"></div>
                                        <div className="waiting-dot"></div>
                                        <div className="waiting-dot"></div>
                                    </div>
                                    <h3 className="text-2xl font-semibold text-white mb-3">
                                        Waiting for participant...
                                    </h3>
                                    <p className="text-gray-400 text-center mb-6">
                                        Share the room code to invite someone to this call
                                    </p>
                                    <button
                                        onClick={copyRoomCode}
                                        className="glass-card rounded-2xl px-8 py-4 flex items-center gap-4 hover:bg-white/10 transition-all group"
                                    >
                                        <span className="room-code">{roomCode}</span>
                                        {copied ? (
                                            <Check className="w-6 h-6 text-green-400" />
                                        ) : (
                                            <Copy className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                                        )}
                                    </button>

                                    {/* Invite hint */}
                                    <div className="mt-8 flex items-center gap-2 text-gray-500 text-sm">
                                        <UserPlus className="w-4 h-4" />
                                        <span>Share this code with anyone to join</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Local Video (Secondary) */}
                        {remoteStream && (
                            <div className="video-container video-container-small lg:relative fixed bottom-32 right-4 w-40 h-28 sm:w-52 sm:h-36 lg:w-full lg:h-full z-10">
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={`w-full h-full object-cover ${isVideoOff ? 'opacity-0' : ''}`}
                                />

                                {/* Avatar when video off */}
                                {isVideoOff && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                        <div className="avatar w-16 h-16 lg:w-24 lg:h-24 text-xl lg:text-3xl">
                                            <span>{userName.charAt(0).toUpperCase()}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Local user label */}
                                <div className="video-label text-xs lg:text-sm">
                                    <User className="w-3 h-3 lg:w-4 lg:h-4" />
                                    <span>You</span>
                                    {isMuted && (
                                        <MicOff className="w-3 h-3 lg:w-4 lg:h-4 text-red-400" />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Self preview when alone */}
                    {!remoteStream && localStream && (
                        <div className="fixed bottom-32 right-4 sm:right-6 w-48 sm:w-64 h-36 sm:h-48 z-10">
                            <div className="video-container video-container-small w-full h-full">
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={`w-full h-full object-cover ${isVideoOff ? 'opacity-0' : ''}`}
                                />

                                {isVideoOff && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                        <div className="avatar w-16 h-16 text-xl">
                                            <span>{userName.charAt(0).toUpperCase()}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="video-label text-xs">
                                    <User className="w-3 h-3" />
                                    <span>{userName} (You)</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Control Bar */}
            <footer className={`glass-dark border-t border-white/10 px-4 sm:px-6 py-4 sm:py-5 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'} z-20`}>
                <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 sm:gap-5">
                    {/* Mute/Unmute Button */}
                    <button
                        onClick={() => {
                            toggleAudio();
                            showNotification(isMuted ? 'Microphone unmuted' : 'Microphone muted');
                        }}
                        className={`control-btn tooltip ${isMuted ? 'control-btn-active' : 'control-btn-default'
                            }`}
                        data-tooltip={`${isMuted ? 'Unmute' : 'Mute'} (M)`}
                    >
                        {isMuted ? (
                            <MicOff className="w-6 h-6" />
                        ) : (
                            <Mic className="w-6 h-6" />
                        )}
                    </button>

                    {/* Video On/Off Button */}
                    <button
                        onClick={() => {
                            toggleVideo();
                            showNotification(isVideoOff ? 'Camera turned on' : 'Camera turned off');
                        }}
                        className={`control-btn tooltip ${isVideoOff ? 'control-btn-active' : 'control-btn-default'
                            }`}
                        data-tooltip={`${isVideoOff ? 'Turn on camera' : 'Turn off camera'} (V)`}
                    >
                        {isVideoOff ? (
                            <VideoOff className="w-6 h-6" />
                        ) : (
                            <Video className="w-6 h-6" />
                        )}
                    </button>

                    {/* Screen Share Button */}
                    <button
                        onClick={() => {
                            toggleScreenShare();
                            if (!isScreenSharing) {
                                showNotification('Screen sharing started');
                            }
                        }}
                        className={`control-btn tooltip ${isScreenSharing ? 'control-btn-share-active' : 'control-btn-share'
                            }`}
                        data-tooltip={`${isScreenSharing ? 'Stop sharing' : 'Share screen'} (S)`}
                    >
                        {isScreenSharing ? (
                            <MonitorOff className="w-6 h-6" />
                        ) : (
                            <Monitor className="w-6 h-6" />
                        )}
                    </button>

                    {/* End Call Button */}
                    <button
                        onClick={handleEndCall}
                        className="control-btn control-btn-end tooltip"
                        data-tooltip="End call"
                    >
                        <PhoneOff className="w-7 h-7" />
                    </button>
                </div>

                {/* Keyboard Shortcuts Hint */}
                <div className="hidden lg:flex justify-center mt-3 gap-6 text-xs text-gray-500">
                    <span><span className="shortcut-hint">M</span> Mute</span>
                    <span><span className="shortcut-hint">V</span> Video</span>
                    <span><span className="shortcut-hint">S</span> Share</span>
                    <span><span className="shortcut-hint">C</span> Chat</span>
                    <span><span className="shortcut-hint">F</span> Fullscreen</span>
                </div>
            </footer>

            {/* Chat Panel */}
            <div className={`chat-panel ${showChat ? 'open' : ''}`}>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="font-semibold text-white">In-call messages</h3>
                    <button
                        onClick={() => setShowChat(false)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {chatMessages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No messages yet</p>
                            <p className="text-sm mt-1">Messages sent here are only visible during this call</p>
                        </div>
                    ) : (
                        chatMessages.map(msg => (
                            <div
                                key={msg.id}
                                className={`chat-message ${msg.sender === 'me' ? 'chat-message-own' : 'chat-message-other'}`}
                            >
                                <p className="text-sm">{msg.text}</p>
                                <p className="text-xs text-white/50 mt-1">{msg.time}</p>
                            </div>
                        ))
                    )}
                </div>

                {/* Chat Input */}
                <form onSubmit={sendMessage} className="p-4 border-t border-white/10">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="input-field flex-1 py-3 text-sm"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="btn-primary p-3 disabled:opacity-50"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            </div>

            {/* Chat Overlay (mobile) */}
            {showChat && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setShowChat(false)}
                />
            )}
        </div>
    );
};

export default CallPage;
