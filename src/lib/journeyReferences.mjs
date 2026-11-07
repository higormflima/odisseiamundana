/**
 * @param {Array<{ pageId: string, journeyId: string }>} references
 * @param {Iterable<string>} journeyIds
 */
export function assertJourneyReferences(references, journeyIds) {
  const knownJourneyIds = new Set(journeyIds);
  const missing = references.filter(({ journeyId }) => !knownJourneyIds.has(journeyId));

  if (missing.length === 0) return;

  const details = missing
    .map(({ pageId, journeyId }) => `  - ${pageId}: ${journeyId}`)
    .join('\n');

  throw new Error(`Referências journey_id inválidas; viagem não encontrada:\n${details}`);
}
