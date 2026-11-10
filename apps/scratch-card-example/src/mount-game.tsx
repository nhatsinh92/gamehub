import type {
  GameAdapter,
  HttpConfig,
  TrackingEvent,
} from "@repo/game-core";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { GAME_CSS } from "./styles.ts";

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

/** Renders the game into a Shadow DOM on `container` (host CSS cannot reach it). */
export function mountGame(
  container: Element,
  options: MountOptions,
): { unmount(): void } {
  const shadow =
    container.shadowRoot ?? container.attachShadow({ mode: "open" });
  shadow.replaceChildren();
  const style = document.createElement("style");
  style.textContent = GAME_CSS;
  const host = document.createElement("div");
  shadow.append(style, host);
  const root = createRoot(host);
  root.render(<App {...options} />);
  return {
    unmount() {
      root.unmount();
      shadow.replaceChildren();
      container.replaceChildren();
    },
  };
}
