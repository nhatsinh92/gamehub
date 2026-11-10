import type { ReactElement, RefObject } from "react";
import { canvasBitmapSize } from "./game/canvas-size.ts";
import { CONFIG } from "./game/config.ts";

export function GameCanvas(props: {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  onPress: () => void;
}): ReactElement {
  const { width, height } = canvasBitmapSize(window.devicePixelRatio, CONFIG);
  return (
    <canvas
      ref={props.canvasRef}
      className="play"
      width={width}
      height={height}
      onPointerDown={(event) => {
        event.preventDefault();
        props.onPress();
      }}
    />
  );
}
