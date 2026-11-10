import type { PointerEvent as ReactPointerEvent, ReactElement } from "react";
import { useEffect, useRef } from "react";
import type { MoleState } from "./mole-logic.ts";

const COLS = 3;
const ROWS = 3;

/** Maps a point in 0..1 canvas space to a hole index, or null. */
export function holeAt(x: number, y: number): number | null {
  if (x < 0 || y < 0 || x >= 1 || y >= 1) return null;
  return Math.floor(y * ROWS) * COLS + Math.floor(x * COLS);
}

function draw(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: MoleState,
): void {
  ctx.fillStyle = "#6fbf73";
  ctx.fillRect(0, 0, width, height);
  const cw = width / COLS;
  const ch = height / ROWS;
  state.moles.forEach((until, i) => {
    const cx = (i % COLS) * cw + cw / 2;
    const cy = Math.floor(i / COLS) * ch + ch / 2 + 14;
    ctx.fillStyle = "#4a2c1a";
    ctx.beginPath();
    ctx.ellipse(cx, cy, cw * 0.38, ch * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    if (until === null) return;
    ctx.fillStyle = "#a0673c";
    ctx.beginPath();
    ctx.arc(cx, cy - 8, cw * 0.27, Math.PI, 0);
    ctx.lineTo(cx + cw * 0.27, cy);
    ctx.lineTo(cx - cw * 0.27, cy);
    ctx.fill();
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(cx - 11, cy - 22, 4, 0, Math.PI * 2);
    ctx.arc(cx + 11, cy - 22, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f4a6b8";
    ctx.beginPath();
    ctx.arc(cx, cy - 12, 6, 0, Math.PI * 2);
    ctx.fill();
  });
}

export interface MoleCanvasProps {
  width: number;
  height: number;
  state: MoleState;
  onPointerDown(e: ReactPointerEvent<HTMLCanvasElement>): void;
}

export function MoleCanvas(props: MoleCanvasProps): ReactElement {
  const { width, height, state, onPointerDown } = props;
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (ctx) draw(ctx, width, height, state);
  }, [width, height, state]);

  return (
    <canvas
      ref={ref}
      className="board"
      width={width}
      height={height}
      onPointerDown={onPointerDown}
    />
  );
}
