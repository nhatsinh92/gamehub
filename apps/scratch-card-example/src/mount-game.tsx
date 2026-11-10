import type {
  GameAdapter,
  HttpConfig,
  TrackingEvent,
} from "@repo/game-core";

export const DEFAULT_WIDTH = 360;
export const DEFAULT_HEIGHT = 480;

export interface MountOptions {
  gameId: string;
  adapter: GameAdapter;
  httpConfig: HttpConfig;
  sendTrackingFunc?: (event: TrackingEvent) => void | Promise<void>;
  width: number;
  height: number;
}

export function mountGame(
  container: Element,
  options: MountOptions,
): { unmount(): void } {
  void container;
  void options;
  return { unmount: () => {} };
}
