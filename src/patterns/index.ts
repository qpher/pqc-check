import { pythonPatterns } from "./python.js";
import { javascriptPatterns } from "./javascript.js";
import { goPatterns } from "./go.js";
import { javaPatterns } from "./java.js";
import { rustPatterns } from "./rust.js";
import { cPatterns } from "./c.js";
import { rubyPatterns } from "./ruby.js";
import { phpPatterns } from "./php.js";
import { configPatterns } from "./config.js";
import type { Pattern } from "../types.js";
import path from "node:path";

/** All patterns, grouped by language */
export const ALL_PATTERNS: Pattern[] = [
  ...pythonPatterns,
  ...javascriptPatterns,
  ...goPatterns,
  ...javaPatterns,
  ...rustPatterns,
  ...cPatterns,
  ...rubyPatterns,
  ...phpPatterns,
  ...configPatterns,
];

/** Language name -> file extension mapping */
export const LANGUAGE_EXTENSIONS: Record<string, string[]> = {
  python: [".py"],
  javascript: [".js", ".ts", ".mjs", ".cjs", ".jsx", ".tsx"],
  go: [".go"],
  java: [".java", ".kt"],
  rust: [".rs"],
  c: [".c", ".cpp", ".cc", ".cxx", ".h", ".hpp"],
  ruby: [".rb"],
  php: [".php"],
  config: [".conf", ".cfg", ".ini", ".cnf", ".yaml", ".yml", ".toml"],
};

/** All supported file extensions */
export const ALL_EXTENSIONS: string[] = Object.values(LANGUAGE_EXTENSIONS).flat();

/**
 * Aliases users commonly type for `--lang`, mapped to canonical language keys.
 * kotlin → java and cpp → c mean those files are scanned with the java/c rule
 * sets (there are no Kotlin/C++-specific patterns).
 */
export const LANGUAGE_ALIASES: Record<string, string> = {
  ts: "javascript",
  typescript: "javascript",
  js: "javascript",
  node: "javascript",
  jsx: "javascript",
  tsx: "javascript",
  py: "python",
  python3: "python",
  kt: "java",
  kotlin: "java",
  cpp: "c",
  "c++": "c",
  cxx: "c",
  cc: "c",
  golang: "go",
  rs: "rust",
  rb: "ruby",
  yml: "config",
  yaml: "config",
  toml: "config",
  ini: "config",
  conf: "config",
};

/** Resolve a token to its canonical language key, or null if unknown. */
function canonicalLanguage(token: string): string | null {
  const key = token.trim().toLowerCase();
  if (!key) return null;
  if (LANGUAGE_EXTENSIONS[key]) return key;
  return LANGUAGE_ALIASES[key] ?? null;
}

/**
 * Resolve + validate `--lang` tokens. Aliases map to canonical names; empty /
 * whitespace tokens (a trailing comma) are dropped; results are deduped. FC-P1:
 * unknown tokens are returned so the CLI can fail loud (exit 2) instead of
 * silently scanning the whole tree.
 */
export function resolveLanguageTokens(tokens: string[]): {
  resolved: string[];
  unknown: string[];
} {
  const resolved: string[] = [];
  const unknown: string[] = [];
  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    const canonical = canonicalLanguage(trimmed);
    if (canonical) {
      if (!resolved.includes(canonical)) resolved.push(canonical);
    } else {
      const lowered = trimmed.toLowerCase();
      if (!unknown.includes(lowered)) unknown.push(lowered);
    }
  }
  return { resolved, unknown };
}

/** Get file extension including the dot */
function getExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

/** Get patterns for a specific file by its extension */
export function getPatternsForFile(filePath: string): Pattern[] {
  const ext = getExtension(filePath);
  return ALL_PATTERNS.filter((p) => p.fileExtensions.includes(ext));
}

/** Get all extensions for a given set of language names */
export function getExtensionsForLanguages(languages: string[]): string[] {
  const extensions: string[] = [];
  for (const lang of languages) {
    const key = canonicalLanguage(lang); // FC-P1: alias-aware; closes the fail-open at source
    if (key && LANGUAGE_EXTENSIONS[key]) {
      extensions.push(...LANGUAGE_EXTENSIONS[key]);
    }
  }
  return extensions;
}
