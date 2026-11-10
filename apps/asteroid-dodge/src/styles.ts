// Injected into the shadow root by mountGame. `all: initial` stops inherited host styles.
export const GAME_CSS = `:host { all: initial; display: block; font-family: sans-serif; }
.game { box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px; background: #0b1020; color: #fff; border-radius: 12px; max-width: 100%; }
.board { position: relative; height: 100%; max-width: 100%; aspect-ratio: 320 / 420; }
.play { display: block; width: 100%; height: 100%; touch-action: none; border-radius: 8px; background: #0b1020; }
.over { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; background: rgba(11, 16, 32, 0.82); border-radius: 8px; }
.prize { font-size: 24px; font-weight: bold; text-align: center; padding: 8px; }
.status { font-size: 16px; text-align: center; }
button { font: inherit; padding: 8px 20px; border: 0; border-radius: 6px; background: #3a7bd5; color: #fff; cursor: pointer; }
`;
