// Tests only.
import type {
  GameAdapter,
  GameConfig,
  GameResult,
  TrackingEvent,
} from "@repo/game-core";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { buildDeck, cellOrigin } from "./memory-logic.ts";
import type { MountOptions } from "./mount-game.tsx";

export const TOKEN = "test-token-not-secret";

export const WIN: GameResult = {
  status: "SUCCESS",
  isWin: true,
  reward: { id: "r1", name: "Golden Ticket", code: "GT" },
  remainingTurns: 3,
  message: "You win",
};

export interface FakeOptions {
  config?: GameConfig;
  configError?: boolean;
  result?: GameResult;
  submitError?: boolean;
  /** when set, getConfig stays pending until this is called */
  holdConfig?: boolean;
}

export function fakeAdapter(opts: FakeOptions = {}): {
  adapter: GameAdapter;
  calls: { submitResult: number[] };
  releaseConfig(): void;
} {
  const calls = { submitResult: [] as number[] };
  let release: () => void = () => {};
  const gate = opts.holdConfig
    ? new Promise<void>((r) => {
        release = r;
      })
    : Promise.resolve();
  const err = { kind: "http" as const, message: "boom" };
  const adapter: GameAdapter = {
    getConfig: async () => {
      await gate;
      return opts.configError
        ? { ok: false, error: err }
        : { ok: true, data: opts.config ?? {} };
    },
    getCurrentUser: () => Promise.resolve({ ok: false, error: err }),
    submitResult: (_env, score) => {
      calls.submitResult.push(score);
      return Promise.resolve(
        opts.submitError
          ? { ok: false, error: err }
          : { ok: true, data: opts.result ?? WIN },
      );
    },
  };
  return { adapter, calls, releaseConfig: () => release() };
}

export async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

export function renderApp(
  fake: ReturnType<typeof fakeAdapter>,
  overrides: Partial<MountOptions> = {},
): { container: HTMLElement; tracking: TrackingEvent[]; unmount(): void } {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  const tracking: TrackingEvent[] = [];
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  void act(() => {
    root.render(
      <App
        gameId="test-game"
        adapter={fake.adapter}
        httpConfig={{ baseUrl: "https://api.test", getAccessTokenFunc: () => TOKEN }}
        sendTrackingFunc={(e) => {
          tracking.push(e);
        }}
        width={360}
        height={480}
        {...overrides}
      />,
    );
  });
  return {
    container,
    tracking,
    unmount: () => {
      void act(() => root.unmount());
      container.remove();
    },
  };
}

export function stubCanvasRect(width: number, height: number): void {
  HTMLCanvasElement.prototype.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      width,
      height,
      toJSON: () => ({}),
    }) as DOMRect;
}

function click(canvas: Element, x: number, y: number): void {
  void act(() => {
    const init = { clientX: x, clientY: y, bubbles: true };
    const event =
      typeof PointerEvent === "function"
        ? new PointerEvent("pointerdown", init)
        : new MouseEvent("pointerdown", init);
    canvas.dispatchEvent(event);
  });
}

/**
 * Plays a whole round on `canvas`. Math.random must be stubbed to 0 before the
 * game mounts, and stubCanvasRect(BOARD_SIZE, BOARD_SIZE) must be set.
 */
export function playAll(canvas: Element): void {
  const deck = buildDeck(() => 0);
  const byFace = new Map<number, number[]>();
  deck.forEach((face, i) => byFace.set(face, [...(byFace.get(face) ?? []), i]));
  for (const pair of byFace.values()) {
    for (const i of pair) {
      const o = cellOrigin(i);
      click(canvas, o.x + 5, o.y + 5);
    }
  }
}
