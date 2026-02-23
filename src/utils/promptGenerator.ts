export type PromptStrategy = "standard" | "chain-of-thought" | "few-shot" | "system-prompt";

export const STRATEGY_META: Record<PromptStrategy, { label: string; description: string }> = {
  standard: { label: "Standard", description: "A well-structured general-purpose prompt" },
  "chain-of-thought": { label: "Chain of Thought", description: "Step-by-step reasoning approach" },
  "few-shot": { label: "Few-Shot", description: "Example-driven prompting with samples" },
  "system-prompt": { label: "System Prompt", description: "System-message style for chat models" },
};

export function generateOptimizedPrompt(idea: string, strategy: PromptStrategy = "standard"): string {
  const trimmed = idea.trim();
  if (!trimmed) return "";

  switch (strategy) {
    case "chain-of-thought":
      return generateCoT(trimmed);
    case "few-shot":
      return generateFewShot(trimmed);
    case "system-prompt":
      return generateSystemPrompt(trimmed);
    default:
      return generateStandard(trimmed);
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateStandard(idea: string): string {
  return `## Role
You are an expert AI assistant specialized in ${idea}.

## Goal
${capitalize(idea)}. Deliver a comprehensive, actionable, and well-structured response.

## Context
The user needs help with ${idea}. Consider best practices, common pitfalls, and industry standards when forming your response.

## Constraints
- Be specific and actionable — avoid vague or generic advice
- Use concrete examples where applicable
- Keep the response well-organized and scannable
- Do not include unnecessary filler content
- Ensure accuracy and cite reasoning where possible

## Output Format
Provide your response in a structured format using:
- Clear headings for each section
- Bullet points for key items
- Code blocks if technical content is involved
- A brief summary at the end`;
}

function generateCoT(idea: string): string {
  return `## Role
You are an expert AI assistant specialized in ${idea}.

## Goal
${capitalize(idea)}. Work through this step by step, showing your reasoning at each stage.

## Instructions
Think through this problem methodically:

1. **Understand** — Restate the core problem or question in your own words
2. **Analyze** — Break down the key components and considerations
3. **Research** — Consider relevant best practices, patterns, and prior art
4. **Reason** — Work through the options, weighing pros and cons
5. **Conclude** — Synthesize your reasoning into a clear recommendation

## Constraints
- Show your reasoning explicitly at each step
- Do not skip to conclusions without explaining why
- Consider edge cases and potential issues
- Be specific with any recommendations

## Output Format
Structure your response with the five steps above as sections. End with a clear **Final Answer** or **Recommendation** section.`;
}

function generateFewShot(idea: string): string {
  return `## Role
You are an expert AI assistant specialized in ${idea}.

## Goal
${capitalize(idea)}. Follow the pattern demonstrated in the examples below.

## Examples

**Example 1:**
Input: [Describe a sample input relevant to ${idea}]
Output: [Describe the expected output format and content]

**Example 2:**
Input: [Describe a different sample input for ${idea}]
Output: [Describe the expected output for this input]

## Now complete this task:
Input: [Your actual input here]

## Constraints
- Follow the exact same format and level of detail as the examples
- Maintain consistency in tone and structure
- Do not deviate from the demonstrated pattern
- Be specific and thorough

## Output Format
Match the output format shown in the examples above.`;
}

function generateSystemPrompt(idea: string): string {
  return `You are an expert AI assistant specialized in ${idea}. Your responses should be comprehensive, accurate, and actionable.

**Core Behaviors:**
- Always provide well-structured, thorough responses about ${idea}
- Use specific examples and concrete recommendations
- Cite reasoning and explain trade-offs when applicable
- Proactively address common pitfalls and edge cases

**Communication Style:**
- Professional yet approachable tone
- Use headings, bullet points, and code blocks for clarity
- Keep responses scannable and well-organized
- Begin with a brief overview, then dive into details

**Constraints:**
- Never provide vague or generic advice
- Always consider the user's context and skill level
- If uncertain, acknowledge limitations clearly
- Do not include unnecessary filler content

When the user asks about ${idea}, provide your response in the format most appropriate for the question type (tutorial, comparison, analysis, etc.).`;
}
