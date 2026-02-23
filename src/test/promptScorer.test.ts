import { describe, it, expect } from "vitest";
import { scorePrompt, getScoreColor, getScoreLabel } from "@/utils/promptScorer";

describe("scorePrompt", () => {
    it("returns zero for empty string", () => {
        const result = scorePrompt("");
        expect(result.total).toBe(0);
        expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it("returns very low score for very short input", () => {
        const result = scorePrompt("hi");
        expect(result.total).toBeLessThan(10);
    });

    it("gives partial credit for role-adjacent keywords", () => {
        const result = scorePrompt("I want you to help me write a detailed plan for building a landing page with proper structure and format");
        expect(result.breakdown.role).toBeGreaterThan(0); // role-adjacent credit
        expect(result.breakdown.role).toBeLessThan(15); // not full credit
    });

    it("gives full role credit for strong role keywords", () => {
        const result = scorePrompt("You are an expert web developer. Analyze the structure of this project. Always use TypeScript. Return the result in JSON format.");
        expect(result.breakdown.role).toBeGreaterThanOrEqual(12);
    });

    it("scores constraints based on count", () => {
        const result = scorePrompt("You must always ensure accuracy. Do not skip steps. Avoid guessing. Never make assumptions. Only use verified data.");
        expect(result.breakdown.constraints).toBeGreaterThanOrEqual(16);
    });

    it("detects output format with gradient", () => {
        const singleFormat = scorePrompt("Provide the response in JSON format with bullet points and numbered list as a table");
        expect(singleFormat.breakdown.outputFormat).toBeGreaterThanOrEqual(16);
    });

    it("awards example bonus in structure score", () => {
        const withExamples = scorePrompt("For example, you could create a landing page. Here's an example of good structure with proper formatting and output");
        expect(withExamples.breakdown.structure).toBeGreaterThan(0);
    });

    it("produces max score for well-crafted prompt", () => {
        const fullPrompt = `## Role
You are an expert software architect. Act as a senior code reviewer.

## Goal
Analyze and evaluate the given codebase for best practices.

## Context
For example, check for proper error handling. Here's an example of good modular design.

## Constraints
- You must always explain your reasoning
- Do not skip any critical issues
- Ensure all suggestions are actionable
- Avoid vague recommendations
- Never suggest deprecated patterns
- Only recommend battle-tested solutions

## Output Format
Provide your response in markdown format with:
- Numbered list of findings
- Table of severity ratings
- Code blocks for suggested fixes
- Bullet points for quick wins
- Summary in JSON format at the end`;
        const result = scorePrompt(fullPrompt);
        expect(result.total).toBeGreaterThanOrEqual(75);
    });

    it("suggests improvements for basic prompts", () => {
        const result = scorePrompt("Write a blog post about technology");
        expect(result.suggestions.length).toBeGreaterThan(2);
        expect(result.suggestions.some((s) => s.toLowerCase().includes("role"))).toBe(true);
    });
});

describe("getScoreColor", () => {
    it("returns success for high scores", () => {
        expect(getScoreColor(80)).toBe("text-success");
        expect(getScoreColor(100)).toBe("text-success");
    });
    it("returns warning for mid scores", () => {
        expect(getScoreColor(50)).toBe("text-warning");
        expect(getScoreColor(79)).toBe("text-warning");
    });
    it("returns destructive for low scores", () => {
        expect(getScoreColor(0)).toBe("text-destructive");
        expect(getScoreColor(49)).toBe("text-destructive");
    });
});

describe("getScoreLabel", () => {
    it("returns Excellent for 85+", () => expect(getScoreLabel(85)).toBe("Excellent"));
    it("returns Great for 70-84", () => expect(getScoreLabel(75)).toBe("Great"));
    it("returns Good for 55-69", () => expect(getScoreLabel(60)).toBe("Good"));
    it("returns Fair for 40-54", () => expect(getScoreLabel(45)).toBe("Fair"));
    it("returns Needs Work for <20", () => expect(getScoreLabel(10)).toBe("Needs Work"));
});
