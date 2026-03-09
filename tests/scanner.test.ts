import { describe, it, expect } from "vitest";
import path from "node:path";
import { scan } from "../src/scanner/index.js";
import type { ScanOptions } from "../src/types.js";

const FIXTURES = path.resolve(__dirname, "fixtures");

function defaultOptions(target: string): ScanOptions {
  return {
    target,
    languages: [],
    format: "console",
    showLow: true,
    ignore: [],
    noSuggestions: false,
    quiet: false,
  };
}

describe("Scanner integration", () => {
  it("scans python-project and finds HIGH + MEDIUM + LOW findings", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "python-project")));
    expect(result.filesScanned).toBeGreaterThan(0);
    expect(result.summary.high).toBeGreaterThan(0);
    expect(result.summary.medium).toBeGreaterThan(0);
    expect(result.summary.low).toBeGreaterThan(0);
    expect(result.totalFindings).toBe(
      result.summary.high + result.summary.medium + result.summary.low,
    );
  });

  it("scans node-project and finds findings", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "node-project")));
    expect(result.filesScanned).toBeGreaterThan(0);
    expect(result.summary.high).toBeGreaterThan(0);
    expect(result.totalFindings).toBeGreaterThan(0);
  });

  it("scans go-project and finds findings", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "go-project")));
    expect(result.filesScanned).toBeGreaterThan(0);
    expect(result.summary.high).toBeGreaterThan(0);
    expect(result.summary.medium).toBeGreaterThan(0);
  });

  it("scans java-project and finds findings", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "java-project")));
    expect(result.filesScanned).toBeGreaterThan(0);
    expect(result.summary.high).toBeGreaterThan(0);
  });

  it("scans clean-project and finds only LOW findings", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "clean-project")));
    expect(result.filesScanned).toBeGreaterThan(0);
    expect(result.summary.high).toBe(0);
    expect(result.summary.medium).toBe(0);
    // Only LOW (sha-256) or zero
    expect(result.summary.low).toBeGreaterThanOrEqual(0);
  });

  it("scans config-files and finds config patterns", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "config-files")));
    expect(result.filesScanned).toBeGreaterThan(0);
    expect(result.totalFindings).toBeGreaterThan(0);
    const hasConfigFinding = [
      ...result.findings.HIGH,
      ...result.findings.MEDIUM,
      ...result.findings.LOW,
    ].some((f) => f.pattern.category === "CONFIG_FILE");
    expect(hasConfigFinding).toBe(true);
  });

  it("scans mixed-project and detects all languages", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "mixed-project")));
    expect(result.filesScanned).toBeGreaterThanOrEqual(3);
    const allFindings = [
      ...result.findings.HIGH,
      ...result.findings.MEDIUM,
      ...result.findings.LOW,
    ];
    const extensions = new Set(allFindings.map((f) => path.extname(f.relativeFilePath)));
    expect(extensions.has(".py")).toBe(true);
    expect(extensions.has(".js")).toBe(true);
    expect(extensions.has(".go")).toBe(true);
  });

  it("respects --lang filter for python only", async () => {
    const opts = defaultOptions(path.join(FIXTURES, "mixed-project"));
    opts.languages = ["python"];
    const result = await scan(opts);
    const allFindings = [
      ...result.findings.HIGH,
      ...result.findings.MEDIUM,
      ...result.findings.LOW,
    ];
    expect(allFindings.every((f) => f.relativeFilePath.endsWith(".py"))).toBe(true);
  });

  it("reports version string", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "clean-project")));
    expect(result.version).toBe("1.0.0");
  });

  it("reports duration", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "clean-project")));
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("reports filesWithFindings correctly", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "python-project")));
    expect(result.summary.filesWithFindings).toBeGreaterThan(0);
    expect(result.summary.filesWithFindings).toBeLessThanOrEqual(result.filesScanned);
  });

  it("throws on non-existent path", async () => {
    await expect(
      scan(defaultOptions(path.join(FIXTURES, "non-existent-project"))),
    ).rejects.toThrow();
  });

  it("throws on file path (not directory)", async () => {
    await expect(
      scan(defaultOptions(path.join(FIXTURES, "python-project/auth.py"))),
    ).rejects.toThrow("not a directory");
  });
});
