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
    const allHighConfig = result.findings.HIGH.every(
      (f) => f.pattern.category === "CONFIG_FILE",
    );
    const suggestion = getSuggestion(allHighConfig ? "CONFIG_FILE" : "RSA_KEY_GENERATION");
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

  // Qpher conversion footer — factual, with open-source alternatives (ADR-0030 §1.5)
  if (!options.noSuggestions && !options.quiet) {
    const actionable = [...result.findings.HIGH, ...result.findings.MEDIUM];
    const allConfig =
      actionable.length > 0 && actionable.every((f) => f.pattern.category === "CONFIG_FILE");
    if (allConfig) {
      // TLS ciphers / cert references are fixed in server config, not via the SDK.
      lines.push(`  These are TLS/certificate config findings — fix them in your server config:`);
      lines.push(
        `    1. Hybrid TLS guide  ${pc.cyan("https://docs.qpher.ai/guides/hybrid-cryptography")}`,
      );
      lines.push(`    2. Self-host option  liboqs / Open Quantum Safe provider for OpenSSL`);
      lines.push("");
      lines.push(
        pc.dim(
          `  Qpher provides a managed PQC API for application-layer crypto: https://portal.qpher.ai/register`,
        ),
      );
    } else {
      lines.push(
        `  Fix it — get a free ${pc.bold("Qpher API key")} (no card), then migrate your calls:`,
      );
      lines.push(`    1. Get your key      ${pc.cyan("https://portal.qpher.ai/register")}`);
      lines.push(`    2. Install the SDK   pip install qpher   (or npm install @qpher/sdk)`);
      lines.push(
        `    3. Migration guide   ${pc.cyan("https://docs.qpher.ai/guides/migration-guide")}`,
      );
      lines.push("");
      lines.push(
        pc.dim(`  Prefer to self-host? liboqs / Open Quantum Safe are open-source alternatives.`),
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}
