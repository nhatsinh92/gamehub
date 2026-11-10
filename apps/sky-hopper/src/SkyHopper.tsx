import type { ReactElement } from "react";

export function SkyHopper(props: { width: number; height: number }): ReactElement {
  return <div className="game" style={{ width: props.width, height: props.height }} />;
}
