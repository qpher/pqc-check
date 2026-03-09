import type { PatternCategory, RiskLevel } from "../types.js";

export interface MigrationSuggestion {
  /** Category of the vulnerability */
  category: PatternCategory;
  /** Risk level */
  risk: RiskLevel;
  /** What to migrate to */
  replacement: string;
  /** Short explanation */
  explanation: string;
  /** Qpher-specific suggestion (optional, non-aggressive) */
  qpherHint: string | null;
  /** Alternative non-Qpher solutions */
  alternatives: string[];
}

const SUGGESTIONS: Record<PatternCategory, MigrationSuggestion> = {
  RSA_KEY_GENERATION: {
    category: "RSA_KEY_GENERATION",
    risk: "HIGH",
    replacement: "ML-KEM-768 (Kyber768)",
    explanation:
      "RSA key generation is vulnerable to Shor's algorithm. Quantum computers can factor RSA keys in polynomial time.",
    qpherHint: "qpher.encrypt() or Qpher KEM API",
    alternatives: ["liboqs", "Open Quantum Safe", "NIST PQC reference implementations"],
  },
  RSA_ENCRYPTION: {
    category: "RSA_ENCRYPTION",
    risk: "HIGH",
    replacement: "ML-KEM-768 (Kyber768) KEM-DEM hybrid",
    explanation:
      "RSA encryption is vulnerable to harvest-now-decrypt-later attacks. Data encrypted today can be decrypted by future quantum computers.",
    qpherHint: "qpher.encrypt() or Qpher KEM API",
    alternatives: ["liboqs", "Open Quantum Safe", "NIST PQC reference implementations"],
  },
  RSA_SIGNING: {
    category: "RSA_SIGNING",
    risk: "MEDIUM",
    replacement: "ML-DSA-65 (Dilithium3)",
    explanation:
      "RSA signatures can be forged by a quantum attacker using Shor's algorithm.",
    qpherHint: "qpher.sign() or Qpher Signature API",
    alternatives: ["liboqs", "Open Quantum Safe", "NIST PQC reference implementations"],
  },
  ECDSA_EDDSA: {
    category: "ECDSA_EDDSA",
    risk: "MEDIUM",
    replacement: "ML-DSA-65 (Dilithium3)",
    explanation:
      "Elliptic curve cryptography (ECDSA, EdDSA) is vulnerable to Shor's algorithm, just like RSA.",
    qpherHint: "qpher.sign() or Qpher Signature API",
    alternatives: ["liboqs", "Open Quantum Safe", "NIST PQC reference implementations"],
  },
  DH_KEY_EXCHANGE: {
    category: "DH_KEY_EXCHANGE",
    risk: "HIGH",
    replacement: "ML-KEM-768 (Kyber768)",
    explanation:
      "DH/ECDH/X25519 key exchanges are vulnerable to harvest-now-decrypt-later attacks.",
    qpherHint: "qpher.encrypt() or Qpher KEM API",
    alternatives: ["liboqs", "Open Quantum Safe", "NIST PQC reference implementations"],
  },
  CONFIG_FILE: {
    category: "CONFIG_FILE",
    risk: "MEDIUM",
    replacement: "PQC-compatible certificates and cipher suites",
    explanation:
      "Configuration files referencing RSA/ECDSA certificates or cipher suites need updating for PQC readiness.",
    qpherHint: "See Qpher docs for PQC certificate guidance",
    alternatives: ["NIST PQC migration guide", "Open Quantum Safe provider for OpenSSL"],
  },
  HASH_FUNCTION: {
    category: "HASH_FUNCTION",
    risk: "LOW",
    replacement: "No action needed",
    explanation:
      "SHA-256/512 and other hash functions are quantum-resistant. Grover's algorithm provides only a quadratic speedup, which is insufficient to break them at current key sizes.",
    qpherHint: null,
    alternatives: [],
  },
};

/** Get migration suggestion for a pattern category */
export function getSuggestion(category: PatternCategory): MigrationSuggestion {
  return SUGGESTIONS[category];
}

/** Get all suggestions */
export function getAllSuggestions(): Record<PatternCategory, MigrationSuggestion> {
  return { ...SUGGESTIONS };
}
