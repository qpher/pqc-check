import { describe, it, expect } from "vitest";
import path from "node:path";
import { formatPdfReport } from "../../src/reporters/pdf.js";
import { scan } from "../../src/scanner/index.js";
import type { ScanOptions, ScanResult } from "../../src/types.js";

const FIXTURES = path.resolve(__dirname, "..", "fixtures");

function defaultOptions(target: string): ScanOptions {
  return {
    target,
    languages: [],
    format: "pdf-report",
    showLow: true,
    ignore: [],
    noSuggestions: false,
    quiet: false,
  };
}

const EMPTY_RESULT: ScanResult = {
  targetPath: "/tmp/empty",
  filesScanned: 2,
  totalFindings: 0,
  findings: { HIGH: [], MEDIUM: [], LOW: [] },
  summary: { high: 0, medium: 0, low: 0, filesWithFindings: 0 },
  durationMs: 1,
  version: "9.9.9",
};

describe("OMB M-23-02 PDF report (#263)", () => {
  it("emits a valid PDF (byte signature + EOF)", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "python-project")));
    const pdf = await formatPdfReport(result, { agency: "A", system: "B" });
    expect(pdf.length).toBeGreaterThan(1000);
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdf.subarray(-8).toString("latin1")).toContain("%%EOF");
  });

  it("renders the 7 sections across multiple pages", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "python-project")));
    const pdf = await formatPdfReport(result, { agency: "A", system: "B" });
    const text = pdf.toString("latin1");
    // pdfkit emits one /Type /Page per page; 7 sections + cover ≥ 7 pages.
    const pageCount = (text.match(/\/Type \/Page\b/g) ?? []).length;
    expect(pageCount).toBeGreaterThanOrEqual(7);
  });

  it("is byte-identical across runs in --reproducible mode", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "python-project")));
    const a = await formatPdfReport(result, { agency: "A", system: "B", reproducible: true });
    const b = await formatPdfReport(result, { agency: "A", system: "B", reproducible: true });
    expect(a.equals(b)).toBe(true);
  });

  it("produces a different report when the agency/system differ (reproducible)", async () => {
    const result = await scan(defaultOptions(path.join(FIXTURES, "python-project")));
    const a = await formatPdfReport(result, { agency: "Foo", system: "S", reproducible: true });
    const b = await formatPdfReport(result, { agency: "Bar", system: "S", reproducible: true });
    expect(a.equals(b)).toBe(false);
  });

  it("handles a clean (zero-finding) scan without throwing", async () => {
    const pdf = await formatPdfReport(EMPTY_RESULT, { agency: "A", system: "B" });
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(500);
  });
});
