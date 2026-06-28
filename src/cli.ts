#!/usr/bin/env node
import { writeFileSync, readFileSync } from "node:fs";
import { Command } from "commander";
import { scan } from "./scanner/index.js";
import { formatConsole } from "./reporters/console.js";
import { formatJson } from "./reporters/json.js";
import { formatSarif } from "./reporters/sarif.js";
import { formatCyclonedxCbom } from "./reporters/cyclonedx.js";
import { formatPdfReport } from "./reporters/pdf.js";
import { VERSION } from "./version.js";
import { resolveLanguageTokens, ALL_PATTERNS } from "./patterns/index.js";
import { serializeRulesetJson, deserializeRuleset } from "./ruleset.js";
import type { ScanOptions } from "./types.js";

const program = new Command();

program
  .name("pqc-check")
  .description("Scan your codebase for quantum-vulnerable cryptography")
  .version(VERSION);

// ── ruleset subcommand (air-gapped support, #262) ──────────────────────────
// The detection ruleset is compiled into the binary; the scanner makes ZERO
// network calls in any mode. These commands let an admin on an isolated
// network export the bundled ruleset to a reviewable/signable file and
// re-import a custom one.
const ruleset = program
  .command("ruleset")
  .description("Inspect or export the bundled detection ruleset (air-gapped support)");

ruleset
  .command("export <path>")
  .description("Write the bundled ruleset to a JSON file an admin can review + sign")
  .action((path: string) => {
    try {
      writeFileSync(path, serializeRulesetJson() + "\n", "utf8");
      console.error(`Wrote ${ALL_PATTERNS.length} patterns to ${path}`);
      process.exit(0);
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(2);
    }
  });

ruleset
  .command("import <path>")
  .description("Load + validate a ruleset file (round-trips with `export`)")
  .action((path: string) => {
    try {
      const patterns = deserializeRuleset(readFileSync(path, "utf8"));
      console.error(`Loaded + validated ${patterns.length} patterns from ${path}`);
      process.exit(0);
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(2);
    }
  });

ruleset
  .command("list")
  .description("List the bundled patterns (id, risk, name)")
  .action(() => {
    for (const p of ALL_PATTERNS) {
      console.log(`${p.id}\t${p.risk}\t${p.name}`);
    }
    process.exit(0);
  });

// ── scan (default command) ─────────────────────────────────────────────────
program
  .command("scan", { isDefault: true })
  .description("Scan a target directory for quantum-vulnerable cryptography")
  .argument("<target>", "Target directory to scan")
  .option(
    "--format <format>",
    "Output format: console, json, sarif, cyclonedx-cbom, pdf-report",
    "console",
  )
  .option("--lang <languages>", "Comma-separated list of languages to scan")
  .option("--show-low", "Show LOW risk findings", false)
  .option("--ignore <patterns>", "Comma-separated glob patterns to ignore")
  .option("--no-suggestions", "Hide the Qpher upsell footer")
  .option("--quiet", "Suppress banner and branding", false)
  .option(
    "--offline",
    "Air-gapped mode: assert zero network access (pqc-check is already fully " +
      "offline — this flag documents intent + hard-disables any future telemetry)",
    false,
  )
  .option("--agency <name>", "Agency name for the OMB M-23-02 PDF report (--format pdf-report)")
  .option("--system <name>", "System name for the OMB M-23-02 PDF report (--format pdf-report)")
  .option(
    "--reproducible",
    "Byte-identical pdf-report / cyclonedx-cbom output (omits wall-clock timestamps)",
    false,
  )
  .action(async (target: string, opts) => {
    // Validate format
    if (!["console", "json", "sarif", "cyclonedx-cbom", "pdf-report"].includes(opts.format)) {
      console.error(
        `Error: Invalid format "${opts.format}". ` +
          `Use: console, json, sarif, cyclonedx-cbom, pdf-report`,
      );
      process.exit(2);
    }

    // pdf-report writes binary to stdout — refuse to dump it to a TTY.
    if (opts.format === "pdf-report" && process.stdout.isTTY) {
      console.error(
        "Error: --format pdf-report emits a binary PDF. Redirect to a file, e.g.\n" +
          `  pqc-check ${target} --format pdf-report --agency "Foo" --system "Bar" > report.pdf`,
      );
      process.exit(2);
    }

    // FC-P1: resolve + validate --lang. Unknown tokens fail loud (exit 2) instead
    // of silently scanning the whole tree; aliases map to canonical names.
    let languages: string[] = [];
    if (opts.lang) {
      const { resolved, unknown } = resolveLanguageTokens(opts.lang.split(","));
      if (unknown.length > 0) {
        console.error(
          `Error: unknown --lang value(s): ${unknown.join(", ")}. ` +
            `Valid: python, javascript, go, java, rust, c, ruby, php, config ` +
            `(aliases: ts/js → javascript, py → python, rs → rust, rb → ruby, ` +
            `kotlin → java, cpp → c, yaml/yml/toml/ini → config).`,
        );
        process.exit(2);
      }
      languages = resolved;
    }

    const options: ScanOptions = {
      target,
      languages,
      format: opts.format as ScanOptions["format"],
      showLow: opts.showLow,
      ignore: opts.ignore ? opts.ignore.split(",").map((p: string) => p.trim()) : [],
      noSuggestions: !opts.suggestions,
      quiet: opts.quiet,
      offline: opts.offline,
    };

    try {
      const result = await scan(options);

      // Output based on format
      switch (options.format) {
        case "json":
          console.log(formatJson(result));
          break;
        case "sarif":
          console.log(formatSarif(result));
          break;
        case "cyclonedx-cbom":
          console.log(formatCyclonedxCbom(result, { reproducible: opts.reproducible }));
          break;
        case "pdf-report":
          process.stdout.write(
            await formatPdfReport(result, {
              agency: opts.agency,
              system: opts.system,
              reproducible: opts.reproducible,
            }),
          );
          break;
        case "console":
        default:
          console.log(formatConsole(result, options));
          break;
      }

      // Exit code: 1 if HIGH or MEDIUM findings, 0 otherwise
      if (result.summary.high > 0 || result.summary.medium > 0) {
        process.exit(1);
      }
      process.exit(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(2);
    }
  });

program.parse();
