import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { WebRTCManager } from "@/lib/webrtc";
import { generateRandomNickname } from "@shared/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Video, Mic, Home, Edit2, Check, X } from "lucide-react";

interface Message {
  id?: number;
  roomId?: number;
  nickname: string;
  content: string;
  fontFamily: string | null;
  createdAt: Date;
}

interface RemoteUser {
  id: string;
  nickname: string;
  stream?: MediaStream;
}

export default function Chat() {
  const { room } = useParams<{ room: string }>();
  const [nickname, setNickname] = useState("");
  const [displayNickname, setDisplayNickname] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [fontFamily, setFontFamily] = useState("sans-serif");
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<Map<string, RemoteUser>>(new Map());
  const [connected, setConnected] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState("");
  const [usedNicknames, setUsedNicknames] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const socketRef = useRef(getSocket());
  const webrtcRef = useRef<WebRTCManager | null>(null);

  const createRoomMutation = trpc.chat.getOrCreateRoom.useMutation();

  // Initialize room and generate random nickname
  useEffect(() => {
    if (!room) return;
    
    const initRoom = async () => {
      try {
        const result = await createRoomMutation.mutateAsync({ slug: room });
        setRoomId(result.id);
        
        // Generate random nickname
        const randomNick = generateRandomNickname();
        setNickname(randomNick);
        setDisplayNickname(randomNick);
      } catch (error) {
        console.error("Failed to create/get room:", error);
      }
    };

    initRoom();
  }, [room]);

  // Setup Socket.IO and WebRTC
  useEffect(() => {
    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Connected to Socket.IO");
      setConnected(true);
      
      if (roomId && nickname) {
        socket.emit("join_room", { roomId, nickname });
        
        // Initialize WebRTC manager
        if (!webrtcRef.current && roomId) {
          webrtcRef.current = new WebRTCManager(socket, socket.id || "", roomId);
        }
      }
    });

    socket.on("message_history", (msgs: Message[]) => {
      setMessages(msgs);
      const nicks = new Set(msgs.map(m => m.nickname).filter(n => n !== "System"));
      setUsedNicknames(nicks);
    });

    socket.on("new_message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("user_joined", (data: { nickname: string; timestamp: Date; userId?: string }) => {
      setUsedNicknames((prev) => new Set([...Array.from(prev), data.nickname]));
      if (data.userId) {
        const userId = data.userId as string;
        setRemoteUsers((prev) => {
          const updated = new Map(Array.from(prev));
          updated.set(userId, { id: userId, nickname: data.nickname });
          return updated;
        });
        
        // Create peer connection for new user
        if (webrtcRef.current) {
          webrtcRef.current.createPeerConnection(userId, data.nickname, true);
        }
      }
      
      setMessages((prev) => [
        ...prev,
        {
          nickname: "System",
          content: `${data.nickname} joined the room`,
          fontFamily: null,
          createdAt: new Date(data.timestamp),
        },
      ]);
    });

    socket.on("user_left", (data: { nickname: string; timestamp: Date; userId?: string }) => {
      setUsedNicknames((prev) => {
        const updated = new Set(Array.from(prev));
        updated.delete(data.nickname);
        return updated;
      });
      if (data.userId) {
        setRemoteUsers((prev) => {
          const updated = new Map(Array.from(prev));
          updated.delete(data.userId as string);
          return updated;
        });
      }
      setMessages((prev) => [
        ...prev,
        {
          nickname: "System",
          content: `${data.nickname} left the room`,
          fontFamily: null,
          createdAt: new Date(data.timestamp),
        },
      ]);
    });

    socket.on("nickname_changed", (data: { oldNickname: string; newNickname: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          nickname: "System",
          content: `${data.oldNickname} changed nickname to ${data.newNickname}`,
          fontFamily: null,
          createdAt: new Date(),
        },
      ]);
      setUsedNicknames((prev) => {
        const updated = new Set(Array.from(prev));
        updated.delete(data.oldNickname);
        updated.add(data.newNickname);
        return updated;
      });
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from Socket.IO");
      setConnected(false);
    });

    return () => {
      socket.off("connect");
      socket.off("message_history");
      socket.off("new_message");
      socket.off("user_joined");
      socket.off("user_left");
      socket.off("nickname_changed");
      socket.off("disconnect");
    };
  }, [roomId, nickname]);

  // Handle camera and microphone
  useEffect(() => {
    if (cameraOn || micOn) {
      navigator.mediaDevices
        .getUserMedia({ video: cameraOn, audio: micOn })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          
          // Share stream with WebRTC peers
          if (webrtcRef.current) {
            webrtcRef.current.setLocalStream(stream);
          }
        })
        .catch((error) => {
          console.error("Error accessing media:", error);
          setCameraOn(false);
          setMicOn(false);
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      
      if (webrtcRef.current) {
        webrtcRef.current.clearLocalStream();
      }
    }
  }, [cameraOn, micOn]);

  // Monitor WebRTC streams
  useEffect(() => {
    if (!webrtcRef.current) return;
    
    const interval = setInterval(() => {
      const connections = webrtcRef.current?.getAllPeerConnections() || [];
      
      setRemoteUsers((prev) => {
        const updated = new Map(Array.from(prev));
        
        for (const connection of connections) {
          if (connection.stream) {
            const user = updated.get(connection.peerId);
            if (user) {
              user.stream = connection.stream;
              updated.set(connection.peerId, user);
            }
          }
        }
        
        return updated;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomId || !displayNickname.trim() || !message.trim()) return;

    const socket = socketRef.current;
    socket.emit("send_message", {
      roomId,
      nickname: displayNickname.trim(),
      content: message.trim(),
      fontFamily,
    });

    setMessage("");
  };

  const handleChangeNickname = () => {
    if (!newNickname.trim()) {
      setEditingNickname(false);
      return;
    }

    if (usedNicknames.has(newNickname.trim())) {
      alert("This nickname is already taken in this room!");
      return;
    }

    const oldNickname = displayNickname;
    const socket = socketRef.current;
    
    socket.emit("change_nickname", {
      roomId,
      oldNickname,
      newNickname: newNickname.trim(),
    });

    setNickname(newNickname.trim());
    setDisplayNickname(newNickname.trim());
    setNewNickname("");
    setEditingNickname(false);
  };

  const handleJoinRoom = () => {
    if (!nickname.trim() || !roomId) return;
    
    const socket = socketRef.current;
    socket.emit("join_room", { roomId, nickname });
  };

  if (!nickname) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-white mb-6">Loading...</h1>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-300 hover:text-white flex items-center gap-2">
              <Home className="w-4 h-4" />
              Home
            </Link>
            <h1 className="text-2xl font-bold text-white">/{room}</h1>
            <span className={`text-sm ${connected ? "text-green-400" : "text-red-400"}`}>
              {connected ? "● Connected" : "● Disconnected"}
            </span>
          </div>
          
          {/* Nickname Display and Edit */}
          <div className="flex items-center gap-2">
            {editingNickname ? (
              <>
                <Input
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  placeholder="New nickname"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 w-40"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleChangeNickname}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingNickname(false);
                    setNewNickname("");
                  }}
                  className="text-slate-300"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <span className="text-slate-300">{displayNickname}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingNickname(true);
                    setNewNickname(displayNickname);
                  }}
                  className="text-slate-300 hover:text-white"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-80px)]">
        {/* Chat Area */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Messages */}
          <Card className="flex-1 bg-slate-800 border-slate-700 p-4 overflow-y-auto">
            <div className="space-y-4">
              {!messages || messages.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                (messages as Message[]).map((msg, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg p-3 break-words ${
                      msg.nickname === "System"
                        ? "bg-slate-700 text-slate-300 text-center text-sm italic"
                        : "bg-slate-700"
                    }`}
                  >
                    {msg.nickname !== "System" && (
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className="font-semibold text-blue-400">
                          {msg.nickname}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                    <p
                      className="text-white"
                      style={{ fontFamily: msg.fontFamily || "sans-serif" }}
                    >
                      {msg.content}
                    </p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </Card>

          {/* Input Area */}
          <Card className="bg-slate-800 border-slate-700 p-4">
            <form onSubmit={handleSendMessage} className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm"
                >
                  <option value="sans-serif">Default</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Monospace</option>
                  <option value="cursive">Cursive</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Courier New">Courier New</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
                <Button
                  type="submit"
                  disabled={!connected}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Media Controls and Videos */}
        <div className="flex flex-col gap-4">
          {/* Media Controls */}
          <Card className="bg-slate-800 border-slate-700 p-4">
            <h3 className="text-white font-semibold mb-4">Media</h3>
            <div className="space-y-2">
              <Button
                onClick={() => setCameraOn(!cameraOn)}
                variant={cameraOn ? "default" : "outline"}
                className="w-full"
              >
                <Video className="w-4 h-4 mr-2" />
                Camera {cameraOn ? "ON" : "OFF"}
              </Button>
              <Button
                onClick={() => setMicOn(!micOn)}
                variant={micOn ? "default" : "outline"}
                className="w-full"
              >
                <Mic className="w-4 h-4 mr-2" />
                Mic {micOn ? "ON" : "OFF"}
              </Button>
            </div>
          </Card>

          {/* Your Video */}
          <Card className="bg-slate-800 border-slate-700 p-4">
            <h3 className="text-white font-semibold mb-2">Your Video</h3>
            <div className="bg-slate-900 rounded aspect-video flex items-center justify-center overflow-hidden">
              {cameraOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-slate-500 text-sm">Camera off</span>
              )}
            </div>
          </Card>

          {/* Remote Videos */}
          {remoteUsers.size > 0 && (
            <Card className="bg-slate-800 border-slate-700 p-4">
              <h3 className="text-white font-semibold mb-2">
                Users ({remoteUsers.size})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Array.from(remoteUsers.values()).map((user) => (
                  <div key={user.id} className="space-y-1">
                    <p className="text-sm text-slate-300">{user.nickname}</p>
                    <div className="bg-slate-900 rounded aspect-video flex items-center justify-center overflow-hidden">
                      {user.stream ? (
                        <video
                          ref={(el) => {
                            if (el) remoteVideoRefs.current.set(user.id, el);
                          }}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                          onLoadedMetadata={(e) => {
                            const video = e.currentTarget;
                            if (user.stream) {
                              video.srcObject = user.stream;
                            }
                          }}
                        />
                      ) : (
                        <span className="text-slate-500 text-xs">No video</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
