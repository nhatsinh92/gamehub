import { useGameContext } from "@repo/game-core";
import type { GameResult, TrackingEvent } from "@repo/game-core";
import type { PointerEvent as ReactPointerEvent, ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { PAD_COLORS, gapMs, litMs, padAt, randomPad } from "./pads.ts";

export const TEXT = {
  loading: "Loading…",
  loadError: "Could not load the game. Please try again later.",
  submitError: "Something went wrong. Please try again.",
  playAgain: "Play again",
  watch: "Watch…",
  repeat: "Your turn",
  score: "Score",
} as const;

const BOARD = 320;
const GAP = 12;
const TAP_MS = 150;
const LEAD_MS = 400;

type Phase = "watch" | "input" | "over";

function Outcome(props: { result: GameResult | null }): ReactElement {
  const { result } = props;
  if (!result) return <div className="status">{TEXT.submitError}</div>;
  if (result.status === "SUCCESS" && result.isWin && result.reward) {
    return <div className="prize">{result.reward.name}</div>;
  }
  return <div className="status">{result.message}</div>;
}

function draw(canvas: HTMLCanvasElement | null, lit: number | null): void {
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;
  const size = (BOARD - GAP) / 2;
  ctx.clearRect(0, 0, BOARD, BOARD);
  PAD_COLORS.forEach((c, i) => {
    ctx.fillStyle = i === lit ? c.bright : c.dim;
    const x = (i % 2) * (size + GAP);
    const y = Math.floor(i / 2) * (size + GAP);
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 16);
    ctx.fill();
  });
}

function reportResult(
  result: GameResult | null,
  sendTracking: (e: TrackingEvent) => void,
  onFail: () => void,
): void {
  if (!result) return onFail();
  sendTracking({
    name: "game_result",
    params: { status: result.status, isWin: result.isWin },
  });
}

// Plays the whole sequence, one pad at a time; input is off meanwhile.
function usePlayback(
  active: boolean,
  turn: number,
  sequence: { current: number[] },
  setLit: (pad: number | null) => void,
  done: () => void,
): void {
  useEffect(() => {
    if (!active) return;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number): void => {
      timers.push(window.setTimeout(fn, ms));
    };
    const seq = sequence.current;
    const on = litMs(seq.length);
    const step = on + gapMs(seq.length);
    seq.forEach((pad, i) => {
      later(() => setLit(pad), LEAD_MS + i * step);
      later(() => setLit(null), LEAD_MS + i * step + on);
    });
    later(done, LEAD_MS + seq.length * step);
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [active, turn]);
}

function usePadGame() {
  const ctx = useGameContext();
  const { sendTracking, submitResult, resetResult } = ctx;
  const sequence = useRef<number[]>([randomPad()]);
  const index = useRef(0);
  const [phase, setPhase] = useState<Phase>("watch");
  const [turn, setTurn] = useState(0);
  const [score, setScore] = useState(0);
  const [lit, setLit] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const playing = ctx.config !== null;

  const later = (fn: () => void, ms: number): void => {
    window.setTimeout(fn, ms);
  };

  usePlayback(playing && phase === "watch", turn, sequence, setLit, () =>
    setPhase("input"),
  );

  const gameOver = (): void => {
    setPhase("over");
    sendTracking({ name: "game_over", params: { score } });
    void submitResult(score).then((result) =>
      reportResult(result, sendTracking, () => setFailed(true)),
    );
  };

  const tap = (pad: number): void => {
    if (phase !== "input") return;
    setLit(pad);
    later(() => setLit(null), TAP_MS);
    if (pad !== sequence.current[index.current]) {
      gameOver();
      return;
    }
    index.current += 1;
    if (index.current < sequence.current.length) return;
    index.current = 0;
    sequence.current = [...sequence.current, randomPad()];
    setScore((n) => n + 1);
    setPhase("watch");
    setTurn((n) => n + 1);
  };

  const playAgain = (): void => {
    resetResult();
    sequence.current = [randomPad()];
    index.current = 0;
    setScore(0);
    setFailed(false);
    setLit(null);
    setPhase("watch");
    setTurn((n) => n + 1);
  };

  return { ctx, phase, score, lit, failed, tap, playAgain };
}

export function PadGame(): ReactElement {
  const { ctx, phase, score, lit, failed, tap, playAgain } = usePadGame();
  const { initGame, sendTracking } = ctx;
  const [loadFailed, setLoadFailed] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const tapRef = useRef(tap);
  tapRef.current = tap;
  const ready = ctx.config !== null;

  useEffect(() => {
    sendTracking({ name: "game_open" });
    void initGame().then((config) => setLoadFailed(config === null));
    // once, on mount
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= 4) tapRef.current(n - 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    draw(canvas.current, lit);
  }, [lit, ready]);

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const pad = padAt(
      (e.clientX - rect.left) / rect.width,
      (e.clientY - rect.top) / rect.height,
    );
    if (pad !== null) tap(pad);
  };

  if (loadFailed) return <div className="status">{TEXT.loadError}</div>;
  if (!ready) return <div className="status">{TEXT.loading}</div>;
  const done = phase === "over" && (ctx.result !== null || failed);
  return (
    <>
      <div className="score">
        {TEXT.score}: {score}
      </div>
      <canvas
        ref={canvas}
        className="pads"
        width={BOARD}
        height={BOARD}
        onPointerDown={onPointerDown}
      />
      {phase === "watch" && <div className="status">{TEXT.watch}</div>}
      {phase === "input" && <div className="status">{TEXT.repeat}</div>}
      {done && <Outcome result={ctx.result} />}
      {done && <button onClick={playAgain}>{TEXT.playAgain}</button>}
    </>
  );
}
