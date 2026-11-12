import type { PointerEvent as ReactPointerEvent, ReactElement, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { MAX_LIVES, fire } from "./game-logic.ts";
import { FOV_WIDE, FOV_ZOOM, createScene } from "./scene.ts";
import type { SniperScene } from "./scene.ts";
import { createShared, startLoop } from "./stage-loop.ts";
import type { Hud, Shared } from "./stage-loop.ts";

export const STAGE_TEXT = {
  noWebgl: "This device cannot run 3D graphics.",
  zoom: "Zoom",
} as const;

const SENSITIVITY = 0.003;
const TAP_PIXELS = 8;
const MAX_YAW = 0.9;
const MIN_PITCH = -0.2;
const MAX_PITCH = 0.6;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function isLocked(canvas: HTMLCanvasElement | null): boolean {
  const root = canvas?.getRootNode();
  const owner = root instanceof ShadowRoot ? root : document;
  return canvas !== null && owner.pointerLockElement === canvas;
}

function tryLock(canvas: HTMLCanvasElement | null): void {
  try {
    void Promise.resolve(canvas?.requestPointerLock()).catch(() => {});
  } catch {
    // pointer lock refused: dragging still aims
  }
}

function turn(shared: Shared, dx: number, dy: number): void {
  const k = SENSITIVITY * (shared.zoom ? FOV_ZOOM / FOV_WIDE : 1);
  shared.aim = {
    yaw: clamp(shared.aim.yaw - dx * k, -MAX_YAW, MAX_YAW),
    pitch: clamp(shared.aim.pitch - dy * k, MIN_PITCH, MAX_PITCH),
  };
}

type Handler = (e: ReactPointerEvent<HTMLCanvasElement>) => void;

/** Mouse (pointer lock or drag) and touch (drag to aim, tap to fire). */
function usePointer(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  sceneRef: RefObject<SniperScene | null>,
  shared: Shared,
): { onDown: Handler; onMove: Handler; onUp: () => void; onCancel: () => void } {
  const press = useRef<{ x: number; y: number; moved: number } | null>(null);
  const shoot = (): void => {
    const scene = sceneRef.current;
    if (scene) shared.game = fire(shared.game, scene.pick());
  };
  return {
    onDown(e) {
      press.current = { x: e.clientX, y: e.clientY, moved: 0 };
      if (e.pointerType === "mouse" && !isLocked(canvasRef.current)) tryLock(canvasRef.current);
      if (isLocked(canvasRef.current)) shoot();
    },
    onMove(e) {
      if (isLocked(canvasRef.current)) return turn(shared, e.movementX, e.movementY);
      const p = press.current;
      if (!p) return;
      turn(shared, e.clientX - p.x, e.clientY - p.y);
      p.moved += Math.abs(e.clientX - p.x) + Math.abs(e.clientY - p.y);
      p.x = e.clientX;
      p.y = e.clientY;
    },
    onUp() {
      const p = press.current;
      press.current = null;
      if (p && !isLocked(canvasRef.current) && p.moved < TAP_PIXELS) shoot();
    },
    onCancel() {
      press.current = null;
    },
  };
}

/** Hold the button to zoom. */
function zoomHandlers(shared: Shared): Record<string, () => void> {
  const set = (on: boolean) => () => {
    shared.zoom = on;
  };
  return {
    onPointerDown: set(true),
    onPointerUp: set(false),
    onPointerLeave: set(false),
    onPointerCancel: set(false),
  };
}

export function Stage(props: { onOver(score: number): void }): ReactElement {
  const { onOver } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SniperScene | null>(null);
  const shared = useRef<Shared>(createShared()).current;
  const [hud, setHud] = useState<Hud>({ score: 0, lives: MAX_LIVES, reload: 1, zoom: false });
  const [failed, setFailed] = useState(false);
  const pointer = usePointer(canvasRef, sceneRef, shared);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let scene: SniperScene;
    try {
      scene = createScene(canvas, canvas.clientWidth || 360, canvas.clientHeight || 480);
    } catch {
      setFailed(true);
      return;
    }
    sceneRef.current = scene;
    const stop = startLoop({ scene, shared, canvas, setHud, onOver });
    return () => {
      stop();
      scene.dispose();
      sceneRef.current = null;
    };
    // once, on mount
  }, []);

  if (failed) return <div className="status">{STAGE_TEXT.noWebgl}</div>;
  return (
    <div className="stage">
      <canvas
        ref={canvasRef}
        className="view"
        onPointerDown={pointer.onDown}
        onPointerMove={pointer.onMove}
        onPointerUp={pointer.onUp}
        onPointerCancel={pointer.onCancel}
      />
      {hud.zoom && <div className="scope" />}
      <div className="hud">
        <span className="score">{hud.score}</span>
        <span className="lives">{"♥".repeat(hud.lives)}</span>
      </div>
      <div className="reload" style={{ width: `${hud.reload * 100}%` }} />
      <button
        className="zoom"
        {...zoomHandlers(shared)}
      >
        {STAGE_TEXT.zoom}
      </button>
    </div>
  );
}
