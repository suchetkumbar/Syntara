import { useState, useEffect, useCallback } from "react";
import { Prompt, PromptVersion } from "@/types/prompt";
import { scorePrompt } from "@/utils/promptScorer";

const STORAGE_KEY = "promptlab_prompts";

function loadPrompts(): Prompt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePrompts(prompts: Prompt[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
}

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>(loadPrompts);

  useEffect(() => {
    savePrompts(prompts);
  }, [prompts]);

  const addPrompt = useCallback((title: string, content: string, tags: string[] = []) => {
    const now = new Date().toISOString();
    const version: PromptVersion = {
      id: crypto.randomUUID(),
      content,
      score: scorePrompt(content),
      createdAt: now,
      note: "Initial version",
    };
    const prompt: Prompt = {
      id: crypto.randomUUID(),
      title,
      content,
      versions: [version],
      createdAt: now,
      updatedAt: now,
      tags,
    };
    setPrompts((prev) => [prompt, ...prev]);
    return prompt;
  }, []);

  const updatePrompt = useCallback((id: string, content: string, note = "Updated") => {
    setPrompts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const version: PromptVersion = {
          id: crypto.randomUUID(),
          content,
          score: scorePrompt(content),
          createdAt: new Date().toISOString(),
          note,
        };
        return { ...p, content, versions: [...p.versions, version], updatedAt: new Date().toISOString() };
      })
    );
  }, []);

  const deletePrompt = useCallback((id: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { prompts, addPrompt, updatePrompt, deletePrompt };
}
