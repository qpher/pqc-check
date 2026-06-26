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

  it("shows an honest no-match message (not a false quantum-safe guarantee) when no findings", async () => {
    const options = defaultOptions(path.join(FIXTURES, "clean-project"));
    const result = await scan(options);
    const output = formatConsole(result, options);
    expect(output).toContain("No known quantum-vulnerable patterns matched.");
    expect(output).toContain("Detection coverage varies by language");
    // Must NOT claim the code IS quantum-safe — that's a dangerous false-confidence message.
    // (The caveat line legitimately says "not a guarantee of quantum-safety", so we ban the
    //  specific old claim rather than the substring "quantum-safe".)
    expect(output).not.toContain("looks quantum-safe");
    expect(output).not.toContain("Your code looks quantum-safe");
  });

  it("includes file paths in output", async () => {
    const options = defaultOptions(path.join(FIXTURES, "python-project"));
    const result = await scan(options);
    const output = formatConsole(result, options);
    expect(output).toContain("auth.py");
  });

  // --- Conversion-footer invariants (ADR-0030 §1.5 + accuracy) ---

  it("footer names an open-source alternative (liboqs) — ADR-0030 §1.5", async () => {
    const options = defaultOptions(path.join(FIXTURES, "python-project"));
    const result = await scan(options);
    const output = formatConsole(result, options);
    expect(output).toContain("liboqs");
  });

  it("footer does not leak the 'enclave' brand promise into stdout (code findings)", async () => {
    const options = defaultOptions(path.join(FIXTURES, "python-project"));
    const result = await scan(options);
    const output = formatConsole(result, options);
    expect(output).not.toContain("enclave");
  });

  it("config-only findings get a server-config CTA, not the SDK CTA", async () => {
    const options = defaultOptions(path.join(FIXTURES, "config-files"));
    const result = await scan(options);
    const output = formatConsole(result, options);
    // A TLS cipher is fixed in server config — NOT by installing the SDK.
    expect(output).not.toContain("pip install qpher");
    // SUMMARY must not tell a config finding to "Migrate to ML-KEM-768".
    expect(output).not.toContain("ML-KEM-768");
    // It should route to cert/cipher guidance, name the alternative, and stay enclave-free.
    expect(output).toContain("server config");
    expect(output).toContain("liboqs");
    expect(output).not.toContain("enclave");
  });
});
