import { definePattern } from "./types.js";

const CFG_EXT = [".conf", ".cfg", ".ini", ".cnf", ".yaml", ".yml", ".toml"];

export const configPatterns = [
  definePattern(
    "PQC-CF-001",
    "SSL Certificate Reference",
    /\bssl_certificate\b|\bSSLCertificateFile\b|\btls_cert\b/,
    "MEDIUM",
    "CONFIG_FILE",
    CFG_EXT,
    "SSL/TLS certificates may use quantum-vulnerable algorithms (RSA/ECDSA)",
    "Ensure certificates use PQC-compatible algorithms when available",
  ),
  definePattern(
    "PQC-CF-002",
    "PEM Key File Reference",
    /\.pem["'\s]|\.key["'\s]|\bssl_certificate_key\b/,
    "MEDIUM",
    "CONFIG_FILE",
    CFG_EXT,
    "PEM/key files may contain quantum-vulnerable key material",
    "Audit referenced key files for PQC readiness",
  ),
  definePattern(
    "PQC-CF-003",
    "RSA in Config",
    /\bRSA:|\brsa_keygen_bits\b/,
    "HIGH",
    "CONFIG_FILE",
    CFG_EXT,
    "Explicit RSA configuration is quantum-vulnerable",
    "Migrate to PQC-compatible key generation",
  ),
  definePattern(
    "PQC-CF-004",
    "TLS Cipher Suite (RSA/DHE)",
    /\bECDHE-RSA\b|\bDHE-RSA\b|\bkRSA\b/,
    "MEDIUM",
    "CONFIG_FILE",
    CFG_EXT,
    "TLS cipher suites using RSA/DHE are quantum-vulnerable",
    "Configure PQC-compatible TLS cipher suites when server support is available",
  ),
];
