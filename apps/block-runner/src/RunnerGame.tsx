import { useGameContext } from "@repo/game-core";
import type { GameResult } from "@repo/game-core";
import type { ReactElement, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import {
  BLOCK_W,
  GROUND_Y,
  OBSTACLE_H,
  RUNNER_H,
  RUNNER_W,
  RUNNER_X,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  createState,
  score,
  step,
} from "./runner.ts";
import type { RunnerState } from "./runner.ts";

export const TEXT = {
  loading: "Loading…",
  loadError: "Could not load the game. Please try again later.",
  submitError: "Something went wrong. Please try again.",
  playAgain: "Play again",
} as const;

export const TICK_MS = 16;

function draw(canvas: HTMLCanvasElement | null, s: RunnerState): void {
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#e8f4fb";
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  ctx.fillStyle = "#555";
  ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 2);
  ctx.fillStyle = "#2e9e4f";
  for (const o of s.obstacles) {
    ctx.fillRect(o.x, GROUND_Y - OBSTACLE_H, o.blocks * BLOCK_W, OBSTACLE_H);
  }
  ctx.fillStyle = s.over ? "#c0392b" : "#7a4bd1";
  ctx.fillRect(RUNNER_X, GROUND_Y - s.height - RUNNER_H, RUNNER_W, RUNNER_H);
}

function Outcome(props: { result: GameResult | null }): ReactElement {
  const { result } = props;
  if (!result) return <div className="status">{TEXT.submitError}</div>;
  if (result.status === "SUCCESS" && result.isWin && result.reward) {
    return <div className="prize">{result.reward.name}</div>;
  }
  return <div className="status">{result.message}</div>;
}

/** Ticks the game while `ready`; restarts when `round` changes. */
function useRunLoop(
  ready: boolean,
  round: number,
  canvas: RefObject<HTMLCanvasElement | null>,
  jumpQueued: RefObject<boolean>,
  onPoints: (points: number) => void,
  onOver: (finalScore: number) => void,
): void {
  useEffect(() => {
    if (!ready) return;
    let state = createState();
    jumpQueued.current = false;
    draw(canvas.current, state);
    const onKey = (e: KeyboardEvent): void => {
      if (e.code !== "Space" && e.code !== "ArrowUp") return;
      e.preventDefault();
      jumpQueued.current = true;
    };
    window.addEventListener("keydown", onKey);
    const timer = setInterval(() => {
      state = step(state, jumpQueued.current, Math.random);
      jumpQueued.current = false;
      draw(canvas.current, state);
      onPoints(score(state));
      if (!state.over) return;
      clearInterval(timer);
      onOver(score(state));
    }, TICK_MS);
    return () => {
      clearInterval(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [ready, round]);
}

export function RunnerGame(): ReactElement {
  const ctx = useGameContext();
  const { initGame, sendTracking, submitResult, resetResult } = ctx;
  const [loadFailed, setLoadFailed] = useState(false);
  const [round, setRound] = useState(0);
  const [points, setPoints] = useState(0);
  const [over, setOver] = useState(false);
  const [failed, setFailed] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const jumpQueued = useRef(false);
  const ready = ctx.config !== null;

  useEffect(() => {
    sendTracking({ name: "game_open" });
    void initGame().then((config) => setLoadFailed(config === null));
    // once, on mount
  }, []);

  useRunLoop(ready, round, canvas, jumpQueued, setPoints, (final) => {
    setOver(true);
    sendTracking({ name: "game_over" });
    void submitResult(final).then((result) => {
      if (result) {
        sendTracking({
          name: "game_result",
          params: { status: result.status, isWin: result.isWin },
        });
      } else setFailed(true);
    });
  });

  const playAgain = (): void => {
    resetResult();
    setOver(false);
    setFailed(false);
    setPoints(0);
    setRound((n) => n + 1);
  };

  if (loadFailed) return <div className="status">{TEXT.loadError}</div>;
  if (!ready) return <div className="status">{TEXT.loading}</div>;
  const done = over && (ctx.result !== null || failed);
  return (
    <>
      <div className="score">Score: {points}</div>
      <canvas
        ref={canvas}
        className="track"
        width={WORLD_WIDTH}
        height={WORLD_HEIGHT}
        onPointerDown={() => {
          jumpQueued.current = true;
        }}
      />
      {done && <Outcome result={ctx.result} />}
      {over && <button onClick={playAgain}>{TEXT.playAgain}</button>}
    </>
  );
}
