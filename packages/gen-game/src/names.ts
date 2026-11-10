export const TEMPLATE_NAME = "scratch-card-example";
export const TEMPLATE_GLOBAL = "ScratchCardExampleSDK";

export function isKebabCase(name: string): boolean {
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name);
}

export function toSdkGlobalName(name: string): string {
  const pascal = name
    .split("-")
    .filter((part) => part !== "")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return `${pascal}SDK`;
}
