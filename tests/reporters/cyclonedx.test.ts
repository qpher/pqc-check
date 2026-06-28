import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { formatCyclonedxCbom } from "../../src/reporters/cyclonedx.js";
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
    format: "cyclonedx-cbom",
    showLow: true,
    ignore: [],
    noSuggestions: false,
    quiet: false,
  };
}

async function cbom(target: string) {
  const result = await scan(defaultOptions(path.join(FIXTURES, target)));
  return JSON.parse(formatCyclonedxCbom(result));
}

describe("CycloneDX CBOM reporter (#261)", () => {
  it("produces valid JSON", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "python-project")));
    expect(() => JSON.parse(formatCyclonedxCbom(result))).not.toThrow();
  });

  it("has a CycloneDX 1.6 BOM header", async () => {
    const bom = await cbom("python-project");
    expect(bom.bomFormat).toBe("CycloneDX");
    expect(bom.specVersion).toBe("1.6");
    expect(bom.version).toBe(1);
    expect(bom.serialNumber).toMatch(/^urn:uuid:[0-9a-f-]{36}$/);
  });

  it("records pqc-check as the BOM tool", async () => {
    const bom = await cbom("python-project");
    const tool = bom.metadata.tools.components[0];
    expect(tool.name).toBe("pqc-check");
    expect(tool.version).toBe(PKG_VERSION);
  });

  it("emits one cryptographic-asset component per finding", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "python-project")));
    const bom = JSON.parse(formatCyclonedxCbom(result));
    expect(bom.components.length).toBe(result.totalFindings);
    expect(bom.components.length).toBeGreaterThan(0);
    for (const c of bom.components) {
      expect(c.type).toBe("cryptographic-asset");
      expect(c.cryptoProperties.assetType).toBe("algorithm");
      // every flagged algorithm is quantum-vulnerable
      expect(c.cryptoProperties.algorithmProperties.nistQuantumSecurityLevel).toBe(0);
      expect(c.cryptoProperties.algorithmProperties).toHaveProperty("primitive");
      expect(Array.isArray(c.cryptoProperties.algorithmProperties.cryptoFunctions)).toBe(true);
    }
  });

  it("attaches source-location evidence to each component", async () => {
    const bom = await cbom("python-project");
    const c = bom.components[0];
    expect(c.evidence.occurrences[0].location).toMatch(/.+:\d+:\d+$/);
    expect(c["bom-ref"]).toMatch(/^PQC-[A-Z]+-\d+:.+:\d+$/);
  });

  it("maps RSA key generation to the pke primitive with a key size", async () => {
    const bom = await cbom("python-project");
    const rsa = bom.components.find((c: { name: string }) => c.name.startsWith("RSA-"));
    expect(rsa).toBeDefined();
    expect(rsa.cryptoProperties.algorithmProperties.primitive).toBe("pke");
    // python fixture uses RSA-2048
    expect(rsa.cryptoProperties.algorithmProperties.parameterSetIdentifier).toBe("2048");
  });

  it("produces a valid empty BOM when there are no findings", () => {
    const emptyResult = {
      targetPath: "/tmp/empty",
      filesScanned: 3,
      totalFindings: 0,
      findings: { HIGH: [], MEDIUM: [], LOW: [] },
      summary: { high: 0, medium: 0, low: 0, filesWithFindings: 0 },
      durationMs: 1,
      version: PKG_VERSION,
    };
    const bom = JSON.parse(formatCyclonedxCbom(emptyResult));
    expect(bom.bomFormat).toBe("CycloneDX");
    expect(bom.specVersion).toBe("1.6");
    expect(bom.components).toEqual([]);
  });
});
