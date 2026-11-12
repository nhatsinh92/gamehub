// Tests only: stands in for scene.ts, which needs WebGL.
import type { SniperScene } from "./scene.ts";

export const FOV_WIDE = 62;
export const FOV_ZOOM = 14;

export function createScene(): SniperScene {
  return { resize() {}, render() {}, pick: () => null, dispose() {} };
}
