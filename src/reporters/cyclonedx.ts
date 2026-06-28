import { createHash, randomUUID } from "node:crypto";
import type { Finding, PatternCategory, ScanResult } from "../types.js";

/** Options for CBOM generation. */
export interface CbomOptions {
  /**
   * Reproducible mode: derive the `serialNumber` deterministically from the
   * component content and omit the wall-clock timestamp, so the same scan
   * yields byte-identical CBOM JSON (#263 embeds + hashes the CBOM).
   */
  reproducible?: boolean;
}

/** Format the first 32 hex chars of a digest as a UUID. */
function uuidFromHex(hex: string): string {
  const h = hex.slice(0, 32);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

/**
 * CycloneDX 1.6 Cryptographic Bill of Materials (CBOM) reporter (#261).
 *
 * Emits a NIST IR 8413-aligned CBOM so `pqc-check` output can feed the
 * cryptographic-inventory requirement of OMB M-23-02. Each finding becomes a
 * `cryptographic-asset` component with `cryptoProperties.algorithmProperties`
 * (CycloneDX 1.6 spec) plus an `evidence.occurrences[]` pointing at the source
 * location.
 *
 * Every algorithm pqc-check flags is quantum-vulnerable, so
 * `nistQuantumSecurityLevel` is 0 (not quantum-safe) for all emitted assets.
 */

/** CycloneDX 1.6 `algorithmProperties.primitive` enum (subset we emit). */
type CryptoPrimitive = "pke" | "signature" | "key-agree" | "hash" | "unknown";

interface CategoryCrypto {
  /** Algorithm family name for the component. */
  algorithmName: string;
  primitive: CryptoPrimitive;
  /** CycloneDX `cryptoFunctions` (lifecycle operations observed). */
  cryptoFunctions: string[];
}

/** Map pqc-check's detection category → CycloneDX crypto properties. */
const CATEGORY_CRYPTO: Record<PatternCategory, CategoryCrypto> = {
  RSA_KEY_GENERATION: { algorithmName: "RSA", primitive: "pke", cryptoFunctions: ["keygen"] },
  RSA_ENCRYPTION: { algorithmName: "RSA", primitive: "pke", cryptoFunctions: ["encrypt"] },
  RSA_SIGNING: { algorithmName: "RSA", primitive: "signature", cryptoFunctions: ["sign"] },
  ECDSA_EDDSA: { algorithmName: "EC", primitive: "signature", cryptoFunctions: ["sign"] },
  DH_KEY_EXCHANGE: { algorithmName: "DH", primitive: "key-agree", cryptoFunctions: ["keygen"] },
  HASH_FUNCTION: { algorithmName: "Hash", primitive: "hash", cryptoFunctions: ["digest"] },
  CONFIG_FILE: { algorithmName: "TLS", primitive: "unknown", cryptoFunctions: ["other"] },
};

/** Best-effort key-size extraction from the matched text (e.g. "2048"). */
function parameterSetIdentifier(finding: Finding): string | undefined {
  const haystack = `${finding.matchedText} ${finding.lineContent}`;
  const m = haystack.match(/\b(1024|2048|3072|4096|192|224|256|384|521)\b/);
  return m ? m[1] : undefined;
}

function toComponent(finding: Finding): Record<string, unknown> {
  const crypto = CATEGORY_CRYPTO[finding.pattern.category];
  const paramSet = parameterSetIdentifier(finding);
  const name = paramSet ? `${crypto.algorithmName}-${paramSet}` : crypto.algorithmName;

  const algorithmProperties: Record<string, unknown> = {
    primitive: crypto.primitive,
    executionEnvironment: "software-plain-ram",
    cryptoFunctions: crypto.cryptoFunctions,
    // Every flagged algorithm is quantum-vulnerable.
    nistQuantumSecurityLevel: 0,
  };
  if (paramSet) {
    algorithmProperties.parameterSetIdentifier = paramSet;
  }

  return {
    type: "cryptographic-asset",
    "bom-ref": `${finding.pattern.id}:${finding.relativeFilePath}:${finding.line}`,
    name,
    cryptoProperties: {
      assetType: "algorithm",
      algorithmProperties,
    },
    evidence: {
      occurrences: [
        {
          location: `${finding.relativeFilePath}:${finding.line}:${finding.column}`,
        },
      ],
    },
    properties: [
      { name: "pqc-check:patternId", value: finding.pattern.id },
      { name: "pqc-check:risk", value: finding.pattern.risk },
      { name: "pqc-check:category", value: finding.pattern.category },
    ],
  };
}

/** Format scan results as a CycloneDX 1.6 CBOM (NIST IR 8413). */
export function formatCyclonedxCbom(result: ScanResult, opts: CbomOptions = {}): string {
  const allFindings = [...result.findings.HIGH, ...result.findings.MEDIUM, ...result.findings.LOW];
  const components = allFindings.map(toComponent);

  // In reproducible mode the serial number is derived from the component
  // content (deterministic) and the wall-clock timestamp is omitted.
  const serialNumber = opts.reproducible
    ? `urn:uuid:${uuidFromHex(createHash("sha256").update(JSON.stringify(components)).digest("hex"))}`
    : `urn:uuid:${randomUUID()}`;

  const metadata: Record<string, unknown> = {
    tools: {
      components: [{ type: "application", name: "pqc-check", version: result.version }],
    },
    component: { type: "application", name: result.targetPath },
  };
  if (!opts.reproducible) {
    metadata.timestamp = new Date().toISOString();
  }

  const bom = {
    bomFormat: "CycloneDX",
    specVersion: "1.6",
    serialNumber,
    version: 1,
    metadata,
    components,
  };

  return JSON.stringify(bom, null, 2);
}
