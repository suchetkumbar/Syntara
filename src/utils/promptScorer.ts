import { PromptScore, ScoreBreakdown } from "@/types/prompt";

const ROLE_KEYWORDS = ["you are", "act as", "as a", "your role", "you're a", "assume the role"];
const CONSTRAINT_KEYWORDS = ["must", "should", "do not", "don't", "avoid", "ensure", "limit", "only", "never", "always"];
const OUTPUT_KEYWORDS = ["format", "output", "respond with", "return", "provide", "deliver", "structure your", "in json", "in markdown", "as a list"];
const SPECIFIC_VERBS = ["analyze", "compare", "evaluate", "create", "design", "implement", "explain", "summarize", "generate", "optimize", "review", "assess", "develop", "outline", "describe"];
const SECTION_MARKERS = ["##", "**", "- ", "1.", "2.", "3.", "context:", "goal:", "task:", "output:", "constraints:", "role:"];

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

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

  // Role (max 15)
  if (containsAny(content, ROLE_KEYWORDS)) {
    breakdown.role = 15;
  } else {
    suggestions.push("Add a role definition (e.g., 'You are an expert...')");
  }

  // Constraints (max 20)
  const constraintCount = countMatches(content, CONSTRAINT_KEYWORDS);
  breakdown.constraints = Math.min(20, constraintCount * 5);
  if (constraintCount === 0) suggestions.push("Add constraints to guide the AI's behavior");

  // Output format (max 20)
  if (containsAny(content, OUTPUT_KEYWORDS)) {
    breakdown.outputFormat = 20;
  } else {
    suggestions.push("Specify the desired output format");
  }

  // Length / specificity (max 15)
  const wordCount = content.split(/\s+/).length;
  if (wordCount > 100) breakdown.specificity = 15;
  else if (wordCount > 50) breakdown.specificity = 10;
  else if (wordCount > 20) breakdown.specificity = 5;
  else suggestions.push("Add more detail — aim for at least 50 words");

  // Structure (max 20)
  const sectionCount = countMatches(content, SECTION_MARKERS);
  breakdown.structure = Math.min(20, sectionCount * 4);
  if (sectionCount < 2) suggestions.push("Use structured sections (headers, bullet points)");

  // Specific verbs / clarity (max 10)
  const verbCount = countMatches(content, SPECIFIC_VERBS);
  breakdown.clarity = Math.min(10, verbCount * 3);
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
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Work";
}
