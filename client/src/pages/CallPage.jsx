/**
 * Call Page - Minimal Responsive Design
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MonitorOff,
    Copy, Check, User, MessageCircle, X, Send
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

    const {
        localStream, remoteStream, isConnected, isConnecting, error,
        isMuted, isVideoOff, isScreenSharing,
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
            showNotification(`${remoteUser || 'User'} joined`);
        }
        if (callStarted) {
            interval = setInterval(() => setCallDuration(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isConnected, callStarted, remoteUser]);

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const showNotification = useCallback((message) => {
        setShowToast(message);
        setTimeout(() => setShowToast(null), 3000);
    }, []);

    useEffect(() => {
        const handleKey = (e) => {
            if (e.target.tagName === 'INPUT') return;
            if (e.key === 'm') toggleAudio();
            if (e.key === 'v') toggleVideo();
            if (e.key === 's') toggleScreenShare();
            if (e.key === 'c') setShowChat(prev => !prev);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [toggleAudio, toggleVideo, toggleScreenShare]);

    const handleEndCall = () => {
        endCall();
        navigate('/');
    };

    const copyRoomCode = async () => {
        await navigator.clipboard.writeText(roomCode);
        setCopied(true);
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

    return (
        <div className="h-screen flex flex-col bg-[#0a0a0f]">
            {/* Toast */}
            {showToast && (
                <div className="toast">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    {showToast}
                </div>
            )}

            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <button onClick={copyRoomCode} className="flex items-center gap-2 text-sm">
                    <span className="text-secondary">Room:</span>
                    <span className="font-mono font-medium">{roomCode}</span>
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-secondary" />}
                </button>

                <div className="flex items-center gap-3">
                    {callStarted && (
                        <div className="call-timer hidden sm:flex">
                            <div className="call-timer-dot" />
                            {formatDuration(callDuration)}
                        </div>
                    )}
                    <div className={`status-badge ${isConnected ? 'status-badge-connected' : 'status-badge-waiting'}`}>
                        {isConnected ? 'Connected' : 'Waiting...'}
                    </div>
                    <button
                        onClick={() => setShowChat(!showChat)}
                        className={`p-2 rounded-lg ${showChat ? 'bg-white/10' : 'hover:bg-white/5'}`}
                    >
                        <MessageCircle className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Video Area */}
            <main className="flex-1 relative overflow-hidden">
                {error && (
                    <div className="absolute top-4 left-4 right-4 bg-red-500/20 text-red-400 p-3 rounded-lg text-sm z-10">
                        {error}
                    </div>
                )}

                {/* Remote Video */}
                <div className="absolute inset-0">
                    {remoteStream ? (
                        <>
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className={`w-full h-full object-cover ${remoteVideoOff ? 'hidden' : ''}`}
                            />
                            {remoteVideoOff && (
                                <div className="w-full h-full flex items-center justify-center bg-[#12121a]">
                                    <div className="avatar">
                                        {remoteUser?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                </div>
                            )}
                            <div className="video-label">
                                <User className="w-3 h-3" />
                                {remoteUser || 'User'}
                                {remoteMuted && <MicOff className="w-3 h-3 text-red-400" />}
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                            <div className="waiting-animation mb-4">
                                <div className="waiting-dot" />
                                <div className="waiting-dot" />
                                <div className="waiting-dot" />
                            </div>
                            <p className="text-lg font-medium mb-2">Waiting for participant...</p>
                            <button
                                onClick={copyRoomCode}
                                className="glass px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-white/5"
                            >
                                <span className="font-mono text-[#6366f1]">{roomCode}</span>
                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    )}
                </div>

                {/* Local Video (PiP) */}
                {localStream && (
                    <div className="absolute bottom-20 right-4 w-32 h-24 sm:w-40 sm:h-28 rounded-xl overflow-hidden shadow-lg border border-white/10 z-10">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                        />
                        {isVideoOff && (
                            <div className="w-full h-full flex items-center justify-center bg-[#12121a]">
                                <div className="avatar w-10 h-10 text-sm">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        )}
                        {isMuted && (
                            <div className="absolute bottom-1 right-1 bg-red-500 p-1 rounded">
                                <MicOff className="w-3 h-3" />
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Controls */}
            <footer className="flex items-center justify-center gap-4 px-4 py-4 border-t border-white/5">
                <button
                    onClick={toggleAudio}
                    className={`control-btn ${isMuted ? 'control-btn-active' : 'control-btn-default'}`}
                >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                    onClick={toggleVideo}
                    className={`control-btn ${isVideoOff ? 'control-btn-active' : 'control-btn-default'}`}
                >
                    {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>

                <button
                    onClick={toggleScreenShare}
                    className={`control-btn ${isScreenSharing ? 'control-btn-share-active' : 'control-btn-share'}`}
                >
                    {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                </button>

                <button onClick={handleEndCall} className="control-btn control-btn-end">
                    <PhoneOff className="w-6 h-6" />
                </button>
            </footer>

            {/* Chat Panel */}
            <div className={`chat-panel ${showChat ? 'open' : ''}`}>
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <span className="font-medium">Chat</span>
                    <button onClick={() => setShowChat(false)} className="p-1 hover:bg-white/10 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-2">
                    {chatMessages.length === 0 ? (
                        <p className="text-center text-secondary text-sm py-8">No messages yet</p>
                    ) : (
                        chatMessages.map(msg => (
                            <div key={msg.id} className={`chat-message ${msg.sender === 'me' ? 'chat-message-own' : 'chat-message-other'}`}>
                                {msg.text}
                            </div>
                        ))
                    )}
                </div>
                <form onSubmit={sendMessage} className="p-4 border-t border-white/5 flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Message..."
                        className="input-field flex-1 text-sm py-2"
                    />
                    <button type="submit" className="btn-primary p-2">
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>

            {showChat && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setShowChat(false)} />}
        </div>
    );
};

export default CallPage;
