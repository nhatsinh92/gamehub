import { useGameContext } from "@repo/game-core";
import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { H, W, BLOCK_H, blockColor, cameraY, createState, drop, fallOffset, levelY, tick } from "./logic.ts";
import type { Block, State } from "./logic.ts";

function draw(c: CanvasRenderingContext2D, s: State, tower: Block[]): void {
  c.fillStyle = "#eef3fb";
  c.fillRect(0, 0, W, H);
  const cam = cameraY(s.score);
  const rect = (level: number, b: Block, dy = 0): void => {
    c.fillStyle = blockColor(level);
    c.fillRect(b.x, levelY(level, cam) + dy, b.w, BLOCK_H - 1);
  };
  tower.forEach((b, level) => rect(level, b));
  for (const f of s.falling) rect(f.level, f, fallOffset(f.age));
  if (s.phase === "playing") rect(s.score + 1, s.slider);
}

/** Calls `onFrame(dtMs)` on every animation frame while enabled. */
function useFrames(enabled: boolean, onFrame: (dtMs: number) => void): void {
  const latest = useRef(onFrame);
  latest.current = onFrame;
  useEffect(() => {
    if (!enabled) return;
    let last: number | null = null;
    const frame = (now: number): void => {
      id = requestAnimationFrame(frame);
      latest.current(last === null ? 0 : Math.min(50, now - last));
      last = now;
    };
    let id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [enabled]);
}

/** Game state, the frame loop, the round end (submit, tracking) and replay. */
export function useGame(enabled: boolean, canvas: RefObject<HTMLCanvasElement | null>) {
  const { sendTracking, submitResult, resetResult } = useGameContext();
  const state = useRef<State>(createState());
  const tower = useRef<Block[]>([state.current.top]);
  const [view, setView] = useState({ phase: state.current.phase, score: 0 });
  const [failed, setFailed] = useState(false);

  const render = (): void => {
    const c = canvas.current?.getContext("2d");
    if (c) draw(c, state.current, tower.current);
  };
  const sync = (): void => {
    const s = state.current;
    setView((v) => (v.phase === s.phase && v.score === s.score ? v : { phase: s.phase, score: s.score }));
  };

  const onDrop = (): void => {
    const before = state.current;
    const next = drop(before);
    if (next === before) return;
    if (before.phase === "ready") sendTracking({ name: "game_start" });
    if (before.phase === "playing" && next.phase === "playing") {
      tower.current = [...tower.current, next.top];
    }
    state.current = next;
    if (next.phase === "over") {
      sendTracking({ name: "game_over", params: { score: next.score } });
      void submitResult(next.score).then((result) => {
        if (!result) setFailed(true);
      });
    }
    sync();
    render();
  };

  useFrames(enabled, (dt) => {
    state.current = tick(state.current, dt);
    render();
  });

  const playAgain = (): void => {
    resetResult();
    state.current = createState();
    tower.current = [state.current.top];
    setFailed(false);
    sync();
    render();
  };

  return { view, failed, onDrop, playAgain };
}
