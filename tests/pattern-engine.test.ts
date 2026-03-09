import { describe, it, expect } from "vitest";
import { matchPatterns } from "../src/scanner/pattern-engine.js";
import { pythonPatterns } from "../src/patterns/python.js";
import { javascriptPatterns } from "../src/patterns/javascript.js";
import type { Pattern } from "../src/types.js";

describe("pattern-engine", () => {
  it("finds matches in Python code", () => {
    const content = `from Crypto.PublicKey import RSA
key = RSA.generate(2048)
`;
    const findings = matchPatterns({
      content,
      filePath: "/test/auth.py",
      rootDir: "/test",
      patterns: pythonPatterns,
    });
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].pattern.id).toBe("PQC-PY-001");
    expect(findings[0].line).toBe(2);
    expect(findings[0].relativeFilePath).toBe("auth.py");
  });

  it("reports correct line numbers", () => {
    const content = `line 1
line 2
key = RSA.generate(2048)
line 4
`;
    const findings = matchPatterns({
      content,
      filePath: "/test/file.py",
      rootDir: "/test",
      patterns: pythonPatterns,
    });
    const rsaFinding = findings.find((f) => f.pattern.id === "PQC-PY-001");
    expect(rsaFinding).toBeDefined();
    expect(rsaFinding!.line).toBe(3);
  });

  it("reports correct column numbers", () => {
    const content = `    key = RSA.generate(2048)`;
    const findings = matchPatterns({
      content,
      filePath: "/test/file.py",
      rootDir: "/test",
      patterns: pythonPatterns,
    });
    expect(findings[0].column).toBeGreaterThan(1);
  });

  it("captures matched text", () => {
    const content = `key = RSA.generate(2048)`;
    const findings = matchPatterns({
      content,
      filePath: "/test/file.py",
      rootDir: "/test",
      patterns: pythonPatterns,
    });
    expect(findings[0].matchedText).toContain("RSA.generate");
  });

  it("captures full line content", () => {
    const content = `key = RSA.generate(2048)`;
    const findings = matchPatterns({
      content,
      filePath: "/test/file.py",
      rootDir: "/test",
      patterns: pythonPatterns,
    });
    expect(findings[0].lineContent).toBe("key = RSA.generate(2048)");
  });

  it("de-duplicates same category on same line", () => {
    const content = `ec.generate_private_key(ec.SECP256R1())`;
    const findings = matchPatterns({
      content,
      filePath: "/test/file.py",
      rootDir: "/test",
      patterns: pythonPatterns,
    });
    const ecdsaFindings = findings.filter((f) => f.pattern.category === "ECDSA_EDDSA");
    // Should de-dupe to 1 per line per category
    expect(ecdsaFindings.length).toBe(1);
  });

  it("returns empty array for no matches", () => {
    const content = `import os\nprint("hello")\n`;
    const findings = matchPatterns({
      content,
      filePath: "/test/safe.py",
      rootDir: "/test",
      patterns: pythonPatterns,
    });
    expect(findings).toEqual([]);
  });

  it("sorts by risk level (HIGH first)", () => {
    const content = `key = RSA.generate(2048)
ec_key = ec.generate_private_key(ec.SECP256R1())
h = hashlib.sha256(b"data")
`;
    const findings = matchPatterns({
      content,
      filePath: "/test/file.py",
      rootDir: "/test",
      patterns: pythonPatterns,
    });
    if (findings.length >= 2) {
      const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      for (let i = 1; i < findings.length; i++) {
        expect(riskOrder[findings[i].pattern.risk]).toBeGreaterThanOrEqual(
          riskOrder[findings[i - 1].pattern.risk],
        );
      }
    }
  });

  it("handles JavaScript patterns", () => {
    const content = `const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
});`;
    const findings = matchPatterns({
      content,
      filePath: "/test/app.js",
      rootDir: "/test",
      patterns: javascriptPatterns,
    });
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].pattern.id).toBe("PQC-JS-001");
  });

  it("computes relative file path correctly", () => {
    const content = `key = RSA.generate(2048)`;
    const findings = matchPatterns({
      content,
      filePath: "/project/src/auth.py",
      rootDir: "/project",
      patterns: pythonPatterns,
    });
    expect(findings[0].relativeFilePath).toBe("src/auth.py");
  });

  it("handles empty content", () => {
    const findings = matchPatterns({
      content: "",
      filePath: "/test/empty.py",
      rootDir: "/test",
      patterns: pythonPatterns,
    });
    expect(findings).toEqual([]);
  });

  it("handles content with only whitespace", () => {
    const findings = matchPatterns({
      content: "   \n  \n  ",
      filePath: "/test/blank.py",
      rootDir: "/test",
      patterns: pythonPatterns,
    });
    expect(findings).toEqual([]);
  });
});
