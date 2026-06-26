# Changelog

All notable changes to `pqc-check` are documented here. This project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.1] - 2026-06-26

### Changed

- **Clearer post-scan guidance.** When code findings are present, the footer now
  shows an ordered path — get a free API key, install the SDK, follow the
  migration guide — instead of three separate lines.
- **Config-only scans get config-appropriate guidance.** When every finding is a
  TLS/certificate config issue (e.g. `ECDHE-RSA`), the summary and footer point
  at server-config / hybrid-TLS guidance instead of the application SDK, and no
  longer suggest "Migrate to ML-KEM-768" (which applies to application-layer
  crypto, not a cipher suite line).
- Open-source alternatives (liboqs / Open Quantum Safe) are named alongside the
  hosted option, consistent across both code and config guidance.

## [1.3.0] - 2026-06-25

### Changed

- **Config-file TLS key-exchange ciphers are now HIGH.** `ECDHE-RSA` / `DHE-RSA`
  / `kRSA` cipher suites (PQC-CF-004) were graded MEDIUM; they are
  quantum-vulnerable key exchange (harvest-now-decrypt-later) and are now
  **HIGH**, consistent with code-level ECDH detection.
- **Certificate / key file references are now LOW.** `ssl_certificate`
  (PQC-CF-001) and `.pem` / `.key` references (PQC-CF-002) are informational —
  the algorithm cannot be confirmed from the config — so they are reported as
  **LOW** (shown with `--show-low`) instead of MEDIUM.

A config that matches only certificate/key references now exits 0 (was 1); an
informational reference no longer fails a CI gate. Configs using `ECDHE-RSA` /
`DHE-RSA` / `kRSA` continue to exit 1 (now HIGH).

## [1.2.0] - 2026-06-25

### Added

- **Python ECDSA signing-call detection.** The Python rule now also matches
  `key.sign(data, ec.ECDSA(...))`, not only EC key generation.

### Changed

- **`--lang` now fails loud on unknown values.** An unknown or mistyped `--lang`
  value (e.g. `typescript`, `kotlin`, `cpp`, a typo) previously scanned the whole
  tree silently; it now exits 2 with a helpful message. Aliases are accepted
  (`ts` / `js` / `py` / `kt` / `cpp` / `golang` / `rb` / `yaml` / …), each
  mapping to the canonical language.

### Documentation

- README accuracy: SARIF output documented as **2.1.0**; the honest clean-scan
  message; `--no-suggestions` clarified as hiding the upsell footer only.

## [1.1.1] - 2026-06-24

### Fixed

- CLI version string is now read from `package.json` (single source of truth).

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
