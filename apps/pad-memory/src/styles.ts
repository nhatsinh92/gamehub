// Injected into the shadow root by mountGame. `all: initial` stops inherited host styles.
export const GAME_CSS = `:host { all: initial; display: block; font-family: sans-serif; }
.game { box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 16px; background: #fff7e6; color: #222; border-radius: 12px; }
.score { font-size: 20px; font-weight: bold; }
.pads { width: 100%; max-width: 320px; aspect-ratio: 1; touch-action: none; cursor: pointer; }
.prize { font-size: 24px; font-weight: bold; text-align: center; padding: 8px; }
.status { font-size: 16px; text-align: center; }
button { font: inherit; padding: 8px 20px; border: 0; border-radius: 6px; background: #3a7bd5; color: #fff; cursor: pointer; }
`;
