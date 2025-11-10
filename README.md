# Chat App - Real-time Chat with WebRTC

Un site de chat en temps réel avec support des salons personnalisés, caméra/micro WebRTC, accès anonyme, et support des polices personnalisées.

## Fonctionnalités

- **Chat en temps réel** avec Socket.IO
- **Salons personnalisés** - Créez des salons avec des URLs comme `/manu`, `/gaming`, etc.
- **Accès anonyme** - Pas de compte requis, entrez juste un surnom
- **Caméra et Microphone** - Partagez votre vidéo avec WebRTC
- **Polices personnalisées** - Choisissez parmi plusieurs polices pour vos messages
- **Persistance des messages** - Les messages sont sauvegardés en base de données
- **Responsive** - Fonctionne sur desktop et mobile

## Stack Technique

- **Frontend**: React 19 + Tailwind CSS 4 + Socket.IO Client
- **Backend**: Node.js + Express + tRPC + Socket.IO
- **Base de données**: MySQL/TiDB
- **Déploiement**: Render

## Installation locale

```bash
# Installer les dépendances
pnpm install

# Configurer les variables d'environnement
cp .env.example .env

# Pousser les migrations de base de données
pnpm db:push

# Démarrer le serveur de développement
pnpm dev
```

Le site sera accessible sur `http://localhost:3000`

## Déploiement sur Render

### 1. Créer un nouveau Web Service sur Render

1. Allez sur [render.com](https://render.com)
2. Cliquez sur **New +** → **Web Service**
3. Connectez votre dépôt Git (ou utilisez `https://github.com/...`)
4. Configurez le service :
   - **Name**: `chatapp` (ou votre choix)
   - **Environment**: `Node`
   - **Build Command**: `pnpm install && pnpm db:push`
   - **Start Command**: `pnpm start`
   - **Plan**: Free (ou Starter)

### 2. Configurer les variables d'environnement

Dans les **Environment Variables** du Web Service, ajoutez :

```
DATABASE_URL=mysql://user:password@host/database
NODE_ENV=production
PORT=3000
```

**Pour la base de données** :
- Créez une base de données MySQL sur Render ou utilisez une autre plateforme (PlanetScale, Supabase, etc.)
- Copiez l'URL de connexion dans `DATABASE_URL`

### 3. Déployer

1. Cliquez sur **Create Web Service**
2. Render déploiera automatiquement votre application
3. Une fois déployée, vous recevrez une URL publique

### 4. Tester

Accédez à votre URL publique et créez un salon pour tester !

## Structure du projet

```
client/
  src/
    pages/
      Home.tsx          # Page d'accueil
      Chat.tsx          # Page de chat
    lib/
      socket.ts         # Configuration Socket.IO
      trpc.ts           # Client tRPC
    App.tsx             # Routes principales

server/
  _core/
    socketio.ts         # Configuration Socket.IO
    index.ts            # Serveur Express
  db.ts                 # Requêtes base de données
  routers.ts            # Procédures tRPC

drizzle/
  schema.ts             # Schéma de base de données
```

## API Socket.IO

### Événements client → serveur

- `join_room` - Rejoindre un salon
  ```js
  socket.emit('join_room', { roomId: 1, nickname: 'John' })
  ```

- `send_message` - Envoyer un message
  ```js
  socket.emit('send_message', {
    roomId: 1,
    nickname: 'John',
    content: 'Hello!',
    fontFamily: 'sans-serif'
  })
  ```

### Événements serveur → client

- `message_history` - Historique des messages au connexion
- `new_message` - Nouveau message reçu
- `user_joined` - Un utilisateur a rejoint
- `user_left` - Un utilisateur a quitté

## Procédures tRPC

### `chat.getOrCreateRoom`
Crée ou récupère un salon par son slug.

```ts
const room = await trpc.chat.getOrCreateRoom.mutate({ slug: 'manu' })
```

### `chat.getMessages`
Récupère les messages d'un salon.

```ts
const messages = await trpc.chat.getMessages.query({ roomId: 1, limit: 50 })
```

### `chat.sendMessage`
Envoie un message (aussi via Socket.IO pour le temps réel).

```ts
await trpc.chat.sendMessage.mutate({
  roomId: 1,
  nickname: 'John',
  content: 'Hello!',
  fontFamily: 'sans-serif'
})
```

## Troubleshooting

### Erreur de connexion à la base de données
- Vérifiez que `DATABASE_URL` est correctement configurée
- Assurez-vous que la base de données est accessible depuis Render
- Activez SSL si nécessaire

### Socket.IO ne se connecte pas
- Vérifiez que le serveur est en cours d'exécution
- Vérifiez les logs du serveur pour les erreurs
- Assurez-vous que WebSocket est activé sur votre hébergeur

### Caméra/Micro ne fonctionne pas
- Vérifiez les permissions du navigateur
- Testez sur HTTPS (requis pour WebRTC en production)
- Vérifiez que votre navigateur supporte WebRTC

## Licence

MIT

## Support

Pour toute question ou problème, créez une issue sur le dépôt Git.
