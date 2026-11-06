/** Test helper: builds a minimal spec in the template's shape. */
export function makeSpec(opts: {
  version?: string | null;
  fr?: Record<string, string>;
  sc?: Record<string, string>;
  extra?: string;
}): string {
  const version = opts.version === undefined ? "1.0.0" : opts.version;
  const bullets = (r: Record<string, string> = {}) =>
    Object.entries(r).map(([id, text]) => `- **${id}**: ${text}`);
  const lines = [
    "# Feature Specification: Sample",
    "",
    ...(version === null ? [] : [`**Version**: ${version}`, ""]),
    "### Functional Requirements",
    "",
    ...bullets(opts.fr),
    "",
    "### Measurable Outcomes",
    "",
    ...bullets(opts.sc),
    ...(opts.extra === undefined ? [] : ["", opts.extra]),
  ];
  return lines.join("\n") + "\n";
}
