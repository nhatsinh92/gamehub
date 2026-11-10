import { SIZE } from "./board.ts";
import type { Board } from "./board.ts";

const COLORS: Record<number, string> = {
  2: "#9be7c4",
  4: "#6fd6d2",
  8: "#5bb8e8",
  16: "#6a8cf0",
  32: "#8d72e8",
  64: "#b564d6",
  128: "#e060b0",
  256: "#f2698a",
  512: "#f58b5a",
  1024: "#f5b84f",
  2048: "#f3dc5c",
};

export function tileColor(value: number): string {
  return COLORS[value] ?? "#e8e4ff";
}

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  board: Board,
  size: number,
): void {
  const gap = 8;
  const cell = (size - gap * (SIZE + 1)) / SIZE;
  ctx.fillStyle = "#2b2a3a";
  ctx.fillRect(0, 0, size, size);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  board.forEach((v, i) => {
    const x = gap + (i % SIZE) * (cell + gap);
    const y = gap + Math.floor(i / SIZE) * (cell + gap);
    ctx.fillStyle = v === 0 ? "#3a3950" : tileColor(v);
    ctx.fillRect(x, y, cell, cell);
    if (v === 0) return;
    ctx.fillStyle = "#1d1c28";
    ctx.font = `bold ${v >= 1024 ? 22 : v >= 128 ? 26 : 32}px sans-serif`;
    ctx.fillText(String(v), x + cell / 2, y + cell / 2);
  });
}
