// Injected into the shadow root by mountGame. `all: initial` stops inherited host styles.
export const GAME_CSS = `:host { all: initial; display: block; font-family: sans-serif; }
.game { box-sizing: border-box; max-width: 100%; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #05050c; color: #e8f6ff; border-radius: 12px; overflow: hidden; }
.play, .stage { position: relative; width: 100%; height: 100%; }
.view { display: block; width: 100%; height: 100%; touch-action: none; cursor: crosshair; }
.scope { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle at 50% 50%, transparent 0, transparent 38%, #000 40%); }
.scope::before, .scope::after { content: ""; position: absolute; background: #28e0ff; opacity: 0.8; }
.scope::before { left: 0; right: 0; top: 50%; height: 1px; }
.scope::after { top: 0; bottom: 0; left: 50%; width: 1px; }
.hud { position: absolute; top: 8px; left: 12px; right: 12px; display: flex; justify-content: space-between; font-weight: bold; font-size: 22px; text-shadow: 0 0 8px #ff2d95; pointer-events: none; }
.lives { color: #ff2d95; }
.reload { position: absolute; left: 0; bottom: 0; height: 4px; background: #28e0ff; pointer-events: none; }
.zoom { position: absolute; right: 12px; bottom: 16px; touch-action: none; }
.over { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; background: rgba(5, 5, 12, 0.8); }
.title { font-size: 28px; font-weight: bold; color: #ff2d95; }
.final { font-size: 48px; font-weight: bold; }
.prize { font-size: 24px; font-weight: bold; text-align: center; padding: 8px; }
.status { font-size: 16px; text-align: center; padding: 16px; }
button { font: inherit; padding: 8px 20px; border: 0; border-radius: 6px; background: #ff2d95; color: #fff; cursor: pointer; user-select: none; }
`;
