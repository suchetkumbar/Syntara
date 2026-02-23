import { describe, it, expect } from "vitest";
import {
    getModelProfiles,
    getModelProfile,
    optimizeForModel,
} from "@/services/placeholder/modelOptimizer";

describe("modelOptimizer", () => {
    // ── Profile Lookup ────────────────────────────────────────────
    describe("getModelProfiles", () => {
        it("returns all 5 model profiles", () => {
            const profiles = getModelProfiles();
            expect(profiles).toHaveLength(5);
        });

        it("each profile has required fields", () => {
            for (const p of getModelProfiles()) {
                expect(p.id).toBeTruthy();
                expect(p.name).toBeTruthy();
                expect(p.provider).toBeTruthy();
                expect(p.contextLimit).toBeGreaterThan(0);
                expect(p.tips.length).toBeGreaterThanOrEqual(1);
                expect(typeof p.transform).toBe("function");
            }
        });
    });

    describe("getModelProfile", () => {
        it("returns the correct profile by id", () => {
            const profile = getModelProfile("gpt-4o");
            expect(profile).toBeDefined();
            expect(profile!.name).toBe("GPT-4o");
            expect(profile!.provider).toBe("OpenAI");
        });

        it("returns undefined for unknown model id", () => {
            expect(getModelProfile("nonexistent-model")).toBeUndefined();
        });
    });

    // ── GPT-4o Transforms ────────────────────────────────────────
    describe("GPT-4o optimization", () => {
        it("adds Role section if missing", () => {
            const result = optimizeForModel("Write a summary", "gpt-4o");
            expect(result.optimized).toContain("## Role");
        });

        it("does not duplicate Role section if present", () => {
            const prompt = "## Role\nYou are an expert.\n\nWrite a summary.";
            const result = optimizeForModel(prompt, "gpt-4o");
            const roleCount = (result.optimized.match(/## Role/g) || []).length;
            expect(roleCount).toBe(1);
        });

        it("adds JSON hint when structured data keywords are present", () => {
            const result = optimizeForModel("Return a json object with the data", "gpt-4o");
            expect(result.optimized.toLowerCase()).toContain("respond in valid json");
        });

        it("does not add JSON hint when already present", () => {
            const prompt = "Return a json object. Respond in JSON.";
            const result = optimizeForModel(prompt, "gpt-4o");
            const jsonCount = (result.optimized.match(/Respond in.*JSON/gi) || []).length;
            expect(jsonCount).toBe(1);
        });
    });

    // ── GPT-3.5 Transforms ───────────────────────────────────────
    describe("GPT-3.5 optimization", () => {
        it("wraps prompt with system message if no 'you are' present", () => {
            const result = optimizeForModel("Summarize the text", "gpt-35");
            expect(result.optimized).toContain("You are a helpful AI assistant");
        });

        it("does not wrap if 'You are' is already present", () => {
            const result = optimizeForModel("You are an expert. Summarize the text.", "gpt-35");
            expect(result.optimized).not.toContain("You are a helpful AI assistant");
        });

        it("adds concise instruction for very long prompts", () => {
            const longPrompt = "You are an expert. " + "word ".repeat(510);
            const result = optimizeForModel(longPrompt, "gpt-35");
            expect(result.optimized).toContain("focused and concise");
        });
    });

    // ── Claude 3.5 Transforms ────────────────────────────────────
    describe("Claude 3.5 optimization", () => {
        it("converts ## headers to XML-style tags", () => {
            const prompt = "## Task\nDo something\n\n## Output\nReturn text";
            const result = optimizeForModel(prompt, "claude-35");
            expect(result.optimized).toContain("<task>");
            expect(result.optimized).toContain("<output>");
        });

        it("adds thinking instruction when not present", () => {
            const result = optimizeForModel("Write a summary", "claude-35");
            expect(result.optimized).toContain("think through this carefully");
        });

        it("does not add thinking instruction if step-by-step is present", () => {
            const result = optimizeForModel("Think step by step about this", "claude-35");
            expect(result.optimized).not.toContain("think through this carefully");
        });
    });

    // ── Gemini Pro Transforms ─────────────────────────────────────
    describe("Gemini Pro optimization", () => {
        it("adds numbered steps instruction when no step keywords present", () => {
            const result = optimizeForModel("Write a summary", "gemini-pro");
            expect(result.optimized).toContain("numbered steps");
        });

        it("does not add steps instruction if 'step' keyword is present", () => {
            const result = optimizeForModel("Follow these steps to summarize", "gemini-pro");
            expect(result.optimized).not.toContain("numbered steps");
        });
    });

    // ── Llama 3 Transforms ───────────────────────────────────────
    describe("Llama 3 optimization", () => {
        it("wraps as system message", () => {
            const result = optimizeForModel("Summarize the text", "llama-3");
            expect(result.optimized).toContain("You are a helpful AI assistant");
        });

        it("adds format instruction when no format keywords present", () => {
            const result = optimizeForModel("Summarize the text", "llama-3");
            expect(result.optimized).toContain("sections and bullet points");
        });

        it("does not add format instruction if 'format' keyword present", () => {
            const result = optimizeForModel("You are an expert. Format the output as a list.", "llama-3");
            expect(result.optimized).not.toContain("sections and bullet points");
        });
    });

    // ── Unknown Model ─────────────────────────────────────────────
    describe("unknown model fallback", () => {
        it("returns original prompt unchanged", () => {
            const prompt = "Write a poem";
            const result = optimizeForModel(prompt, "unknown-model-xyz");
            expect(result.optimized).toBe(prompt);
            expect(result.changes).toContain("Unknown model — no changes applied");
        });
    });

    // ── optimizeForModel Change Detection ─────────────────────────
    describe("change detection", () => {
        it("reports 'already well-optimized' when no changes needed", () => {
            const prompt = "You are an expert. Follow these steps to complete the task. Format the output clearly.";
            const result = optimizeForModel(prompt, "llama-3");
            // This prompt has "You are", "steps", and "format" — should be unchanged
            expect(result.changes).toContain("Prompt already well-optimized for this model");
        });

        it("reports model name in result", () => {
            const result = optimizeForModel("hello", "claude-35");
            expect(result.model).toBe("Claude 3.5 Sonnet");
        });
    });
});
