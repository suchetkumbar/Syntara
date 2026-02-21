export function generateOptimizedPrompt(idea: string): string {
  const trimmed = idea.trim();
  if (!trimmed) return "";

  return `## Role
You are an expert AI assistant specialized in ${trimmed}.

## Goal
${capitalize(trimmed)}. Deliver a comprehensive, actionable, and well-structured response.

## Context
The user needs help with ${trimmed}. Consider best practices, common pitfalls, and industry standards when forming your response.

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

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
