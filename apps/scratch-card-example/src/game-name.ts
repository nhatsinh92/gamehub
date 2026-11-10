import pkg from "../package.json" with { type: "json" };

/** "scratch-card-example" -> "ScratchCardExampleSDK" */
export function toSdkGlobalName(name: string): string {
  const parts = name
    .split("-")
    .filter((p) => p !== "")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1));
  return `${parts.join("")}SDK`;
}

// the single name source is the "name" field of package.json
export const PACKAGE_NAME: string = pkg.name;
export const GAME_ID: string = PACKAGE_NAME;
export const SDK_GLOBAL_NAME: string = toSdkGlobalName(PACKAGE_NAME);
