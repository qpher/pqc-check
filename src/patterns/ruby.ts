import { definePattern } from "./types.js";

const RB_EXT = [".rb"];

export const rubyPatterns = [
  definePattern(
    "PQC-RB-001",
    "RSA Key Generation",
    /\bOpenSSL::PKey::RSA\.new\b|\bOpenSSL::PKey::RSA\.generate\b/,
    "HIGH",
    "RSA_KEY_GENERATION",
    RB_EXT,
    "RSA key generation is vulnerable to quantum attacks using Shor's algorithm",
    "Migrate to ML-KEM-768 (Kyber768) for key encapsulation",
  ),
  definePattern(
    "PQC-RB-002",
    "ECDSA Signing",
    /\bOpenSSL::PKey::EC\.generate\b/,
    "MEDIUM",
    "ECDSA_EDDSA",
    RB_EXT,
    "ECDSA is vulnerable to quantum attacks using Shor's algorithm",
    "Migrate to ML-DSA-65 (Dilithium3) for digital signatures",
  ),
  definePattern(
    "PQC-RB-003",
    "DH Key Exchange",
    /\bOpenSSL::PKey::DH\.new\b|\bOpenSSL::PKey::DH\.generate\b/,
    "HIGH",
    "DH_KEY_EXCHANGE",
    RB_EXT,
    "Diffie-Hellman key exchange is vulnerable to quantum attacks",
    "Migrate to ML-KEM-768 (Kyber768) for key encapsulation",
  ),
];
