/** Risk level for a quantum-vulnerable finding */
export type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

/** Pattern categories for grouping */
export type PatternCategory =
  | "RSA_KEY_GENERATION"
  | "RSA_ENCRYPTION"
  | "RSA_SIGNING"
  | "ECDSA_EDDSA"
  | "DH_KEY_EXCHANGE"
  | "CONFIG_FILE"
  | "HASH_FUNCTION";

/** A single detection pattern */
export interface Pattern {
  /** Unique pattern ID, e.g. "PQC-PY-001" */
  id: string;
  /** Human-readable name, e.g. "RSA Key Generation" */
  name: string;
  /** Regex to match in source code */
  regex: RegExp;
  /** Risk level */
  risk: RiskLevel;
  /** Vulnerability category */
  category: PatternCategory;
  /** File extensions this pattern applies to */
  fileExtensions: string[];
  /** Short description of why this is vulnerable */
  description: string;
  /** PQC replacement suggestion */
  suggestion: string;
}

/** A finding (pattern match in a specific file) */
export interface Finding {
  /** Pattern that matched */
  pattern: Pattern;
  /** Absolute file path */
  filePath: string;
  /** Relative file path (for display) */
  relativeFilePath: string;
  /** Line number (1-based) */
  line: number;
  /** Column number (1-based) */
  column: number;
  /** The matched text snippet */
  matchedText: string;
  /** The full line of code */
  lineContent: string;
}

/** Scan results */
export interface ScanResult {
  /** Target directory scanned */
  targetPath: string;
  /** Total files scanned */
  filesScanned: number;
  /** Total findings */
  totalFindings: number;
  /** Findings grouped by risk */
  findings: {
    HIGH: Finding[];
    MEDIUM: Finding[];
    LOW: Finding[];
  };
  /** Summary statistics */
  summary: {
    high: number;
    medium: number;
    low: number;
    filesWithFindings: number;
  };
  /** Scan duration in milliseconds */
  durationMs: number;
  /** Scanner version */
  version: string;
}

/** CLI options */
export interface ScanOptions {
  /** Target path to scan */
  target: string;
  /** Specific languages to scan (empty = all) */
  languages: string[];
  /** Output format */
  format: "console" | "json" | "sarif" | "cyclonedx-cbom" | "pdf-report";
  /** Show LOW risk findings */
  showLow: boolean;
  /** Ignore patterns (glob) */
  ignore: string[];
  /** Don't show Qpher suggestions */
  noSuggestions: boolean;
  /** Suppress banner/branding */
  quiet: boolean;
  /** Air-gapped mode: assert zero network access (#262). Optional for back-compat. */
  offline?: boolean;
}
