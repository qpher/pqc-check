import type { ScanResult } from "../types.js";
import { getSuggestion } from "../suggestions/migration.js";

/** Format scan results as JSON */
export function formatJson(result: ScanResult): string {
  const allFindings = [
    ...result.findings.HIGH,
    ...result.findings.MEDIUM,
    ...result.findings.LOW,
  ];

  const output = {
    version: result.version,
    scanner: "pqc-check",
    target: result.targetPath,
    timestamp: new Date().toISOString(),
    filesScanned: result.filesScanned,
    summary: {
      total: result.totalFindings,
      high: result.summary.high,
      medium: result.summary.medium,
      low: result.summary.low,
      filesWithFindings: result.summary.filesWithFindings,
    },
    findings: allFindings.map((f) => {
      const suggestion = getSuggestion(f.pattern.category);
      return {
        id: f.pattern.id,
        name: f.pattern.name,
        risk: f.pattern.risk,
        category: f.pattern.category,
        file: f.relativeFilePath,
        line: f.line,
        column: f.column,
        matchedText: f.matchedText,
        lineContent: f.lineContent,
        description: f.pattern.description,
        suggestion: {
          replacement: suggestion.replacement,
          alternatives: suggestion.alternatives,
          qpherHint: suggestion.qpherHint,
        },
      };
    }),
    durationMs: result.durationMs,
  };

  return JSON.stringify(output, null, 2);
}
