import { useGameContext } from "@repo/game-core";
import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { BOARD_W, launch, newGame, setPaddle, step } from "./game-logic.ts";
import type { Breakout as GameState } from "./game-logic.ts";
import { draw } from "./draw.ts";

const LEFT_KEYS = ["ArrowLeft", "KeyA"];
const RIGHT_KEYS = ["ArrowRight", "KeyD"];

interface Held {
  left: boolean;
  right: boolean;
}

function useKeys(active: boolean, held: RefObject<Held>, start: () => void): void {
  useEffect(() => {
    if (!active) return;
    const onKey = (down: boolean) => (e: KeyboardEvent): void => {
      const left = LEFT_KEYS.includes(e.code);
      const right = RIGHT_KEYS.includes(e.code);
      if (!left && !right) return;
      e.preventDefault();
      if (left) held.current.left = down;
      if (right) held.current.right = down;
      if (down) start();
    };
    const keyDown = onKey(true);
    const keyUp = onKey(false);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      held.current.left = false;
      held.current.right = false;
    };
  }, [active]);
}

function useLoop(
  active: boolean,
  round: number,
  game: RefObject<GameState>,
  held: RefObject<Held>,
  canvas: RefObject<HTMLCanvasElement | null>,
  on: { score(n: number): void; over(score: number): void },
): void {
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    let last: number | null = null;
    const tick = (now: number): void => {
      const s = game.current;
      const dt = last === null ? 0 : (now - last) / 1000;
      last = now;
      const before = s.score;
      step(s, dt, (held.current.right ? 1 : 0) - (held.current.left ? 1 : 0));
      if (s.score !== before) on.score(s.score);
      const g = canvas.current?.getContext("2d");
      if (g) draw(g, s);
      if (s.over) on.over(s.score);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, round]);
}

export function useGame(ready: boolean, canvas: RefObject<HTMLCanvasElement | null>) {
  const { sendTracking, submitResult, resetResult } = useGameContext();
  const game = useRef<GameState>(newGame());
  const held = useRef<Held>({ left: false, right: false });
  const [score, setScore] = useState(0);
  const [launched, setLaunched] = useState(false);
  const [over, setOver] = useState(false);
  const [failed, setFailed] = useState(false);
  const [round, setRound] = useState(0);

  const start = (): void => {
    if (game.current.launched) return;
    launch(game.current);
    setLaunched(true);
  };
  const onOver = (final: number): void => {
    setOver(true);
    sendTracking({ name: "game_over", params: { score: final } });
    void submitResult(final).then((result) => {
      if (!result) return setFailed(true);
      sendTracking({
        name: "game_result",
        params: { status: result.status, isWin: result.isWin },
      });
    });
  };
  const active = ready && !over;
  useKeys(active, held, start);
  useLoop(active, round, game, held, canvas, { score: setScore, over: onOver });

  const dragTo = (clientX: number, rect: DOMRect): void => {
    if (rect.width > 0) {
      setPaddle(game.current, ((clientX - rect.left) / rect.width) * BOARD_W);
    }
  };
  const playAgain = (): void => {
    resetResult();
    game.current = newGame();
    setScore(0);
    setLaunched(false);
    setFailed(false);
    setOver(false);
    setRound((n) => n + 1);
  };
  return { score, launched, over, failed, start, dragTo, playAgain };
}
