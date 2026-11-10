export const GRID_SIZE = 20;
export const BRUSH_RADIUS = 0.08;
export const REVEAL_THRESHOLD = 0.5;

export type ScratchGrid = {
  readonly size: number;
  readonly cells: readonly boolean[];
};

export function createScratchGrid(size: number = GRID_SIZE): ScratchGrid {
  void size;
  return { size: 0, cells: [] };
}

export function scratchAt(
  grid: ScratchGrid,
  x: number,
  y: number,
  radius: number = BRUSH_RADIUS,
): ScratchGrid {
  void x;
  void y;
  void radius;
  return grid;
}

export function scratchProgress(grid: ScratchGrid): number {
  void grid;
  return 0;
}
