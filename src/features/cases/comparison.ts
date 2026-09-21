import type {
  CaseComparison,
  CaseExtraDelta,
  CaseInstrumentDelta,
  CaseSubstitutionSuggestion,
  ExtraInstrumentEntry,
  InstrumentCheckEntry,
} from '@/types/database';

/**
 * Compares a case's confirmed intake checklist against its confirmed
 * outtake checklist and reports deviations: missing/surplus quantities of
 * known reference instruments, new or resolved extra instruments, and
 * name-similarity "possible substitution" suggestions.
 *
 * This is a deterministic diff of two human-confirmed records, not an
 * automated image/vision analysis - see README "KI-Vergleich" for why that
 * is the deliberate, honest design here.
 */
export function compareCaseScans(
  intake: { instrumentChecks: InstrumentCheckEntry[]; extraInstruments: ExtraInstrumentEntry[] },
  outtake: { instrumentChecks: InstrumentCheckEntry[]; extraInstruments: ExtraInstrumentEntry[] },
  comparedBy: string,
): CaseComparison {
  const instrumentDeltas: CaseInstrumentDelta[] = [];
  const outtakeByInstrument = new Map(outtake.instrumentChecks.map((c) => [c.instrumentId, c]));

  for (const intakeCheck of intake.instrumentChecks) {
    const outtakeCheck = outtakeByInstrument.get(intakeCheck.instrumentId);
    const outtakeQuantity = outtakeCheck?.quantityConfirmed ?? 0;
    const delta = outtakeQuantity - intakeCheck.quantityConfirmed;
    if (delta !== 0) {
      instrumentDeltas.push({
        instrumentId: intakeCheck.instrumentId,
        name: intakeCheck.name,
        intakeQuantity: intakeCheck.quantityConfirmed,
        outtakeQuantity,
        delta,
        critical: intakeCheck.critical,
      });
    }
  }

  const extraDeltas = diffExtraInstruments(intake.extraInstruments, outtake.extraInstruments);

  const substitutionSuggestions = buildSubstitutionSuggestions(instrumentDeltas, extraDeltas);

  return {
    instrumentDeltas,
    extraDeltas,
    substitutionSuggestions,
    hasDeviations: instrumentDeltas.length > 0 || extraDeltas.length > 0,
    comparedAt: new Date().toISOString(),
    comparedBy,
  };
}

function diffExtraInstruments(
  intakeExtras: ExtraInstrumentEntry[],
  outtakeExtras: ExtraInstrumentEntry[],
): CaseExtraDelta[] {
  const quantityByName = new Map<string, { intake: number; outtake: number }>();

  for (const extra of intakeExtras) {
    const key = extra.name.trim().toLowerCase();
    const entry = quantityByName.get(key) ?? { intake: 0, outtake: 0 };
    entry.intake += extra.quantity;
    quantityByName.set(key, entry);
  }
  for (const extra of outtakeExtras) {
    const key = extra.name.trim().toLowerCase();
    const entry = quantityByName.get(key) ?? { intake: 0, outtake: 0 };
    entry.outtake += extra.quantity;
    quantityByName.set(key, entry);
  }

  const deltas: CaseExtraDelta[] = [];
  for (const [key, { intake, outtake }] of quantityByName) {
    if (intake === outtake) continue;
    const originalName =
      outtakeExtras.find((e) => e.name.trim().toLowerCase() === key)?.name ??
      intakeExtras.find((e) => e.name.trim().toLowerCase() === key)?.name ??
      key;
    deltas.push({ name: originalName, intakeQuantity: intake, outtakeQuantity: outtake });
  }
  return deltas;
}

const SUBSTITUTION_SIMILARITY_THRESHOLD = 0.25;
const MAX_SUBSTITUTION_SUGGESTIONS = 5;

function buildSubstitutionSuggestions(
  instrumentDeltas: CaseInstrumentDelta[],
  extraDeltas: CaseExtraDelta[],
): CaseSubstitutionSuggestion[] {
  const missing = instrumentDeltas.filter((d) => d.delta < 0);
  const newExtras = extraDeltas.filter((d) => d.outtakeQuantity > d.intakeQuantity);
  if (missing.length === 0 || newExtras.length === 0) return [];

  const suggestions: CaseSubstitutionSuggestion[] = [];
  for (const missingItem of missing) {
    let best: { name: string; similarity: number } | null = null;
    for (const extra of newExtras) {
      const similarity = nameSimilarity(missingItem.name, extra.name);
      if (!best || similarity > best.similarity) best = { name: extra.name, similarity };
    }
    if (best && best.similarity >= SUBSTITUTION_SIMILARITY_THRESHOLD) {
      suggestions.push({
        missingInstrumentId: missingItem.instrumentId,
        missingName: missingItem.name,
        extraName: best.name,
        similarity: best.similarity,
      });
    }
  }

  return suggestions.sort((a, b) => b.similarity - a.similarity).slice(0, MAX_SUBSTITUTION_SUGGESTIONS);
}

function tokenize(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2),
  );
}

/** Jaccard similarity of normalized word tokens - cheap, dependency-free, good enough for a "did you mean" hint. */
function nameSimilarity(a: string, b: string): number {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection += 1;
  }
  const union = tokensA.size + tokensB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
