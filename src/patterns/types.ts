import type { Pattern, RiskLevel, PatternCategory } from "../types.js";

export type { Pattern, RiskLevel, PatternCategory };

export function definePattern(
  id: string,
  name: string,
  regex: RegExp,
  risk: RiskLevel,
  category: PatternCategory,
  fileExtensions: string[],
  description: string,
  suggestion: string,
): Pattern {
  return { id, name, regex, risk, category, fileExtensions, description, suggestion };
}
