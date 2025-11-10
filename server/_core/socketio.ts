import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { addMessage, getMessages } from "../db";

interface SocketUser {
  id: string;
  nickname: string;
  roomId: number;
}

const users: Map<string, SocketUser> = new Map();

export function setupSocketIO(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join room
    socket.on("join_room", async (data: { roomId: number; nickname: string }) => {
      const { roomId, nickname } = data;
      
      socket.join(`room_${roomId}`);
      
      const user: SocketUser = {
        id: socket.id,
        nickname,
        roomId,
      };
      
      users.set(socket.id, user);

      // Notify others that user joined
      io.to(`room_${roomId}`).emit("user_joined", {
        nickname,
        timestamp: new Date(),
      });

      // Send message history
      const messages = await getMessages(roomId, 50);
      socket.emit("message_history", messages);

      console.log(`${nickname} joined room ${roomId}`);
    });

    // Send message
    socket.on("send_message", async (data: { roomId: number; nickname: string; content: string; fontFamily?: string }) => {
      const { roomId, nickname, content, fontFamily } = data;

      try {
        await addMessage(roomId, nickname, content, fontFamily);

        // Broadcast to all users in the room
        io.to(`room_${roomId}`).emit("new_message", {
          nickname,
          content,
          fontFamily: fontFamily || "sans-serif",
          createdAt: new Date(),
        });
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", "Failed to send message");
      }
    });

    // WebRTC offer
    socket.on("webrtc_offer", (data: { to: string; offer: any }) => {
      io.to(data.to).emit("webrtc_offer", {
        from: socket.id,
        offer: data.offer,
      });
    });

    // WebRTC answer
    socket.on("webrtc_answer", (data: { to: string; answer: any }) => {
      io.to(data.to).emit("webrtc_answer", {
        from: socket.id,
        answer: data.answer,
      });
    });

    // WebRTC ICE candidate
    socket.on("webrtc_ice_candidate", (data: { to: string; candidate: any }) => {
      io.to(data.to).emit("webrtc_ice_candidate", {
        from: socket.id,
        candidate: data.candidate,
      });
    });

    // Change nickname
    socket.on("change_nickname", (data: { roomId: number; oldNickname: string; newNickname: string }) => {
      const user = users.get(socket.id);
      if (user) {
        user.nickname = data.newNickname;
        users.set(socket.id, user);
        
        io.to(`room_${data.roomId}`).emit("nickname_changed", {
          oldNickname: data.oldNickname,
          newNickname: data.newNickname,
        });
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      const user = users.get(socket.id);
      if (user) {
        io.to(`room_${user.roomId}`).emit("user_left", {
          nickname: user.nickname,
          timestamp: new Date(),
        });
        users.delete(socket.id);
        console.log(`${user.nickname} left room ${user.roomId}`);
      }
    });
  });

  return io;
}
