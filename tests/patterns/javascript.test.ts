import { describe, it, expect } from "vitest";
import { javascriptPatterns } from "../../src/patterns/javascript.js";

function findPattern(id: string) {
  return javascriptPatterns.find((p) => p.id === id)!;
}

describe("JavaScript patterns", () => {
  describe("PQC-JS-001: RSA Key Generation", () => {
    const pattern = findPattern("PQC-JS-001");

    it("matches generateKeyPairSync('rsa')", () => {
      expect(pattern.regex.test('crypto.generateKeyPairSync("rsa", {')).toBe(true);
    });

    it("matches generateKeyPair('rsa')", () => {
      expect(pattern.regex.test("crypto.generateKeyPair('rsa', {")).toBe(true);
    });

    it("does not match generateKeyPair('ed25519')", () => {
      expect(pattern.regex.test("crypto.generateKeyPair('ed25519')")).toBe(false);
    });

    it("has HIGH risk", () => {
      expect(pattern.risk).toBe("HIGH");
    });

    it("applies to JS/TS files", () => {
      expect(pattern.fileExtensions).toContain(".js");
      expect(pattern.fileExtensions).toContain(".ts");
      expect(pattern.fileExtensions).toContain(".tsx");
    });
  });

  describe("PQC-JS-002: RSA Encryption", () => {
    const pattern = findPattern("PQC-JS-002");

    it("matches crypto.publicEncrypt()", () => {
      expect(pattern.regex.test("crypto.publicEncrypt(publicKey, data)")).toBe(true);
    });

    it("matches crypto.privateDecrypt()", () => {
      expect(pattern.regex.test("crypto.privateDecrypt(privateKey, data)")).toBe(true);
    });

    it("has HIGH risk", () => {
      expect(pattern.risk).toBe("HIGH");
    });
  });

  describe("PQC-JS-003: RSA Signing (Web Crypto)", () => {
    const pattern = findPattern("PQC-JS-003");

    it("matches RSASSA-PKCS1-v1_5", () => {
      expect(pattern.regex.test('{ name: "RSASSA-PKCS1-v1_5" }')).toBe(true);
    });

    it("matches RSA-PSS", () => {
      expect(pattern.regex.test('{ name: "RSA-PSS" }')).toBe(true);
    });

    it("matches RSA-OAEP", () => {
      expect(pattern.regex.test('{ name: "RSA-OAEP" }')).toBe(true);
    });

    it("has MEDIUM risk", () => {
      expect(pattern.risk).toBe("MEDIUM");
    });
  });

  describe("PQC-JS-004: ECDSA (Web Crypto)", () => {
    const pattern = findPattern("PQC-JS-004");

    it("matches ECDSA", () => {
      expect(pattern.regex.test('{ name: "ECDSA", namedCurve: "P-256" }')).toBe(true);
    });

    it("does not match ECDH (now PQC-JS-009)", () => {
      expect(pattern.regex.test('{ name: "ECDH", namedCurve: "P-256" }')).toBe(false);
    });

    it("has MEDIUM risk", () => {
      expect(pattern.risk).toBe("MEDIUM");
    });

    it("belongs to ECDSA_EDDSA category", () => {
      expect(pattern.category).toBe("ECDSA_EDDSA");
    });
  });

  describe("PQC-JS-005: DH Key Exchange", () => {
    const pattern = findPattern("PQC-JS-005");

    it("matches createDiffieHellman()", () => {
      expect(pattern.regex.test("crypto.createDiffieHellman(2048)")).toBe(true);
    });

    it("matches createECDH()", () => {
      expect(pattern.regex.test('crypto.createECDH("prime256v1")')).toBe(true);
    });

    it("has HIGH risk", () => {
      expect(pattern.risk).toBe("HIGH");
    });
  });

  describe("PQC-JS-006: JWT RS256", () => {
    const pattern = findPattern("PQC-JS-006");

    it("matches algorithm: 'RS256'", () => {
      expect(pattern.regex.test('{ algorithm": "RS256" }')).toBe(true);
    });

    it("has MEDIUM risk", () => {
      expect(pattern.risk).toBe("MEDIUM");
    });
  });

  describe("PQC-JS-007: node-forge RSA", () => {
    const pattern = findPattern("PQC-JS-007");

    it("matches forge.pki.rsa.generateKeyPair", () => {
      expect(pattern.regex.test("forge.pki.rsa.generateKeyPair(2048)")).toBe(true);
    });

    it("has HIGH risk", () => {
      expect(pattern.risk).toBe("HIGH");
    });
  });

  describe("PQC-JS-008: jose RSA Key Generation", () => {
    const pattern = findPattern("PQC-JS-008");

    it("matches generateKeyPair('RS256')", () => {
      expect(pattern.regex.test("generateKeyPair('RS256')")).toBe(true);
    });

    it("matches generateKeyPair('PS256')", () => {
      expect(pattern.regex.test("generateKeyPair('PS256')")).toBe(true);
    });

    it("does not match generateKeyPair('ES256')", () => {
      expect(pattern.regex.test("generateKeyPair('ES256')")).toBe(false);
    });

    it("has HIGH risk", () => {
      expect(pattern.risk).toBe("HIGH");
    });
  });

  describe("PQC-JS-009: ECDH (Web Crypto)", () => {
    const pattern = findPattern("PQC-JS-009");

    it("matches ECDH key agreement", () => {
      expect(pattern.regex.test('{ name: "ECDH", namedCurve: "P-256" }')).toBe(true);
    });

    it("matches crypto.subtle.deriveKey with ECDH", () => {
      expect(pattern.regex.test('crypto.subtle.deriveKey({ name: "ECDH", public: peerKey }, ...)')).toBe(true);
    });

    it("does not match ECDSA (now PQC-JS-004)", () => {
      expect(pattern.regex.test('{ name: "ECDSA" }')).toBe(false);
    });

    it("has HIGH risk", () => {
      expect(pattern.risk).toBe("HIGH");
    });

    it("belongs to DH_KEY_EXCHANGE category", () => {
      expect(pattern.category).toBe("DH_KEY_EXCHANGE");
    });
  });
});
