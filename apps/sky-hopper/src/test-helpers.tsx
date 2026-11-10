// Tests only.
import type {
  GameAdapter,
  GameConfig,
  GameResult,
  TrackingEvent,
} from "@repo/game-core";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { vi } from "vitest";
import { App } from "./App.tsx";
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
  /** when set, submitResult stays pending until releaseSubmit is called */
  holdSubmit?: boolean;
}

export function fakeAdapter(opts: FakeOptions = {}): {
  adapter: GameAdapter;
  calls: { submitResult: number[] };
  releaseConfig(): void;
  releaseSubmit(): void;
} {
  const calls = { submitResult: [] as number[] };
  let release: () => void = () => {};
  const gate = opts.holdConfig
    ? new Promise<void>((r) => {
        release = r;
      })
    : Promise.resolve();
  let releaseSub: () => void = () => {};
  const subGate = opts.holdSubmit
    ? new Promise<void>((r) => {
        releaseSub = r;
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
    submitResult: async (_env, score) => {
      calls.submitResult.push(score);
      await subGate;
      return opts.submitError
        ? { ok: false, error: err }
        : { ok: true, data: opts.result ?? WIN };
    },
  };
  return {
    adapter,
    calls,
    releaseConfig: () => release(),
    releaseSubmit: () => releaseSub(),
  };
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

export interface Frames {
  /** runs n frames, ms apart, inside act() */
  frames(n: number, ms: number): void;
  /** number of animation frames waiting to run */
  pending(): number;
}

/** Stubs requestAnimationFrame/cancelAnimationFrame with a manual queue. */
export function installFrames(): Frames {
  let now = 1000;
  let nextId = 1;
  const queue = new Map<number, FrameRequestCallback>();
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    const id = nextId++;
    queue.set(id, cb);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    queue.delete(id);
  });
  return {
    frames(n, ms) {
      for (let i = 0; i < n; i++) {
        now += ms;
        const batch = [...queue.values()];
        queue.clear();
        act(() => {
          for (const cb of batch) cb(now);
        });
      }
    },
    pending: () => queue.size,
  };
}

export function tap(el: Element): void {
  act(() => {
    const init = { bubbles: true };
    el.dispatchEvent(
      typeof PointerEvent === "function"
        ? new PointerEvent("pointerdown", init)
        : new MouseEvent("pointerdown", init),
    );
  });
}

export function pressSpace(
  el: Element,
  opts: { repeat?: boolean } = {},
): KeyboardEvent {
  const event = new KeyboardEvent("keydown", {
    code: "Space",
    key: " ",
    repeat: opts.repeat ?? false,
    bubbles: true,
    cancelable: true,
  });
  act(() => {
    el.dispatchEvent(event);
  });
  return event;
}

export function setHidden(hidden: boolean): void {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => (hidden ? "hidden" : "visible"),
  });
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

/** One tap, then 60 Hz frames until the over screen shows (at most 300). */
export function playToGround(root: ParentNode, driver: Frames): void {
  const canvas = root.querySelector("canvas.play");
  if (canvas) tap(canvas);
  for (let i = 0; i < 300 && !root.querySelector(".over"); i++) {
    driver.frames(1, 1000 / 60);
  }
}
