import { PromptScore, ScoreBreakdown } from "@/types/prompt";

const ROLE_KEYWORDS = ["you are", "act as", "as a", "your role", "you're a", "assume the role", "persona", "expert in", "specialist"];
const ROLE_ADJACENT = ["i want you to", "your job", "pretend", "imagine you're", "behave as"];
const CONSTRAINT_KEYWORDS = ["must", "should", "do not", "don't", "avoid", "ensure", "limit", "only", "never", "always", "no more than", "at least", "within", "between"];
const OUTPUT_KEYWORDS = ["format", "output", "respond with", "return", "provide", "deliver", "structure your", "in json", "in markdown", "as a list", "table", "bullet points", "numbered list", "csv", "xml", "yaml"];
const SPECIFIC_VERBS = ["analyze", "compare", "evaluate", "create", "design", "implement", "explain", "summarize", "generate", "optimize", "review", "assess", "develop", "outline", "describe", "debug", "refactor", "translate", "classify", "extract", "rank", "propose"];
const SECTION_MARKERS = ["##", "**", "- ", "1.", "2.", "3.", "context:", "goal:", "task:", "output:", "constraints:", "role:", "instructions:", "requirements:", "background:", "examples:"];
const EXAMPLE_MARKERS = ["for example", "e.g.", "such as", "here's an example", "example:", "sample:", "like this:", "input:", "output:", "few-shot"];

function countMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter((k) => lower.includes(k)).length;
}

export function scorePrompt(content: string): PromptScore {
  const breakdown: ScoreBreakdown = {
    role: 0,
    specificity: 0,
    clarity: 0,
    structure: 0,
    constraints: 0,
    outputFormat: 0,
  };
  const suggestions: string[] = [];

  if (!content || !content.trim()) {
    suggestions.push("Start by writing a prompt — even a rough idea helps!");
    return { total: 0, breakdown, suggestions };
  }

  const wordCount = content.split(/\s+/).filter(Boolean).length;

  // Penalize very short prompts
  if (wordCount < 5) {
    suggestions.push("Your prompt is very short. Expand it with context, constraints, and output format.");
    return { total: Math.min(5, wordCount), breakdown: { ...breakdown, specificity: Math.min(5, wordCount) }, suggestions };
  }

  // Role (max 15) — gradient scoring
  const roleMatches = countMatches(content, ROLE_KEYWORDS);
  const roleAdjacent = countMatches(content, ROLE_ADJACENT);
  if (roleMatches >= 2) {
    breakdown.role = 15;
  } else if (roleMatches === 1) {
    breakdown.role = 12;
  } else if (roleAdjacent > 0) {
    breakdown.role = 6; // Partial credit for role-adjacent language
    suggestions.push("Strengthen the role — use 'You are an expert...' for best results");
  } else {
    suggestions.push("Add a role definition (e.g., 'You are an expert...')");
  }

  // Constraints (max 20) — gradient
  const constraintCount = countMatches(content, CONSTRAINT_KEYWORDS);
  breakdown.constraints = Math.min(20, constraintCount * 4);
  if (constraintCount === 0) suggestions.push("Add constraints to guide the AI's behavior");
  else if (constraintCount < 3) suggestions.push("Consider adding more constraints for precision");

  // Output format (max 20) — gradient instead of binary
  const outputCount = countMatches(content, OUTPUT_KEYWORDS);
  if (outputCount >= 3) breakdown.outputFormat = 20;
  else if (outputCount === 2) breakdown.outputFormat = 16;
  else if (outputCount === 1) breakdown.outputFormat = 10;
  else suggestions.push("Specify the desired output format");

  // Specificity/length (max 15) — smoother curve
  if (wordCount > 150) breakdown.specificity = 15;
  else if (wordCount > 100) breakdown.specificity = 13;
  else if (wordCount > 70) breakdown.specificity = 11;
  else if (wordCount > 50) breakdown.specificity = 9;
  else if (wordCount > 30) breakdown.specificity = 6;
  else if (wordCount > 15) breakdown.specificity = 3;
  else breakdown.specificity = 1;
  if (wordCount < 30) suggestions.push("Add more detail — aim for at least 50 words");

  // Structure (max 20) — bonus for examples
  const sectionCount = countMatches(content, SECTION_MARKERS);
  const exampleCount = countMatches(content, EXAMPLE_MARKERS);
  breakdown.structure = Math.min(20, sectionCount * 3 + exampleCount * 4);
  if (sectionCount < 2) suggestions.push("Use structured sections (headers, bullet points)");
  if (exampleCount === 0) suggestions.push("Include examples to improve clarity (few-shot style)");

  // Clarity / specific verbs (max 10)
  const verbCount = countMatches(content, SPECIFIC_VERBS);
  breakdown.clarity = Math.min(10, verbCount * 2);
  if (verbCount === 0) suggestions.push("Use specific action verbs (analyze, compare, evaluate...)");

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

  return { total, breakdown, suggestions };
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
}

export function getScoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Great";
  if (score >= 55) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Basic";
  return "Needs Work";
}
