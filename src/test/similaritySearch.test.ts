import { describe, it, expect } from "vitest";
import { findSimilarPrompts } from "@/services/placeholder/similaritySearch";
import { Prompt } from "@/types/prompt";

/** Helper to create a minimal Prompt object for tests */
function makePrompt(id: string, title: string, content: string): Prompt {
    return {
        id,
        title,
        content,
        versions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [],
    };
}

describe("similaritySearch", () => {
    const corpus: Prompt[] = [
        makePrompt("1", "Code Review", "Review the following code for security vulnerabilities and performance issues"),
        makePrompt("2", "Blog Writer", "Write a comprehensive blog post about technology trends with SEO optimization"),
        makePrompt("3", "Data Analysis", "Analyze the dataset for patterns, trends, and statistical significance"),
        makePrompt("4", "Code Debugger", "Debug the following code and identify the root cause of errors and bugs"),
        makePrompt("5", "Email Writer", "Compose a professional email to a client about the project status update"),
    ];

    // ── Basic Functionality ───────────────────────────────────────
    describe("basic search", () => {
        it("returns results for a matching query", () => {
            const results = findSimilarPrompts("code review security", corpus);
            expect(results.length).toBeGreaterThan(0);
        });

        it("ranks the most relevant prompt first", () => {
            const results = findSimilarPrompts("code review security vulnerabilities", corpus);
            expect(results[0].prompt.id).toBe("1");
        });

        it("returns scores between 0 and 1", () => {
            const results = findSimilarPrompts("code review", corpus);
            for (const r of results) {
                expect(r.score).toBeGreaterThanOrEqual(0);
                expect(r.score).toBeLessThanOrEqual(1);
            }
        });
    });

    // ── Identical / Near-identical ────────────────────────────────
    describe("similarity scores", () => {
        it("returns high similarity for identical text", () => {
            const query = "Review the following code for security vulnerabilities and performance issues";
            const results = findSimilarPrompts(query, corpus);
            expect(results[0].prompt.id).toBe("1");
            expect(results[0].score).toBeGreaterThan(0.5);
        });

        it("returns higher score for similar content than dissimilar", () => {
            const results = findSimilarPrompts("debug code fix errors bugs", corpus);
            const debugResult = results.find((r) => r.prompt.id === "4");
            const emailResult = results.find((r) => r.prompt.id === "5");
            if (debugResult && emailResult) {
                expect(debugResult.score).toBeGreaterThan(emailResult.score);
            } else {
                // At minimum, debug result should be present
                expect(debugResult).toBeDefined();
            }
        });
    });

    // ── Empty / Edge Cases ────────────────────────────────────────
    describe("edge cases", () => {
        it("returns empty array for empty query", () => {
            expect(findSimilarPrompts("", corpus)).toHaveLength(0);
        });

        it("returns empty array for whitespace-only query", () => {
            expect(findSimilarPrompts("   \n\t  ", corpus)).toHaveLength(0);
        });

        it("returns empty array for empty corpus", () => {
            expect(findSimilarPrompts("code review", [])).toHaveLength(0);
        });

        it("returns empty array for completely unrelated query", () => {
            // Very short words (≤2 chars) are filtered out, so "xyz" (3 chars) should work
            // but have no overlap with the corpus
            const results = findSimilarPrompts("xyzzyfrob quxbazzle", corpus);
            expect(results).toHaveLength(0);
        });
    });

    // ── Limit and Threshold ───────────────────────────────────────
    describe("limit and threshold", () => {
        it("respects the limit parameter", () => {
            const results = findSimilarPrompts("the following code", corpus, 2);
            expect(results.length).toBeLessThanOrEqual(2);
        });

        it("filters results below the threshold", () => {
            // Very high threshold — should return few or no results
            const results = findSimilarPrompts("code review", corpus, 5, 0.95);
            // With a 0.95 threshold, only near-exact matches should pass
            for (const r of results) {
                expect(r.score).toBeGreaterThanOrEqual(0.95);
            }
        });

        it("returns more results with a lower threshold", () => {
            const lowThreshold = findSimilarPrompts("code analysis review", corpus, 10, 0.01);
            const highThreshold = findSimilarPrompts("code analysis review", corpus, 10, 0.5);
            expect(lowThreshold.length).toBeGreaterThanOrEqual(highThreshold.length);
        });
    });

    // ── Result Ordering ───────────────────────────────────────────
    describe("result ordering", () => {
        it("returns results sorted by score descending", () => {
            const results = findSimilarPrompts("code review analysis", corpus);
            for (let i = 1; i < results.length; i++) {
                expect(results[i].score).toBeLessThanOrEqual(results[i - 1].score);
            }
        });
    });
});
