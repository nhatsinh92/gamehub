import { createContext, createElement, useContext } from "react";
import type { ReactElement } from "react";
import type { GameContextProviderProps, GameContextValue } from "./types.ts";

export const GameContext = createContext<GameContextValue | undefined>(
  undefined,
);

export function GameContextProvider(
  props: GameContextProviderProps,
): ReactElement {
  const value: GameContextValue = {
    config: null,
    currentUser: null,
    result: null,
    isLoading: false,
    error: null,
    initGame: () => Promise.resolve(null),
    getCurrentUser: () => Promise.resolve(null),
    submitResult: () => Promise.resolve(null),
    resetResult: () => {
      throw new Error("not implemented");
    },
    sendTracking: () => {
      throw new Error("not implemented");
    },
  };
  return createElement(GameContext.Provider, { value }, props.children);
}

export function useGameContext(): GameContextValue {
  return useContext(GameContext) as GameContextValue;
}
