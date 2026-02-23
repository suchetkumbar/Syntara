import { describe, it, expect } from "vitest";
import { debugPrompt, DebugIssue } from "@/services/placeholder/promptDebugger";

function severities(issues: DebugIssue[]) {
    return issues.map((i) => i.severity);
}

function categories(issues: DebugIssue[]) {
    return issues.map((i) => i.category);
}

describe("promptDebugger", () => {
    // ── Empty / Minimal ───────────────────────────────────────────
    describe("empty and minimal input", () => {
        it("returns a single error for empty string", () => {
            const result = debugPrompt("");
            expect(result).toHaveLength(1);
            expect(result[0].severity).toBe("error");
            expect(result[0].category).toBe("Empty");
        });

        it("returns a single error for whitespace-only input", () => {
            const result = debugPrompt("   \n\t  ");
            expect(result).toHaveLength(1);
            expect(result[0].severity).toBe("error");
        });

        it("returns issues for a very short non-empty prompt", () => {
            const result = debugPrompt("Hello");
            expect(result.length).toBeGreaterThan(0);
            // Should detect missing sections at minimum
            expect(categories(result)).toContain("Missing Section");
        });
    });

    // ── Vague Language ────────────────────────────────────────────
    describe("vague language detection", () => {
        it("detects vague words like 'stuff' and 'things'", () => {
            const result = debugPrompt("Write about stuff and things");
            const vague = result.filter((i) => i.category === "Vague Language");
            expect(vague.length).toBeGreaterThan(0);
        });

        it("detects uncertain language like 'maybe' and 'perhaps'", () => {
            const result = debugPrompt("Maybe perhaps you could possibly do something");
            const vague = result.filter((i) => i.category === "Vague Language");
            expect(vague.length).toBeGreaterThan(0);
        });

        it("detects filler intensifiers like 'very' and 'really'", () => {
            const result = debugPrompt("Make it very really extremely detailed");
            const vague = result.filter((i) => i.category === "Vague Language");
            expect(vague.length).toBeGreaterThan(0);
        });

        it("detects weak directives like 'try to'", () => {
            const result = debugPrompt("Try to attempt to write a summary");
            const vague = result.filter((i) => i.category === "Vague Language");
            expect(vague.length).toBeGreaterThan(0);
        });

        it("detects imprecise quantities like 'some' and 'several'", () => {
            const result = debugPrompt("Include some examples and several references");
            const vague = result.filter((i) => i.category === "Vague Language");
            expect(vague.length).toBeGreaterThan(0);
        });
    });

    // ── Conflicting Instructions ──────────────────────────────────
    describe("conflict detection", () => {
        it("detects brevity vs detail conflict", () => {
            const result = debugPrompt("Be brief and concise. Also be detailed and comprehensive.");
            const conflicts = result.filter((i) => i.category === "Conflict");
            expect(conflicts.length).toBeGreaterThan(0);
            expect(conflicts[0].severity).toBe("error");
        });

        it("detects formal vs casual tone conflict", () => {
            const result = debugPrompt("Write in a formal professional tone. Keep it casual and friendly.");
            const conflicts = result.filter((i) => i.category === "Conflict");
            expect(conflicts.length).toBeGreaterThan(0);
        });

        it("detects simple vs advanced level conflict", () => {
            const result = debugPrompt("Use simple beginner terms. Target an advanced expert audience.");
            const conflicts = result.filter((i) => i.category === "Conflict");
            expect(conflicts.length).toBeGreaterThan(0);
        });

        it("returns no conflicts for consistent instructions", () => {
            const result = debugPrompt("Be detailed and thorough. Write for an expert audience.");
            const conflicts = result.filter((i) => i.category === "Conflict");
            expect(conflicts).toHaveLength(0);
        });
    });

    // ── Missing Sections ──────────────────────────────────────────
    describe("missing section detection", () => {
        it("detects all missing sections in a bare prompt", () => {
            const result = debugPrompt("Write a poem about nature");
            const missing = result.filter((i) => i.category === "Missing Section");
            // Should flag missing Role, Task, Output Format, Constraints
            // "Write" satisfies none of the essential keywords directly
            expect(missing.length).toBeGreaterThanOrEqual(2);
        });

        it("does not flag Role if 'you are' is present", () => {
            const result = debugPrompt("You are a poet. Your task is to write. Output a poem. You must rhyme.");
            const missing = result.filter((i) => i.category === "Missing Section");
            expect(missing).toHaveLength(0);
        });

        it("recognizes 'act as' as a role section", () => {
            const result = debugPrompt("Act as a teacher. Your goal is to explain. Format the output clearly. You should be clear.");
            const missingRole = result.filter((i) => i.category === "Missing Section" && i.message.includes("Role"));
            expect(missingRole).toHaveLength(0);
        });
    });

    // ── Complexity ────────────────────────────────────────────────
    describe("complexity detection", () => {
        it("detects very long sentences (200+ chars)", () => {
            const longSentence = "word ".repeat(60); // ~300 chars without period
            const result = debugPrompt(longSentence);
            const complexity = result.filter((i) => i.category === "Complexity");
            expect(complexity.length).toBeGreaterThan(0);
        });
    });

    // ── Structure ─────────────────────────────────────────────────
    describe("structure detection", () => {
        it("flags long prompts without structure markers", () => {
            // 101+ words, no #, -, *, or numbers
            const longFlat = Array(110).fill("word").join(" ");
            const result = debugPrompt(longFlat);
            const structure = result.filter((i) => i.category === "Structure");
            expect(structure.length).toBeGreaterThan(0);
        });

        it("does not flag long prompts with structure", () => {
            const longStructured = "## Section\n" + "- " + Array(110).fill("word").join(" ");
            const result = debugPrompt(longStructured);
            const structure = result.filter((i) => i.category === "Structure");
            expect(structure).toHaveLength(0);
        });
    });

    // ── Ambiguity (multiple questions) ────────────────────────────
    describe("ambiguity detection", () => {
        it("flags prompts with more than 3 question marks", () => {
            const result = debugPrompt("What? How? When? Where? Why?");
            const ambiguity = result.filter((i) => i.category === "Ambiguity");
            expect(ambiguity.length).toBeGreaterThan(0);
            expect(ambiguity[0].message).toContain("5 questions");
        });

        it("does not flag prompts with 3 or fewer question marks", () => {
            const result = debugPrompt("What? How? When?");
            const ambiguity = result.filter((i) => i.category === "Ambiguity");
            expect(ambiguity).toHaveLength(0);
        });
    });

    // ── Sorting ───────────────────────────────────────────────────
    describe("result ordering", () => {
        it("sorts issues by severity: error > warning > info", () => {
            // This prompt should trigger errors (conflict), warnings (vague), and info (missing)
            const result = debugPrompt("Maybe be brief and also be detailed");
            const sev = severities(result);
            const order = { error: 0, warning: 1, info: 2 };
            for (let i = 1; i < sev.length; i++) {
                expect(order[sev[i]]).toBeGreaterThanOrEqual(order[sev[i - 1]]);
            }
        });
    });

    // ── Well-formed prompt ────────────────────────────────────────
    describe("well-formed prompts", () => {
        it("returns few or no issues for a well-structured prompt", () => {
            const good = `## Role
You are a senior software engineer.

## Task
Your goal is to review the following code.

## Output Format
Return a structured review with sections for issues and improvements.

## Constraints
You must be specific and reference line numbers. Do not include style-only feedback.`;
            const result = debugPrompt(good);
            // Should have no missing sections, no conflicts
            const errors = result.filter((i) => i.severity === "error");
            expect(errors).toHaveLength(0);
        });
    });
});
