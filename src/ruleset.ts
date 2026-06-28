/**
 * Ruleset serialization for air-gapped / classified deployments (#262).
 *
 * pqc-check's detection ruleset (`ALL_PATTERNS`) is COMPILED INTO the binary —
 * the scanner performs zero network calls in any mode (verified by
 * `tests/offline-guarantee.test.ts`). These helpers let an administrator on an
 * isolated network export the bundled ruleset to a reviewable/signable JSON
 * file and re-import it, so a custom or air-gap-distributed ruleset round-trips
 * identically.
 *
 * A `Pattern`'s `regex` is a live `RegExp`, which is not JSON-serializable, so
 * it is stored as `{ source, flags }` and reconstructed on import.
 */
import { ALL_PATTERNS } from "./patterns/index.js";
import { VERSION } from "./version.js";
import type { Pattern } from "./types.js";

/** The on-disk shape of a single pattern (regex split into source + flags). */
export interface SerializedPattern {
  id: string;
  name: string;
  regexSource: string;
  regexFlags: string;
  risk: Pattern["risk"];
  category: Pattern["category"];
  fileExtensions: string[];
  description: string;
  suggestion: string;
}

/** The on-disk ruleset document. */
export interface SerializedRuleset {
  schema: "pqc-check/ruleset";
  schemaVersion: 1;
  toolVersion: string;
  patternCount: number;
  patterns: SerializedPattern[];
}

const RULESET_SCHEMA = "pqc-check/ruleset" as const;
const RULESET_SCHEMA_VERSION = 1 as const;

function serializePattern(p: Pattern): SerializedPattern {
  return {
    id: p.id,
    name: p.name,
    regexSource: p.regex.source,
    regexFlags: p.regex.flags,
    risk: p.risk,
    category: p.category,
    fileExtensions: [...p.fileExtensions],
    description: p.description,
    suggestion: p.suggestion,
  };
}

function deserializePattern(s: SerializedPattern): Pattern {
  return {
    id: s.id,
    name: s.name,
    regex: new RegExp(s.regexSource, s.regexFlags),
    risk: s.risk,
    category: s.category,
    fileExtensions: [...s.fileExtensions],
    description: s.description,
    suggestion: s.suggestion,
  };
}

/** Serialize the given patterns (default: the bundled ruleset) to a document. */
export function serializeRuleset(patterns: Pattern[] = ALL_PATTERNS): SerializedRuleset {
  return {
    schema: RULESET_SCHEMA,
    schemaVersion: RULESET_SCHEMA_VERSION,
    toolVersion: VERSION,
    patternCount: patterns.length,
    patterns: patterns.map(serializePattern),
  };
}

/** Pretty-printed JSON for `ruleset export`. */
export function serializeRulesetJson(patterns: Pattern[] = ALL_PATTERNS): string {
  return JSON.stringify(serializeRuleset(patterns), null, 2);
}

/**
 * Parse + validate a ruleset document loaded from disk and reconstruct live
 * `Pattern`s. Throws a descriptive `Error` on any structural problem so
 * `ruleset import` fails loud rather than silently scanning with a broken
 * ruleset.
 */
export function deserializeRuleset(json: string): Pattern[] {
  let doc: unknown;
  try {
    doc = JSON.parse(json);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`ruleset is not valid JSON: ${message}`);
  }

  if (typeof doc !== "object" || doc === null) {
    throw new Error("ruleset must be a JSON object");
  }
  const d = doc as Record<string, unknown>;
  if (d.schema !== RULESET_SCHEMA) {
    throw new Error(`ruleset schema must be "${RULESET_SCHEMA}", got ${JSON.stringify(d.schema)}`);
  }
  if (d.schemaVersion !== RULESET_SCHEMA_VERSION) {
    throw new Error(
      `unsupported ruleset schemaVersion ${JSON.stringify(d.schemaVersion)} ` +
        `(this build supports ${RULESET_SCHEMA_VERSION})`,
    );
  }
  if (!Array.isArray(d.patterns)) {
    throw new Error("ruleset.patterns must be an array");
  }

  const ids = new Set<string>();
  return d.patterns.map((raw, i) => {
    if (typeof raw !== "object" || raw === null) {
      throw new Error(`ruleset.patterns[${i}] must be an object`);
    }
    const p = raw as Record<string, unknown>;
    for (const field of [
      "id",
      "name",
      "regexSource",
      "regexFlags",
      "risk",
      "category",
      "description",
      "suggestion",
    ]) {
      if (typeof p[field] !== "string") {
        throw new Error(`ruleset.patterns[${i}].${field} must be a string`);
      }
    }
    if (!Array.isArray(p.fileExtensions) || !p.fileExtensions.every((e) => typeof e === "string")) {
      throw new Error(`ruleset.patterns[${i}].fileExtensions must be an array of strings`);
    }
    const id = p.id as string;
    if (ids.has(id)) {
      throw new Error(`ruleset.patterns[${i}] has duplicate id "${id}"`);
    }
    ids.add(id);
    try {
      // eslint-disable-next-line no-new
      new RegExp(p.regexSource as string, p.regexFlags as string);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`ruleset.patterns[${i}] ("${id}") has an invalid regex: ${message}`);
    }
    return deserializePattern(p as unknown as SerializedPattern);
  });
}
