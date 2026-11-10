import { useGameContext } from "@repo/game-core";
import type { GameResult } from "@repo/game-core";
import type { PointerEvent, ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { isOver, newBoard, slide, spawn } from "./board.ts";
import type { Board, Dir } from "./board.ts";
import { drawBoard } from "./draw.ts";

export const TEXT = {
  loading: "Loading…",
  loadError: "Could not load the game. Please try again later.",
  submitError: "Something went wrong. Please try again.",
  playAgain: "Play again",
  gameOver: "Game over",
} as const;

const CANVAS_SIZE = 320;
const SWIPE_MIN = 24;

const KEYS: Record<string, Dir> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  a: "left",
  d: "right",
  w: "up",
  s: "down",
};

function Outcome(props: { result: GameResult | null }): ReactElement {
  const { result } = props;
  if (!result) return <div className="status">{TEXT.submitError}</div>;
  if (result.status === "SUCCESS" && result.isWin && result.reward) {
    return <div className="prize">{result.reward.name}</div>;
  }
  return <div className="status">{result.message}</div>;
}

function useRound() {
  const ctx = useGameContext();
  const [board, setBoard] = useState<Board>(() => newBoard(Math.random));
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [failed, setFailed] = useState(false);
  const state = useRef({ board, score, over });
  const { sendTracking, submitResult, resetResult } = ctx;

  const move = (dir: Dir): void => {
    const cur = state.current;
    if (cur.over) return;
    const res = slide(cur.board, dir);
    if (!res.moved) return;
    const next = spawn(res.board, Math.random);
    const total = cur.score + res.gained;
    const finished = isOver(next);
    state.current = { board: next, score: total, over: finished };
    setBoard(next);
    setScore(total);
    if (!finished) return;
    setOver(true);
    sendTracking({ name: "game_over", params: { score: total } });
    void submitResult(total).then((result) => {
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
    const fresh = newBoard(Math.random);
    state.current = { board: fresh, score: 0, over: false };
    setBoard(fresh);
    setScore(0);
    setOver(false);
    setFailed(false);
  };

  return { ctx, board, score, over, failed, move, playAgain };
}

function BoardCanvas(props: {
  board: Board;
  move: (dir: Dir) => void;
}): ReactElement {
  const { board, move } = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const ctx2d = canvas.current?.getContext("2d");
    if (ctx2d) drawBoard(ctx2d, board, CANVAS_SIZE);
  }, [board]);

  const onPointerUp = (e: PointerEvent): void => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "right" : "left");
    else move(dy > 0 ? "down" : "up");
  };

  return (
    <canvas
      ref={canvas}
      className="board"
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      onPointerDown={(e) => {
        start.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={onPointerUp}
    />
  );
}

export function Game(): ReactElement {
  const { ctx, board, score, over, failed, move, playAgain } = useRound();
  const { initGame, sendTracking } = ctx;
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    sendTracking({ name: "game_open" });
    void initGame().then((config) => setLoadFailed(config === null));
    // once, on mount
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const dir = KEYS[e.key] ?? KEYS[e.key.toLowerCase()];
      if (!dir) return;
      e.preventDefault();
      move(dir);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (loadFailed) return <div className="status">{TEXT.loadError}</div>;
  if (!ctx.config) return <div className="status">{TEXT.loading}</div>;
  const done = ctx.result !== null || failed;

  return (
    <>
      <div className="score">Score: {score}</div>
      <BoardCanvas board={board} move={move} />
      {over && (
        <div className="over">
          <div className="status">
            {TEXT.gameOver}: {score}
          </div>
          {done && <Outcome result={ctx.result} />}
          {done && <button onClick={playAgain}>{TEXT.playAgain}</button>}
        </div>
      )}
    </>
  );
}
