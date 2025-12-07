/**
 * API Configuration
 * 
 * Centralized API endpoints and configuration
 * Uses environment variables for production deployment
 */

// Backend API URL - configure via environment variable for production
const API_BASE_URL = import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD
        ? 'https://kalov.onrender.com'  // Production URL
        : 'http://localhost:3001');

console.log('[API] Using base URL:', API_BASE_URL);

/**
 * Create a new room
 * @returns {Promise<{success: boolean, roomCode: string}>}
 */
export const createRoom = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/rooms/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to create room');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating room:', error);
        throw error;
    }
};

/**
 * Check if a room exists
 * @param {string} roomCode - The room code to check
 * @returns {Promise<{exists: boolean, participantCount: number, isFull: boolean}>}
 */
export const checkRoom = async (roomCode) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/rooms/${roomCode}`);

        if (!response.ok) {
            throw new Error('Failed to check room');
        }

        return await response.json();
    } catch (error) {
        console.error('Error checking room:', error);
        throw error;
    }
};

export default {
    createRoom,
    checkRoom,
    API_BASE_URL
};
