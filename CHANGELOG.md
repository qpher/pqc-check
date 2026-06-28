# Changelog

All notable changes to `pqc-check` are documented here. This project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2026-06-27

### Added

- **OMB M-23-02 PDF inventory report (#263).** New `--format pdf-report`
  generates a federal-reporting-ready PDF with all seven OMB M-23-02 sections:
  (1) cover with agency/system/scan-fingerprint, (2) executive summary with
  traffic-light status, (3) cryptographic inventory table, (4) migration
  priority ranking (risk + harvest-now-decrypt-later weighting), (5) recommended
  migration paths (RSA→ML-KEM-1024, ECDSA→ML-DSA-87, …), (6) methodology + tool
  provenance with the embedded-CBOM SHA-256, (7) appendix with the full embedded
  CycloneDX 1.6 CBOM.
  - `--agency <name>` / `--system <name>` populate the report header.
  - `--reproducible` produces **byte-identical** output for the same scan (fixes
    PDF metadata dates + file ID, derives the CBOM serial from content, omits
    all wall-clock timestamps) — for federal review + CI diffing. Also applies to
    `--format cyclonedx-cbom`.
  - Dependency: `pdfkit` (~1 MB) — keeps the lightweight-npx positioning
    (vs a ~150 MB headless-browser approach).

### Notes

- Out of scope for this release (tracked separately): two published example PDFs
  (case studies) and the `docs.qpher.ai/oss/pqc-check/omb-m-23-02-report` page.

## [1.5.0] - 2026-06-27

### Added

- **CycloneDX 1.6 Cryptographic Bill of Materials (CBOM) output (#261).** New
  `--format cyclonedx-cbom` emits a NIST IR 8413-aligned CBOM so pqc-check can
  feed the cryptographic-inventory requirement of OMB M-23-02. Each finding
  becomes a `cryptographic-asset` component with
  `cryptoProperties.algorithmProperties` (primitive, cryptoFunctions,
  parameterSetIdentifier when a key size is detectable, and
  `nistQuantumSecurityLevel: 0` since every flagged algorithm is
  quantum-vulnerable) plus `evidence.occurrences[]` pointing at the source
  location. The BOM carries pqc-check as the generating tool and a
  `urn:uuid:` serial number.

## [1.4.0] - 2026-06-27

### Added

- **Air-gapped / classified-network support (#262).** pqc-check makes **zero
  network calls in any mode** — the detection ruleset is compiled into the
  binary. New surfaces make that explicit for federal / SIPR / JWICS use:
  - `--offline` flag on `scan` — documents air-gapped intent and hard-disables
    any future telemetry (there is none today). Behaviour is unchanged because
    the scanner is already fully offline.
  - `pqc-check ruleset export <path>` — write the bundled ruleset to a JSON file
    an administrator can review, diff, and sign before transfer to an isolated
    network.
  - `pqc-check ruleset import <path>` — load + validate a ruleset file
    (round-trips identically with `export`; fails loud on schema / regex /
    duplicate-id errors).
  - `pqc-check ruleset list` — enumerate the bundled patterns.
  - New `tests/offline-guarantee.test.ts` static guard fails CI if any network
    import/API is ever introduced into the scanner source.

### Notes

- Telemetry: pqc-check collects and transmits **nothing**. There is no
  phone-home, analytics, or remote ruleset fetch in any code path.
- Out of scope for this release (tracked separately): signed `.tar.gz` release
  artifacts with SHA-256 manifests, and the
  `docs.qpher.ai/oss/pqc-check/air-gapped` deployment guide.

## [1.1.0] - 2026-06-23

### Added

- **Elliptic-curve ECDH key-exchange detection across all 8 languages** (C, Go,
  Java, JavaScript/TypeScript, PHP, Python, Ruby, Rust), graded **HIGH**
  (harvest-now-decrypt-later). Previously elliptic-curve ECDH was either
  undetected or — in the Web Crypto path — mis-graded as MEDIUM. Key exchange is
  now consistently HIGH, since captured ciphertext is decryptable once a quantum
  computer exists.

## [1.0.1] - 2026-06-20

### Fixed

- Console reporter migration-guide link now points at the live docs (was a 404).

### Added

- Free-API-key call-to-action (no card required) in the console output.

## [1.0.0]

- Initial release. Scans C, Go, Java, JavaScript/TypeScript, PHP, Python, Ruby,
  Rust source and config files for quantum-vulnerable cryptography (RSA, ECDSA,
  Ed25519, DH/ECDH, X25519, weak TLS cipher suites). Console / JSON / SARIF
  reporters; migration suggestions toward ML-KEM-768 and ML-DSA-65.
