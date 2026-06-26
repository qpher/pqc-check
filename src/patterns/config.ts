import { definePattern } from "./types.js";

const CFG_EXT = [".conf", ".cfg", ".ini", ".cnf", ".yaml", ".yml", ".toml"];

export const configPatterns = [
  definePattern(
    "PQC-CF-001",
    "SSL Certificate Reference",
    /\bssl_certificate\b|\bSSLCertificateFile\b|\btls_cert\b/,
    "LOW",
    "CONFIG_FILE",
    CFG_EXT,
    "Informational: a certificate file is referenced — its algorithm (likely RSA/ECDSA) cannot be confirmed from the config alone",
    "Audit the referenced certificate for PQC readiness",
  ),
  definePattern(
    "PQC-CF-002",
    "PEM Key File Reference",
    /\.pem["'\s]|\.key["'\s]|\bssl_certificate_key\b/,
    "LOW",
    "CONFIG_FILE",
    CFG_EXT,
    "Informational: a PEM/key file is referenced — its key material cannot be confirmed from the config alone",
    "Audit the referenced key file for PQC readiness",
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
    "HIGH",
    "CONFIG_FILE",
    CFG_EXT,
    "TLS cipher suites using ECDHE/DHE/RSA key exchange are quantum-vulnerable (harvest now, decrypt later)",
    "Migrate to PQC-compatible (hybrid) TLS key exchange (e.g. ML-KEM-768) when server support is available",
  ),
];
