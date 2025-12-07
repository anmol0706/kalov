/**
 * Home Page - Minimal Responsive Design
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Users, ArrowRight, Copy, Check, Sparkles } from 'lucide-react';
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

    useEffect(() => {
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
            if (result.success) setCreatedRoomCode(result.roomCode);
        } catch {
            setError('Failed to create room. Please try again.');
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
            setError('Please enter a room code');
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
            setError('Failed to join room');
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

    const handleBack = () => {
        setMode(null);
        setRoomCode('');
        setCreatedRoomCode('');
        setError('');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass mb-4">
                        <Video className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold gradient-text mb-1">MeetFlow</h1>
                    <p className="text-sm text-secondary">Video calls, simplified</p>
                </div>

                {/* Main Card */}
                <div className="glass p-6">
                    {/* Initial View */}
                    {!mode && !createdRoomCode && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-secondary mb-2">Your Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    className="input-field"
                                />
                            </div>

                            <button
                                onClick={() => setMode('create')}
                                className="w-full glass p-4 text-left flex items-center gap-4 hover:bg-white/5 transition-colors rounded-xl"
                            >
                                <div className="w-10 h-10 rounded-lg bg-[#6366f1] flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">Create Room</p>
                                    <p className="text-xs text-muted">Start a new call</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted" />
                            </button>

                            <button
                                onClick={() => setMode('join')}
                                className="w-full glass p-4 text-left flex items-center gap-4 hover:bg-white/5 transition-colors rounded-xl"
                            >
                                <div className="w-10 h-10 rounded-lg bg-[#10b981] flex items-center justify-center">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">Join Room</p>
                                    <p className="text-xs text-muted">Enter a code</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted" />
                            </button>
                        </div>
                    )}

                    {/* Create Room View */}
                    {mode === 'create' && !createdRoomCode && (
                        <div className="space-y-4">
                            <button onClick={handleBack} className="text-sm text-secondary hover:text-white">
                                ← Back
                            </button>
                            <div className="text-center py-2">
                                <div className="w-12 h-12 rounded-xl bg-[#6366f1] flex items-center justify-center mx-auto mb-3">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-xl font-semibold">Create Room</h2>
                            </div>
                            <div>
                                <label className="block text-sm text-secondary mb-2">Your Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                            <button onClick={handleCreateRoom} disabled={loading} className="btn-primary w-full">
                                {loading ? <div className="spinner" /> : 'Create Room'}
                            </button>
                        </div>
                    )}

                    {/* Room Created View */}
                    {createdRoomCode && (
                        <div className="space-y-4 text-center">
                            <div className="w-12 h-12 rounded-xl bg-[#10b981] flex items-center justify-center mx-auto">
                                <Check className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">Room Created!</h2>
                                <p className="text-sm text-secondary">Share this code</p>
                            </div>
                            <div className="bg-[#12121a] rounded-xl p-4">
                                <div className="flex items-center justify-center gap-3">
                                    <span className="room-code">{createdRoomCode}</span>
                                    <button onClick={copyRoomCode} className="p-2 hover:bg-white/10 rounded-lg">
                                        {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-secondary" />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={handleBack} className="btn-secondary flex-1">Back</button>
                                <button onClick={handleEnterRoom} className="btn-primary flex-1">Enter</button>
                            </div>
                        </div>
                    )}

                    {/* Join Room View */}
                    {mode === 'join' && (
                        <div className="space-y-4">
                            <button onClick={handleBack} className="text-sm text-secondary hover:text-white">
                                ← Back
                            </button>
                            <div className="text-center py-2">
                                <div className="w-12 h-12 rounded-xl bg-[#10b981] flex items-center justify-center mx-auto mb-3">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-xl font-semibold">Join Room</h2>
                            </div>
                            <div>
                                <label className="block text-sm text-secondary mb-2">Your Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-secondary mb-2">Room Code</label>
                                <input
                                    type="text"
                                    placeholder="XXXX-XXXX"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                    className="input-field text-center font-mono tracking-widest"
                                    maxLength={9}
                                />
                            </div>
                            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                            <button onClick={handleJoinRoom} disabled={loading} className="btn-primary w-full">
                                {loading ? <div className="spinner" /> : 'Join Room'}
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center text-xs text-muted mt-6">
                    Secure peer-to-peer video calls
                </p>
            </div>
        </div>
    );
};

export default HomePage;
