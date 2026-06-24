import { describe, it, expect } from "vitest";
import { rubyPatterns } from "../../src/patterns/ruby.js";

function findPattern(id: string) {
  return rubyPatterns.find((p) => p.id === id)!;
}

describe("Ruby patterns", () => {
  describe("PQC-RB-004: ECDH Key Exchange", () => {
    const pattern = findPattern("PQC-RB-004");

    it("matches ec_key.dh_compute_key()", () => {
      expect(pattern.regex.test("shared = ec_key.dh_compute_key(peer_point)")).toBe(true);
    });

    it("matches modern OpenSSL 3.x pkey.derive()", () => {
      expect(pattern.regex.test("shared = private_key.derive(peer_public_key)")).toBe(true);
    });

    // Accepted false-positive: the broad `.derive(` branch matches any `.derive(`.
    // We accept this tradeoff because a missed key exchange = a missed HNDL risk.
    it("matches a benign .derive() (documented accepted false-positive)", () => {
      expect(pattern.regex.test("value = config.derive(:something)")).toBe(true);
    });

    it("does not match OpenSSL::PKey::RSA.new (RSA keygen, no derive)", () => {
      expect(pattern.regex.test("key = OpenSSL::PKey::RSA.new(2048)")).toBe(false);
    });

    it("has HIGH risk", () => {
      expect(pattern.risk).toBe("HIGH");
    });

    it("belongs to DH_KEY_EXCHANGE category", () => {
      expect(pattern.category).toBe("DH_KEY_EXCHANGE");
    });

    it("applies to .rb files", () => {
      expect(pattern.fileExtensions).toContain(".rb");
    });
  });
});
