import { describe, it, expect } from "vitest";
import { cPatterns } from "../../src/patterns/c.js";

function findPattern(id: string) {
  return cPatterns.find((p) => p.id === id)!;
}

describe("C patterns", () => {
  describe("PQC-C-005: ECDH Key Exchange", () => {
    const pattern = findPattern("PQC-C-005");

    it("matches ECDH_compute_key()", () => {
      expect(pattern.regex.test("ECDH_compute_key(secret, len, peer_pub, ecdh, NULL);")).toBe(true);
    });

    it("does not match EC_KEY_new_by_curve_name (ECDSA keygen, not ECDH)", () => {
      expect(pattern.regex.test("EC_KEY *key = EC_KEY_new_by_curve_name(NID_X9_62_prime256v1);")).toBe(false);
    });

    it("has HIGH risk", () => {
      expect(pattern.risk).toBe("HIGH");
    });

    it("belongs to DH_KEY_EXCHANGE category", () => {
      expect(pattern.category).toBe("DH_KEY_EXCHANGE");
    });

    it("applies to .c files", () => {
      expect(pattern.fileExtensions).toContain(".c");
    });
  });
});
