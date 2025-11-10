import SimplePeer from "simple-peer";
import { Socket } from "socket.io-client";

export interface PeerConnection {
  peerId: string;
  peerNickname: string;
  peer: any;
  stream?: MediaStream;
}

export class WebRTCManager {
  private peers: Map<string, PeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private socket: Socket;
  private userId: string;
  private roomId: number;

  constructor(socket: Socket, userId: string, roomId: number) {
    this.socket = socket;
    this.userId = userId;
    this.roomId = roomId;

    // Listen for WebRTC signaling events
    this.socket.on("webrtc_offer", this.handleOffer.bind(this));
    this.socket.on("webrtc_answer", this.handleAnswer.bind(this));
    this.socket.on("webrtc_ice_candidate", this.handleIceCandidate.bind(this));
    this.socket.on("user_left", this.handleUserLeft.bind(this));
  }

  async setLocalStream(stream: MediaStream) {
    this.localStream = stream;
    
    // Send stream to all existing peers
    for (const connection of Array.from(this.peers.values())) {
      stream.getTracks().forEach((track) => {
        connection.peer.addTrack(track, stream);
      });
    }
  }

  clearLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  createPeerConnection(
    peerId: string,
    peerNickname: string,
    initiator: boolean
  ): any {
    const peer = new (SimplePeer as any)({
      initiator,
      trickleIce: true,
      streams: this.localStream ? [this.localStream] : [],
      config: {
        iceServers: [
          { urls: ["stun:stun.l.google.com:19302"] },
          { urls: ["stun:stun1.l.google.com:19302"] },
        ],
      },
    });

    // Handle stream from remote peer
    peer.on("stream", (stream: any) => {
      console.log(`Received stream from ${peerNickname}`);
      const connection = this.peers.get(peerId);
      if (connection) {
        connection.stream = stream;
      }
    });

    // Handle signaling
    peer.on("signal", (data: any) => {
      if (data.type === "offer") {
        this.socket.emit("webrtc_offer", {
          to: peerId,
          offer: data,
        });
      } else if (data.type === "answer") {
        this.socket.emit("webrtc_answer", {
          to: peerId,
          answer: data,
        });
      } else if (data.candidate) {
        this.socket.emit("webrtc_ice_candidate", {
          to: peerId,
          candidate: data,
        });
      }
    });

    // Handle errors
    peer.on("error", (err: any) => {
      console.error(`WebRTC error with ${peerNickname}:`, err);
      this.removePeerConnection(peerId);
    });

    // Handle connection close
    peer.on("close", () => {
      console.log(`Connection closed with ${peerNickname}`);
      this.removePeerConnection(peerId);
    });

    const connection: PeerConnection = {
      peerId,
      peerNickname,
      peer,
    };

    this.peers.set(peerId, connection);
    return peer;
  }

  getPeerConnection(peerId: string): PeerConnection | undefined {
    return this.peers.get(peerId);
  }

  getAllPeerConnections(): PeerConnection[] {
    return Array.from(this.peers.values());
  }

  private handleOffer(data: { from: string; offer: any }) {
    let connection = this.peers.get(data.from);
    
    if (!connection) {
      // Create peer connection if it doesn't exist
      connection = {
        peerId: data.from,
        peerNickname: data.from,
        peer: this.createPeerConnection(data.from, data.from, false),
      };
    }

    connection.peer.signal(data.offer);
  }

  private handleAnswer(data: { from: string; answer: any }) {
    const connection = this.peers.get(data.from);
    if (connection) {
      connection.peer.signal(data.answer);
    }
  }

  private handleIceCandidate(data: { from: string; candidate: any }) {
    const connection = this.peers.get(data.from);
    if (connection) {
      connection.peer.signal(data.candidate);
    }
  }

  private handleUserLeft(data: { nickname: string }) {
    // Find and remove peer by nickname
    for (const [peerId, connection] of Array.from(this.peers.entries())) {
      if (connection.peerNickname === data.nickname) {
        this.removePeerConnection(peerId);
        break;
      }
    }
  }

  private removePeerConnection(peerId: string) {
    const connection = this.peers.get(peerId);
    if (connection) {
      connection.peer.destroy();
      this.peers.delete(peerId);
    }
  }

  destroy() {
    for (const connection of Array.from(this.peers.values())) {
      connection.peer.destroy();
    }
    this.peers.clear();
    this.clearLocalStream();
    
    this.socket.off("webrtc_offer");
    this.socket.off("webrtc_answer");
    this.socket.off("webrtc_ice_candidate");
    this.socket.off("user_left");
  }
}
