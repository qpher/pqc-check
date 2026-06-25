import { describe, it, expect } from "vitest";
import { pythonPatterns } from "../../src/patterns/python.js";

function findPattern(id: string) {
  return pythonPatterns.find((p) => p.id === id)!;
}

describe("Python patterns", () => {
  describe("PQC-PY-001: RSA Key Generation", () => {
    const pattern = findPattern("PQC-PY-001");

    it("matches RSA.generate()", () => {
      expect(pattern.regex.test('key = RSA.generate(2048)')).toBe(true);
    });

    it("matches rsa.generate_private_key()", () => {
      expect(pattern.regex.test('rsa.generate_private_key(public_exponent=65537)')).toBe(true);
    });

    it("does not match variable names", () => {
      expect(pattern.regex.test('rsa_config_path = "/etc/rsa"')).toBe(false);
    });

    it("has HIGH risk", () => {
      expect(pattern.risk).toBe("HIGH");
    });

    it("applies to .py files", () => {
      expect(pattern.fileExtensions).toContain(".py");
    });
  });

  describe("PQC-PY-002: RSA Encryption", () => {
    const pattern = findPattern("PQC-PY-002");

    it("matches PKCS1_OAEP.new()", () => {
      expect(pattern.regex.test('cipher = PKCS1_OAEP.new(key)')).toBe(true);
    });

    it("matches PKCS1_v1_5.new()", () => {
      expect(pattern.regex.test('cipher = PKCS1_v1_5.new(key)')).toBe(true);
    });

    it("matches cryptography's public_key.encrypt(..., padding.OAEP(...))", () => {
      expect(
        pattern.regex.test(
          "ciphertext = public_key.encrypt(data, padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None))",
        ),
      ).toBe(true);
    });

    it("has HIGH risk", () => {
      expect(pattern.risk).toBe("HIGH");
    });
  });

  describe("PQC-PY-003: RSA Signing", () => {
    const pattern = findPattern("PQC-PY-003");

    it("matches pkcs1_15.new()", () => {
      expect(pattern.regex.test('signer = pkcs1_15.new(key)')).toBe(true);
    });

    it("matches pss.new()", () => {
      expect(pattern.regex.test('signer = pss.new(key)')).toBe(true);
    });

    it("has MEDIUM risk", () => {
      expect(pattern.risk).toBe("MEDIUM");
    });
  });

  describe("PQC-PY-004: ECDSA Signing", () => {
    const pattern = findPattern("PQC-PY-004");

    it("matches ec.generate_private_key()", () => {
      expect(pattern.regex.test('ec.generate_private_key(ec.SECP256R1())')).toBe(true);
    });

    it("matches ec.SECP256R1", () => {
      expect(pattern.regex.test('curve = ec.SECP256R1')).toBe(true);
    });

    it("matches ec.SECP384R1", () => {
      expect(pattern.regex.test('curve = ec.SECP384R1')).toBe(true);
    });

    it("matches the ec.ECDSA() signing call (FC-P2)", () => {
      expect(
        pattern.regex.test("sig = key.sign(data, ec.ECDSA(hashes.SHA256()))"),
      ).toBe(true);
    });

    it("does not match a benign ec.ECDSA substring (FC-P2)", () => {
      expect(pattern.regex.test("result = spec.ECDSA(x)")).toBe(false);
    });

    it("has MEDIUM risk", () => {
      expect(pattern.risk).toBe("MEDIUM");
    });
  });

  describe("PQC-PY-005: Ed25519 Signing", () => {
    const pattern = findPattern("PQC-PY-005");

    it("matches Ed25519PrivateKey.generate()", () => {
      expect(pattern.regex.test('ed25519.Ed25519PrivateKey.generate()')).toBe(true);
    });

    it("has MEDIUM risk", () => {
      expect(pattern.risk).toBe("MEDIUM");
    });
  });

  describe("PQC-PY-006: X25519 Key Exchange", () => {
    const pattern = findPattern("PQC-PY-006");

    it("matches X25519PrivateKey.generate()", () => {
      expect(pattern.regex.test('x25519.X25519PrivateKey.generate()')).toBe(true);
    });

    it("has HIGH risk", () => {
      expect(pattern.risk).toBe("HIGH");
    });
  });

  describe("PQC-PY-007: DH Key Exchange", () => {
    const pattern = findPattern("PQC-PY-007");

    it("matches dh.generate_parameters()", () => {
      expect(pattern.regex.test('dh.generate_parameters(generator=2, key_size=2048)')).toBe(true);
    });

    it("matches DHParameterNumbers", () => {
      expect(pattern.regex.test('params = DHParameterNumbers(p, g)')).toBe(true);
    });

    it("has HIGH risk", () => {
      expect(pattern.risk).toBe("HIGH");
    });
  });

  describe("PQC-PY-008: JWT RS256", () => {
    const pattern = findPattern("PQC-PY-008");

    it("matches jwt.encode with RS256", () => {
      expect(pattern.regex.test('jwt.encode(payload, key, "RS256")')).toBe(true);
    });

    it("matches algorithm config", () => {
      expect(pattern.regex.test("'algorithm': 'RS256'")).toBe(true);
    });

    it("has MEDIUM risk", () => {
      expect(pattern.risk).toBe("MEDIUM");
    });
  });

  describe("PQC-PY-009: SHA-256 Hash", () => {
    const pattern = findPattern("PQC-PY-009");

    it("matches hashlib.sha256()", () => {
      expect(pattern.regex.test('h = hashlib.sha256(b"data")')).toBe(true);
    });

    it("matches hashlib.sha512()", () => {
      expect(pattern.regex.test('h = hashlib.sha512(b"data")')).toBe(true);
    });

    it("has LOW risk", () => {
      expect(pattern.risk).toBe("LOW");
    });

    it("belongs to HASH_FUNCTION category", () => {
      expect(pattern.category).toBe("HASH_FUNCTION");
    });
  });

  describe("PQC-PY-010: ECDH Key Exchange", () => {
    const pattern = findPattern("PQC-PY-010");

    it("matches private_key.exchange(ec.ECDH(), peer)", () => {
      expect(pattern.regex.test("shared = private_key.exchange(ec.ECDH(), peer_public_key)")).toBe(true);
    });

    it("does not match ec.SECP256R1 (ECDSA curve, not ECDH)", () => {
      expect(pattern.regex.test("ec.generate_private_key(ec.SECP256R1())")).toBe(false);
    });

    it("has HIGH risk", () => {
      expect(pattern.risk).toBe("HIGH");
    });

    it("belongs to DH_KEY_EXCHANGE category", () => {
      expect(pattern.category).toBe("DH_KEY_EXCHANGE");
    });
  });
});
