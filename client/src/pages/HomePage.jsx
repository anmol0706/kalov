/**
 * Professional HomePage with Enhanced UX
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Video, Users, ArrowRight, Copy, Check, Sparkles,
    Shield, Zap, Globe, Lock
} from 'lucide-react';
import { createRoom, checkRoom } from '../services/apiService';

const HomePage = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState(null);
    const [roomCode, setRoomCode] = useState('');
    const [userName, setUserName] = useState('');
    const [createdRoomCode, setCreatedRoomCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedName = sessionStorage.getItem('userName');
        if (savedName) setUserName(savedName);
    }, []);

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
        } catch {
            setError('Failed to create room');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = async () => {
        if (!userName.trim()) {
            setError('Please enter your name');
            return;
        }
        if (!roomCode.trim()) {
            setError('Please enter room code');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const result = await checkRoom(roomCode.toUpperCase());
            if (!result.exists) {
                setError('Room not found');
                setLoading(false);
                return;
            }
            if (result.isFull) {
                setError('Room is full');
                setLoading(false);
                return;
            }
            sessionStorage.setItem('userName', userName);
            navigate(`/call/${roomCode.toUpperCase()}`);
        } catch {
            setError('Failed to join');
        } finally {
            setLoading(false);
        }
    };

    const handleEnterRoom = () => {
        sessionStorage.setItem('userName', userName);
        navigate(`/call/${createdRoomCode}`);
    };

    const copyRoomCode = async () => {
        await navigator.clipboard.writeText(createdRoomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const features = [
        { icon: Lock, title: 'Encrypted', color: '#6366f1' },
        { icon: Zap, title: 'Instant', color: '#8b5cf6' },
        { icon: Globe, title: 'Global', color: '#10b981' }
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background Gradients */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Content */}
            <div className={`w-full max-w-md relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 slide-up' : 'opacity-0'}`}>
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl glass-card mb-5 shadow-glow">
                        <Video className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold gradient-text mb-2">
                        MeetFlow
                    </h1>
                    <p className="text-base text-secondary">Professional video calls, instantly</p>
                </div>

                {/* Main Card */}
                <div className="glass-card p-6 sm:p-8 fade-in">
                    {/* Initial State */}
                    {!mode && !createdRoomCode && (
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">
                                    Your Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    className="input-field"
                                    onKeyPress={(e) => e.key === 'Enter' && setMode('create')}
                                />
                            </div>

                            <button
                                onClick={() => setMode('create')}
                                className="w-full feature-card"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                                        style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
                                        <Sparkles className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h3 className="text-lg font-semibold text-white mb-0.5">Create Room</h3>
                                        <p className="text-sm text-muted">Start a new video call</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-muted transition-transform group-hover:translate-x-1" />
                                </div>
                            </button>

                            <button
                                onClick={() => setMode('join')}
                                className="w-full feature-card"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                                        style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                                        <Users className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h3 className="text-lg font-semibold text-white mb-0.5">Join Room</h3>
                                        <p className="text-sm text-muted">Enter a room code</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-muted transition-transform group-hover:translate-x-1" />
                                </div>
                            </button>

                            {/* Trust Indicators */}
                            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
                                {features.map((feature, i) => (
                                    <div key={i} className="text-center py-3">
                                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg mb-2"
                                            style={{ background: `${feature.color}20` }}>
                                            <feature.icon className="w-4 h-4" style={{ color: feature.color }} />
                                        </div>
                                        <p className="text-xs font-medium text-secondary">{feature.title}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Create Mode */}
                    {mode === 'create' && !createdRoomCode && (
                        <div className="space-y-5 slide-up">
                            <button
                                onClick={() => { setMode(null); setError(''); }}
                                className="text-sm text-secondary hover:text-white transition-colors flex items-center gap-1"
                            >
                                <ArrowRight className="w-4 h-4 rotate-180" />
                                Back
                            </button>

                            <div className="text-center py-3">
                                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg"
                                    style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
                                    <Sparkles className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold mb-1">Create Room</h2>
                                <p className="text-sm text-secondary">Invite others to join your call</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Your Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    className="input-field"
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <button onClick={handleCreateRoom} disabled={loading} className="btn btn-primary w-full">
                                {loading ? <div className="spinner" /> : <>Create Room <ArrowRight className="w-4 h-4" /></>}
                            </button>
                        </div>
                    )}

                    {/* Room Created */}
                    {createdRoomCode && (
                        <div className="space-y-5 text-center slide-up">
                            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg"
                                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                                <Check className="w-8 h-8 text-white" />
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold mb-1">Room Created!</h2>
                                <p className="text-sm text-secondary">Share this code to invite others</p>
                            </div>

                            <div className="bg-[#12121a] rounded-2xl p-6 border border-white/10">
                                <p className="text-xs text-muted mb-2">Room Code</p>
                                <div className="flex items-center justify-center gap-3">
                                    <span className="room-code">{createdRoomCode}</span>
                                    <button
                                        onClick={copyRoomCode}
                                        className="p-2.5 rounded-xl glass hover:bg-white/10 transition-all"
                                    >
                                        {copied ? (
                                            <Check className="w-5 h-5 text-green-400" />
                                        ) : (
                                            <Copy className="w-5 h-5 text-secondary" />
                                        )}
                                    </button>
                                </div>
                                {copied && (
                                    <p className="text-xs text-green-400 mt-2 animate-pulse">Copied!</p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => { setCreatedRoomCode(''); setMode(null); }} className="btn btn-secondary flex-1">
                                    New Room
                                </button>
                                <button onClick={handleEnterRoom} className="btn btn-primary flex-1">
                                    Enter Room
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Join Mode */}
                    {mode === 'join' && (
                        <div className="space-y-5 slide-up">
                            <button
                                onClick={() => { setMode(null); setError(''); }}
                                className="text-sm text-secondary hover:text-white transition-colors flex items-center gap-1"
                            >
                                <ArrowRight className="w-4 h-4 rotate-180" />
                                Back
                            </button>

                            <div className="text-center py-3">
                                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg"
                                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                                    <Users className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold mb-1">Join Room</h2>
                                <p className="text-sm text-secondary">Enter the room code to connect</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Your Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Room Code</label>
                                <input
                                    type="text"
                                    placeholder="XXXX-XXXX"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                    className="input-field text-center font-mono tracking-widest text-lg"
                                    maxLength={9}
                                    onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <button onClick={handleJoinRoom} disabled={loading} className="btn btn-primary w-full">
                                {loading ? <div className="spinner" /> : <>Join Room <ArrowRight className="w-4 h-4" /></>}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-muted mt-6">
                    End-to-end encrypted • No account required • Free forever
                </p>
            </div>
        </div>
    );
};

export default HomePage;
