# Chat App TODO

## Core Features
- [x] Database schema for rooms and messages
- [x] tRPC procedures for chat operations
- [x] Custom chat rooms (e.g., /manu, /manuai)
- [x] Anonymous access (no login required)
- [x] User nickname/display name
- [x] Message persistence in database
- [x] Custom font support
- [x] Home page with room creation
- [ ] WebRTC for camera and microphone (real-time video)
- [ ] User presence indicators

## Backend
- [x] Create rooms table in database
- [x] Create messages table in database
- [x] Implement room management endpoints (tRPC)
- [x] Add message history retrieval
- [ ] Setup Socket.IO for real-time updates
- [ ] Create WebRTC signaling endpoints

## Frontend
- [x] Home page with room creation
- [x] Chat interface with message display
- [x] Input field for typing messages
- [x] Room navigation
- [x] Font customization UI
- [x] Responsive design
- [ ] Camera/microphone toggle buttons (functional WebRTC)
- [ ] Video grid display for WebRTC
- [ ] Real-time message updates via Socket.IO

## Deployment
- [ ] Test on Render
- [ ] Environment variables setup
- [ ] Database connection verification
