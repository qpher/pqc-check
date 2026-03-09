import { definePattern } from "./types.js";

const RS_EXT = [".rs"];

export const rustPatterns = [
  definePattern(
    "PQC-RS-001",
    "RSA Key Generation (rsa crate)",
    /\bRsaPrivateKey::new\s*\(|\bRsaPublicKey::from\b/,
    "HIGH",
    "RSA_KEY_GENERATION",
    RS_EXT,
    "RSA key generation is vulnerable to quantum attacks using Shor's algorithm",
    "Migrate to ML-KEM-768 (Kyber768) for key encapsulation",
  ),
  definePattern(
    "PQC-RS-002",
    "RSA (ring crate)",
    /\bring::signature::RSA\b|\bring::rsa\b/,
    "HIGH",
    "RSA_KEY_GENERATION",
    RS_EXT,
    "ring RSA operations are vulnerable to quantum attacks",
    "Migrate to ML-KEM-768 (Kyber768) for key encapsulation",
  ),
  definePattern(
    "PQC-RS-003",
    "ECDSA Signing",
    /\bEcdsaKeyPair::|\bp256::ecdsa\b|\bk256::ecdsa\b/,
    "MEDIUM",
    "ECDSA_EDDSA",
    RS_EXT,
    "ECDSA is vulnerable to quantum attacks using Shor's algorithm",
    "Migrate to ML-DSA-65 (Dilithium3) for digital signatures",
  ),
  definePattern(
    "PQC-RS-004",
    "Ed25519 Signing",
    /\bed25519_dalek::SigningKey\b|\bEd25519KeyPair\b/,
    "MEDIUM",
    "ECDSA_EDDSA",
    RS_EXT,
    "Ed25519 signatures are vulnerable to quantum attacks",
    "Migrate to ML-DSA-65 (Dilithium3) for digital signatures",
  ),
  definePattern(
    "PQC-RS-005",
    "X25519 Key Exchange",
    /\bx25519_dalek::\b|\bEphemeralSecret::random\b/,
    "HIGH",
    "DH_KEY_EXCHANGE",
    RS_EXT,
    "X25519 key exchange is vulnerable to quantum attacks (harvest now, decrypt later)",
    "Migrate to ML-KEM-768 (Kyber768) for key encapsulation",
  ),
];
