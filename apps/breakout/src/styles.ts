// Injected into the shadow root by mountGame. `all: initial` stops inherited host styles.
export const GAME_CSS = `:host { all: initial; display: block; font-family: sans-serif; }
.game { box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 12px; background: #11131f; color: #f2f2f2; border-radius: 12px; }
.score { font-size: 28px; font-weight: bold; }
.board { position: relative; width: 100%; max-height: 100%; aspect-ratio: 4 / 5; display: flex; align-items: center; justify-content: center; }
.play { width: 100%; height: 100%; max-width: 100%; max-height: 100%; touch-action: none; border-radius: 8px; }
.hint { position: absolute; bottom: 64px; left: 0; right: 0; text-align: center; font-size: 14px; pointer-events: none; }
.over { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; background: rgba(17, 19, 31, 0.85); border-radius: 8px; }
.final-score { font-size: 24px; font-weight: bold; }
.prize { font-size: 20px; font-weight: bold; text-align: center; padding: 4px; }
.status { font-size: 16px; text-align: center; }
button { font: inherit; padding: 8px 20px; border: 0; border-radius: 6px; background: #3a7bd5; color: #fff; cursor: pointer; }
`;
