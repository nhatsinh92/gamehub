import type { PointerEvent as ReactPointerEvent, ReactElement } from "react";
import { useEffect, useRef } from "react";
import { createScratchGrid, scratchAt } from "./scratch-progress.ts";
import type { ScratchGrid } from "./scratch-progress.ts";

export interface ScratchCanvasProps {
  width: number;
  height: number;
  disabled: boolean;
  onScratch(grid: ScratchGrid): void;
}

const BRUSH_PX = 28;

function erase(canvas: HTMLCanvasElement, px: number, py: number): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(px, py, BRUSH_PX, 0, Math.PI * 2);
  ctx.fill();
}

export function ScratchCanvas(props: ScratchCanvasProps): ReactElement {
  const { width, height, disabled, onScratch } = props;
  const ref = useRef<HTMLCanvasElement>(null);
  const grid = useRef<ScratchGrid>(createScratchGrid());
  const pressed = useRef(false);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#9e9e9e";
    ctx.fillRect(0, 0, width, height);
  }, [width, height]);

  const scratchPoint = (e: ReactPointerEvent<HTMLCanvasElement>): void => {
    const canvas = ref.current;
    if (!canvas || disabled || !pressed.current) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    erase(canvas, x * width, y * height);
    grid.current = scratchAt(grid.current, x, y);
    onScratch(grid.current);
  };

  return (
    <canvas
      ref={ref}
      className="cover"
      width={width}
      height={height}
      onPointerDown={(e) => {
        pressed.current = true;
        scratchPoint(e);
      }}
      onPointerMove={scratchPoint}
      onPointerUp={() => {
        pressed.current = false;
      }}
      onPointerLeave={() => {
        pressed.current = false;
      }}
    />
  );
}
