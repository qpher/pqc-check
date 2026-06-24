import { readFileSync } from "node:fs";

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version: string };

/** Single source of truth for the CLI version, read from package.json. */
export const VERSION: string = pkg.version;
