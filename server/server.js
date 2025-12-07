/**
 * WebRTC Signaling Server - Production Ready
 * 
 * This server handles the signaling process for WebRTC peer-to-peer connections.
 * It uses Socket.io to exchange offer, answer, and ICE candidates between peers.
 * 
 * No database is used - all room management is done in-memory.
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Get environment
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 3001;

// Allowed origins for CORS - be explicit
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'https://kalov-zh3v.onrender.com',
    'https://kalov.onrender.com'
];

console.log('[Server] Allowed origins:', allowedOrigins);

// CORS middleware - apply before routes
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc)
        if (!origin) {
            return callback(null, true);
        }

        // Check if origin is in allowed list or matches onrender.com
        if (allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
            callback(null, true);
        } else {
            console.log('[CORS] Origin not in whitelist:', origin);
            // Still allow for now to debug
            callback(null, true);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Parse JSON
app.use(express.json());

// Trust proxy for Render
app.set('trust proxy', 1);

// Configure Socket.io with CORS
const io = new Server(server, {
    cors: {
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
                callback(null, true);
            } else {
                callback(null, true); // Allow all for now
            }
        },
        methods: ['GET', 'POST'],
        credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling']
});

// In-memory storage for rooms
const rooms = new Map();

/**
 * Generate a unique room code
 * Format: XXXX-XXXX (8 characters with hyphen)
 */
const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        if (i === 4) code += '-';
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        rooms: rooms.size,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Create a new room
app.post('/api/rooms/create', (req, res) => {
    const roomCode = generateRoomCode();
    rooms.set(roomCode, {
        participants: [],
        createdAt: new Date()
    });

    console.log(`[Room Created] Code: ${roomCode}`);
    res.json({ success: true, roomCode });
});

// Check if a room exists
app.get('/api/rooms/:roomCode', (req, res) => {
    const { roomCode } = req.params;
    const room = rooms.get(roomCode.toUpperCase());

    if (room) {
        res.json({
            exists: true,
            participantCount: room.participants.length,
            isFull: room.participants.length >= 2
        });
    } else {
        res.json({ exists: false });
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'MeetFlow Signaling Server',
        version: '1.0.0',
        status: 'running',
        cors: 'enabled',
        endpoints: {
            health: '/api/health',
            createRoom: 'POST /api/rooms/create',
            checkRoom: 'GET /api/rooms/:roomCode'
        }
    });
});

/**
 * Socket.io Connection Handler
 */
io.on('connection', (socket) => {
    console.log(`[Connected] Socket ID: ${socket.id}`);

    socket.on('join-room', ({ roomCode, userName }) => {
        const normalizedCode = roomCode.toUpperCase();

        if (!rooms.has(normalizedCode)) {
            rooms.set(normalizedCode, {
                participants: [],
                createdAt: new Date()
            });
        }

        const room = rooms.get(normalizedCode);

        if (room.participants.length >= 2) {
            socket.emit('room-full', { message: 'Room is full. Only 2 participants allowed.' });
            return;
        }

        socket.join(normalizedCode);
        room.participants.push({
            socketId: socket.id,
            userName: userName || 'Anonymous'
        });

        socket.roomCode = normalizedCode;
        socket.userName = userName;

        console.log(`[Joined Room] ${userName} joined ${normalizedCode}. Participants: ${room.participants.length}`);

        socket.emit('room-joined', {
            roomCode: normalizedCode,
            participantCount: room.participants.length,
            isInitiator: room.participants.length === 1
        });

        if (room.participants.length === 2) {
            const otherParticipant = room.participants.find(p => p.socketId !== socket.id);

            socket.to(normalizedCode).emit('user-joined', {
                socketId: socket.id,
                userName: userName
            });

            socket.emit('existing-user', {
                socketId: otherParticipant.socketId,
                userName: otherParticipant.userName
            });
        }
    });

    socket.on('offer', ({ offer, to }) => {
        console.log(`[Offer] From ${socket.id} to ${to}`);
        socket.to(to).emit('offer', {
            offer,
            from: socket.id,
            userName: socket.userName
        });
    });

    socket.on('answer', ({ answer, to }) => {
        console.log(`[Answer] From ${socket.id} to ${to}`);
        socket.to(to).emit('answer', {
            answer,
            from: socket.id
        });
    });

    socket.on('ice-candidate', ({ candidate, to }) => {
        socket.to(to).emit('ice-candidate', {
            candidate,
            from: socket.id
        });
    });

    socket.on('toggle-audio', ({ isMuted }) => {
        if (socket.roomCode) {
            socket.to(socket.roomCode).emit('peer-audio-toggle', {
                socketId: socket.id,
                isMuted
            });
        }
    });

    socket.on('toggle-video', ({ isVideoOff }) => {
        if (socket.roomCode) {
            socket.to(socket.roomCode).emit('peer-video-toggle', {
                socketId: socket.id,
                isVideoOff
            });
        }
    });

    socket.on('toggle-screen-share', ({ isScreenSharing }) => {
        if (socket.roomCode) {
            socket.to(socket.roomCode).emit('peer-screen-share', {
                socketId: socket.id,
                isScreenSharing
            });
        }
    });

    socket.on('chat-message', ({ text }) => {
        if (socket.roomCode) {
            socket.to(socket.roomCode).emit('chat-message', {
                text,
                userName: socket.userName,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        }
    });

    socket.on('leave-room', () => {
        handleDisconnect(socket);
    });

    socket.on('disconnect', () => {
        console.log(`[Disconnected] Socket ID: ${socket.id}`);
        handleDisconnect(socket);
    });
});

function handleDisconnect(socket) {
    if (socket.roomCode) {
        const room = rooms.get(socket.roomCode);

        if (room) {
            room.participants = room.participants.filter(p => p.socketId !== socket.id);

            socket.to(socket.roomCode).emit('user-left', {
                socketId: socket.id,
                userName: socket.userName
            });

            if (room.participants.length === 0) {
                rooms.delete(socket.roomCode);
                console.log(`[Room Deleted] ${socket.roomCode} - no participants`);
            }

            console.log(`[Left Room] ${socket.userName} left ${socket.roomCode}`);
        }

        socket.leave(socket.roomCode);
    }
}

// Clean up stale rooms every 30 minutes
setInterval(() => {
    const now = new Date();
    const staleThreshold = 30 * 60 * 1000;

    for (const [roomCode, room] of rooms.entries()) {
        if (room.participants.length === 0 && (now - room.createdAt) > staleThreshold) {
            rooms.delete(roomCode);
            console.log(`[Cleanup] Deleted stale room: ${roomCode}`);
        }
    }
}, 30 * 60 * 1000);

// Start server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║     MeetFlow Signaling Server                     ║
║     Environment: ${NODE_ENV.padEnd(32)}║
║     Port: ${String(PORT).padEnd(40)}║
║     CORS: Enabled for all origins                 ║
║     Ready for connections...                      ║
╚═══════════════════════════════════════════════════╝
  `);
});
