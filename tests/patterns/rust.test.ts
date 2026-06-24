import { describe, it, expect } from "vitest";
import { rustPatterns } from "../../src/patterns/rust.js";

function findPattern(id: string) {
  return rustPatterns.find((p) => p.id === id)!;
}

describe("Rust patterns", () => {
  describe("PQC-RS-006: ECDH Key Exchange", () => {
    const pattern = findPattern("PQC-RS-006");

    it("matches p256::ecdh::diffie_hellman", () => {
      expect(pattern.regex.test("let shared = p256::ecdh::diffie_hellman(secret, peer.as_affine());")).toBe(true);
    });

    it("matches ring::agreement", () => {
      expect(pattern.regex.test("ring::agreement::agree_ephemeral(my_private_key, &peer_public_key, ...)")).toBe(true);
    });

    it("does not match p256::ecdsa (ECDSA signing, not ECDH)", () => {
      expect(pattern.regex.test("let key = p256::ecdsa::SigningKey::random(&mut rng);")).toBe(false);
    });

    it("has HIGH risk", () => {
      expect(pattern.risk).toBe("HIGH");
    });

    it("belongs to DH_KEY_EXCHANGE category", () => {
      expect(pattern.category).toBe("DH_KEY_EXCHANGE");
    });

    it("applies to .rs files", () => {
      expect(pattern.fileExtensions).toContain(".rs");
    });
  });
});
