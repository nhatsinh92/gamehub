import { useGameContext } from "@repo/game-core";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import {
  SHIP_R,
  SHIP_Y,
  START_STATE,
  WORLD_H,
  WORLD_W,
  clampShip,
  scoreOf,
  step,
} from "./game.ts";
import type { GameState } from "./game.ts";

export const TEXT = {
  loading: "Loading…",
  loadError: "Could not load the game. Please try again later.",
  submitError: "Something went wrong. Please try again.",
  gameOver: "Game over",
  playAgain: "Play again",
} as const;

const MAX_DT = 0.05;
const STEER_KEYS = ["ArrowLeft", "ArrowRight", "a", "d"];

function draw(ctx: CanvasRenderingContext2D, s: GameState): void {
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.fillStyle = "#0b1020";
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.fillStyle = "#8d949e";
  ctx.strokeStyle = "#5c626b";
  for (const k of s.rocks) {
    ctx.beginPath();
    k.shape.forEach((f, i) => {
      const a = (i / k.shape.length) * Math.PI * 2;
      const px = k.x + Math.cos(a) * k.r * f;
      const py = k.y + Math.sin(a) * k.r * f;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = "#4fd1c5";
  ctx.beginPath();
  ctx.moveTo(s.shipX, SHIP_Y - SHIP_R);
  ctx.lineTo(s.shipX + SHIP_R, SHIP_Y + SHIP_R);
  ctx.lineTo(s.shipX - SHIP_R, SHIP_Y + SHIP_R);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(String(scoreOf(s)), WORLD_W / 2, 28);
}

function keyHandler(keys: Set<string>): (e: KeyboardEvent) => void {
  return (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (!STEER_KEYS.includes(k)) return;
    e.preventDefault();
    if (e.type === "keydown") keys.add(k);
    else keys.delete(k);
  };
}

/** Ship x in world units for a press or drag on the canvas, or null to ignore. */
function pointerWorldX(e: PointerEvent, el: HTMLCanvasElement | null): number | null {
  if (e.type === "pointermove" && e.buttons === 0) return null;
  const rect = el?.getBoundingClientRect();
  if (!rect || rect.width === 0) return null;
  return clampShip(((e.clientX - rect.left) / rect.width) * WORLD_W);
}

function Round(props: {
  onOver: (score: number) => void;
}): ReactElement {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const over = useRef(props.onOver);
  over.current = props.onOver;

  useEffect(() => {
    let state: GameState = START_STATE;
    const keys = new Set<string>();
    let last: number | null = null;
    let id: number | null = null;
    const el = canvas.current;
    const ctx = el?.getContext("2d") ?? null;
    const frame = (now: number): void => {
      const dt = last === null ? 0 : Math.min((now - last) / 1000, MAX_DT);
      last = now;
      const left = keys.has("ArrowLeft") || keys.has("a");
      const right = keys.has("ArrowRight") || keys.has("d");
      state = step(state, dt, (right ? 1 : 0) - (left ? 1 : 0), Math.random);
      if (ctx) draw(ctx, state);
      if (state.over) {
        id = null;
        over.current(scoreOf(state));
      } else id = requestAnimationFrame(frame);
    };
    const onKey = keyHandler(keys);
    const onPointer = (e: PointerEvent): void => {
      const x = pointerWorldX(e, el);
      if (x !== null) state = { ...state, shipX: x };
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("keyup", onKey);
    el?.addEventListener("pointerdown", onPointer);
    el?.addEventListener("pointermove", onPointer);
    id = requestAnimationFrame(frame);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("keyup", onKey);
      el?.removeEventListener("pointerdown", onPointer);
      el?.removeEventListener("pointermove", onPointer);
      if (id !== null) cancelAnimationFrame(id);
    };
  }, []);

  return (
    <canvas
      ref={canvas}
      className="play"
      width={WORLD_W * 2}
      height={WORLD_H * 2}
    />
  );
}

export function AsteroidDodge(): ReactElement {
  const ctx = useGameContext();
  const { initGame, sendTracking, submitResult, resetResult } = ctx;
  const [loadFailed, setLoadFailed] = useState(false);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    sendTracking({ name: "game_open" });
    void initGame().then((config) => setLoadFailed(config === null));
    // once, on mount
  }, []);

  const onOver = (final: number): void => {
    setScore(final);
    sendTracking({ name: "game_over", params: { score: final } });
    void submitResult(final).then((result) => {
      if (result) {
        sendTracking({
          name: "game_result",
          params: { status: result.status, isWin: result.isWin },
        });
      } else setFailed(true);
    });
  };

  const playAgain = (): void => {
    resetResult();
    setFailed(false);
    setScore(null);
    setRound((n) => n + 1);
  };

  if (loadFailed) return <div className="status">{TEXT.loadError}</div>;
  if (!ctx.config) return <div className="status">{TEXT.loading}</div>;
  return (
    <div className="board">
      <Round key={round} onOver={onOver} />
      {score !== null && (
        <div className="over">
          <div className="prize">{TEXT.gameOver}</div>
          <div className="status">Score: {score}</div>
          {failed && <div className="status">{TEXT.submitError}</div>}
          <button onClick={playAgain}>{TEXT.playAgain}</button>
        </div>
      )}
    </div>
  );
}
