# Changelog

All notable changes to `pqc-check` are documented here. This project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
