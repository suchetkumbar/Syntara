import { describe, it, expect } from "vitest";
import { generateOptimizedPrompt, STRATEGY_META } from "@/utils/promptGenerator";

describe("generateOptimizedPrompt", () => {
    it("returns empty string for empty input", () => {
        expect(generateOptimizedPrompt("")).toBe("");
        expect(generateOptimizedPrompt("   ")).toBe("");
    });

    it("generates standard prompt by default", () => {
        const result = generateOptimizedPrompt("web development");
        expect(result).toContain("## Role");
        expect(result).toContain("web development");
        expect(result).toContain("## Constraints");
        expect(result).toContain("## Output Format");
    });

    it("generates chain-of-thought prompt", () => {
        const result = generateOptimizedPrompt("debugging a memory leak", "chain-of-thought");
        expect(result).toContain("step by step");
        expect(result).toContain("**Understand**");
        expect(result).toContain("**Analyze**");
        expect(result).toContain("**Conclude**");
        expect(result).toContain("debugging a memory leak");
    });

    it("generates few-shot prompt", () => {
        const result = generateOptimizedPrompt("code review", "few-shot");
        expect(result).toContain("**Example 1:**");
        expect(result).toContain("**Example 2:**");
        expect(result).toContain("pattern");
        expect(result).toContain("code review");
    });

    it("generates system prompt style", () => {
        const result = generateOptimizedPrompt("data analysis", "system-prompt");
        expect(result).toContain("**Core Behaviors:**");
        expect(result).toContain("**Communication Style:**");
        expect(result).toContain("data analysis");
        // System prompt style doesn't use ## Role header
        expect(result).not.toContain("## Role");
    });

    it("capitalizes the idea in goal section", () => {
        const result = generateOptimizedPrompt("building restful APIs");
        expect(result).toContain("Building restful APIs");
    });

    it("has strategy metadata for all strategies", () => {
        expect(Object.keys(STRATEGY_META)).toEqual([
            "standard",
            "chain-of-thought",
            "few-shot",
            "system-prompt",
        ]);
        for (const meta of Object.values(STRATEGY_META)) {
            expect(meta.label).toBeTruthy();
            expect(meta.description).toBeTruthy();
        }
    });
});
