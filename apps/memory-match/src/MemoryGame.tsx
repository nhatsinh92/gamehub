import { useGameContext } from "@repo/game-core";
import type { GameResult } from "@repo/game-core";
import type { Dispatch, PointerEvent, ReactElement, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
import {
  BOARD_SIZE,
  CELL,
  MISMATCH_MS,
  buildDeck,
  cellAt,
  cellOrigin,
  flip,
  hide,
  isDone,
  isLocked,
  newBoard,
} from "./memory-logic.ts";
import type { Board } from "./memory-logic.ts";

export const TEXT = {
  loading: "Loading…",
  loadError: "Could not load the game. Please try again later.",
  submitError: "Something went wrong. Please try again.",
  playAgain: "Play again",
} as const;

const COLORS = ["#e74c3c", "#3498db", "#2ecc71", "#f1c40f", "#9b59b6", "#e67e22", "#1abc9c", "#34495e"];

function drawShape(g: CanvasRenderingContext2D, face: number, cx: number, cy: number): void {
  const r = CELL * 0.3;
  g.fillStyle = COLORS[face] ?? "#000";
  g.beginPath();
  switch (face % 4) {
    case 0:
      g.arc(cx, cy, r, 0, Math.PI * 2);
      break;
    case 1:
      g.rect(cx - r, cy - r, r * 2, r * 2);
      break;
    case 2:
      g.moveTo(cx, cy - r);
      g.lineTo(cx + r, cy + r);
      g.lineTo(cx - r, cy + r);
      g.closePath();
      break;
    default:
      g.moveTo(cx, cy - r);
      g.lineTo(cx + r, cy);
      g.lineTo(cx, cy + r);
      g.lineTo(cx - r, cy);
      g.closePath();
  }
  g.fill();
}

function draw(canvas: HTMLCanvasElement | null, b: Board): void {
  const g = canvas?.getContext("2d");
  if (!g) return;
  g.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
  b.deck.forEach((face, i) => {
    const { x, y } = cellOrigin(i);
    const up = b.matched[i] || b.open.includes(i);
    g.fillStyle = up ? "#ffffff" : "#3a7bd5";
    g.fillRect(x, y, CELL, CELL);
    if (up) drawShape(g, face, x + CELL / 2, y + CELL / 2);
  });
}

function Outcome(props: { result: GameResult | null; moves: number }): ReactElement {
  const { result, moves } = props;
  if (!result) return <div className="status">{TEXT.submitError}</div>;
  return <div className="status">Score: {moves} moves</div>;
}

function useTicking(running: boolean, setSeconds: Dispatch<SetStateAction<number>>): void {
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
}

function useMismatchHide(board: Board, setBoard: Dispatch<SetStateAction<Board>>): void {
  useEffect(() => {
    if (!isLocked(board)) return;
    const id = setTimeout(() => setBoard(hide), MISMATCH_MS);
    return () => clearTimeout(id);
  }, [board]);
}

function useMemoryRound() {
  const ctx = useGameContext();
  const { initGame, sendTracking, submitResult, resetResult } = ctx;
  const [loadFailed, setLoadFailed] = useState(false);
  const [board, setBoard] = useState<Board>(() => newBoard(buildDeck(Math.random)));
  const [seconds, setSeconds] = useState(0);
  const [failed, setFailed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const submitted = useRef(false);
  const done = isDone(board);
  const ready = ctx.config !== null && !loadFailed;

  useEffect(() => {
    sendTracking({ name: "game_open" });
    void initGame().then((config) => setLoadFailed(config === null));
    // once, on mount
  }, []);

  useTicking(ready && !done, setSeconds);
  useMismatchHide(board, setBoard);

  useEffect(() => {
    if (ready) draw(canvasRef.current, board);
  }, [board, ready]);

  useEffect(() => {
    if (!done || submitted.current) return;
    submitted.current = true;
    sendTracking({ name: "game_over", params: { moves: board.moves, seconds } });
    void submitResult(board.moves).then((result) => {
      if (result) {
        sendTracking({
          name: "game_result",
          params: { status: result.status, isWin: result.isWin },
        });
      } else setFailed(true);
    });
  }, [done]);

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((e.clientX - rect.left) * BOARD_SIZE) / rect.width;
    const y = ((e.clientY - rect.top) * BOARD_SIZE) / rect.height;
    setBoard((b) => flip(b, cellAt(x, y)));
  };

  const playAgain = (): void => {
    resetResult();
    submitted.current = false;
    setFailed(false);
    setSeconds(0);
    setBoard(newBoard(buildDeck(Math.random)));
  };

  const over = done && (ctx.result !== null || failed);
  return { ctx, loadFailed, board, seconds, canvasRef, over, onPointerDown, playAgain };
}

export function MemoryGame(): ReactElement {
  const { ctx, loadFailed, board, seconds, canvasRef, over, onPointerDown, playAgain } =
    useMemoryRound();
  if (loadFailed) return <div className="status">{TEXT.loadError}</div>;
  if (!ctx.config) return <div className="status">{TEXT.loading}</div>;
  return (
    <>
      <div className="hud">
        <span>Moves: {board.moves}</span>
        <span>Time: {seconds}s</span>
      </div>
      <canvas
        ref={canvasRef}
        className="board"
        width={BOARD_SIZE}
        height={BOARD_SIZE}
        onPointerDown={onPointerDown}
      />
      {over && <Outcome result={ctx.result} moves={board.moves} />}
      {over && <button onClick={playAgain}>{TEXT.playAgain}</button>}
    </>
  );
}
