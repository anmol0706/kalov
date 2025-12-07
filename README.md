# MeetFlow - Video & Audio Calling Website

A modern, feature-rich video calling application built with React, Tailwind CSS, Node.js, and WebRTC. This application enables real-time peer-to-peer video and audio communication without any database.

## ✨ Features

- 🎥 **HD Video Calling** - Crystal-clear video with WebRTC
- 🎤 **Audio Calling** - High-quality audio communication
- 🔗 **Easy Room Sharing** - Generate room codes and share with anyone
- 🖥️ **Screen Sharing** - Share your screen during calls
- 💬 **In-call Chat** - Send messages during your call
- 🎛️ **Media Controls** - Mute/unmute, camera on/off
- ⌨️ **Keyboard Shortcuts** - Quick controls with M, V, S, C, F keys
- ⏱️ **Call Timer** - Track call duration
- 🔒 **Secure** - Peer-to-peer encrypted connections
- 📱 **Responsive** - Works on desktop and mobile
- 🚀 **No Account Required** - Join calls instantly

## 🛠️ Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- Socket.io Client
- Lucide React Icons

### Backend
- Node.js + Express
- Socket.io
- WebRTC signaling

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── hooks/          # useWebRTC hook
│   │   ├── pages/          # HomePage, CallPage
│   │   └── services/       # API and socket services
│   └── ...
├── server/                 # Node.js backend
│   └── server.js           # Signaling server
├── render.yaml             # Render deployment config
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Local Development

1. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Install client dependencies**
   ```bash
   cd client
   npm install
   ```

3. **Start the server** (Terminal 1)
   ```bash
   cd server
   npm run dev
   ```

4. **Start the client** (Terminal 2)
   ```bash
   cd client
   npm run dev
   ```

5. Open http://localhost:5173

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| M | Mute/Unmute microphone |
| V | Toggle camera |
| S | Toggle screen share |
| C | Toggle chat panel |
| F | Toggle fullscreen |
| ESC | Close chat/Exit fullscreen |

## 🌐 Deployment on Render

### Option 1: Using Blueprint (Recommended)

1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New" → "Blueprint"
4. Connect your GitHub repository
5. Render will auto-detect `render.yaml` and deploy both services

### Option 2: Manual Deployment

#### Backend (Web Service)
1. Create new Web Service on Render
2. Connect to your GitHub repo
3. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

#### Frontend (Static Site)
1. Create new Static Site on Render
2. Connect to your GitHub repo
3. Settings:
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

#### Environment Variables

**After deploying, update the frontend environment:**
- `VITE_API_URL`: Your backend URL (e.g., `https://meetflow-server.onrender.com`)
- `VITE_SOCKET_URL`: Same as API URL

**Update the code:**
After deploying the backend, update these files with your actual Render URLs:
- `client/src/services/apiService.js`
- `client/src/services/socketService.js`

## 📝 How It Works

1. **Room Creation**: User creates a room, server generates unique code
2. **Room Joining**: Second user enters the code
3. **WebRTC Signaling**: Server exchanges offer/answer/ICE candidates
4. **P2P Connection**: Direct video/audio streaming between browsers

## 🔒 Security

- WebRTC connections are encrypted (DTLS)
- No media is stored on servers
- Rooms are limited to 2 participants
- Rooms auto-delete after 30 minutes of inactivity

## 🌐 Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full |
| Firefox | ✅ Full |
| Safari | ✅ Full |
| Edge | ✅ Full |

## 📄 License

MIT License - Feel free to use for personal or commercial projects.

---

Built with ❤️ using React & WebRTC
