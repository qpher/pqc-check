import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { formatJson } from "../../src/reporters/json.js";
import { scan } from "../../src/scanner/index.js";
import type { ScanOptions } from "../../src/types.js";

const FIXTURES = path.resolve(__dirname, "..", "fixtures");
const PKG_VERSION = (
  JSON.parse(readFileSync(path.resolve(__dirname, "..", "..", "package.json"), "utf8")) as {
    version: string;
  }
).version;

function defaultOptions(target: string): ScanOptions {
  return {
    target,
    languages: [],
    format: "json",
    showLow: true,
    ignore: [],
    noSuggestions: false,
    quiet: false,
  };
}

describe("JSON reporter", () => {
  it("produces valid JSON", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "python-project")));
    const output = formatJson(result);
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it("includes scanner name and version", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "python-project")));
    const parsed = JSON.parse(formatJson(result));
    expect(parsed.scanner).toBe("pqc-check");
    expect(parsed.version).toBe(PKG_VERSION);
  });

  it("includes timestamp", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "python-project")));
    const parsed = JSON.parse(formatJson(result));
    expect(parsed.timestamp).toBeDefined();
    expect(new Date(parsed.timestamp).getTime()).not.toBeNaN();
  });

  it("includes summary with correct fields", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "python-project")));
    const parsed = JSON.parse(formatJson(result));
    expect(parsed.summary).toHaveProperty("total");
    expect(parsed.summary).toHaveProperty("high");
    expect(parsed.summary).toHaveProperty("medium");
    expect(parsed.summary).toHaveProperty("low");
    expect(parsed.summary).toHaveProperty("filesWithFindings");
  });

  it("includes all findings with correct structure", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "python-project")));
    const parsed = JSON.parse(formatJson(result));
    expect(parsed.findings.length).toBeGreaterThan(0);
    const finding = parsed.findings[0];
    expect(finding).toHaveProperty("id");
    expect(finding).toHaveProperty("name");
    expect(finding).toHaveProperty("risk");
    expect(finding).toHaveProperty("category");
    expect(finding).toHaveProperty("file");
    expect(finding).toHaveProperty("line");
    expect(finding).toHaveProperty("column");
    expect(finding).toHaveProperty("matchedText");
    expect(finding).toHaveProperty("lineContent");
    expect(finding).toHaveProperty("description");
    expect(finding).toHaveProperty("suggestion");
  });

  it("includes suggestions with alternatives", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "python-project")));
    const parsed = JSON.parse(formatJson(result));
    const finding = parsed.findings[0];
    expect(finding.suggestion).toHaveProperty("replacement");
    expect(finding.suggestion).toHaveProperty("alternatives");
    expect(Array.isArray(finding.suggestion.alternatives)).toBe(true);
  });

  it("includes durationMs", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "python-project")));
    const parsed = JSON.parse(formatJson(result));
    expect(typeof parsed.durationMs).toBe("number");
  });

  it("produces empty findings array for clean project", async () => {
    const opts = defaultOptions(path.join(FIXTURES, "clean-project"));
    opts.showLow = false;
    const result = await scan(opts);
    // Filter out LOW for this check
    const highMed = result.findings.HIGH.length + result.findings.MEDIUM.length;
    expect(highMed).toBe(0);
  });
});
