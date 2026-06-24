import fs from "node:fs/promises";
import path from "node:path";
import type { ScanOptions, ScanResult, Finding } from "../types.js";
import { walkFiles } from "./file-walker.js";
import { matchPatterns } from "./pattern-engine.js";
import { getPatternsForFile, getExtensionsForLanguages } from "../patterns/index.js";
import { VERSION } from "../version.js";

const CONCURRENCY = 10;

/** Run a scan against the target path */
export async function scan(options: ScanOptions): Promise<ScanResult> {
  const startTime = Date.now();
  const targetPath = path.resolve(options.target);

  // Validate target exists and is a directory
  const stat = await fs.stat(targetPath);
  if (!stat.isDirectory()) {
    throw new Error(`Target path is not a directory: ${targetPath}`);
  }

  // Determine file extensions to scan
  const extensions =
    options.languages.length > 0 ? getExtensionsForLanguages(options.languages) : [];

  // Walk files
  const files = await walkFiles({
    rootDir: targetPath,
    extensions,
    ignorePatterns: options.ignore,
  });

  // Scan files with concurrency limit
  const allFindings: Finding[] = [];

  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (filePath) => {
        try {
          const content = await fs.readFile(filePath, "utf-8");
          const patterns = getPatternsForFile(filePath);
          if (patterns.length === 0) return [];
          return matchPatterns({ content, filePath, rootDir: targetPath, patterns });
        } catch {
          // Skip files that can't be read
          return [];
        }
      }),
    );
    for (const findings of batchResults) {
      allFindings.push(...findings);
    }
  }

  // Group findings by risk
  const findings = {
    HIGH: allFindings.filter((f) => f.pattern.risk === "HIGH"),
    MEDIUM: allFindings.filter((f) => f.pattern.risk === "MEDIUM"),
    LOW: allFindings.filter((f) => f.pattern.risk === "LOW"),
  };

  // Count unique files with findings
  const filesWithFindings = new Set(allFindings.map((f) => f.filePath)).size;

  const durationMs = Date.now() - startTime;

  return {
    targetPath,
    filesScanned: files.length,
    totalFindings: allFindings.length,
    findings,
    summary: {
      high: findings.HIGH.length,
      medium: findings.MEDIUM.length,
      low: findings.LOW.length,
      filesWithFindings,
    },
    durationMs,
    version: VERSION,
  };
}
