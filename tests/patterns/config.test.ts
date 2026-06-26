import { describe, it, expect } from "vitest";
import { configPatterns } from "../../src/patterns/config.js";
import { matchPatterns } from "../../src/scanner/pattern-engine.js";

function findPattern(id: string) {
  return configPatterns.find((p) => p.id === id)!;
}

describe("Config patterns", () => {
  describe("PQC-CF-001: SSL Certificate Reference", () => {
    const pattern = findPattern("PQC-CF-001");

    it("matches ssl_certificate", () => {
      expect(pattern.regex.test("ssl_certificate /etc/ssl/cert.pem;")).toBe(true);
    });

    it("matches SSLCertificateFile", () => {
      expect(pattern.regex.test("SSLCertificateFile /etc/ssl/cert.pem")).toBe(true);
    });

    it("matches tls_cert", () => {
      expect(pattern.regex.test('tls_cert = "/etc/ssl/cert.pem"')).toBe(true);
    });

    it("has LOW risk", () => {
      expect(pattern.risk).toBe("LOW");
    });

    it("applies to config file extensions", () => {
      expect(pattern.fileExtensions).toContain(".conf");
      expect(pattern.fileExtensions).toContain(".yaml");
      expect(pattern.fileExtensions).toContain(".yml");
    });
  });

  describe("PQC-CF-002: PEM Key File Reference", () => {
    const pattern = findPattern("PQC-CF-002");

    it("matches .pem reference", () => {
      expect(pattern.regex.test('cert = "server.pem"')).toBe(true);
    });

    it("matches .key reference", () => {
      expect(pattern.regex.test("ssl_certificate_key /etc/ssl/server.key ")).toBe(true);
    });

    it("matches ssl_certificate_key", () => {
      expect(pattern.regex.test("ssl_certificate_key /path/to/key")).toBe(true);
    });

    it("has LOW risk", () => {
      expect(pattern.risk).toBe("LOW");
    });
  });

  describe("PQC-CF-003: RSA in Config", () => {
    const pattern = findPattern("PQC-CF-003");

    it("matches RSA: prefix", () => {
      expect(pattern.regex.test("RSA:2048")).toBe(true);
    });

    it("matches rsa_keygen_bits", () => {
      expect(pattern.regex.test("rsa_keygen_bits = 2048")).toBe(true);
    });

    it("has HIGH risk", () => {
      expect(pattern.risk).toBe("HIGH");
    });
  });

  describe("PQC-CF-004: TLS Cipher Suite", () => {
    const pattern = findPattern("PQC-CF-004");

    it("matches ECDHE-RSA", () => {
      expect(pattern.regex.test("ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384")).toBe(true);
    });

    it("matches DHE-RSA", () => {
      expect(pattern.regex.test("ssl_ciphers DHE-RSA-AES256-GCM-SHA384")).toBe(true);
    });

    it("matches kRSA", () => {
      expect(pattern.regex.test("ssl_ciphers kRSA+AES")).toBe(true);
    });

    it("has HIGH risk", () => {
      expect(pattern.risk).toBe("HIGH");
    });
  });

  describe("scan-level severity (M2)", () => {
    function risksFor(content: string): string[] {
      return matchPatterns({
        content,
        filePath: "/t/tls.conf",
        rootDir: "/t",
        patterns: configPatterns,
      }).map((f) => f.pattern.risk);
    }

    it("ECDHE-RSA cipher → HIGH present (Harvest Now, Decrypt Later)", () => {
      const risks = risksFor("ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384;");
      expect(risks).toContain("HIGH");
    });

    it("cert/key reference only → no HIGH/MEDIUM (LOW only, exit 0)", () => {
      const risks = risksFor('ssl_certificate "/etc/ssl/server.pem";');
      expect(risks).not.toContain("HIGH");
      expect(risks).not.toContain("MEDIUM");
    });
  });
});
