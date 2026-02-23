/**
 * Token Estimator
 *
 * Word-based heuristic for estimating token counts across models.
 * Average English text ≈ 1.3 tokens per word (GPT tokenizer baseline).
 */

export interface TokenEstimation {
  tokens: number;
  costs: { model: string; cost: string }[];
  contextWarning: string | null;
}

const MODEL_PRICING: { model: string; inputPer1k: number; contextLimit: number }[] = [
  { model: "GPT-4o", inputPer1k: 0.005, contextLimit: 128_000 },
  { model: "GPT-4", inputPer1k: 0.03, contextLimit: 8_192 },
  { model: "GPT-3.5", inputPer1k: 0.0015, contextLimit: 16_385 },
  { model: "Claude 3.5", inputPer1k: 0.003, contextLimit: 200_000 },
  { model: "Gemini Pro", inputPer1k: 0.00125, contextLimit: 1_000_000 },
];

const TOKENS_PER_WORD = 1.3;

export function estimateTokens(text: string): number {
  if (!text || !text.trim()) return 0;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount * TOKENS_PER_WORD);
}

export function estimateCosts(tokens: number): { model: string; cost: string }[] {
  if (tokens === 0) return [];
  return MODEL_PRICING.map(({ model, inputPer1k }) => ({
    model,
    cost: `$${((tokens / 1000) * inputPer1k).toFixed(6)}`,
  }));
}

export function getContextWarning(tokens: number): string | null {
  const warnings: string[] = [];
  for (const { model, contextLimit } of MODEL_PRICING) {
    const usage = tokens / contextLimit;
    if (usage > 0.9) {
      warnings.push(`⚠️ Approaching ${model} context limit (${Math.round(usage * 100)}%)`);
    } else if (usage > 1) {
      warnings.push(`🚫 Exceeds ${model} context limit`);
    }
  }
  return warnings.length > 0 ? warnings[0] : null;
}

export function getFullEstimation(text: string): TokenEstimation {
  const tokens = estimateTokens(text);
  return {
    tokens,
    costs: estimateCosts(tokens),
    contextWarning: getContextWarning(tokens),
  };
}
