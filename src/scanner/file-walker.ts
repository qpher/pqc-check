import fs from "node:fs/promises";
import path from "node:path";
import ignore, { type Ignore } from "ignore";
import { ALL_EXTENSIONS } from "../patterns/index.js";

export interface WalkOptions {
  /** Root directory to scan */
  rootDir: string;
  /** File extensions to include (empty = all supported) */
  extensions: string[];
  /** Glob patterns to ignore */
  ignorePatterns: string[];
}

/** Built-in directory/file patterns to always ignore */
const BUILTIN_IGNORE = [
  "node_modules",
  ".git",
  "__pycache__",
  ".venv",
  "venv",
  "dist",
  "build",
  "target",
  "vendor",
  ".next",
  ".nuxt",
  "coverage",
  "*.min.js",
  "*.min.css",
  "*.map",
  "*.lock",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "go.sum",
  "*.wasm",
  "*.so",
  "*.dylib",
  "*.dll",
  "*.exe",
  "*.bin",
  "*.png",
  "*.jpg",
  "*.gif",
  "*.svg",
  "*.ico",
  "*.pdf",
];

/** Max file size to scan (5MB) */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Load ignore patterns from a file if it exists */
async function loadIgnoreFile(filePath: string): Promise<string[]> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
  } catch {
    return [];
  }
}

/** Check if a file is likely binary by reading the first 512 bytes */
async function isBinaryFile(filePath: string): Promise<boolean> {
  try {
    const fd = await fs.open(filePath, "r");
    const buffer = Buffer.alloc(512);
    const { bytesRead } = await fd.read(buffer, 0, 512, 0);
    await fd.close();
    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) return true;
    }
    return false;
  } catch {
    return true;
  }
}

/** Recursively walk a directory tree, respecting ignore patterns */
export async function walkFiles(options: WalkOptions): Promise<string[]> {
  const { rootDir, extensions, ignorePatterns } = options;
  const allowedExtensions = extensions.length > 0 ? extensions : ALL_EXTENSIONS;

  // Build the ignore filter
  const ig: Ignore = ignore();
  ig.add(BUILTIN_IGNORE);
  ig.add(ignorePatterns);

  // Load .gitignore and .pqcignore if present
  const gitignorePatterns = await loadIgnoreFile(path.join(rootDir, ".gitignore"));
  const pqcignorePatterns = await loadIgnoreFile(path.join(rootDir, ".pqcignore"));
  ig.add(gitignorePatterns);
  ig.add(pqcignorePatterns);

  const files: string[] = [];

  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      // Permission denied or other error — skip
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(rootDir, fullPath);

      // Check ignore patterns
      if (ig.ignores(relativePath)) continue;

      if (entry.isDirectory()) {
        // Don't follow symlinks
        if (entry.isSymbolicLink()) continue;
        await walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!allowedExtensions.includes(ext)) continue;

        // Skip large files
        try {
          const stat = await fs.stat(fullPath);
          if (stat.size > MAX_FILE_SIZE) continue;
        } catch {
          continue;
        }

        // Skip binary files
        if (await isBinaryFile(fullPath)) continue;

        files.push(fullPath);
      }
    }
  }

  await walk(rootDir);
  return files.sort();
}
