import { useGameContext } from "@repo/game-core";
import type { GameResult } from "@repo/game-core";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { GRID, newState, step, tickMs } from "./snake-engine.ts";
import type { Dir, State } from "./snake-engine.ts";

export const TEXT = {
  loading: "Loading…",
  loadError: "Could not load the game. Please try again later.",
  submitError: "Something went wrong. Please try again.",
  playAgain: "Play again",
} as const;

const CELL = 20;
const SIZE = GRID * CELL;
const SWIPE_MIN = 24; // px of finger travel that counts as a swipe

const KEYS: Record<string, Dir> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
  W: "up",
  S: "down",
  A: "left",
  D: "right",
};

function draw(canvas: HTMLCanvasElement | null, state: State): void {
  const g = canvas?.getContext("2d");
  if (!g) return;
  g.fillStyle = "#14342b";
  g.fillRect(0, 0, SIZE, SIZE);
  g.fillStyle = "#5b3a29";
  g.fillRect(0, 0, SIZE, CELL);
  g.fillRect(0, SIZE - CELL, SIZE, CELL);
  g.fillRect(0, 0, CELL, SIZE);
  g.fillRect(SIZE - CELL, 0, CELL, SIZE);
  g.fillStyle = "#f2c14e";
  g.beginPath();
  g.arc(
    state.prey.x * CELL + CELL / 2,
    state.prey.y * CELL + CELL / 2,
    CELL / 2 - 3,
    0,
    Math.PI * 2,
  );
  g.fill();
  state.snake.forEach((p, i) => {
    g.fillStyle = i === 0 ? "#7bd88f" : "#3fae6a";
    g.fillRect(p.x * CELL + 1, p.y * CELL + 1, CELL - 2, CELL - 2);
  });
}

function Outcome(props: { result: GameResult | null }): ReactElement {
  const { result } = props;
  if (!result) return <div className="status">{TEXT.submitError}</div>;
  if (result.status === "SUCCESS" && result.isWin && result.reward) {
    return <div className="prize">{result.reward.name}</div>;
  }
  return <div className="status">{result.message}</div>;
}

function GameOver(props: {
  score: number;
  result: GameResult | null;
  onAgain: () => void;
}): ReactElement {
  return (
    <div className="overlay">
      <div className="status">Game over — score {props.score}</div>
      <Outcome result={props.result} />
      <button onClick={props.onAgain}>{TEXT.playAgain}</button>
    </div>
  );
}

function useSwipe(wanted: { current: Dir }) {
  const from = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent): void => {
    from.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent): void => {
    const start = from.current;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN) return;
    if (Math.abs(dx) > Math.abs(dy)) wanted.current = dx > 0 ? "right" : "left";
    else wanted.current = dy > 0 ? "down" : "up";
    from.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerEnd = (): void => {
    from.current = null;
  };
  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: onPointerEnd,
    onPointerCancel: onPointerEnd,
  };
}

/** Runs one round per `round` value once the game is ready; reports score and game over. */
function useRun(
  ready: boolean,
  round: number,
  canvasRef: { current: HTMLCanvasElement | null },
  wanted: { current: Dir },
  onScore: (score: number) => void,
  onOver: (score: number) => void,
): void {
  useEffect(() => {
    if (!ready) return;
    let state = newState(Math.random);
    wanted.current = state.dir;
    onScore(0);
    draw(canvasRef.current, state);
    let timer: ReturnType<typeof setTimeout>;
    const tick = (): void => {
      state = step(state, wanted.current, Math.random);
      wanted.current = state.dir;
      onScore(state.score);
      draw(canvasRef.current, state);
      if (state.over) onOver(state.score);
      else timer = setTimeout(tick, tickMs(state.score));
    };
    timer = setTimeout(tick, tickMs(0));
    const onKey = (e: KeyboardEvent): void => {
      const dir = KEYS[e.key];
      if (!dir) return;
      e.preventDefault();
      wanted.current = dir;
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
    // restart when a new round starts
  }, [ready, round]);
}

export function SnakeGame(): ReactElement {
  const ctx = useGameContext();
  const { initGame, sendTracking, submitResult, resetResult } = ctx;
  const [loadFailed, setLoadFailed] = useState(false);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [failed, setFailed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wanted = useRef<Dir>("right");
  const swipeHandlers = useSwipe(wanted);

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
  useRun(!loadFailed && ctx.config !== null, round, canvasRef, wanted, setScore, onOver);

  const playAgain = (): void => {
    resetResult();
    setOver(false);
    setFailed(false);
    setRound((n) => n + 1);
  };

  if (loadFailed) return <div className="status">{TEXT.loadError}</div>;
  if (!ctx.config) return <div className="status">{TEXT.loading}</div>;
  const done = over && (ctx.result !== null || failed);
  return (
    <>
      <div className="score">Score: {score}</div>
      <div className="card">
        <canvas
          className="board"
          width={SIZE}
          height={SIZE}
          ref={canvasRef}
          {...swipeHandlers}
        />
        {done && (
          <GameOver score={score} result={ctx.result} onAgain={playAgain} />
        )}
      </div>
    </>
  );
}
