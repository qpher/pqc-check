import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { formatSarif } from "../../src/reporters/sarif.js";
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
    format: "sarif",
    showLow: true,
    ignore: [],
    noSuggestions: false,
    quiet: false,
  };
}

describe("SARIF reporter", () => {
  it("produces valid JSON", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "python-project")));
    const output = formatSarif(result);
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it("has correct SARIF schema version", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "python-project")));
    const sarif = JSON.parse(formatSarif(result));
    expect(sarif.version).toBe("2.1.0");
    expect(sarif.$schema).toContain("sarif-schema-2.1.0");
  });

  it("includes tool driver info", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "python-project")));
    const sarif = JSON.parse(formatSarif(result));
    const driver = sarif.runs[0].tool.driver;
    expect(driver.name).toBe("pqc-check");
    expect(driver.version).toBe(PKG_VERSION);
    expect(driver.informationUri).toContain("pqc-check");
  });

  it("includes rules mapped from patterns", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "python-project")));
    const sarif = JSON.parse(formatSarif(result));
    const rules = sarif.runs[0].tool.driver.rules;
    expect(rules.length).toBeGreaterThan(0);
    const rule = rules[0];
    expect(rule).toHaveProperty("id");
    expect(rule).toHaveProperty("name");
    expect(rule).toHaveProperty("shortDescription");
    expect(rule).toHaveProperty("fullDescription");
    expect(rule).toHaveProperty("helpUri");
    expect(rule).toHaveProperty("defaultConfiguration");
  });

  it("maps HIGH risk to error level", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "python-project")));
    const sarif = JSON.parse(formatSarif(result));
    const highResults = sarif.runs[0].results.filter(
      (r: { level: string }) => r.level === "error",
    );
    expect(highResults.length).toBeGreaterThan(0);
  });

  it("maps MEDIUM risk to warning level", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "python-project")));
    const sarif = JSON.parse(formatSarif(result));
    const medResults = sarif.runs[0].results.filter(
      (r: { level: string }) => r.level === "warning",
    );
    expect(medResults.length).toBeGreaterThan(0);
  });

  it("includes correct location information", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "python-project")));
    const sarif = JSON.parse(formatSarif(result));
    const firstResult = sarif.runs[0].results[0];
    const location = firstResult.locations[0].physicalLocation;
    expect(location.artifactLocation.uri).toBeDefined();
    expect(location.region.startLine).toBeGreaterThan(0);
    expect(location.region.startColumn).toBeGreaterThan(0);
    expect(location.region.snippet.text).toBeDefined();
  });

  it("includes ruleId and ruleIndex in results", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "python-project")));
    const sarif = JSON.parse(formatSarif(result));
    const firstResult = sarif.runs[0].results[0];
    expect(firstResult.ruleId).toBeDefined();
    expect(typeof firstResult.ruleIndex).toBe("number");
  });

  it("helpUri points to qpher docs", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "python-project")));
    const sarif = JSON.parse(formatSarif(result));
    const rules = sarif.runs[0].tool.driver.rules;
    for (const rule of rules) {
      expect(rule.helpUri).toContain("docs.qpher.ai/guides/migration-guide");
    }
  });
});
