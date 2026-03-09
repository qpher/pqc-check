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
    const key = lang.toLowerCase();
    if (LANGUAGE_EXTENSIONS[key]) {
      extensions.push(...LANGUAGE_EXTENSIONS[key]);
    }
  }
  return extensions;
}
