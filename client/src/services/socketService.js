/**
 * Socket.io Service
 * 
 * Manages WebSocket connection to the signaling server.
 * Handles all real-time communication for WebRTC signaling.
 * Uses environment variables for production deployment.
 */

import { io } from 'socket.io-client';

// Signaling server URL - configure via environment variable for production
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ||
    (import.meta.env.PROD
        ? 'https://meetflow-server.onrender.com'  // Production URL (update after deployment)
        : 'http://localhost:3001');

console.log('[Socket] Using server URL:', SOCKET_URL);

// Create socket instance with auto-connect disabled
let socket = null;

/**
 * Initialize socket connection
 * @returns {Socket} Socket.io socket instance
 */
export const initSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            transports: ['websocket', 'polling'],
            // Production settings
            timeout: 20000,
            forceNew: true
        });
    }
    return socket;
};

/**
 * Connect to the signaling server
 * @returns {Socket} Connected socket instance
 */
export const connectSocket = () => {
    const socketInstance = initSocket();
    if (!socketInstance.connected) {
        socketInstance.connect();
    }
    return socketInstance;
};

/**
 * Disconnect from the signaling server
 */
export const disconnectSocket = () => {
    if (socket && socket.connected) {
        socket.disconnect();
    }
};

/**
 * Get the current socket instance
 * @returns {Socket|null} Current socket or null if not initialized
 */
export const getSocket = () => socket;

export default {
    initSocket,
    connectSocket,
    disconnectSocket,
    getSocket,
    SOCKET_URL
};
