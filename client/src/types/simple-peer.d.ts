declare module "simple-peer" {
  interface Options {
    initiator?: boolean;
    trickleIce?: boolean;
    streams?: MediaStream[];
    config?: any;
  }

  interface Instance {
    addTrack(track: MediaStreamTrack, stream: MediaStream): void;
    destroy(): void;
    signal(data: any): void;
    on(event: string, callback: (data: any) => void): void;
    off(event: string, callback: (data: any) => void): void;
  }

  function SimplePeer(options?: Options): Instance;

  export default SimplePeer;
}
