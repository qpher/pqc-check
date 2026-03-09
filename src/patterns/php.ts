import { definePattern } from "./types.js";

const PHP_EXT = [".php"];

export const phpPatterns = [
  definePattern(
    "PQC-PHP-001",
    "RSA Key Generation",
    /\bopenssl_pkey_new\s*\(.*OPENSSL_KEYTYPE_RSA|\bphpseclib.*RSA\b/,
    "HIGH",
    "RSA_KEY_GENERATION",
    PHP_EXT,
    "RSA key generation is vulnerable to quantum attacks using Shor's algorithm",
    "Migrate to ML-KEM-768 (Kyber768) for key encapsulation",
  ),
  definePattern(
    "PQC-PHP-002",
    "ECDSA Signing",
    /\bopenssl_pkey_new\s*\(.*OPENSSL_KEYTYPE_EC|\bOPENSSL_KEYTYPE_EC\b/,
    "MEDIUM",
    "ECDSA_EDDSA",
    PHP_EXT,
    "ECDSA is vulnerable to quantum attacks using Shor's algorithm",
    "Migrate to ML-DSA-65 (Dilithium3) for digital signatures",
  ),
  definePattern(
    "PQC-PHP-003",
    "DH Key Exchange",
    /\bopenssl_pkey_new\s*\(.*OPENSSL_KEYTYPE_DH/,
    "HIGH",
    "DH_KEY_EXCHANGE",
    PHP_EXT,
    "Diffie-Hellman key exchange is vulnerable to quantum attacks",
    "Migrate to ML-KEM-768 (Kyber768) for key encapsulation",
  ),
];
