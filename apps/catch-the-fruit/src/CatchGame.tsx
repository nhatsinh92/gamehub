import { useGameContext } from "@repo/game-core";
import type { GameResult } from "@repo/game-core";
import type { PointerEvent as ReactPointerEvent, ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import {
  BASKET_BOTTOM,
  BASKET_HEIGHT,
  BASKET_SPEED,
  BASKET_WIDTH,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  FRUIT_COLORS,
  OBJECT_RADIUS,
  START_LIVES,
  clampBasket,
  initialState,
  step,
} from "./catch-logic.ts";
import type { CatchState } from "./catch-logic.ts";

export const TEXT = {
  loading: "Loading…",
  loadError: "Could not load the game. Please try again later.",
  submitError: "Something went wrong. Please try again.",
  playAgain: "Play again",
} as const;

const MAX_DT = 0.05;

function draw(ctx: CanvasRenderingContext2D, s: CatchState): void {
  ctx.fillStyle = "#bde3ff";
  ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
  for (const o of s.objects) {
    ctx.beginPath();
    ctx.arc(o.x, o.y, OBJECT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle =
      o.kind === "bomb" ? "#263238" : (FRUIT_COLORS[o.color] ?? "#e53935");
    ctx.fill();
    if (o.kind === "bomb") {
      ctx.strokeStyle = "#8d6e63";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(o.x, o.y - OBJECT_RADIUS);
      ctx.lineTo(o.x + 6, o.y - OBJECT_RADIUS - 8);
      ctx.stroke();
    }
  }
  const top = BOARD_HEIGHT - BASKET_BOTTOM - BASKET_HEIGHT;
  const half = BASKET_WIDTH / 2;
  ctx.fillStyle = "#8d5524";
  ctx.beginPath();
  ctx.moveTo(s.basketX - half, top);
  ctx.lineTo(s.basketX + half, top);
  ctx.lineTo(s.basketX + half - 10, top + BASKET_HEIGHT);
  ctx.lineTo(s.basketX - half + 10, top + BASKET_HEIGHT);
  ctx.closePath();
  ctx.fill();
}

function Outcome(props: { result: GameResult | null }): ReactElement {
  const { result } = props;
  if (!result) return <div className="status">{TEXT.submitError}</div>;
  if (result.status === "SUCCESS" && result.isWin && result.reward) {
    return <div className="prize">{result.reward.name}</div>;
  }
  return <div className="status">{result.message}</div>;
}

function useKeys(): { current: { left: boolean; right: boolean } } {
  const keys = useRef({ left: false, right: false });
  useEffect(() => {
    const setKey = (e: KeyboardEvent, down: boolean): void => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") keys.current.left = down;
      if (k === "arrowright" || k === "d") keys.current.right = down;
    };
    const onDown = (e: KeyboardEvent): void => setKey(e, true);
    const onUp = (e: KeyboardEvent): void => setKey(e, false);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);
  return keys;
}

function Board(props: {
  onChange(s: CatchState): void;
  onOver(score: number): void;
}): ReactElement {
  const { onChange, onOver } = props;
  const ref = useRef<HTMLCanvasElement>(null);
  const keys = useKeys();
  const dragging = useRef(false);
  const stateRef = useRef<CatchState>(initialState());

  useEffect(() => {
    let raf = 0;
    let last: number | null = null;
    const frame = (now: number): void => {
      const dt = last === null ? 0 : Math.min(MAX_DT, (now - last) / 1000);
      last = now;
      let s = stateRef.current;
      const dir = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0);
      s = { ...s, basketX: clampBasket(s.basketX + dir * BASKET_SPEED * dt) };
      s = step(s, dt, Math.random);
      stateRef.current = s;
      const ctx = ref.current?.getContext("2d");
      if (ctx) draw(ctx, s);
      onChange(s);
      if (s.over) onOver(s.score);
      else raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // once per mounted round
  }, []);

  const dragTo = (e: ReactPointerEvent<HTMLCanvasElement>): void => {
    const canvas = ref.current;
    if (!canvas || !dragging.current) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0) return;
    const x = ((e.clientX - rect.left) / rect.width) * BOARD_WIDTH;
    stateRef.current = { ...stateRef.current, basketX: clampBasket(x) };
  };

  return (
    <canvas
      ref={ref}
      className="board"
      width={BOARD_WIDTH}
      height={BOARD_HEIGHT}
      onPointerDown={(e) => {
        dragging.current = true;
        dragTo(e);
      }}
      onPointerMove={dragTo}
      onPointerUp={() => (dragging.current = false)}
      onPointerLeave={() => (dragging.current = false)}
    />
  );
}

function useRound() {
  const ctx = useGameContext();
  const { sendTracking, submitResult, resetResult } = ctx;
  const [round, setRound] = useState(0);
  const [over, setOver] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hud, setHud] = useState({ score: 0, lives: START_LIVES });
  const submitted = useRef(false);

  const onChange = (s: CatchState): void => {
    setHud((h) =>
      h.score === s.score && h.lives === s.lives
        ? h
        : { score: s.score, lives: s.lives },
    );
  };

  const onOver = (score: number): void => {
    if (submitted.current) return;
    submitted.current = true;
    setOver(true);
    sendTracking({ name: "game_over", params: { score } });
    void submitResult(score).then((result) => {
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
    submitted.current = false;
    setOver(false);
    setFailed(false);
    setHud({ score: 0, lives: START_LIVES });
    setRound((n) => n + 1);
  };

  return { ctx, round, over, failed, hud, onChange, onOver, playAgain };
}

export function CatchGame(): ReactElement {
  const { ctx, round, over, failed, hud, onChange, onOver, playAgain } =
    useRound();
  const { initGame, sendTracking } = ctx;
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    sendTracking({ name: "game_open" });
    void initGame().then((config) => setLoadFailed(config === null));
    // once, on mount
  }, []);

  if (loadFailed) return <div className="status">{TEXT.loadError}</div>;
  if (!ctx.config) return <div className="status">{TEXT.loading}</div>;
  const done = over && (ctx.result !== null || failed);
  return (
    <>
      <div className="hud">
        <span>Score: {hud.score}</span>
        <span>Lives: {hud.lives}</span>
      </div>
      <div className="card">
        {over && <div className="final">Game over. Score: {hud.score}</div>}
        {done && <Outcome result={ctx.result} />}
        <Board key={round} onChange={onChange} onOver={onOver} />
      </div>
      {done && <button onClick={playAgain}>{TEXT.playAgain}</button>}
    </>
  );
}
