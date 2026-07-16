/**
 * lib/fuzzy-module-match.ts
 * Simple fuzzy string similarity for module name matching during CSV import.
 * Returns a 0-1 score. No external dependencies.
 */

/** Normalize: lowercase, strip punctuation/dashes/underscores, collapse spaces */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[-_/\\]/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Bigram set similarity (Sørensen–Dice coefficient) */
function bigramSimilarity(a: string, b: string): number {
  const bigrams = (s: string): Set<string> => {
    const bg = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) bg.add(s[i] + s[i + 1]);
    return bg;
  };

  const ba = bigrams(a);
  const bb = bigrams(b);
  if (ba.size === 0 && bb.size === 0) return 1;
  if (ba.size === 0 || bb.size === 0) return 0;

  let intersection = 0;
  ba.forEach((bg) => { if (bb.has(bg)) intersection++; });
  return (2 * intersection) / (ba.size + bb.size);
}

/** Check if all words of `needle` appear in `haystack` (word containment) */
function wordContainment(needle: string, haystack: string): boolean {
  const words = needle.split(" ").filter(Boolean);
  return words.every((w) => haystack.includes(w));
}

export interface ModuleMatch {
  moduleId: string;
  moduleName: string;
  score: number; // 0-1
}

/**
 * Find best matching project module for a CSV module name.
 * Returns null if no modules exist for the project.
 */
export function findBestModuleMatch(
  csvModuleName: string,
  projectModules: Array<{ id: string; name: string }>
): ModuleMatch | null {
  if (!csvModuleName.trim() || projectModules.length === 0) return null;

  const normCsv = normalize(csvModuleName);

  let best: ModuleMatch | null = null;

  for (const mod of projectModules) {
    const normMod = normalize(mod.name);

    // Exact match after normalization → score 1.0
    if (normCsv === normMod) {
      return { moduleId: mod.id, moduleName: mod.name, score: 1 };
    }

    let score = bigramSimilarity(normCsv, normMod);

    // Boost if one fully contains the other
    if (wordContainment(normCsv, normMod) || wordContainment(normMod, normCsv)) {
      score = Math.max(score, 0.75);
    }

    // Boost if CSV starts with module name or vice versa
    if (normCsv.startsWith(normMod) || normMod.startsWith(normCsv)) {
      score = Math.max(score, 0.70);
    }

    if (!best || score > best.score) {
      best = { moduleId: mod.id, moduleName: mod.name, score };
    }
  }

  return best;
}

/** Confidence label + colour class for display */
export function matchConfidence(score: number): {
  label: string;
  colorClass: string;
} {
  if (score >= 0.85) return { label: "High", colorClass: "text-green-600 dark:text-green-400" };
  if (score >= 0.55) return { label: "Medium", colorClass: "text-amber-600 dark:text-amber-400" };
  return { label: "Low", colorClass: "text-red-500 dark:text-red-400" };
}
