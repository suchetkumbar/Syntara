/**
 * Prompt Debugger
 *
 * Analyzes prompts for potential issues:
 * - Ambiguous phrases
 * - Conflicting constraints
 * - Vague language
 * - Missing essential sections
 * - Overly complex sentences
 */

export type IssueSeverity = "error" | "warning" | "info";

export interface DebugIssue {
  severity: IssueSeverity;
  category: string;
  message: string;
  suggestion: string;
}

const VAGUE_PHRASES = [
  { pattern: /\b(stuff|things|etc\.?|and so on)\b/gi, msg: "Vague language detected", fix: "Replace with specific terms" },
  { pattern: /\b(good|nice|great|bad|better)\b(?!\s+(practice|example))/gi, msg: "Subjective qualifier", fix: "Define what 'good' means in this context" },
  { pattern: /\b(maybe|perhaps|might|possibly|somewhat)\b/gi, msg: "Uncertain language weakens intent", fix: "Use definitive language" },
  { pattern: /\b(very|really|extremely|totally|absolutely)\b/gi, msg: "Filler intensifier", fix: "Remove or replace with measurable criteria" },
  { pattern: /\b(try to|attempt to|aim to)\b/gi, msg: "Weak directive", fix: "Use direct commands: 'Do X' instead of 'Try to X'" },
  { pattern: /\b(some|various|several|many|a few)\b/gi, msg: "Imprecise quantity", fix: "Specify exact numbers or ranges" },
];

const CONFLICT_PAIRS = [
  { a: /\b(be (brief|concise|short))\b/i, b: /\b(be (detailed|comprehensive|thorough|exhaustive))\b/i, msg: "Conflicting: asks for both brevity AND detail" },
  { a: /\b(formal|professional)\b/i, b: /\b(casual|friendly|informal|conversational)\b/i, msg: "Conflicting: asks for both formal AND casual tone" },
  { a: /\b(do not|don't|never)\s+\w+\s+example/i, b: /\b(provide|include|give)\s+example/i, msg: "Conflicting: both prohibits AND requests examples" },
  { a: /\b(simple|basic|beginner)\b/i, b: /\b(advanced|complex|expert|sophisticated)\b/i, msg: "Conflicting: targets both simple AND advanced levels" },
];

const COMPLEXITY_PATTERNS = [
  { pattern: /[^.!?]{200,}/g, msg: "Sentence exceeds 200 chars — hard to follow", fix: "Break into shorter, focused sentences" },
  { pattern: /(\b\w+\b)(?=.*?\b\1\b.*?\b\1\b)/gi, msg: "Word repetition detected", fix: "Vary vocabulary or restructure" },
];

const ESSENTIAL_SECTIONS = [
  { keywords: ["role", "you are", "act as", "persona"], label: "Role/Persona" },
  { keywords: ["task", "goal", "objective", "your job"], label: "Task/Goal" },
  { keywords: ["output", "format", "respond", "return"], label: "Output Format" },
  { keywords: ["constraint", "must", "should", "do not", "avoid"], label: "Constraints" },
];

export function debugPrompt(prompt: string): DebugIssue[] {
  const issues: DebugIssue[] = [];

  if (!prompt || !prompt.trim()) {
    issues.push({ severity: "error", category: "Empty", message: "Prompt is empty", suggestion: "Start with a role, task, and output format" });
    return issues;
  }

  const lower = prompt.toLowerCase();

  // 1. Vague language
  for (const { pattern, msg, fix } of VAGUE_PHRASES) {
    const matches = prompt.match(pattern);
    if (matches && matches.length > 0) {
      const unique = [...new Set(matches.map((m) => m.toLowerCase()))];
      issues.push({
        severity: "warning",
        category: "Vague Language",
        message: `${msg}: "${unique.slice(0, 3).join('", "')}"`,
        suggestion: fix,
      });
    }
  }

  // 2. Conflicting instructions
  for (const { a, b, msg } of CONFLICT_PAIRS) {
    if (a.test(prompt) && b.test(prompt)) {
      issues.push({
        severity: "error",
        category: "Conflict",
        message: msg,
        suggestion: "Choose one direction and be consistent",
      });
    }
  }

  // 3. Complexity issues
  for (const { pattern, msg, fix } of COMPLEXITY_PATTERNS) {
    if (pattern.test(prompt)) {
      issues.push({ severity: "warning", category: "Complexity", message: msg, suggestion: fix });
    }
    pattern.lastIndex = 0; // Reset regex
  }

  // 4. Missing essential sections
  for (const { keywords, label } of ESSENTIAL_SECTIONS) {
    const found = keywords.some((k) => lower.includes(k));
    if (!found) {
      issues.push({
        severity: "info",
        category: "Missing Section",
        message: `No ${label} section detected`,
        suggestion: `Consider adding a ${label} section to improve clarity`,
      });
    }
  }

  // 5. Check for overly long prompt without structure
  const wordCount = prompt.split(/\s+/).length;
  const hasStructure = /[#\-*\d.]/.test(prompt);
  if (wordCount > 100 && !hasStructure) {
    issues.push({
      severity: "warning",
      category: "Structure",
      message: "Long prompt without clear structure",
      suggestion: "Use headers (##), bullet points (-), or numbered lists for readability",
    });
  }

  // 6. Multiple question marks (ambiguous intent)
  const questionCount = (prompt.match(/\?/g) || []).length;
  if (questionCount > 3) {
    issues.push({
      severity: "warning",
      category: "Ambiguity",
      message: `${questionCount} questions detected — AI may lose focus`,
      suggestion: "Limit to 1-2 key questions or break into separate prompts",
    });
  }

  // Sort by severity: error > warning > info
  const order: Record<IssueSeverity, number> = { error: 0, warning: 1, info: 2 };
  issues.sort((a, b) => order[a.severity] - order[b.severity]);

  return issues;
}
