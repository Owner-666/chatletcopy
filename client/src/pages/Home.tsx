import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, Plus } from "lucide-react";

export default function Home() {
  const [roomName, setRoomName] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName.trim()) {
      // Will navigate via Link
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="w-8 h-8 text-blue-500" />
            <h1 className="text-4xl font-bold text-white">Chat App</h1>
          </div>
          <p className="text-slate-400">Real-time chat with camera and microphone</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Join Room Section */}
          <Card className="bg-slate-800 border-slate-700 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Join a Room</h2>
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Room Name
                </label>
                <Input
                  placeholder="e.g., manu, manuai, gaming"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
                <p className="text-xs text-slate-400 mt-2">
                  URL will be: /room/{roomName || "roomname"}
                </p>
              </div>
              {roomName.trim() ? (
                <Link href={`/room/${roomName}`}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Enter Room
                  </Button>
                </Link>
              ) : (
                <Button disabled className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Enter Room
                </Button>
              )}
            </form>
          </Card>

          {/* Features Section */}
          <Card className="bg-slate-800 border-slate-700 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Features</h2>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">✓</span>
                <span>Real-time messaging</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">✓</span>
                <span>Custom chat rooms</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">✓</span>
                <span>Camera & Microphone</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">✓</span>
                <span>Custom fonts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">✓</span>
                <span>No account required</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">✓</span>
                <span>Completely anonymous</span>
              </li>
            </ul>
          </Card>
        </div>

        {/* Popular Rooms */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">Popular Rooms</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["general", "gaming", "music"].map((room) => (
              <Link key={room} href={`/room/${room}`}>
                <Card className="bg-slate-800 border-slate-700 p-6 hover:border-blue-500 cursor-pointer transition">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    /{room}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Join this room to chat
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
