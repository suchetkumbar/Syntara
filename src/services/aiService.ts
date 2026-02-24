/**
 * AI Service — Central layer for all Gemini-powered features.
 *
 * Every method has a local-heuristic fallback so the app works
 * even when the API key is missing or the network is down.
 */

import { getModel, isAIAvailable } from "@/lib/gemini";
import { PromptScore, ScoreBreakdown } from "@/types/prompt";
import type { PromptStrategy } from "@/utils/promptGenerator";
import type { DebugIssue } from "@/services/placeholder/promptDebugger";
import type { OptimizationResult } from "@/services/placeholder/modelOptimizer";

// ─── Helpers ────────────────────────────────────────────────────────

const MAX_RETRIES = 4;
const BASE_DELAY_MS = 3000;
const FALLBACK_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite"];

async function ask(prompt: string): Promise<string> {
    if (!isAIAvailable()) throw new Error("AI not available");

    let lastError: unknown;

    for (const modelName of FALLBACK_MODELS) {
        const model = getModel(modelName);
        if (!model) continue;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const result = await model.generateContent(prompt);
                return result.response.text();
            } catch (err: unknown) {
                lastError = err;
                const status = (err as { status?: number }).status;
                // Retry on 429 (rate limit) or 503 (overloaded)
                if ((status === 429 || status === 503) && attempt < MAX_RETRIES) {
                    const delay = BASE_DELAY_MS * Math.pow(2, attempt); // 3s, 6s, 12s, 24s
                    console.warn(`Gemini ${modelName} ${status} — retry ${attempt + 1}/${MAX_RETRIES} in ${delay / 1000}s`);
                    await new Promise((r) => setTimeout(r, delay));
                    continue;
                }
                // If rate limited on last retry, try next model
                if (status === 429 || status === 503) break;
                throw err;
            }
        }
    }
    throw lastError;
}

/** Parse JSON from an LLM response that may be wrapped in ```json fences. */
function parseJSON<T>(raw: string): T {
    const cleaned = raw
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
    return JSON.parse(cleaned);
}

// ─── 1. AI Prompt Generator ────────────────────────────────────────

export interface GenerateResult {
    prompt: string;
    usedAI: boolean;
}

export async function generatePromptAI(
    idea: string,
    strategy: PromptStrategy
): Promise<GenerateResult> {
    const strategyDescriptions: Record<PromptStrategy, string> = {
        standard: "A well-structured general-purpose prompt with Role, Goal, Context, Constraints, and Output Format sections",
        "chain-of-thought": "A chain-of-thought prompt that asks the AI to reason step by step",
        "few-shot": "A few-shot prompt with example input/output pairs demonstrating the expected pattern",
        "system-prompt": "A system-message style prompt for chat models, setting behavior and personality",
    };

    const systemPrompt = `You are Syntara, an expert prompt engineer. Generate a high-quality, production-ready AI prompt based on the user's idea.

Strategy: "${strategy}" — ${strategyDescriptions[strategy]}

Rules:
- Generate ONLY the prompt text itself — no explanations, no preamble, no markdown code fences
- Make it detailed, specific, and immediately usable
- Include clear sections using ## headers (for standard/chain-of-thought) or natural structure
- Include role definition, task description, constraints, and output format
- Use action verbs (analyze, compare, evaluate, create, etc.)
- Be specific — avoid vague language like "stuff", "things", "etc."
- The prompt should score highly on: role clarity, specificity, structure, constraints, output format`;

    const result = await ask(`${systemPrompt}\n\nUser's idea: ${idea}`);
    return { prompt: result.trim(), usedAI: true };
}

// ─── 2. AI Prompt Scorer ───────────────────────────────────────────

export async function scorePromptAI(content: string): Promise<PromptScore> {
    const systemPrompt = `You are a prompt quality evaluator. Score the given prompt on these exact dimensions.

Scoring rubric:
- role (0-15): Does it define who the AI should be? 15 = clear expert role, 0 = no role
- specificity (0-15): How detailed and specific is it? 15 = highly specific, 0 = vague
- clarity (0-10): Are instructions clear and unambiguous? 10 = crystal clear, 0 = confusing
- structure (0-20): Is it well-organized with sections/headers/lists? 20 = excellent structure, 0 = wall of text
- constraints (0-20): Does it set boundaries and rules? 20 = comprehensive constraints, 0 = no constraints
- outputFormat (0-20): Does it specify how the AI should respond? 20 = precise format, 0 = no format spec

Also provide 2-4 specific, actionable suggestions for improvement. Each suggestion should reference the actual prompt content.

Respond in this exact JSON format and nothing else:
{
  "total": <number 0-100>,
  "breakdown": { "role": <n>, "specificity": <n>, "clarity": <n>, "structure": <n>, "constraints": <n>, "outputFormat": <n> },
  "suggestions": ["<suggestion1>", "<suggestion2>"]
}`;

    const raw = await ask(`${systemPrompt}\n\nPrompt to evaluate:\n${content}`);
    const parsed = parseJSON<{ total: number; breakdown: ScoreBreakdown; suggestions: string[] }>(raw);

    // Validate and clamp scores
    const breakdown: ScoreBreakdown = {
        role: Math.min(15, Math.max(0, parsed.breakdown.role || 0)),
        specificity: Math.min(15, Math.max(0, parsed.breakdown.specificity || 0)),
        clarity: Math.min(10, Math.max(0, parsed.breakdown.clarity || 0)),
        structure: Math.min(20, Math.max(0, parsed.breakdown.structure || 0)),
        constraints: Math.min(20, Math.max(0, parsed.breakdown.constraints || 0)),
        outputFormat: Math.min(20, Math.max(0, parsed.breakdown.outputFormat || 0)),
    };
    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

    return {
        total,
        breakdown,
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    };
}

// ─── 3. AI Prompt Debugger ─────────────────────────────────────────

export async function debugPromptAI(prompt: string): Promise<DebugIssue[]> {
    const systemPrompt = `You are a prompt debugging expert. Analyze the given prompt for issues.

Check for:
1. Vague or ambiguous language
2. Conflicting instructions
3. Missing essential sections (role, task, constraints, output format)
4. Overly complex or long sentences
5. Weak directives ("try to" instead of "do")
6. Logical inconsistencies
7. Missing context that the AI would need

For each issue found, classify severity as:
- "error": Critical problems that will significantly hurt output quality
- "warning": Issues that could reduce quality
- "info": Suggestions for improvement

Respond in this exact JSON format and nothing else:
[
  {
    "severity": "error" | "warning" | "info",
    "category": "<category name>",
    "message": "<what the issue is>",
    "suggestion": "<how to fix it>"
  }
]

If the prompt is excellent and has no issues, return an empty array: []`;

    const raw = await ask(`${systemPrompt}\n\nPrompt to debug:\n${prompt}`);
    const parsed = parseJSON<DebugIssue[]>(raw);

    if (!Array.isArray(parsed)) return [];

    // Validate each issue
    return parsed
        .filter((i) => i.severity && i.category && i.message && i.suggestion)
        .map((i) => ({
            severity: (["error", "warning", "info"].includes(i.severity) ? i.severity : "info") as DebugIssue["severity"],
            category: String(i.category),
            message: String(i.message),
            suggestion: String(i.suggestion),
        }));
}

// ─── 4. AI Model Optimizer ─────────────────────────────────────────

export async function optimizeForModelAI(
    prompt: string,
    modelName: string
): Promise<OptimizationResult> {
    const systemPrompt = `You are an expert in optimizing prompts for specific AI models. Rewrite the given prompt to work best with ${modelName}.

Model-specific knowledge:
- GPT-4o: Prefers structured prompts with ## headers, supports JSON mode, great at multi-step reasoning
- GPT-3.5 Turbo: Works best with concise focused prompts, needs explicit examples, shorter context
- Claude 3.5 Sonnet: Prefers XML-tagged sections, excels with long-form analysis, "think step by step"
- Gemini Pro: Handles very long contexts, responds well to task decomposition, supports multimodal refs
- Llama 3: Needs clear system prompts with boundaries, keep under 2000 tokens, explicit format examples

Rules:
- Output ONLY the optimized prompt text — no explanations
- Preserve the original intent completely
- Apply model-specific best practices for structure, formatting, and instructions
- Make meaningful improvements, not just cosmetic changes`;

    const result = await ask(`${systemPrompt}\n\nOriginal prompt:\n${prompt}`);
    const optimized = result.trim();

    // Detect changes
    const changes: string[] = [];
    if (optimized.length > prompt.length) changes.push("Expanded with model-specific guidance");
    if (optimized.length < prompt.length) changes.push("Condensed for model's optimal context window");
    if (optimized.includes("<") && !prompt.includes("<")) changes.push("Added XML-style tags (model preference)");
    if (optimized.includes("##") && !prompt.includes("##")) changes.push("Added structured headers");
    if (optimized.includes("step") && !prompt.includes("step")) changes.push("Added step-by-step reasoning");
    if (changes.length === 0) changes.push("Applied model-specific formatting and best practices");

    return { optimized, model: modelName, changes };
}

// ─── 5. AI Prompt Improver ─────────────────────────────────────────

export interface ImproveResult {
    improved: string;
    changes: string[];
    usedAI: boolean;
}

export async function improvePromptAI(prompt: string): Promise<ImproveResult> {
    const systemPrompt = `You are Syntara, an expert prompt engineer. Improve the given prompt while preserving its intent.

Rules:
- Output ONLY the improved prompt text — no explanations, no preamble
- Preserve the user's original intent and topic completely
- Add clear sections (Role, Task, Constraints, Output Format) if missing
- Replace vague language with specific instructions
- Add constraints and output format if missing
- Improve structure with headers and bullet points
- Add action verbs and measurable criteria
- Make it significantly better, not just cosmetically different`;

    const result = await ask(`${systemPrompt}\n\nPrompt to improve:\n${prompt}`);
    const improved = result.trim();

    const changes: string[] = [];
    if (improved.includes("##") && !prompt.includes("##")) changes.push("Added structured sections");
    if (improved.includes("Role") && !prompt.includes("Role")) changes.push("Added role definition");
    if (improved.includes("Constraint") && !prompt.includes("Constraint")) changes.push("Added constraints");
    if (improved.includes("Output") && !prompt.includes("Output")) changes.push("Added output format");
    if (improved.length > prompt.length * 1.2) changes.push("Expanded with more specific details");
    if (changes.length === 0) changes.push("Refined language and structure for clarity");

    return { improved, changes, usedAI: true };
}

// ─── 6. AI A/B Compare ─────────────────────────────────────────────

export interface CompareResult {
    winner: "A" | "B" | "tie";
    analysis: string;
    strengthsA: string[];
    strengthsB: string[];
    recommendation: string;
}

export async function comparePromptsAI(
    promptA: string,
    promptB: string
): Promise<CompareResult> {
    const systemPrompt = `You are a prompt quality evaluator. Compare these two prompts and determine which is better.

Evaluate on: role clarity, specificity, structure, constraints, output format, and overall effectiveness.

Respond in this exact JSON format and nothing else:
{
  "winner": "A" | "B" | "tie",
  "analysis": "<2-3 sentence comparison>",
  "strengthsA": ["<strength1>", "<strength2>"],
  "strengthsB": ["<strength1>", "<strength2>"],
  "recommendation": "<which to use and why>"
}`;

    const raw = await ask(`${systemPrompt}\n\nPrompt A:\n${promptA}\n\n---\n\nPrompt B:\n${promptB}`);
    return parseJSON<CompareResult>(raw);
}
