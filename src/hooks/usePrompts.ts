import { useState, useEffect, useCallback } from "react";
import { Prompt, PromptVersion } from "@/types/prompt";
import { scorePrompt } from "@/utils/promptScorer";
import { useAuth } from "@/contexts/AuthContext";

const LEGACY_KEY = "promptlab_prompts";
const GLOBAL_KEY = "syntara_prompts";

function getStorageKey(userId: string | undefined): string {
  return userId ? `syntara_user_${userId}_prompts` : GLOBAL_KEY;
}

function loadPrompts(userId: string | undefined): Prompt[] {
  try {
    const key = getStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);

    // Migrate from legacy/global keys for first-time user
    if (userId) {
      const globalRaw = localStorage.getItem(GLOBAL_KEY);
      if (globalRaw) {
        localStorage.setItem(key, globalRaw);
        return JSON.parse(globalRaw);
      }
    }

    // Legacy migration (promptlab → syntara)
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const targetKey = getStorageKey(userId);
      localStorage.setItem(targetKey, legacy);
      localStorage.removeItem(LEGACY_KEY);
      return JSON.parse(legacy);
    }

    return [];
  } catch {
    return [];
  }
}

function savePrompts(userId: string | undefined, prompts: Prompt[]) {
  localStorage.setItem(getStorageKey(userId), JSON.stringify(prompts));
}

export function usePrompts() {
  const { user } = useAuth();
  const userId = user?.id;
  const [prompts, setPrompts] = useState<Prompt[]>(() => loadPrompts(userId));

  // Reload prompts when user changes
  useEffect(() => {
    setPrompts(loadPrompts(userId));
  }, [userId]);

  useEffect(() => {
    savePrompts(userId, prompts);
  }, [prompts, userId]);

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
