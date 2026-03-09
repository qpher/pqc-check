import { definePattern } from "./types.js";

const C_EXT = [".c", ".cpp", ".cc", ".cxx", ".h", ".hpp"];

export const cPatterns = [
  definePattern(
    "PQC-C-001",
    "OpenSSL RSA",
    /\bRSA_generate_key\b|\bRSA_new\s*\(|\bEVP_PKEY_RSA\b/,
    "HIGH",
    "RSA_KEY_GENERATION",
    C_EXT,
    "OpenSSL RSA operations are vulnerable to quantum attacks using Shor's algorithm",
    "Migrate to ML-KEM-768 (Kyber768) for key encapsulation",
  ),
  definePattern(
    "PQC-C-002",
    "OpenSSL ECDSA",
    /\bEC_KEY_new_by_curve_name\b|\bEVP_PKEY_EC\b/,
    "MEDIUM",
    "ECDSA_EDDSA",
    C_EXT,
    "OpenSSL ECDSA is vulnerable to quantum attacks",
    "Migrate to ML-DSA-65 (Dilithium3) for digital signatures",
  ),
  definePattern(
    "PQC-C-003",
    "OpenSSL DH",
    /\bDH_generate_parameters\b|\bEVP_PKEY_DH\b/,
    "HIGH",
    "DH_KEY_EXCHANGE",
    C_EXT,
    "OpenSSL DH key exchange is vulnerable to quantum attacks",
    "Migrate to ML-KEM-768 (Kyber768) for key encapsulation",
  ),
  definePattern(
    "PQC-C-004",
    "OpenSSL Ed25519",
    /\bEVP_PKEY_ED25519\b|\bED25519_sign\b/,
    "MEDIUM",
    "ECDSA_EDDSA",
    C_EXT,
    "Ed25519 signatures are vulnerable to quantum attacks",
    "Migrate to ML-DSA-65 (Dilithium3) for digital signatures",
  ),
];
