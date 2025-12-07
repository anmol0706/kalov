/**
 * Home Page Component
 * 
 * Enhanced landing page with:
 * - Premium glassmorphism UI
 * - Smooth animations
 * - Feature highlights
 * - Create/Join room functionality
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Video,
    Users,
    PhoneCall,
    ArrowRight,
    Copy,
    Check,
    Sparkles,
    Shield,
    Zap,
    Globe,
    Monitor,
    Mic
} from 'lucide-react';
import { createRoom, checkRoom } from '../services/apiService';

const HomePage = () => {
    const navigate = useNavigate();

    // State for form handling
    const [mode, setMode] = useState(null); // 'create' | 'join' | null
    const [roomCode, setRoomCode] = useState('');
    const [userName, setUserName] = useState('');
    const [createdRoomCode, setCreatedRoomCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Animation on mount
    useEffect(() => {
        setMounted(true);
        // Load saved username if exists
        const savedName = sessionStorage.getItem('userName');
        if (savedName) setUserName(savedName);
    }, []);

    /**
     * Handle room creation
     */
    const handleCreateRoom = async () => {
        if (!userName.trim()) {
            setError('Please enter your name');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await createRoom();
            if (result.success) {
                setCreatedRoomCode(result.roomCode);
            }
        } catch (err) {
            setError('Failed to create room. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handle joining a room
     */
    const handleJoinRoom = async () => {
        if (!userName.trim()) {
            setError('Please enter your name');
            return;
        }

        if (!roomCode.trim()) {
            setError('Please enter a room code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await checkRoom(roomCode.toUpperCase());

            if (!result.exists) {
                setError('Room not found. Please check the code.');
                setLoading(false);
                return;
            }

            if (result.isFull) {
                setError('Room is full. Only 2 participants allowed.');
                setLoading(false);
                return;
            }

            sessionStorage.setItem('userName', userName);
            navigate(`/call/${roomCode.toUpperCase()}`);
        } catch (err) {
            setError('Failed to join room. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Enter the created room
     */
    const handleEnterRoom = () => {
        sessionStorage.setItem('userName', userName);
        navigate(`/call/${createdRoomCode}`);
    };

    /**
     * Copy room code to clipboard
     */
    const copyRoomCode = async () => {
        try {
            await navigator.clipboard.writeText(createdRoomCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    /**
     * Reset to initial state
     */
    const handleBack = () => {
        setMode(null);
        setRoomCode('');
        setCreatedRoomCode('');
        setError('');
    };

    // Features list for display
    const features = [
        { icon: Shield, title: 'Secure', desc: 'End-to-end encrypted' },
        { icon: Zap, title: 'Instant', desc: 'No downloads needed' },
        { icon: Globe, title: 'Global', desc: 'Connect worldwide' },
    ];

    return (
        <div className="min-h-screen flex flex-col">
            {/* Animated Orbs */}
            <div className="animated-bg">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>
            </div>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4 py-12">
                <div className={`w-full max-w-lg transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    {/* Logo and Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl glass-card mb-8 relative">
                            <Video className="w-12 h-12 text-white" />
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            </div>
                        </div>
                        <h1 className="text-5xl font-bold mb-4">
                            <span className="gradient-text-animated">
                                MeetFlow
                            </span>
                        </h1>
                        <p className="text-xl text-gray-400">
                            Crystal-clear video calls, instantly
                        </p>
                    </div>

                    {/* Main Card */}
                    <div className="glass-card rounded-3xl p-8 transition-all duration-500">
                        {/* Initial State - Show Create/Join Options */}
                        {!mode && !createdRoomCode && (
                            <div className="space-y-5">
                                {/* User Name Input */}
                                <div className="mb-8">
                                    <label className="block text-sm font-medium text-gray-300 mb-3">
                                        Your Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter your name to get started"
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                        className="input-field text-lg"
                                        onKeyPress={(e) => e.key === 'Enter' && setMode('create')}
                                    />
                                </div>

                                {/* Create Room Button */}
                                <button
                                    onClick={() => setMode('create')}
                                    className="w-full feature-card text-left group"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow">
                                            <Sparkles className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-semibold text-white mb-1">Create Room</h3>
                                            <p className="text-gray-400">Start a new video call instantly</p>
                                        </div>
                                        <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-white group-hover:translate-x-2 transition-all" />
                                    </div>
                                </button>

                                {/* Join Room Button */}
                                <button
                                    onClick={() => setMode('join')}
                                    className="w-full feature-card text-left group"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-shadow">
                                            <Users className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-semibold text-white mb-1">Join Room</h3>
                                            <p className="text-gray-400">Enter a room code to connect</p>
                                        </div>
                                        <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-white group-hover:translate-x-2 transition-all" />
                                    </div>
                                </button>

                                {/* Features Row */}
                                <div className="grid grid-cols-3 gap-3 pt-6 border-t border-white/10 mt-8">
                                    {features.map((feature, index) => (
                                        <div key={index} className="text-center p-3">
                                            <feature.icon className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                                            <p className="text-sm font-medium text-white">{feature.title}</p>
                                            <p className="text-xs text-gray-500">{feature.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Create Room Mode */}
                        {mode === 'create' && !createdRoomCode && (
                            <div className="space-y-6">
                                <button
                                    onClick={handleBack}
                                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
                                >
                                    <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                                    Back
                                </button>

                                <div className="text-center py-4">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-purple-500/30">
                                        <Sparkles className="w-10 h-10 text-white" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mb-2">Create a Room</h2>
                                    <p className="text-gray-400">Get a unique code to share with others</p>
                                </div>

                                {/* User Name Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Your Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter your name"
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                        className="input-field"
                                    />
                                </div>

                                {error && (
                                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                                        <p className="text-red-400 text-sm text-center">{error}</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleCreateRoom}
                                    disabled={loading}
                                    className="btn-primary w-full flex items-center justify-center gap-3 text-lg py-4"
                                >
                                    {loading ? (
                                        <div className="spinner spinner-small"></div>
                                    ) : (
                                        <>
                                            Create Room
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Room Created - Show Code */}
                        {createdRoomCode && (
                            <div className="space-y-6 text-center">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-green-500/30">
                                    <Check className="w-10 h-10 text-white" />
                                </div>

                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2">Room Created!</h2>
                                    <p className="text-gray-400">Share this code with others to join</p>
                                </div>

                                {/* Room Code Display */}
                                <div className="glass-dark rounded-2xl p-8">
                                    <p className="text-sm text-gray-400 mb-3">Room Code</p>
                                    <div className="flex items-center justify-center gap-4">
                                        <span className="room-code">{createdRoomCode}</span>
                                        <button
                                            onClick={copyRoomCode}
                                            className="p-3 rounded-xl glass hover:bg-white/15 transition-all"
                                            title="Copy code"
                                        >
                                            {copied ? (
                                                <Check className="w-6 h-6 text-green-400" />
                                            ) : (
                                                <Copy className="w-6 h-6 text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                    {copied && (
                                        <p className="text-green-400 text-sm mt-3 animate-pulse">Copied to clipboard!</p>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={handleBack}
                                        className="btn-secondary flex-1"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleEnterRoom}
                                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                                    >
                                        <PhoneCall className="w-5 h-5" />
                                        Enter Room
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Join Room Mode */}
                        {mode === 'join' && (
                            <div className="space-y-6">
                                <button
                                    onClick={handleBack}
                                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
                                >
                                    <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                                    Back
                                </button>

                                <div className="text-center py-4">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/30">
                                        <Users className="w-10 h-10 text-white" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mb-2">Join a Room</h2>
                                    <p className="text-gray-400">Enter the room code to join</p>
                                </div>

                                {/* User Name Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Your Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter your name"
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                        className="input-field"
                                    />
                                </div>

                                {/* Room Code Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Room Code
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="XXXX-XXXX"
                                        value={roomCode}
                                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                        className="input-field text-center tracking-widest font-mono text-xl"
                                        maxLength={9}
                                        onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                                    />
                                </div>

                                {error && (
                                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                                        <p className="text-red-400 text-sm text-center">{error}</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleJoinRoom}
                                    disabled={loading}
                                    className="btn-primary w-full flex items-center justify-center gap-3 text-lg py-4"
                                >
                                    {loading ? (
                                        <div className="spinner spinner-small"></div>
                                    ) : (
                                        <>
                                            <PhoneCall className="w-5 h-5" />
                                            Join Room
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-10">
                        <div className="flex items-center justify-center gap-6 text-gray-500 text-sm">
                            <div className="flex items-center gap-2">
                                <Video className="w-4 h-4" />
                                <span>HD Video</span>
                            </div>
                            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                            <div className="flex items-center gap-2">
                                <Mic className="w-4 h-4" />
                                <span>Crystal Audio</span>
                            </div>
                            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                            <div className="flex items-center gap-2">
                                <Monitor className="w-4 h-4" />
                                <span>Screen Share</span>
                            </div>
                        </div>
                        <p className="text-gray-600 text-xs mt-4">
                            Secure peer-to-peer video calls • No account required
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HomePage;
