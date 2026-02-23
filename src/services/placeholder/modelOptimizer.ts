/**
 * Model-Specific Optimization Engine
 *
 * Applies model-specific best practices and formatting to prompts.
 */

export interface ModelProfile {
  id: string;
  name: string;
  provider: string;
  contextLimit: number;
  tips: string[];
  transform: (prompt: string) => string;
}

export interface OptimizationResult {
  optimized: string;
  model: string;
  changes: string[];
}

function ensureSection(prompt: string, header: string, content: string): { text: string; added: boolean } {
  const lower = prompt.toLowerCase();
  if (lower.includes(header.toLowerCase())) return { text: prompt, added: false };
  return { text: `${prompt}\n\n## ${header}\n${content}`, added: true };
}

function wrapAsSystemMessage(prompt: string): string {
  // If already has system-message style, return as-is
  if (prompt.startsWith("You are") || prompt.startsWith("Act as")) return prompt;
  // Otherwise prepend a system-style header
  return `You are a helpful AI assistant. Follow these instructions precisely:\n\n${prompt}`;
}

const MODEL_PROFILES: ModelProfile[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    contextLimit: 128_000,
    tips: [
      "GPT-4o excels with structured prompts using clear headers",
      "Supports JSON mode — add 'Respond in JSON' for structured output",
      "Handles multi-step reasoning well with explicit step markers",
    ],
    transform: (prompt) => {
      const changes: string[] = [];
      let result = prompt;

      // Ensure role section
      const { text: r1, added: a1 } = ensureSection(result, "Role", "You are an expert AI assistant.");
      if (a1) changes.push("Added Role section");
      result = r1;

      // Add JSON hint if requesting structured data
      if (/json|object|array|data/i.test(result) && !/respond in json/i.test(result)) {
        result += "\n\n> Note: Respond in valid JSON if structured data is requested.";
        changes.push("Added JSON mode hint");
      }

      return result;
    },
  },
  {
    id: "gpt-35",
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    contextLimit: 16_385,
    tips: [
      "GPT-3.5 works best with concise, focused prompts",
      "Avoid overly complex multi-step instructions",
      "Use explicit examples for better results",
    ],
    transform: (prompt) => {
      let result = prompt;
      // Simplify if too long
      if (result.split(/\s+/).length > 500) {
        result += "\n\n> Important: Keep your response focused and concise.";
      }
      // Ensure direct instructions
      if (!result.toLowerCase().includes("you are") && !result.toLowerCase().includes("act as")) {
        result = wrapAsSystemMessage(result);
      }
      return result;
    },
  },
  {
    id: "claude-35",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    contextLimit: 200_000,
    tips: [
      "Claude responds well to XML-tagged sections for structure",
      "Prefers 'Human/Assistant' turn format in conversations",
      "Excels with long-form analysis and nuanced reasoning",
    ],
    transform: (prompt) => {
      let result = prompt;
      // Convert ## headers to XML-style tags for Claude
      result = result.replace(/^## (.+)$/gm, (_, title) => {
        const tag = title.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z_]/g, "");
        return `<${tag}>\n<!-- ${title} -->`;
      });
      // Add thinking instruction
      if (!/think|reason|step.*by.*step/i.test(result)) {
        result += "\n\nPlease think through this carefully before responding.";
      }
      return result;
    },
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    provider: "Google",
    contextLimit: 1_000_000,
    tips: [
      "Gemini handles very long contexts well — don't be afraid of detail",
      "Supports multimodal input references",
      "Responds well to clear task decomposition",
    ],
    transform: (prompt) => {
      let result = prompt;
      // Add task decomposition hint
      if (!/step|phase|stage|part/i.test(result)) {
        result += "\n\nBreak your response into clear, numbered steps.";
      }
      return result;
    },
  },
  {
    id: "llama-3",
    name: "Llama 3",
    provider: "Meta",
    contextLimit: 8_192,
    tips: [
      "Llama 3 works best with system prompts that set clear boundaries",
      "Keep prompts under 2000 tokens for best performance",
      "Use explicit examples to demonstrate expected format",
    ],
    transform: (prompt) => {
      let result = wrapAsSystemMessage(prompt);
      // Add format reinforcement
      if (!/format|structure|layout/i.test(result)) {
        result += "\n\nFormat your response clearly with sections and bullet points.";
      }
      return result;
    },
  },
];

export function getModelProfiles(): ModelProfile[] {
  return MODEL_PROFILES;
}

export function getModelProfile(modelId: string): ModelProfile | undefined {
  return MODEL_PROFILES.find((m) => m.id === modelId);
}

export function optimizeForModel(prompt: string, modelId: string): OptimizationResult {
  const profile = getModelProfile(modelId);
  if (!profile) {
    return { optimized: prompt, model: modelId, changes: ["Unknown model — no changes applied"] };
  }

  const original = prompt;
  const optimized = profile.transform(prompt);

  // Detect what changed
  const changes: string[] = [];
  if (optimized !== original) {
    if (optimized.length > original.length) {
      const diff = optimized.length - original.length;
      changes.push(`Added ${diff} characters of model-specific guidance`);
    }
    if (optimized.includes("JSON") && !original.includes("JSON")) {
      changes.push("Added JSON output mode hint");
    }
    if (optimized.includes("think") && !original.includes("think")) {
      changes.push("Added reasoning instruction");
    }
    if (optimized.includes("<") && !original.includes("<")) {
      changes.push("Converted headers to XML-style tags (Claude preference)");
    }
    if (changes.length === 0) changes.push("Applied model-specific formatting");
  } else {
    changes.push("Prompt already well-optimized for this model");
  }

  return { optimized, model: profile.name, changes };
}
