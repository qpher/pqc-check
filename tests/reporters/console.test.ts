import { describe, it, expect } from "vitest";
import path from "node:path";
import { formatConsole } from "../../src/reporters/console.js";
import { scan } from "../../src/scanner/index.js";
import type { ScanOptions, ScanResult } from "../../src/types.js";

const FIXTURES = path.resolve(__dirname, "..", "fixtures");

function defaultOptions(target: string): ScanOptions {
  return {
    target,
    languages: [],
    format: "console",
    showLow: false,
    ignore: [],
    noSuggestions: false,
    quiet: false,
  };
}

describe("Console reporter", () => {
  it("contains HIGH RISK section when HIGH findings exist", async () => {
    const options = defaultOptions(path.join(FIXTURES, "python-project"));
    const result = await scan(options);
    const output = formatConsole(result, options);
    expect(output).toContain("HIGH RISK");
  });

  it("contains MEDIUM RISK section when MEDIUM findings exist", async () => {
    const options = defaultOptions(path.join(FIXTURES, "python-project"));
    const result = await scan(options);
    const output = formatConsole(result, options);
    expect(output).toContain("MEDIUM RISK");
  });

  it("contains SUMMARY section", async () => {
    const options = defaultOptions(path.join(FIXTURES, "python-project"));
    const result = await scan(options);
    const output = formatConsole(result, options);
    expect(output).toContain("SUMMARY");
  });

  it("shows banner by default", async () => {
    const options = defaultOptions(path.join(FIXTURES, "python-project"));
    const result = await scan(options);
    const output = formatConsole(result, options);
    expect(output).toContain("pqc-check");
    expect(output).toContain("Quantum Vulnerability Scanner");
  });

  it("hides banner with --quiet", async () => {
    const options = defaultOptions(path.join(FIXTURES, "python-project"));
    options.quiet = true;
    const result = await scan(options);
    const output = formatConsole(result, options);
    expect(output).not.toContain("Quantum Vulnerability Scanner");
  });

  it("shows Qpher suggestion by default", async () => {
    const options = defaultOptions(path.join(FIXTURES, "python-project"));
    const result = await scan(options);
    const output = formatConsole(result, options);
    expect(output).toContain("qpher");
  });

  it("hides Qpher suggestion with --no-suggestions", async () => {
    const options = defaultOptions(path.join(FIXTURES, "python-project"));
    options.noSuggestions = true;
    const result = await scan(options);
    const output = formatConsole(result, options);
    expect(output).not.toContain("pip install qpher");
  });

  it("hides LOW findings by default", async () => {
    const options = defaultOptions(path.join(FIXTURES, "python-project"));
    options.showLow = false;
    const result = await scan(options);
    const output = formatConsole(result, options);
    expect(output).not.toContain("LOW RISK");
  });

  it("shows LOW findings with --show-low", async () => {
    const options = defaultOptions(path.join(FIXTURES, "python-project"));
    options.showLow = true;
    const result = await scan(options);
    const output = formatConsole(result, options);
    expect(output).toContain("LOW RISK");
  });

  it("shows success message when no findings", async () => {
    const options = defaultOptions(path.join(FIXTURES, "clean-project"));
    const result = await scan(options);
    const output = formatConsole(result, options);
    expect(output).toContain("quantum-safe");
  });

  it("includes file paths in output", async () => {
    const options = defaultOptions(path.join(FIXTURES, "python-project"));
    const result = await scan(options);
    const output = formatConsole(result, options);
    expect(output).toContain("auth.py");
  });
});
