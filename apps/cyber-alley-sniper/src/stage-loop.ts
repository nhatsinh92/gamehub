// The frame loop and its page listeners. No React: Stage.tsx owns the view.
import { RELOAD_SECONDS, createGame, step, timeScale } from "./game-logic.ts";
import type { Game } from "./game-logic.ts";
import type { Aim, SniperScene } from "./scene.ts";

export interface Hud {
  score: number;
  lives: number;
  reload: number;
  zoom: boolean;
}

/** Mutable state shared by the loop and the input handlers. */
export interface Shared {
  game: Game;
  aim: Aim;
  zoom: boolean;
}

export function createShared(): Shared {
  return { game: createGame(), aim: { yaw: 0, pitch: 0.1 }, zoom: false };
}

function hudOf(shared: Shared): Hud {
  const { game } = shared;
  const reload = game.reload > 0 ? 1 - game.reload / RELOAD_SECONDS : 1;
  return { score: game.score, lives: game.lives, reload, zoom: shared.zoom };
}

function sameHud(a: Hud, b: Hud): boolean {
  return (
    a.score === b.score &&
    a.lives === b.lives &&
    a.zoom === b.zoom &&
    Math.abs(a.reload - b.reload) < 0.05
  );
}

export interface LoopOptions {
  scene: SniperScene;
  shared: Shared;
  canvas: HTMLCanvasElement;
  setHud(update: (h: Hud) => Hud): void;
  onOver(score: number): void;
}

/** Starts the loop; returns the cleanup. Pauses while the tab is hidden. */
export function startLoop(o: LoopOptions): () => void {
  const { scene, shared, canvas } = o;
  let frame = 0;
  let last: number | null = null;
  let reported = false;

  const loop = (now: number): void => {
    const real = last === null ? 0 : (now - last) / 1000;
    last = now;
    shared.game = step(shared.game, real, Math.random);
    const dt = Math.min(real, 0.1) * timeScale(shared.game);
    scene.render(shared.game, shared.aim, shared.zoom, dt);
    const next = hudOf(shared);
    o.setHud((h) => (sameHud(h, next) ? h : next));
    if (shared.game.over) {
      if (!reported) o.onOver(shared.game.score);
      reported = true;
      return;
    }
    frame = requestAnimationFrame(loop);
  };
  const start = (): void => {
    last = null;
    frame = requestAnimationFrame(loop);
  };
  const onVisibility = (): void => {
    if (document.hidden) cancelAnimationFrame(frame);
    else if (!shared.game.over) start();
  };
  const onResize = (): void => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w > 0 && h > 0) scene.resize(w, h);
  };
  const setKey = (on: boolean) => (e: KeyboardEvent) => {
    if (e.code === "KeyZ") shared.zoom = on;
  };
  const keyDown = setKey(true);
  const keyUp = setKey(false);
  const observer = typeof ResizeObserver === "function" ? new ResizeObserver(onResize) : null;
  observer?.observe(canvas);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  start();
  return () => {
    cancelAnimationFrame(frame);
    observer?.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("keydown", keyDown);
    window.removeEventListener("keyup", keyUp);
  };
}
