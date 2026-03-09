import path from "node:path";
import type { Pattern, Finding } from "../types.js";

export interface MatchOptions {
  /** The file content as a string */
  content: string;
  /** The file path (absolute) */
  filePath: string;
  /** Root directory (for relative path calculation) */
  rootDir: string;
  /** Patterns to match against */
  patterns: Pattern[];
}

/** Match patterns against file content and return findings */
export function matchPatterns(options: MatchOptions): Finding[] {
  const { content, filePath, rootDir, patterns } = options;
  const lines = content.split("\n");
  const relativeFilePath = path.relative(rootDir, filePath);
  const findings: Finding[] = [];

  // Track matches per line to de-duplicate same-category hits
  const lineMatches = new Map<string, Finding>();

  for (const pattern of patterns) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = pattern.regex.exec(line);
      if (!match) continue;

      const lineNumber = i + 1;
      const column = match.index + 1;
      const dedupeKey = `${lineNumber}:${pattern.category}`;

      const existing = lineMatches.get(dedupeKey);
      if (existing) {
        // Keep the higher risk finding for same line+category
        const riskOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        if (riskOrder[pattern.risk] > riskOrder[existing.pattern.risk]) {
          const finding: Finding = {
            pattern,
            filePath,
            relativeFilePath,
            line: lineNumber,
            column,
            matchedText: match[0],
            lineContent: line,
          };
          lineMatches.set(dedupeKey, finding);
        }
      } else {
        const finding: Finding = {
          pattern,
          filePath,
          relativeFilePath,
          line: lineNumber,
          column,
          matchedText: match[0],
          lineContent: line,
        };
        lineMatches.set(dedupeKey, finding);
      }
    }
  }

  findings.push(...lineMatches.values());

  // Sort by: risk (HIGH first) -> file path -> line number
  const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  findings.sort((a, b) => {
    const riskDiff = riskOrder[a.pattern.risk] - riskOrder[b.pattern.risk];
    if (riskDiff !== 0) return riskDiff;
    const pathDiff = a.relativeFilePath.localeCompare(b.relativeFilePath);
    if (pathDiff !== 0) return pathDiff;
    return a.line - b.line;
  });

  return findings;
}
