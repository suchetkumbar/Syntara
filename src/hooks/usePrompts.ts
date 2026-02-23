import { useState, useEffect, useCallback } from "react";
import { Prompt, PromptVersion } from "@/types/prompt";
import { scorePrompt } from "@/utils/promptScorer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export function usePrompts() {
  const { user } = useAuth();
  const userId = user?.id;
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  // Load prompts from Supabase when user changes
  useEffect(() => {
    if (!userId) {
      setPrompts([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchPrompts() {
      setLoading(true);
      const { data, error } = await supabase
        .from("prompts")
        .select("*, prompt_versions(*)")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error("Failed to load prompts:", error.message);
        setPrompts([]);
      } else {
        // Map DB rows to Prompt interface
        const mapped: Prompt[] = (data || []).map((row: any) => ({
          id: row.id,
          title: row.title,
          content: row.content,
          tags: row.tags || [],
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          versions: (row.prompt_versions || [])
            .map((v: any) => ({
              id: v.id,
              content: v.content,
              score: v.score,
              createdAt: v.created_at,
              note: v.note,
            }))
            .sort(
              (a: PromptVersion, b: PromptVersion) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            ),
        }));
        setPrompts(mapped);
      }
      setLoading(false);
    }

    fetchPrompts();
    return () => { cancelled = true; };
  }, [userId]);

  const addPrompt = useCallback(
    async (title: string, content: string, tags: string[] = []) => {
      if (!userId) return null;

      const score = scorePrompt(content);

      // Insert prompt
      const { data: promptRow, error: promptErr } = await supabase
        .from("prompts")
        .insert({ user_id: userId, title, content, tags })
        .select()
        .single();

      if (promptErr || !promptRow) {
        console.error("Failed to create prompt:", promptErr?.message);
        return null;
      }

      // Insert initial version
      const { data: versionRow, error: versionErr } = await supabase
        .from("prompt_versions")
        .insert({
          prompt_id: promptRow.id,
          content,
          score,
          note: "Initial version",
        })
        .select()
        .single();

      if (versionErr) {
        console.error("Failed to create version:", versionErr.message);
      }

      const version: PromptVersion = {
        id: versionRow?.id || crypto.randomUUID(),
        content,
        score,
        createdAt: versionRow?.created_at || new Date().toISOString(),
        note: "Initial version",
      };

      const prompt: Prompt = {
        id: promptRow.id,
        title,
        content,
        versions: [version],
        createdAt: promptRow.created_at,
        updatedAt: promptRow.updated_at,
        tags,
      };

      setPrompts((prev) => [prompt, ...prev]);
      return prompt;
    },
    [userId]
  );

  const updatePrompt = useCallback(
    async (id: string, content: string, note = "Updated") => {
      if (!userId) return;

      const score = scorePrompt(content);
      const now = new Date().toISOString();

      // Update prompt content
      const { error: updateErr } = await supabase
        .from("prompts")
        .update({ content, updated_at: now })
        .eq("id", id);

      if (updateErr) {
        console.error("Failed to update prompt:", updateErr.message);
        return;
      }

      // Insert new version
      const { data: versionRow } = await supabase
        .from("prompt_versions")
        .insert({ prompt_id: id, content, score, note })
        .select()
        .single();

      const version: PromptVersion = {
        id: versionRow?.id || crypto.randomUUID(),
        content,
        score,
        createdAt: versionRow?.created_at || now,
        note,
      };

      setPrompts((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          return {
            ...p,
            content,
            versions: [...p.versions, version],
            updatedAt: now,
          };
        })
      );
    },
    [userId]
  );

  const deletePrompt = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("prompts").delete().eq("id", id);
      if (error) {
        console.error("Failed to delete prompt:", error.message);
        return;
      }
      setPrompts((prev) => prev.filter((p) => p.id !== id));
    },
    []
  );

  return { prompts, loading, addPrompt, updatePrompt, deletePrompt };
}
