import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Video, Mic, Home } from "lucide-react";

interface Message {
  id: number;
  roomId: number;
  nickname: string;
  content: string;
  fontFamily: string | null;
  createdAt: Date;
}

export default function Chat() {
  const { room } = useParams<{ room: string }>();
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [fontFamily, setFontFamily] = useState("sans-serif");
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const createRoomMutation = trpc.chat.getOrCreateRoom.useMutation();
  const sendMessageMutation = trpc.chat.sendMessage.useMutation();
  const getMessagesQuery = trpc.chat.getMessages.useQuery(
    roomId ? { roomId, limit: 100 } : { roomId: 0, limit: 100 },
    { enabled: !!roomId }
  );

  // Initialize room
  useEffect(() => {
    if (!room) return;
    
    const initRoom = async () => {
      try {
        const result = await createRoomMutation.mutateAsync({ slug: room });
        setRoomId(result.id);
      } catch (error) {
        console.error("Failed to create/get room:", error);
      }
    };

    initRoom();
  }, [room]);

  // Load messages
  useEffect(() => {
    if (getMessagesQuery.data) {
      setMessages(getMessagesQuery.data as Message[]);
    }
  }, [getMessagesQuery.data]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for new messages
  useEffect(() => {
    if (!roomId) return;
    
    const interval = setInterval(() => {
      getMessagesQuery.refetch();
    }, 1000);

    return () => clearInterval(interval);
  }, [roomId, getMessagesQuery]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomId || !nickname.trim() || !message.trim()) return;

    try {
      await sendMessageMutation.mutateAsync({
        roomId,
        nickname: nickname.trim(),
        content: message.trim(),
        fontFamily,
      });
      setMessage("");
      await getMessagesQuery.refetch();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

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
                (messages as Message[]).map((msg) => (
                  <div
                    key={msg.id}
                    className="bg-slate-700 rounded-lg p-3 break-words"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-semibold text-blue-400">
                        {msg.nickname}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p
                      className="text-white mt-1"
                      style={{ fontFamily: msg.fontFamily || "sans-serif" }}
                    >
                      {msg.content}
                    </p>
                  </div>                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </Card>

          {/* Input Area */}
          <Card className="bg-slate-800 border-slate-700 p-4">
            <form onSubmit={handleSendMessage} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Your nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2"
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
                  disabled={sendMessageMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Media Controls */}
        <div className="flex flex-col gap-4">
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
                Microphone {micOn ? "ON" : "OFF"}
              </Button>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-4">
            <h3 className="text-white font-semibold mb-2">Video Feed</h3>
            <div className="bg-slate-900 rounded aspect-video flex items-center justify-center">
              {cameraOn ? (
                <video
                  autoPlay
                  playsInline
                  className="w-full h-full rounded"
                />
              ) : (
                <span className="text-slate-500">Camera off</span>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
