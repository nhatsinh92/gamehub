import { expect, test } from "vitest";
import { isKebabCase, toSdkGlobalName } from "./names.ts";

test("[004:FR-004] isKebabCase table", () => {
  const names = [
    "lucky-wheel",
    "quiz",
    "wheel-2",
    "a1-b2",
    "LuckyWheel",
    "lucky_wheel",
    "-lucky",
    "lucky-",
    "lucky--wheel",
    "1lucky",
    "",
    "lucky wheel",
  ];
  expect(names.map(isKebabCase)).toEqual([
    true,
    true,
    true,
    true,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ]);
});

test("[004:FR-009] toSdkGlobalName table", () => {
  const names = ["scratch-card-example", "lucky-wheel", "quiz", "wheel-2"];
  expect(names.map(toSdkGlobalName)).toEqual([
    "ScratchCardExampleSDK",
    "LuckyWheelSDK",
    "QuizSDK",
    "Wheel2SDK",
  ]);
});
