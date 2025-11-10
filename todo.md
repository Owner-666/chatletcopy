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
- [x] Real-time messaging with Socket.IO
- [x] Camera and Microphone support
- [ ] User presence indicators

## Backend
- [x] Create rooms table in database
- [x] Create messages table in database
- [x] Implement room management endpoints (tRPC)
- [x] Add message history retrieval
- [x] Setup Socket.IO for real-time updates
- [x] Create WebRTC signaling endpoints (basic)

## Frontend
- [x] Home page with room creation
- [x] Chat interface with message display
- [x] Input field for typing messages
- [x] Room navigation
- [x] Font customization UI
- [x] Responsive design
- [x] Camera/microphone toggle buttons
- [x] Video feed display
- [x] Real-time message updates via Socket.IO
- [x] Join room with nickname

## Deployment
- [x] README with Render deployment instructions
- [ ] Pousser code sur GitHub
- [ ] Configurer base de données Render
- [ ] Déployer Web Service sur Render

## Nouvelles fonctionnalités
- [x] Générer pseudo aléatoire à la connexion
- [x] Permettre de changer le pseudo dans le salon
- [x] Vérifier que le pseudo est unique dans le salon
- [x] Partage vidéo P2P avec WebRTC entre utilisateurs
