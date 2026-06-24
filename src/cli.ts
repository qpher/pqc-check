#!/usr/bin/env node
import { Command } from "commander";
import { scan } from "./scanner/index.js";
import { formatConsole } from "./reporters/console.js";
import { formatJson } from "./reporters/json.js";
import { formatSarif } from "./reporters/sarif.js";
import { VERSION } from "./version.js";
import type { ScanOptions } from "./types.js";

const program = new Command();

program
  .name("pqc-check")
  .description("Scan your codebase for quantum-vulnerable cryptography")
  .version(VERSION)
  .argument("<target>", "Target directory to scan")
  .option("--format <format>", "Output format: console, json, sarif", "console")
  .option("--lang <languages>", "Comma-separated list of languages to scan")
  .option("--show-low", "Show LOW risk findings", false)
  .option("--ignore <patterns>", "Comma-separated glob patterns to ignore")
  .option("--no-suggestions", "Hide Qpher migration suggestions")
  .option("--quiet", "Suppress banner and branding", false)
  .action(async (target: string, opts) => {
    const options: ScanOptions = {
      target,
      languages: opts.lang ? opts.lang.split(",").map((l: string) => l.trim()) : [],
      format: opts.format as ScanOptions["format"],
      showLow: opts.showLow,
      ignore: opts.ignore ? opts.ignore.split(",").map((p: string) => p.trim()) : [],
      noSuggestions: !opts.suggestions,
      quiet: opts.quiet,
    };

    // Validate format
    if (!["console", "json", "sarif"].includes(options.format)) {
      console.error(`Error: Invalid format "${options.format}". Use: console, json, sarif`);
      process.exit(2);
    }

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
