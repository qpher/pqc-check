import type { ScanResult, Pattern, RiskLevel } from "../types.js";
import { ALL_PATTERNS } from "../patterns/index.js";

/** Map risk level to SARIF level */
function toSarifLevel(risk: RiskLevel): string {
  switch (risk) {
    case "HIGH":
      return "error";
    case "MEDIUM":
      return "warning";
    case "LOW":
      return "note";
  }
}

/** Build SARIF rule from pattern */
function patternToRule(pattern: Pattern) {
  return {
    id: pattern.id,
    name: pattern.name,
    shortDescription: { text: pattern.name },
    fullDescription: { text: pattern.description },
    helpUri: `https://docs.qpher.ai/guides/migration-guide#${pattern.category.toLowerCase()}`,
    defaultConfiguration: {
      level: toSarifLevel(pattern.risk),
    },
    properties: {
      tags: ["security", "quantum", "cryptography", pattern.category.toLowerCase()],
    },
  };
}

/** Format scan results as SARIF v2.1.0 */
export function formatSarif(result: ScanResult): string {
  const allFindings = [
    ...result.findings.HIGH,
    ...result.findings.MEDIUM,
    ...result.findings.LOW,
  ];

  // Collect unique pattern IDs used in findings
  const usedPatternIds = new Set(allFindings.map((f) => f.pattern.id));
  const usedPatterns = ALL_PATTERNS.filter((p) => usedPatternIds.has(p.id));

  // Build rule index map
  const ruleIndex = new Map<string, number>();
  usedPatterns.forEach((p, i) => ruleIndex.set(p.id, i));

  const sarif = {
    $schema:
      "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/main/sarif-2.1/schema/sarif-schema-2.1.0.json",
    version: "2.1.0" as const,
    runs: [
      {
        tool: {
          driver: {
            name: "pqc-check",
            version: result.version,
            informationUri: "https://github.com/qpher/pqc-check",
            rules: usedPatterns.map(patternToRule),
          },
        },
        results: allFindings.map((f) => ({
          ruleId: f.pattern.id,
          ruleIndex: ruleIndex.get(f.pattern.id),
          level: toSarifLevel(f.pattern.risk),
          message: {
            text: `${f.pattern.name}: ${f.pattern.description}. ${f.pattern.suggestion}`,
          },
          locations: [
            {
              physicalLocation: {
                artifactLocation: {
                  uri: f.relativeFilePath,
                  uriBaseId: "%SRCROOT%",
                },
                region: {
                  startLine: f.line,
                  startColumn: f.column,
                  snippet: { text: f.lineContent },
                },
              },
            },
          ],
        })),
      },
    ],
  };

  return JSON.stringify(sarif, null, 2);
}
