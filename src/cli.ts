#!/usr/bin/env node
import { Command } from "commander";
import { scan } from "./scanner/index.js";
import { formatConsole } from "./reporters/console.js";
import { formatJson } from "./reporters/json.js";
import { formatSarif } from "./reporters/sarif.js";
import { VERSION } from "./version.js";
import { resolveLanguageTokens } from "./patterns/index.js";
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
  .option("--no-suggestions", "Hide the Qpher upsell footer")
  .option("--quiet", "Suppress banner and branding", false)
  .action(async (target: string, opts) => {
    // Validate format
    if (!["console", "json", "sarif"].includes(opts.format)) {
      console.error(`Error: Invalid format "${opts.format}". Use: console, json, sarif`);
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
