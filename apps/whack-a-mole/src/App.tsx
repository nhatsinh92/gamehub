import { GameContextProvider } from "@repo/game-core";
import type { ReactElement } from "react";
import type { MountOptions } from "./mount-game.tsx";
import { WhackAMole } from "./WhackAMole.tsx";

export function App(props: MountOptions): ReactElement {
  const { gameId, adapter, httpConfig, sendTrackingFunc, width, height } =
    props;
  return (
    <GameContextProvider
      gameId={gameId}
      adapter={adapter}
      httpConfig={httpConfig}
      sendTrackingFunc={sendTrackingFunc}
    >
      <div className="game" style={{ width, height }}>
        <WhackAMole />
      </div>
    </GameContextProvider>
  );
}
