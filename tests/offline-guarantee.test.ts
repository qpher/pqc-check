import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Air-gapped guarantee (#262): pqc-check MUST make zero network calls in any
 * mode. The ruleset is compiled in; the scanner only reads the target tree from
 * local disk. This static guard fails CI if anyone introduces a network import
 * or API into the scanner source, so the offline promise can't silently
 * regress on a classified-network deployment.
 */
const SRC_DIR = join(import.meta.dirname, "..", "src");

/** Patterns that would indicate outbound network access. */
const FORBIDDEN = [
  /\bfrom\s+["']node:https?["']/,
  /\brequire\(\s*["']https?["']\s*\)/,
  /\bfrom\s+["'](axios|got|node-fetch|undici|superagent|request)["']/,
  /\bfetch\s*\(/,
  /\bnew\s+XMLHttpRequest\b/,
  /\bnavigator\b/,
  /\bWebSocket\b/,
  /\bdgram\b/,
];

function tsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...tsFiles(full));
    } else if (entry.endsWith(".ts")) {
      out.push(full);
    }
  }
  return out;
}

describe("offline guarantee (#262)", () => {
  const files = tsFiles(SRC_DIR);

  it("finds source files to scan (guard is not a silent no-op)", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it.each(files)("%s contains no network imports or calls", (file) => {
    const text = readFileSync(file, "utf8");
    for (const pattern of FORBIDDEN) {
      expect(
        pattern.test(text),
        `${file} matches forbidden network pattern ${pattern} — pqc-check must stay fully offline (#262)`,
      ).toBe(false);
    }
  });
});
