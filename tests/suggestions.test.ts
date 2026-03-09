import { describe, it, expect } from "vitest";
import { getSuggestion, getAllSuggestions } from "../src/suggestions/migration.js";
import type { PatternCategory } from "../src/types.js";

describe("Migration suggestions", () => {
  const categories: PatternCategory[] = [
    "RSA_KEY_GENERATION",
    "RSA_ENCRYPTION",
    "RSA_SIGNING",
    "ECDSA_EDDSA",
    "DH_KEY_EXCHANGE",
    "CONFIG_FILE",
    "HASH_FUNCTION",
  ];

  it("every category has a suggestion", () => {
    for (const category of categories) {
      const suggestion = getSuggestion(category);
      expect(suggestion).toBeDefined();
      expect(suggestion.category).toBe(category);
    }
  });

  it("every suggestion has a replacement", () => {
    for (const category of categories) {
      const suggestion = getSuggestion(category);
      expect(suggestion.replacement).toBeTruthy();
    }
  });

  it("every suggestion has an explanation", () => {
    for (const category of categories) {
      const suggestion = getSuggestion(category);
      expect(suggestion.explanation).toBeTruthy();
    }
  });

  it("RSA_KEY_GENERATION suggests ML-KEM-768 / Kyber768", () => {
    const suggestion = getSuggestion("RSA_KEY_GENERATION");
    expect(suggestion.replacement).toContain("ML-KEM-768");
    expect(suggestion.replacement).toContain("Kyber768");
  });

  it("RSA_ENCRYPTION suggests ML-KEM-768 / Kyber768", () => {
    const suggestion = getSuggestion("RSA_ENCRYPTION");
    expect(suggestion.replacement).toContain("ML-KEM-768");
  });

  it("RSA_SIGNING suggests ML-DSA-65 / Dilithium3", () => {
    const suggestion = getSuggestion("RSA_SIGNING");
    expect(suggestion.replacement).toContain("ML-DSA-65");
    expect(suggestion.replacement).toContain("Dilithium3");
  });

  it("ECDSA_EDDSA suggests ML-DSA-65 / Dilithium3", () => {
    const suggestion = getSuggestion("ECDSA_EDDSA");
    expect(suggestion.replacement).toContain("ML-DSA-65");
  });

  it("DH_KEY_EXCHANGE suggests ML-KEM-768 / Kyber768", () => {
    const suggestion = getSuggestion("DH_KEY_EXCHANGE");
    expect(suggestion.replacement).toContain("ML-KEM-768");
  });

  it("HASH_FUNCTION says no action needed", () => {
    const suggestion = getSuggestion("HASH_FUNCTION");
    expect(suggestion.replacement.toLowerCase()).toContain("no action");
    expect(suggestion.qpherHint).toBeNull();
    expect(suggestion.alternatives).toEqual([]);
  });

  it("Qpher is mentioned alongside alternatives (not alone)", () => {
    for (const category of categories) {
      const suggestion = getSuggestion(category);
      if (suggestion.qpherHint) {
        expect(suggestion.alternatives.length).toBeGreaterThan(0);
      }
    }
  });

  it("alternatives include liboqs for crypto categories", () => {
    const cryptoCategories: PatternCategory[] = [
      "RSA_KEY_GENERATION",
      "RSA_ENCRYPTION",
      "RSA_SIGNING",
      "ECDSA_EDDSA",
      "DH_KEY_EXCHANGE",
    ];
    for (const category of cryptoCategories) {
      const suggestion = getSuggestion(category);
      expect(suggestion.alternatives.some((a) => a.toLowerCase().includes("liboqs"))).toBe(true);
    }
  });

  it("getAllSuggestions returns all categories", () => {
    const all = getAllSuggestions();
    for (const category of categories) {
      expect(all[category]).toBeDefined();
    }
  });
});
