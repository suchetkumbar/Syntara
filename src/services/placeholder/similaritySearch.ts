/**
 * Similarity Search
 *
 * TF-IDF-style keyword similarity using cosine similarity on term frequency vectors.
 */

import { Prompt } from "@/types/prompt";

export interface SimilarityResult {
  prompt: Prompt;
  score: number; // 0-1
}

/** Tokenize text into lowercase words, strip punctuation */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2); // Ignore very short words
}

/** Build a term frequency map */
function termFrequency(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) || 0) + 1);
  }
  // Normalize by total count
  const total = tokens.length;
  if (total > 0) {
    for (const [key, val] of freq) {
      freq.set(key, val / total);
    }
  }
  return freq;
}

/** Cosine similarity between two TF vectors */
function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  const allKeys = new Set([...a.keys(), ...b.keys()]);
  for (const key of allKeys) {
    const va = a.get(key) || 0;
    const vb = b.get(key) || 0;
    dotProduct += va * vb;
    normA += va * va;
    normB += vb * vb;
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
}

/**
 * Find prompts similar to the query text.
 * Returns prompts ranked by similarity score (descending), filtered above threshold.
 */
export function findSimilarPrompts(
  query: string,
  prompts: Prompt[],
  limit = 5,
  threshold = 0.05
): SimilarityResult[] {
  if (!query.trim() || prompts.length === 0) return [];

  const queryTokens = tokenize(query);
  const queryTF = termFrequency(queryTokens);

  const results: SimilarityResult[] = [];
  for (const prompt of prompts) {
    const text = `${prompt.title} ${prompt.content}`;
    const tokens = tokenize(text);
    const tf = termFrequency(tokens);
    const score = cosineSimilarity(queryTF, tf);

    if (score >= threshold) {
      results.push({ prompt, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}
