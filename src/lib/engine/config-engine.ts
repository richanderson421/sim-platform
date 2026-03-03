import { z } from 'zod';
import { gameConfigSchema } from './types';
export function validateSubmission(configJson: unknown, roundNumber: number, payload: unknown) {
  const config = gameConfigSchema.parse(configJson); const round = config.rounds.find((r) => r.roundNumber === roundNumber); if (!round) throw new Error('Round missing');
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of round.fields) { if (f.type === 'number') { let s = z.coerce.number(); if (f.min !== undefined) s = s.min(f.min); if (f.max !== undefined) s = s.max(f.max); shape[f.key] = f.required ? s : s.optional(); } else { const opts = (f.options ?? []).map((o) => o.value); shape[f.key] = (f.required ? z.enum(opts as [string,...string[]]) : z.enum(opts as [string,...string[]]).optional()); } }
  return z.object(shape).parse(payload);
}
export function evaluateSubmission(configJson: unknown, roundNumber: number, payload: Record<string, unknown>, priorScore = 0) {
  const config = gameConfigSchema.parse(configJson); const round = config.rounds.find((r) => r.roundNumber === roundNumber); if (!round) throw new Error('Round missing');
  let score = 0; for (const [k, w] of Object.entries(round.scoring.weights)) score += Number(payload[k] ?? 0) * w;
  if (round.scoring.bonusIf && String(payload[round.scoring.bonusIf.field]) === round.scoring.bonusIf.equals) score += round.scoring.bonusIf.amount;
  const unlocked = !round.unlockRules?.minPriorScore || priorScore >= round.unlockRules.minPriorScore;
  return { score, unlocked, priorScore };
}
