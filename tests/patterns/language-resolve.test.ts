import { describe, it, expect } from "vitest";
import {
  resolveLanguageTokens,
  getExtensionsForLanguages,
} from "../../src/patterns/index.js";

describe("resolveLanguageTokens (FC-P1)", () => {
  it("maps aliases to canonical, dedupes, drops empties, collects unknowns", () => {
    const { resolved, unknown } = resolveLanguageTokens([
      "Python",
      " ts ",
      "",
      "py",
      "bogus",
      "bogus",
    ]);
    expect(resolved).toEqual(["python", "javascript"]);
    expect(unknown).toEqual(["bogus"]);
  });

  it("accepts canonical names unchanged", () => {
    const { resolved, unknown } = resolveLanguageTokens(["python", "go", "config"]);
    expect(resolved).toEqual(["python", "go", "config"]);
    expect(unknown).toEqual([]);
  });

  it("maps config aliases (yaml/yml/toml/ini/conf → config)", () => {
    const { resolved, unknown } = resolveLanguageTokens(["yaml", "toml", "ini"]);
    expect(resolved).toEqual(["config"]);
    expect(unknown).toEqual([]);
  });

  it("flags unknown tokens (the fail-loud trigger)", () => {
    const { resolved, unknown } = resolveLanguageTokens(["typescript", "kotlin", "nope"]);
    expect(resolved).toEqual(["javascript", "java"]);
    expect(unknown).toEqual(["nope"]);
  });
});

describe("getExtensionsForLanguages is alias-aware (FC-P1 defense-in-depth)", () => {
  it("resolves an alias to the canonical language's extensions", () => {
    expect(getExtensionsForLanguages(["ts"])).toEqual([
      ".js",
      ".ts",
      ".mjs",
      ".cjs",
      ".jsx",
      ".tsx",
    ]);
  });

  it("returns [] for an unknown token (CLI fails loud before this is reached)", () => {
    expect(getExtensionsForLanguages(["bogus"])).toEqual([]);
  });
});
