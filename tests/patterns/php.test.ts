import { describe, it, expect } from "vitest";
import { phpPatterns } from "../../src/patterns/php.js";

function findPattern(id: string) {
  return phpPatterns.find((p) => p.id === id)!;
}

describe("PHP patterns", () => {
  describe("PQC-PHP-004: ECDH Key Exchange", () => {
    const pattern = findPattern("PQC-PHP-004");

    it("matches openssl_pkey_derive()", () => {
      expect(pattern.regex.test("$secret = openssl_pkey_derive($peerKey, $privKey);")).toBe(true);
    });

    it("matches sodium_crypto_scalarmult", () => {
      expect(pattern.regex.test("$shared = sodium_crypto_scalarmult($sk, $peerPk);")).toBe(true);
    });

    it("does not match openssl_pkey_new with EC keytype (ECDSA, not ECDH)", () => {
      expect(pattern.regex.test('$key = openssl_pkey_new(["private_key_type" => OPENSSL_KEYTYPE_EC]);')).toBe(false);
    });

    it("has HIGH risk", () => {
      expect(pattern.risk).toBe("HIGH");
    });

    it("belongs to DH_KEY_EXCHANGE category", () => {
      expect(pattern.category).toBe("DH_KEY_EXCHANGE");
    });

    it("applies to .php files", () => {
      expect(pattern.fileExtensions).toContain(".php");
    });
  });
});
