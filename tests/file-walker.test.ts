import { describe, it, expect } from "vitest";
import path from "node:path";
import fs from "node:fs/promises";
import { walkFiles } from "../src/scanner/file-walker.js";

const FIXTURES = path.resolve(__dirname, "fixtures");

describe("file-walker", () => {
  it("discovers Python files recursively", async () => {
    const files = await walkFiles({
      rootDir: path.join(FIXTURES, "python-project"),
      extensions: [".py"],
      ignorePatterns: [],
    });
    expect(files.length).toBeGreaterThan(0);
    expect(files.every((f) => f.endsWith(".py"))).toBe(true);
  });

  it("discovers JavaScript files", async () => {
    const files = await walkFiles({
      rootDir: path.join(FIXTURES, "node-project"),
      extensions: [".js"],
      ignorePatterns: [],
    });
    expect(files.length).toBeGreaterThan(0);
    expect(files.every((f) => f.endsWith(".js"))).toBe(true);
  });

  it("discovers Go files", async () => {
    const files = await walkFiles({
      rootDir: path.join(FIXTURES, "go-project"),
      extensions: [".go"],
      ignorePatterns: [],
    });
    expect(files.length).toBeGreaterThan(0);
    expect(files.every((f) => f.endsWith(".go"))).toBe(true);
  });

  it("discovers Java files", async () => {
    const files = await walkFiles({
      rootDir: path.join(FIXTURES, "java-project"),
      extensions: [".java"],
      ignorePatterns: [],
    });
    expect(files.length).toBeGreaterThan(0);
    expect(files.every((f) => f.endsWith(".java"))).toBe(true);
  });

  it("discovers config files", async () => {
    const files = await walkFiles({
      rootDir: path.join(FIXTURES, "config-files"),
      extensions: [".conf"],
      ignorePatterns: [],
    });
    expect(files.length).toBeGreaterThan(0);
  });

  it("discovers all supported files when no extensions specified", async () => {
    const files = await walkFiles({
      rootDir: path.join(FIXTURES, "mixed-project"),
      extensions: [],
      ignorePatterns: [],
    });
    const extensions = files.map((f) => path.extname(f));
    expect(extensions).toContain(".py");
    expect(extensions).toContain(".js");
    expect(extensions).toContain(".go");
  });

  it("respects ignore patterns", async () => {
    const files = await walkFiles({
      rootDir: path.join(FIXTURES, "mixed-project"),
      extensions: [],
      ignorePatterns: ["*.py"],
    });
    expect(files.every((f) => !f.endsWith(".py"))).toBe(true);
  });

  it("returns empty array for empty directory", async () => {
    const emptyDir = path.join(FIXTURES, "__empty_test_dir__");
    await fs.mkdir(emptyDir, { recursive: true });
    try {
      const files = await walkFiles({
        rootDir: emptyDir,
        extensions: [],
        ignorePatterns: [],
      });
      expect(files).toEqual([]);
    } finally {
      await fs.rmdir(emptyDir);
    }
  });

  it("returns sorted file list", async () => {
    const files = await walkFiles({
      rootDir: path.join(FIXTURES, "mixed-project"),
      extensions: [],
      ignorePatterns: [],
    });
    const sorted = [...files].sort();
    expect(files).toEqual(sorted);
  });

  it("respects .pqcignore file", async () => {
    const testDir = path.join(FIXTURES, "__pqcignore_test__");
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(path.join(testDir, ".pqcignore"), "ignored.py\n");
    await fs.writeFile(path.join(testDir, "ignored.py"), "# ignored");
    await fs.writeFile(path.join(testDir, "included.py"), "# included");
    try {
      const files = await walkFiles({
        rootDir: testDir,
        extensions: [".py"],
        ignorePatterns: [],
      });
      expect(files.some((f) => f.includes("included.py"))).toBe(true);
      expect(files.some((f) => f.includes("ignored.py"))).toBe(false);
    } finally {
      await fs.rm(testDir, { recursive: true });
    }
  });
});
