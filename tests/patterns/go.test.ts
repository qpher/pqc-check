import { describe, it, expect } from "vitest";
import { goPatterns } from "../../src/patterns/go.js";

function findPattern(id: string) {
  return goPatterns.find((p) => p.id === id)!;
}

describe("Go patterns", () => {
  describe("PQC-GO-001: RSA Key Generation", () => {
    const pattern = findPattern("PQC-GO-001");

    it("matches rsa.GenerateKey()", () => {
      expect(pattern.regex.test("rsaKey, _ := rsa.GenerateKey(rand.Reader, 2048)")).toBe(true);
    });

    it("matches rsa.GenerateMultiPrimeKey()", () => {
      expect(pattern.regex.test("rsa.GenerateMultiPrimeKey(rand.Reader, 3, 2048)")).toBe(true);
    });

    it("has HIGH risk", () => {
      expect(pattern.risk).toBe("HIGH");
    });

    it("applies to .go files", () => {
      expect(pattern.fileExtensions).toContain(".go");
    });
  });

  describe("PQC-GO-002: RSA Encryption", () => {
    const pattern = findPattern("PQC-GO-002");

    it("matches rsa.EncryptOAEP()", () => {
      expect(pattern.regex.test("rsa.EncryptOAEP(sha256, rand.Reader, pub, msg, nil)")).toBe(
        true,
      );
    });

    it("matches rsa.EncryptPKCS1v15()", () => {
      expect(pattern.regex.test("rsa.EncryptPKCS1v15(rand.Reader, pub, msg)")).toBe(true);
    });

    it("has HIGH risk", () => {
      expect(pattern.risk).toBe("HIGH");
    });
  });

  describe("PQC-GO-003: RSA Signing", () => {
    const pattern = findPattern("PQC-GO-003");

    it("matches rsa.SignPKCS1v15()", () => {
      expect(pattern.regex.test("rsa.SignPKCS1v15(rand.Reader, priv, hash, digest)")).toBe(true);
    });

    it("matches rsa.SignPSS()", () => {
      expect(pattern.regex.test("rsa.SignPSS(rand.Reader, priv, hash, digest, opts)")).toBe(true);
    });

    it("has MEDIUM risk", () => {
      expect(pattern.risk).toBe("MEDIUM");
    });
  });

  describe("PQC-GO-004: ECDSA Signing", () => {
    const pattern = findPattern("PQC-GO-004");

    it("matches ecdsa.GenerateKey()", () => {
      expect(pattern.regex.test("ecdsa.GenerateKey(elliptic.P256(), rand.Reader)")).toBe(true);
    });

    it("matches elliptic.P256()", () => {
      expect(pattern.regex.test("curve := elliptic.P256()")).toBe(true);
    });

    it("has MEDIUM risk", () => {
      expect(pattern.risk).toBe("MEDIUM");
    });
  });

  describe("PQC-GO-005: Ed25519", () => {
    const pattern = findPattern("PQC-GO-005");

    it("matches ed25519.GenerateKey()", () => {
      expect(pattern.regex.test("ed25519.GenerateKey(rand.Reader)")).toBe(true);
    });

    it("has MEDIUM risk", () => {
      expect(pattern.risk).toBe("MEDIUM");
    });
  });

  describe("PQC-GO-006: X25519 / ECDH", () => {
    const pattern = findPattern("PQC-GO-006");

    it("matches ecdh.X25519()", () => {
      expect(pattern.regex.test("ecdh.X25519().GenerateKey(rand.Reader)")).toBe(true);
    });

    it("matches ecdh.P256()", () => {
      expect(pattern.regex.test("ecdh.P256().GenerateKey(rand.Reader)")).toBe(true);
    });

    it("has HIGH risk", () => {
      expect(pattern.risk).toBe("HIGH");
    });
  });
});
