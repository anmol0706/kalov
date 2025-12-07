/**
 * Main Application Component
 * 
 * Sets up React Router for navigation between:
 * - Home Page: Create or join a room
 * - Call Page: Video/Audio call interface
 * 
 * Includes animated background elements for premium look
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import HomePage from './pages/HomePage';
import CallPage from './pages/CallPage';
import './index.css';

/**
 * Loading Screen Component
 * Shown briefly while app initializes
 */
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a]">
    <div className="text-center">
      <div className="spinner mb-4 mx-auto"></div>
      <p className="text-gray-400 animate-pulse">Loading MeetFlow...</p>
    </div>
  </div>
);

/**
 * 404 Not Found Page
 */
const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <div className="text-center">
      <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
      <p className="text-xl text-gray-400 mb-8">Page not found</p>
      <a
        href="/"
        className="btn-primary inline-flex items-center gap-2"
      >
        Go Home
      </a>
    </div>
  </div>
);

function App() {
  const [loading, setLoading] = useState(true);

  // Simulate brief loading for smooth transition
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      {/* Grid pattern overlay */}
      <div className="grid-pattern"></div>

      {/* Main Routes */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/call/:roomCode" element={<CallPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
