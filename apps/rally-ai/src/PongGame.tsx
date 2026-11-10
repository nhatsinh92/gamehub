import { useGameContext } from "@repo/game-core";
import type { GameResult } from "@repo/game-core";
import type { ReactElement, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import {
  BALL_R,
  BOARD_H,
  BOARD_W,
  PADDLE_H,
  PADDLE_MARGIN,
  PADDLE_W,
  initialState,
  step,
} from "./pong.ts";
import type { PongState } from "./pong.ts";

export const TEXT = {
  loading: "Loading…",
  loadError: "Could not load the game. Please try again later.",
  submitError: "Something went wrong. Please try again.",
  playAgain: "Play again",
  gameOver: "Game over",
} as const;

function draw(canvas: HTMLCanvasElement, s: PongState): void {
  const c = canvas.getContext("2d");
  if (!c) return;
  c.fillStyle = "#14213d";
  c.fillRect(0, 0, BOARD_W, BOARD_H);
  c.strokeStyle = "#8d99ae";
  c.setLineDash([8, 8]);
  c.beginPath();
  c.moveTo(BOARD_W / 2, 0);
  c.lineTo(BOARD_W / 2, BOARD_H);
  c.stroke();
  c.setLineDash([]);
  const paddle = (x: number, y: number, color: string): void => {
    c.fillStyle = color;
    c.beginPath();
    c.roundRect(x, y - PADDLE_H / 2, PADDLE_W, PADDLE_H, 5);
    c.fill();
  };
  paddle(PADDLE_MARGIN, s.player, "#fca311");
  paddle(BOARD_W - PADDLE_MARGIN - PADDLE_W, s.ai, "#e5e5e5");
  c.fillStyle = "#06d6a0";
  c.beginPath();
  c.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2);
  c.fill();
}

function Outcome(props: { result: GameResult | null }): ReactElement {
  const { result } = props;
  if (!result) return <div className="status">{TEXT.submitError}</div>;
  if (result.status === "SUCCESS" && result.isWin && result.reward) {
    return <div className="prize">{result.reward.name}</div>;
  }
  return <div className="status">{result.message}</div>;
}

function GameOver(props: { score: number }): ReactElement {
  return (
    <div className="status">
      {TEXT.gameOver}: {props.score}
    </div>
  );
}

function keyDir(e: KeyboardEvent): number {
  if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") return -1;
  if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") return 1;
  return 0;
}

/** Keyboard and drag input, read by the loop each frame. */
function useInput(canvasRef: RefObject<HTMLCanvasElement | null>, on: boolean) {
  const input = useRef<{ dir: number; dragTo: number | null }>({
    dir: 0,
    dragTo: null,
  });
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!on || !canvas) return;
    const i = input.current;
    const down = (e: KeyboardEvent): void => {
      const d = keyDir(e);
      if (d) {
        i.dir = d;
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent): void => {
      if (keyDir(e) === i.dir) i.dir = 0;
    };
    const drag = (e: PointerEvent): void => {
      if (e.type === "pointermove" && i.dragTo === null) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.height === 0) return;
      i.dragTo = ((e.clientY - rect.top) / rect.height) * BOARD_H;
    };
    const endDrag = (): void => {
      i.dragTo = null;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointerdown", drag);
    canvas.addEventListener("pointermove", drag);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("pointerup", endDrag);
      canvas.removeEventListener("pointerdown", drag);
      canvas.removeEventListener("pointermove", drag);
    };
  }, [on, canvasRef]);
  return input;
}

function useRally(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  on: boolean,
  round: number,
  onScore: (score: number) => void,
  onOver: (score: number) => void,
): void {
  const input = useInput(canvasRef, on);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!on || !canvas) return;
    let state = initialState();
    let last: number | null = null;
    let raf = 0;
    const frame = (now: number): void => {
      const dt = last === null ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      state = step(state, dt, input.current.dir, input.current.dragTo);
      draw(canvas, state);
      onScore(state.score);
      if (state.over) onOver(state.score);
      else raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // restart on each round
  }, [on, round]);
}

export function PongGame(): ReactElement {
  const ctx = useGameContext();
  const { initGame, sendTracking, submitResult, resetResult } = ctx;
  const [loadFailed, setLoadFailed] = useState(false);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [failed, setFailed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ready = Boolean(ctx.config);

  useEffect(() => {
    sendTracking({ name: "game_open" });
    void initGame().then((config) => setLoadFailed(config === null));
    // once, on mount
  }, []);

  const onOver = (final: number): void => {
    setOver(true);
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
  useRally(canvasRef, ready, round, setScore, onOver);

  const playAgain = (): void => {
    resetResult();
    setScore(0);
    setOver(false);
    setFailed(false);
    setRound((n) => n + 1);
  };

  if (loadFailed) return <div className="status">{TEXT.loadError}</div>;
  if (!ready) return <div className="status">{TEXT.loading}</div>;
  const done = over && (ctx.result !== null || failed);
  return (
    <>
      <div className="score">{score}</div>
      <canvas
        ref={canvasRef}
        className="board"
        width={BOARD_W}
        height={BOARD_H}
      />
      {over && <GameOver score={score} />}
      {done && <Outcome result={ctx.result} />}
      {done && <button onClick={playAgain}>{TEXT.playAgain}</button>}
    </>
  );
}
