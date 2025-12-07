/**
 * Professional CallPage with Enhanced Features
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MonitorOff,
    Copy, Check, User, MessageCircle, X, Send, Settings, MoreVertical,
    Users as UsersIcon, Maximize2, Minimize2
} from 'lucide-react';
import useWebRTC from '../hooks/useWebRTC';

const CallPage = () => {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const userName = sessionStorage.getItem('userName') || 'Anonymous';

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const [copied, setCopied] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [callDuration, setCallDuration] = useState(0);
    const [callStarted, setCallStarted] = useState(false);
    const [showToast, setShowToast] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);

    const {
        localStream, remoteStream, isConnected, isConnecting, error,
        isMuted, isVideoOff, isScreenSharing, connectionQuality,
        toggleAudio, toggleVideo, toggleScreenShare,
        remoteUser, remoteMuted, remoteVideoOff, endCall
    } = useWebRTC(roomCode, userName);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    useEffect(() => {
        let interval;
        if (isConnected && !callStarted) {
            setCallStarted(true);
            showNotification(`${remoteUser || 'User'} joined the call`, 'success');
        }
        if (callStarted) {
            interval = setInterval(() => setCallDuration(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isConnected, callStarted, remoteUser]);

    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const showNotification = useCallback((message, type = 'info') => {
        setShowToast({ message, type });
        setTimeout(() => setShowToast(null), 4000);
    }, []);

    useEffect(() => {
        const handleKey = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'm') {
                toggleAudio();
                showNotification(isMuted ? 'Microphone unmuted' : 'Microphone muted');
            }
            if (e.key === 'v') {
                toggleVideo();
                showNotification(isVideoOff ? 'Camera turned on' : 'Camera turned off');
            }
            if (e.key === 's') toggleScreenShare();
            if (e.key === 'c') setShowChat(prev => !prev);
            if (e.key === 'f') toggleFullscreen();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [toggleAudio, toggleVideo, toggleScreenShare, isMuted, isVideoOff]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        let timeout;
        const resetTimeout = () => {
            setShowControls(true);
            clearTimeout(timeout);
            timeout = setTimeout(() => setShowControls(false), 4000);
        };
        window.addEventListener('mousemove', resetTimeout);
        window.addEventListener('click', resetTimeout);
        resetTimeout();
        return () => {
            window.removeEventListener('mousemove', resetTimeout);
            window.removeEventListener('click', resetTimeout);
            clearTimeout(timeout);
        };
    }, []);

    const handleEndCall = () => {
        endCall();
        navigate('/');
    };

    const copyRoomCode = async () => {
        await navigator.clipboard.writeText(roomCode);
        setCopied(true);
        showNotification('Room code copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        setChatMessages(prev => [...prev, {
            id: Date.now(),
            text: newMessage,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setNewMessage('');
    };

    const getConnectionColor = () => {
        if (connectionQuality === 'poor') return '#ef4444';
        if (connectionQuality === 'medium') return '#f59e0b';
        return '#10b981';
    };

    return (
        <div className="h-screen flex flex-col bg-[#0a0a0f] relative">
            {/* Toast */}
            {showToast && (
                <div className={`toast ${showToast.type === 'error' ? 'border-red-500/50' : 'border-purple-500/50'}`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${showToast.type === 'error' ? 'bg-red-400' : 'bg-green-400'}`} />
                    {showToast.message}
                </div>
            )}

            {/* Header */}
            <header className={`glass border-b border-white/5 px-4 py-3 transition-all duration-300 z-20 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'}`}>
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Left: Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                            <Video className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-white hidden sm:block">MeetFlow</span>
                    </div>

                    {/* Center: Room Info & Timer */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={copyRoomCode}
                            className="glass px-3 py-1.5 rounded-full flex items-center gap-2 hover:bg-white/10 transition-all text-sm"
                        >
                            <span className="text-muted hidden sm:inline">Room:</span>
                            <span className="font-mono font-semibold">{roomCode}</span>
                            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-muted" />}
                        </button>

                        {callStarted && (
                            <div className="call-timer hidden md:flex">
                                <div className="call-timer-dot" />
                                {formatDuration(callDuration)}
                            </div>
                        )}
                    </div>

                    {/* Right: Status & Actions */}
                    <div className="flex items-center gap-2">
                        {isConnected && connectionQuality && (
                            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full glass text-xs">
                                <div className="w-2 h-2 rounded-full" style={{ background: getConnectionColor() }} />
                                <span className="text-muted capitalize">{connectionQuality}</span>
                            </div>
                        )}

                        <div className={`status-badge ${isConnected ? 'status-badge-connected' : 'status-badge-waiting'}`}>
                            {isConnected ? 'Connected' : 'Waiting...'}
                        </div>

                        <button
                            onClick={() => setShowChat(!showChat)}
                            className={`p-2 rounded-xl transition-all ${showChat ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-white/5 text-secondary'}`}
                        >
                            <MessageCircle className="w-5 h-5" />
                        </button>

                        <button
                            onClick={toggleFullscreen}
                            className="p-2 rounded-xl hover:bg-white/5 text-secondary transition-all hidden sm:block"
                        >
                            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Video Area */}
            <main className="flex-1 relative overflow-hidden">
                {error && (
                    <div className="absolute top-4 left-4 right-4 bg-red-500/20 backdrop-blur-xl border border-red-500/40 text-red-300 p-3 rounded-xl text-sm z-10 shadow-lg">
                        {error}
                    </div>
                )}

                {/* Remote Video */}
                <div className="absolute inset-0 bg-[#12121a]">
                    {remoteStream ? (
                        <>
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className={`w-full h-full object-cover ${remoteVideoOff ? 'hidden' : ''}`}
                            />
                            {remoteVideoOff && (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="text-center fade-in">
                                        <div className="avatar mx-auto mb-4">
                                            {remoteUser?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        <p className="text-xl font-semibold text-white">{remoteUser || 'User'}</p>
                                        <p className="text-sm text-secondary mt-1">Camera is off</p>
                                    </div>
                                </div>
                            )}
                            <div className="video-label">
                                <User className="w-3.5 h-3.5" />
                                {remoteUser || 'Remote User'}
                                {remoteMuted && <MicOff className="w-3.5 h-3.5 text-red-400" />}
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6">
                            <div className="waiting-animation mb-6">
                                <div className="waiting-dot" />
                                <div className="waiting-dot" />
                                <div className="waiting-dot" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">
                                Waiting for participant...
                            </h3>
                            <p className="text-secondary text-center mb-6 max-w-md">
                                Share the room code to invite someone to this call
                            </p>
                            <button
                                onClick={copyRoomCode}
                                className="glass-card px-8 py-4 flex items-center gap-4 hover:bg-white/8 transition-all"
                            >
                                <span className="room-code">{roomCode}</span>
                                {copied ? <Check className="w-6 h-6 text-green-400" /> : <Copy className="w-6 h-6 text-secondary" />}
                            </button>
                        </div>
                    )}
                </div>

                {/* Local Video PiP */}
                {localStream && (
                    <div className="absolute bottom-24 right-4 w-36 h-24 sm:w-48 sm:h-32 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 z-10 glass">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                        />
                        {isVideoOff && (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                <div className="avatar w-12 h-12 sm:w-16 sm:h-16 text-lg sm:text-2xl">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        )}
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-white flex items-center gap-1">
                            <User className="w-3 h-3" />
                            You
                            {isMuted && <MicOff className="w-3 h-3 text-red-400" />}
                        </div>
                    </div>
                )}
            </main>

            {/* Controls */}
            <footer className={`glass border-t border-white/5 px-4 py-5 transition-all duration-300 z-20 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'}`}>
                <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 sm:gap-5">
                    <button
                        onClick={() => {
                            toggleAudio();
                            showNotification(isMuted ? 'Unmuted' : 'Muted');
                        }}
                        className={`control-btn ${isMuted ? 'control-btn-active' : 'control-btn-default'}`}
                        title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                    >
                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={() => {
                            toggleVideo();
                            showNotification(isVideoOff ? 'Camera on' : 'Camera off');
                        }}
                        className={`control-btn ${isVideoOff ? 'control-btn-active' : 'control-btn-default'}`}
                        title={isVideoOff ? 'Turn on camera (V)' : 'Turn off camera (V)'}
                    >
                        {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={toggleScreenShare}
                        className={`control-btn ${isScreenSharing ? 'control-btn-share-active' : 'control-btn-share'}`}
                        title={isScreenSharing ? 'Stop sharing (S)' : 'Share screen (S)'}
                    >
                        {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={handleEndCall}
                        className="control-btn control-btn-end"
                        title="End call"
                    >
                        <PhoneOff className="w-6 h-6" />
                    </button>
                </div>
            </footer>

            {/* Chat Panel */}
            <div className={`chat-panel ${showChat ? 'open' : ''}`}>
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-purple-400" />
                        <span className="font-semibold">Chat</span>
                    </div>
                    <button onClick={() => setShowChat(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {chatMessages.length === 0 ? (
                        <div className="text-center text-secondary py-12">
                            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No messages yet</p>
                            <p className="text-xs text-muted mt-1">Send a message to start chatting</p>
                        </div>
                    ) : (
                        chatMessages.map(msg => (
                            <div key={msg.id} className={`chat-message ${msg.sender === 'me' ? 'chat-message-own' : 'chat-message-other'}`}>
                                <p>{msg.text}</p>
                                <p className="text-xs opacity-70 mt-1">{msg.time}</p>
                            </div>
                        ))
                    )}
                </div>

                <form onSubmit={sendMessage} className="p-4 border-t border-white/5 flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="input-field flex-1 text-sm py-2.5"
                    />
                    <button type="submit" disabled={!newMessage.trim()} className="btn btn-primary p-2.5">
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>

            {showChat && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setShowChat(false)} />}
        </div>
    );
};

export default CallPage;
