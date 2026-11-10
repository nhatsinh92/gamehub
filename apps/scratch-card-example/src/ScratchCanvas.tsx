import type { ReactElement } from "react";
import type { ScratchGrid } from "./scratch-progress.ts";

export interface ScratchCanvasProps {
  width: number;
  height: number;
  disabled: boolean;
  onScratch(grid: ScratchGrid): void;
}

export function ScratchCanvas(props: ScratchCanvasProps): ReactElement | null {
  void props;
  return null;
}
