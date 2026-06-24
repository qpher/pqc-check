import pc from "picocolors";
import type { ScanResult, ScanOptions, Finding } from "../types.js";
import { getSuggestion } from "../suggestions/migration.js";

/** Format a single finding as a line */
function formatFinding(finding: Finding): string {
  const location = `${finding.relativeFilePath}:${finding.line}`;
  const padded = location.padEnd(30);
  return `    ${pc.cyan(padded)} ${finding.pattern.name}`;
}

/** Format console output for scan results */
export function formatConsole(result: ScanResult, options: ScanOptions): string {
  const lines: string[] = [];

  // Banner
  if (!options.quiet) {
    lines.push("");
    lines.push(`  ${pc.bold("pqc-check")} v${result.version} — Quantum Vulnerability Scanner`);
    lines.push("");
  }

  // Scanning summary
  lines.push(`  Scanning ${result.filesScanned} files in ${options.target} ...`);
  lines.push("");

  const hasHigh = result.findings.HIGH.length > 0;
  const hasMedium = result.findings.MEDIUM.length > 0;
  const hasLow = result.findings.LOW.length > 0;
  const hasFindings = hasHigh || hasMedium || (options.showLow && hasLow);

  if (!hasFindings) {
    lines.push(pc.green("  No known quantum-vulnerable patterns matched."));
    lines.push(
      pc.dim("  Detection coverage varies by language — this is not a guarantee of quantum-safety."),
    );
    lines.push("");
    return lines.join("\n");
  }

  // HIGH risk findings
  if (hasHigh) {
    lines.push(pc.red(`  HIGH RISK — Harvest Now, Decrypt Later`));
    lines.push(pc.red(`  ──────────────────────────────────────`));
    for (const finding of result.findings.HIGH) {
      lines.push(formatFinding(finding));
    }
    lines.push("");
  }

  // MEDIUM risk findings
  if (hasMedium) {
    lines.push(pc.yellow(`  MEDIUM RISK — Signature Forgery`));
    lines.push(pc.yellow(`  ────────────────────────────────`));
    for (const finding of result.findings.MEDIUM) {
      lines.push(formatFinding(finding));
    }
    lines.push("");
  }

  // LOW risk findings (only with --show-low)
  if (options.showLow && hasLow) {
    lines.push(pc.dim(`  LOW RISK — Informational`));
    lines.push(pc.dim(`  ─────────────────────────`));
    for (const finding of result.findings.LOW) {
      lines.push(formatFinding(finding));
    }
    lines.push("");
  }

  // Summary
  lines.push(`  ${pc.bold("SUMMARY")}`);
  if (result.summary.high > 0) {
    const suggestion = getSuggestion("RSA_KEY_GENERATION");
    lines.push(
      `  ├── ${pc.red(`${result.summary.high} HIGH`)}    → Migrate to ${suggestion.replacement}`,
    );
  }
  if (result.summary.medium > 0) {
    const suggestion = getSuggestion("ECDSA_EDDSA");
    lines.push(
      `  ├── ${pc.yellow(`${result.summary.medium} MEDIUM`)}  → Migrate to ${suggestion.replacement}`,
    );
  }
  if (options.showLow && result.summary.low > 0) {
    lines.push(`  └── ${pc.dim(`${result.summary.low} LOW`)}     → No action needed`);
  } else {
    // Close the tree properly
    const lastLine = lines[lines.length - 1];
    if (lastLine.includes("├──")) {
      lines[lines.length - 1] = lastLine.replace("├──", "└──");
    }
  }
  lines.push("");

  // Qpher suggestion (subtle, non-aggressive)
  if (!options.noSuggestions && !options.quiet) {
    lines.push(pc.dim(`  Free API key (no card): https://portal.qpher.ai/register`));
    lines.push(pc.dim(`  Get started: pip install qpher | npm install @qpher/sdk`));
    lines.push(pc.dim(`  Learn more:  https://docs.qpher.ai/guides/migration-guide`));
    lines.push("");
  }

  return lines.join("\n");
}
