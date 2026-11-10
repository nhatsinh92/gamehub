// Injected into the shadow root by mountGame. `all: initial` stops inherited host styles.
export const GAME_CSS = `:host { all: initial; display: block; font-family: sans-serif; }
.game { box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 16px; background: #fff7e6; color: #222; border-radius: 12px; }
.score { font-size: 28px; font-weight: bold; }
.board { max-width: 100%; max-height: 70%; aspect-ratio: 320 / 400; touch-action: none; border-radius: 8px; }
.prize { font-size: 24px; font-weight: bold; text-align: center; padding: 8px; }
.status { font-size: 16px; text-align: center; }
button { font: inherit; padding: 8px 20px; border: 0; border-radius: 6px; background: #3a7bd5; color: #fff; cursor: pointer; }
`;
