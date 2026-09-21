import type { RecognitionCandidate } from '@/types/database';

/**
 * Full tray code, e.g. "SSW-LEIH-04-02" (facility prefix - LEIH - tray no. - variant no.).
 * The facility prefix is intentionally generic (2-6 uppercase letters) so
 * other sites/prefixes than "SSW" still match.
 */
const FULL_CODE_PATTERN = /\b([A-Z]{2,6}-LEIH-\d{2}-\d{2})\b/g;

/** Short alias, e.g. "LEIH 04", "LEIH-04", "LEIH04". */
const SHORT_CODE_PATTERN = /\bLEIH[\s-]?(\d{2})\b/g;

function normalize(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, ' ');
}

/**
 * Extracts every LEIH-Sieb identifier candidate found in a block of text
 * (OCR output or a raw barcode/QR payload), ranked by pattern specificity.
 */
export function extractIdentifierCandidates(
  text: string,
  source: RecognitionCandidate['source'],
  baseConfidence: number,
): RecognitionCandidate[] {
  const candidates: RecognitionCandidate[] = [];
  const cleaned = normalize(text);

  for (const match of cleaned.matchAll(FULL_CODE_PATTERN)) {
    candidates.push({ value: match[1], source, confidence: baseConfidence });
  }

  for (const match of cleaned.matchAll(SHORT_CODE_PATTERN)) {
    const value = `LEIH ${match[1]}`;
    // Skip if this short alias is already covered by a full code match above.
    if (candidates.some((c) => c.value.includes(`LEIH-${match[1]}`))) continue;
    candidates.push({ value, source, confidence: baseConfidence * 0.85 });
  }

  return candidates;
}

/** Deduplicates by normalized value, keeping the highest-confidence entry. */
export function dedupeCandidates(candidates: RecognitionCandidate[]): RecognitionCandidate[] {
  const byValue = new Map<string, RecognitionCandidate>();
  for (const candidate of candidates) {
    const key = candidate.value.toUpperCase();
    const existing = byValue.get(key);
    if (!existing || candidate.confidence > existing.confidence) {
      byValue.set(key, candidate);
    }
  }
  return [...byValue.values()].sort((a, b) => b.confidence - a.confidence);
}
