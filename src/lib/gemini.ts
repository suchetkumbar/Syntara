import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

if (!apiKey) {
    console.warn(
        "Missing VITE_GEMINI_API_KEY env var. AI features will fall back to local heuristics."
    );
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Get a Gemini generative model instance.
 * Default: gemini-2.0-flash (free tier, fast, good quality).
 */
export function getModel(modelName = "gemini-2.0-flash") {
    if (!genAI) return null;
    return genAI.getGenerativeModel({ model: modelName });
}

/** Check whether AI is available (key configured). */
export function isAIAvailable(): boolean {
    return !!genAI;
}
