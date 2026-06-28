import { describe, it, expect } from "vitest";
import { ALL_PATTERNS } from "../src/patterns/index.js";
import { serializeRuleset, serializeRulesetJson, deserializeRuleset } from "../src/ruleset.js";

describe("ruleset export/import (air-gapped, #262)", () => {
  it("serializes the bundled ruleset with a stable schema header", () => {
    const doc = serializeRuleset();
    expect(doc.schema).toBe("pqc-check/ruleset");
    expect(doc.schemaVersion).toBe(1);
    expect(doc.patternCount).toBe(ALL_PATTERNS.length);
    expect(doc.patterns).toHaveLength(ALL_PATTERNS.length);
  });

  it("round-trips the bundled ruleset identically (export → import)", () => {
    const json = serializeRulesetJson();
    const restored = deserializeRuleset(json);

    expect(restored).toHaveLength(ALL_PATTERNS.length);
    for (let i = 0; i < ALL_PATTERNS.length; i++) {
      const orig = ALL_PATTERNS[i];
      const back = restored[i];
      expect(back.id).toBe(orig.id);
      expect(back.name).toBe(orig.name);
      expect(back.risk).toBe(orig.risk);
      expect(back.category).toBe(orig.category);
      expect(back.fileExtensions).toEqual(orig.fileExtensions);
      expect(back.description).toBe(orig.description);
      expect(back.suggestion).toBe(orig.suggestion);
      // RegExp reconstructed identically (source + flags)
      expect(back.regex.source).toBe(orig.regex.source);
      expect(back.regex.flags).toBe(orig.regex.flags);
    }
  });

  it("rejects non-JSON input", () => {
    expect(() => deserializeRuleset("not json")).toThrow(/not valid JSON/);
  });

  it("rejects a wrong schema marker", () => {
    const bad = JSON.stringify({ schema: "something-else", schemaVersion: 1, patterns: [] });
    expect(() => deserializeRuleset(bad)).toThrow(/schema must be/);
  });

  it("rejects an unsupported schemaVersion", () => {
    const bad = JSON.stringify({ schema: "pqc-check/ruleset", schemaVersion: 99, patterns: [] });
    expect(() => deserializeRuleset(bad)).toThrow(/unsupported ruleset schemaVersion/);
  });

  it("rejects a pattern with an invalid regex", () => {
    const bad = JSON.stringify({
      schema: "pqc-check/ruleset",
      schemaVersion: 1,
      patterns: [
        {
          id: "X-1",
          name: "n",
          regexSource: "(unterminated",
          regexFlags: "",
          risk: "HIGH",
          category: "RSA_KEY_GENERATION",
          fileExtensions: [".py"],
          description: "d",
          suggestion: "s",
        },
      ],
    });
    expect(() => deserializeRuleset(bad)).toThrow(/invalid regex/);
  });

  it("rejects duplicate pattern ids", () => {
    const one = {
      id: "DUP",
      name: "n",
      regexSource: "a",
      regexFlags: "",
      risk: "HIGH",
      category: "RSA_KEY_GENERATION",
      fileExtensions: [".py"],
      description: "d",
      suggestion: "s",
    };
    const bad = JSON.stringify({
      schema: "pqc-check/ruleset",
      schemaVersion: 1,
      patterns: [one, { ...one }],
    });
    expect(() => deserializeRuleset(bad)).toThrow(/duplicate id/);
  });
});
