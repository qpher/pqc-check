import { createHash } from "node:crypto";
import PDFDocument from "pdfkit";
import type { Finding, PatternCategory, RiskLevel, ScanResult } from "../types.js";
import { formatCyclonedxCbom } from "./cyclonedx.js";

/**
 * OMB M-23-02 PDF inventory report (#263).
 *
 * Produces the raw material an agency CISO can submit (with light editing) to
 * OMB as part of the M-23-02 post-quantum migration reporting cadence. Seven
 * sections (cover, executive summary, cryptographic inventory, migration
 * priority, recommended migration paths, methodology + provenance, appendices)
 * map to the reporting requirements, and the CycloneDX CBOM is embedded for
 * machine verification.
 *
 * `--reproducible` produces byte-identical output for the same scan by fixing
 * the PDF metadata dates and the file ID and omitting all wall-clock content.
 */

export interface PdfReportOptions {
  agency?: string;
  system?: string;
  /** Byte-identical output for the same scan (CI / federal review). */
  reproducible?: boolean;
}

const INDIGO = "#4A3CD8"; // Quantum Violet (ADR-0051)
const INK = "#1B1A17";
const MUTED = "#6B6B6B";
const RED = "#C0392B";
const AMBER = "#B7791F";
const GREEN = "#1E7E45";

/** Per-category PQC migration target (recommended replacement). */
const MIGRATION_TARGET: Record<PatternCategory, string> = {
  RSA_KEY_GENERATION: "ML-KEM-1024 (FIPS 203) for key establishment",
  RSA_ENCRYPTION: "ML-KEM-1024 (FIPS 203) hybrid KEM-DEM",
  RSA_SIGNING: "ML-DSA-87 (FIPS 204)",
  ECDSA_EDDSA: "ML-DSA-87 (FIPS 204)",
  DH_KEY_EXCHANGE: "ML-KEM-1024 (FIPS 203)",
  HASH_FUNCTION: "SHA-384 / SHA-512 (truncation-resistant)",
  CONFIG_FILE: "PQC-enabled TLS (hybrid X25519+ML-KEM-768 → ML-KEM-1024)",
};

/**
 * Harvest-now-decrypt-later weighting: key-establishment + encryption are the
 * most urgent (captured ciphertext is decryptable once a quantum computer
 * exists); signing is urgent but not retroactively breakable.
 */
const HNDL_CATEGORIES = new Set<PatternCategory>([
  "RSA_KEY_GENERATION",
  "RSA_ENCRYPTION",
  "DH_KEY_EXCHANGE",
  "CONFIG_FILE",
]);

const RISK_RANK: Record<RiskLevel, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

function allFindings(result: ScanResult): Finding[] {
  return [...result.findings.HIGH, ...result.findings.MEDIUM, ...result.findings.LOW];
}

/** Migration-priority order: risk, then harvest-now-decrypt-later, then file. */
function priorityOrder(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => {
    const r = RISK_RANK[a.pattern.risk] - RISK_RANK[b.pattern.risk];
    if (r !== 0) return r;
    const h =
      Number(HNDL_CATEGORIES.has(b.pattern.category)) -
      Number(HNDL_CATEGORIES.has(a.pattern.category));
    if (h !== 0) return h;
    return a.relativeFilePath.localeCompare(b.relativeFilePath) || a.line - b.line;
  });
}

function trafficLight(result: ScanResult): { label: string; color: string } {
  if (result.summary.high > 0)
    return { label: "RED — quantum-vulnerable cryptography in use", color: RED };
  if (result.summary.medium > 0) return { label: "AMBER — review required", color: AMBER };
  return { label: "GREEN — no quantum-vulnerable cryptography detected", color: GREEN };
}

function paramSet(finding: Finding): string {
  const m = `${finding.matchedText} ${finding.lineContent}`.match(
    /\b(1024|2048|3072|4096|192|224|256|384|521)\b/,
  );
  return m ? m[1] : "—";
}

export function formatPdfReport(result: ScanResult, opts: PdfReportOptions = {}): Promise<Buffer> {
  const findings = allFindings(result);
  const agency = opts.agency ?? "[Agency Name]";
  const system = opts.system ?? "[System Name]";

  // Embed the (reproducible) CBOM + its SHA-256 for machine verification.
  const cbomJson = formatCyclonedxCbom(result, { reproducible: opts.reproducible });
  const cbomHash = createHash("sha256").update(cbomJson).digest("hex");
  // Cover "scan fingerprint" = SHA-256 of the canonical CBOM (deterministic in
  // reproducible mode); covers every finding + its source location.
  const scanFingerprint = cbomHash;

  const fixedDate = new Date(0); // 1970-01-01 — used only in reproducible mode
  const doc = new PDFDocument({
    size: "LETTER",
    margin: 56,
    info: {
      Title: `Post-Quantum Cryptography Inventory — ${system}`,
      Author: "pqc-check",
      Creator: "pqc-check",
      Producer: "pqc-check",
      ...(opts.reproducible ? { CreationDate: fixedDate, ModDate: fixedDate } : {}),
    },
  });
  // Deterministic file ID in reproducible mode (pdfkit otherwise randomises it).
  if (opts.reproducible) {
    // @ts-expect-error pdfkit's _id is internal but the only deterministic hook.
    doc._id = Buffer.from(cbomHash.slice(0, 32), "hex");
  }

  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const W = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  const h1 = (t: string) =>
    doc.fillColor(INDIGO).fontSize(16).font("Helvetica-Bold").text(t).moveDown(0.4);
  const body = (t: string) =>
    doc.fillColor(INK).fontSize(10).font("Helvetica").text(t).moveDown(0.3);
  const muted = (t: string) => doc.fillColor(MUTED).fontSize(8).font("Helvetica").text(t);

  // ── 1. Cover ───────────────────────────────────────────────────────────
  doc.moveDown(4);
  doc
    .fillColor(INDIGO)
    .fontSize(28)
    .font("Helvetica-Bold")
    .text("Post-Quantum Cryptography", { align: "center" });
  doc
    .fillColor(INK)
    .fontSize(20)
    .font("Helvetica")
    .text("Cryptographic Inventory Report", { align: "center" });
  doc.moveDown(2);
  doc.fontSize(13).fillColor(INK).font("Helvetica-Bold").text(agency, { align: "center" });
  doc.font("Helvetica").text(`System: ${system}`, { align: "center" });
  doc.moveDown(1.5);
  doc.fontSize(9).fillColor(MUTED).font("Helvetica");
  doc.text(
    `Scan date: ${opts.reproducible ? "(reproducible mode — date omitted)" : new Date().toISOString().slice(0, 10)}`,
    { align: "center" },
  );
  doc.text(`Tool: pqc-check v${result.version}`, { align: "center" });
  doc.text(`Scan fingerprint (SHA-256): ${scanFingerprint}`, { align: "center" });
  doc.moveDown(3);
  doc
    .fontSize(8)
    .fillColor(MUTED)
    .text(
      "Prepared in alignment with OMB M-23-02 (Migrating to Post-Quantum Cryptography). " +
        "This report inventories quantum-vulnerable cryptography; it is not an assertion of " +
        "FIPS 140-3 validation or accreditation.",
      { align: "center" },
    );

  // ── 2. Executive summary ────────────────────────────────────────────────
  doc.addPage();
  h1("2. Executive Summary");
  const tl = trafficLight(result);
  doc.fillColor(tl.color).fontSize(12).font("Helvetica-Bold").text(tl.label).moveDown(0.5);
  body(`Files scanned: ${result.filesScanned}`);
  body(`Total quantum-vulnerable components: ${result.totalFindings}`);
  body(`  • HIGH (harvest-now-decrypt-later): ${result.summary.high}`);
  body(`  • MEDIUM: ${result.summary.medium}`);
  body(`  • LOW: ${result.summary.low}`);
  body(`Non-vulnerable: not separately enumerated (pqc-check reports only vulnerable usage).`);

  // ── 3. Cryptographic inventory table ────────────────────────────────────
  doc.addPage();
  h1("3. Cryptographic Inventory");
  drawTable(
    doc,
    W,
    ["Algorithm", "Param", "NIST QSL", "Location", "Risk"],
    [0.22, 0.1, 0.12, 0.42, 0.14],
    findings.map((f) => [
      f.pattern.name,
      paramSet(f),
      "0",
      `${f.relativeFilePath}:${f.line}`,
      f.pattern.risk,
    ]),
  );

  // ── 4. Migration priority ranking ───────────────────────────────────────
  doc.addPage();
  h1("4. Migration Priority Ranking");
  muted(
    "Ordered by risk, then harvest-now-decrypt-later exposure (key establishment + encryption before signing).",
  );
  doc.moveDown(0.5);
  const ranked = priorityOrder(findings);
  drawTable(
    doc,
    W,
    ["#", "Algorithm", "Location", "Risk", "HNDL"],
    [0.07, 0.27, 0.4, 0.13, 0.13],
    ranked.map((f, i) => [
      String(i + 1),
      f.pattern.name,
      `${f.relativeFilePath}:${f.line}`,
      f.pattern.risk,
      HNDL_CATEGORIES.has(f.pattern.category) ? "Yes" : "No",
    ]),
  );

  // ── 5. Recommended migration paths ──────────────────────────────────────
  doc.addPage();
  h1("5. Recommended Migration Paths");
  const seen = new Set<PatternCategory>();
  for (const f of findings) {
    if (seen.has(f.pattern.category)) continue;
    seen.add(f.pattern.category);
    doc.fillColor(INK).fontSize(10).font("Helvetica-Bold").text(f.pattern.name);
    doc
      .fillColor(INDIGO)
      .font("Helvetica")
      .text(`  → ${MIGRATION_TARGET[f.pattern.category]}`)
      .moveDown(0.4);
  }
  if (seen.size === 0) body("No quantum-vulnerable cryptography detected — no migration required.");

  // ── 6. Methodology + tool provenance ────────────────────────────────────
  doc.addPage();
  h1("6. Methodology & Tool Provenance");
  body(
    "pqc-check statically scans source code for quantum-vulnerable cryptographic primitives using a compiled-in ruleset (no network access). Detection coverage varies by language and is not a guarantee of quantum-safety.",
  );
  body(`Tool: pqc-check v${result.version}`);
  body(`CycloneDX CBOM SHA-256: ${cbomHash}`);
  body(`Reproducible mode: ${opts.reproducible ? "ON (byte-identical output)" : "OFF"}`);

  // ── 7. Appendices: embedded CBOM ────────────────────────────────────────
  doc.addPage();
  h1("7. Appendix A — Embedded CycloneDX CBOM");
  muted(
    "The full machine-readable CBOM (CycloneDX 1.6) is reproduced below for verification. Its SHA-256 is recorded in §6.",
  );
  doc.moveDown(0.5);
  doc.fillColor(INK).fontSize(6).font("Courier").text(cbomJson, { width: W });

  doc.end();
  return done;
}

/** Minimal fixed-width table (pdfkit has no built-in tables). */
function drawTable(
  doc: PDFKit.PDFDocument,
  width: number,
  headers: string[],
  colFractions: number[],
  rows: string[][],
): void {
  const cols = colFractions.map((f) => f * width);
  const startX = doc.page.margins.left;
  const rowH = 16;

  const renderRow = (cells: string[], bold: boolean) => {
    const y = doc.y;
    if (doc.y + rowH > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
    }
    let x = startX;
    doc
      .fontSize(8)
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .fillColor(bold ? "#FFFFFF" : INK);
    if (bold) doc.rect(startX, doc.y - 2, width, rowH).fill(INDIGO);
    cells.forEach((cell, i) => {
      doc
        .fillColor(bold ? "#FFFFFF" : INK)
        .text(cell, x + 2, y, { width: cols[i] - 4, ellipsis: true });
      x += cols[i];
    });
    doc.y = y + rowH;
  };

  renderRow(headers, true);
  if (rows.length === 0) {
    doc
      .fontSize(8)
      .fillColor(MUTED)
      .font("Helvetica")
      .text("(no findings)", startX + 2, doc.y + 2);
    doc.moveDown();
    return;
  }
  rows.forEach((r) => renderRow(r, false));
}
