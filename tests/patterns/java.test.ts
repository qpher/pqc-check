import { describe, it, expect } from "vitest";
import { javaPatterns } from "../../src/patterns/java.js";

function findPattern(id: string) {
  return javaPatterns.find((p) => p.id === id)!;
}

describe("Java patterns", () => {
  describe("PQC-JV-001: RSA Key Generation", () => {
    const pattern = findPattern("PQC-JV-001");

    it('matches KeyPairGenerator.getInstance("RSA")', () => {
      expect(pattern.regex.test('KeyPairGenerator.getInstance("RSA")')).toBe(true);
    });

    it("matches RSAKeyGenParameterSpec", () => {
      expect(pattern.regex.test("new RSAKeyGenParameterSpec(2048, e)")).toBe(true);
    });

    it('does not match KeyPairGenerator.getInstance("EC")', () => {
      expect(pattern.regex.test('KeyPairGenerator.getInstance("EC")')).toBe(false);
    });

    it("has HIGH risk", () => {
      expect(pattern.risk).toBe("HIGH");
    });

    it("applies to .java and .kt files", () => {
      expect(pattern.fileExtensions).toContain(".java");
      expect(pattern.fileExtensions).toContain(".kt");
    });
  });

  describe("PQC-JV-002: RSA Encryption", () => {
    const pattern = findPattern("PQC-JV-002");

    it('matches Cipher.getInstance("RSA...")', () => {
      expect(pattern.regex.test('Cipher.getInstance("RSA/ECB/PKCS1Padding")')).toBe(true);
    });

    it("has HIGH risk", () => {
      expect(pattern.risk).toBe("HIGH");
    });
  });

  describe("PQC-JV-003: RSA Signing", () => {
    const pattern = findPattern("PQC-JV-003");

    it('matches Signature.getInstance("SHA256withRSA")', () => {
      expect(pattern.regex.test('Signature.getInstance("SHA256withRSA")')).toBe(true);
    });

    it("has MEDIUM risk", () => {
      expect(pattern.risk).toBe("MEDIUM");
    });
  });

  describe("PQC-JV-004: ECDSA Signing", () => {
    const pattern = findPattern("PQC-JV-004");

    it('matches KeyPairGenerator.getInstance("EC")', () => {
      expect(pattern.regex.test('KeyPairGenerator.getInstance("EC")')).toBe(true);
    });

    it('matches Signature.getInstance("SHA256withECDSA")', () => {
      expect(pattern.regex.test('Signature.getInstance("SHA256withECDSA")')).toBe(true);
    });

    it("has MEDIUM risk", () => {
      expect(pattern.risk).toBe("MEDIUM");
    });
  });

  describe("PQC-JV-005: DH Key Exchange", () => {
    const pattern = findPattern("PQC-JV-005");

    it('matches KeyAgreement.getInstance("DH")', () => {
      expect(pattern.regex.test('KeyAgreement.getInstance("DH")')).toBe(true);
    });

    it("matches DHParameterSpec", () => {
      expect(pattern.regex.test("new DHParameterSpec(p, g)")).toBe(true);
    });

    it("has HIGH risk", () => {
      expect(pattern.risk).toBe("HIGH");
    });
  });

  describe("PQC-JV-006: Bouncy Castle RSA", () => {
    const pattern = findPattern("PQC-JV-006");

    it("matches RSAKeyPairGenerator", () => {
      expect(pattern.regex.test("new RSAKeyPairGenerator()")).toBe(true);
    });

    it("matches RSAEngine", () => {
      expect(pattern.regex.test("new RSAEngine()")).toBe(true);
    });

    it("has HIGH risk", () => {
      expect(pattern.risk).toBe("HIGH");
    });
  });

  describe("PQC-JV-007: ECDH Key Exchange", () => {
    const pattern = findPattern("PQC-JV-007");

    it('matches KeyAgreement.getInstance("ECDH")', () => {
      expect(pattern.regex.test('KeyAgreement ka = KeyAgreement.getInstance("ECDH");')).toBe(true);
    });

    it("matches the ECDHC cofactor variant", () => {
      expect(pattern.regex.test('KeyAgreement.getInstance("ECDHC")')).toBe(true);
    });

    it('matches the provider-arg form getInstance("ECDH", "BC")', () => {
      expect(pattern.regex.test('KeyAgreement.getInstance("ECDH", "BC")')).toBe(true);
    });

    it('does not match KeyAgreement.getInstance("DH")', () => {
      expect(pattern.regex.test('KeyAgreement.getInstance("DH")')).toBe(false);
    });

    it("has HIGH risk", () => {
      expect(pattern.risk).toBe("HIGH");
    });

    it("belongs to DH_KEY_EXCHANGE category", () => {
      expect(pattern.category).toBe("DH_KEY_EXCHANGE");
    });
  });
});
