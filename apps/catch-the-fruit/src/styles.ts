// Injected into the shadow root by mountGame. `all: initial` stops inherited host styles.
export const GAME_CSS = `:host { all: initial; display: block; font-family: sans-serif; }
.game { box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 16px; background: #fff7e6; color: #222; border-radius: 12px; }
.hud { width: 100%; display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; }
.card { position: relative; width: 100%; flex: 1; min-height: 0; background: #bde3ff; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.board { width: 100%; height: 100%; object-fit: contain; touch-action: none; }
.final { position: absolute; top: 10px; z-index: 1; font-size: 20px; font-weight: bold; }
.prize { position: absolute; top: 44px; z-index: 1; font-size: 20px; font-weight: bold; text-align: center; padding: 8px; }
.status { font-size: 16px; text-align: center; }
.card .status { position: absolute; top: 44px; z-index: 1; }
button { font: inherit; padding: 8px 20px; border: 0; border-radius: 6px; background: #3a7bd5; color: #fff; cursor: pointer; }
`;
