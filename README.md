# Syntara

AI Prompt Engineering Workbench — generate, score, debug, optimize, and compare prompts with model-specific intelligence.

## Features

### Core
- **Prompt Generator** — Generate or improve prompts with 4 strategies (Standard, Chain-of-Thought, Few-Shot, System Prompt)
- **Prompt Scoring Engine** — Gradient scoring on role, specificity, clarity, structure, constraints, output format
- **Modular Prompt Builder** — Assemble prompts with toggleable, drag-and-drop blocks (@dnd-kit)
- **Prompt Library** — Search, edit, version-track, export/import saved prompts
- **A/B Compare** — Side-by-side prompt scoring with persisted experiments

### Intelligence
- **Prompt Debugger** — Detects vague language, conflicting instructions, complexity issues, missing sections
- **Model Optimizer** — Model-specific tips & transforms for GPT-4o, GPT-3.5, Claude 3.5, Gemini Pro, Llama 3
- **Similarity Search** — TF-IDF cosine similarity to find related prompts in your library
- **Token Estimator** — Word-based heuristic with 5-model cost breakdowns and context warnings

### Pages
- **Templates** — 15 curated prompt templates across 5 categories (Coding, Writing, Analysis, Creative, Business)
- **Analytics Dashboard** — Score distribution, category breakdown, best prompt, recent activity
- **Settings** — Account, preferences (default strategy/model), data management, keyboard shortcuts reference

### Quality of Life
- **Authentication** — Login/Signup with user-scoped data (SHA-256 hashing, demo mode)
- **Dark/Light Theme** — Toggle with animated icon
- **Keyboard Shortcuts** — `Ctrl+Enter`, `Ctrl+S`, `Ctrl+K`, `Ctrl+/`
- **Version Diff** — LCS-based inline diff in Library version history
- **Export/Import** — JSON bulk export, Markdown per-prompt, JSON file import

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Framer Motion
- @dnd-kit (drag-and-drop)
- Vitest (82+ tests)

## Getting Started

```sh
git clone <YOUR_GIT_URL>
cd Syntara
npm install
npm run dev
```

## Keyboard Shortcuts

| Shortcut | Context | Action |
|----------|---------|--------|
| `Ctrl + Enter` | Generator | Generate / Optimize prompt |
| `Ctrl + S` | Builder | Save current prompt |
| `Ctrl + K` | Global | Focus search (Library / Templates) |
| `Ctrl + /` | Global | Toggle shortcuts help dialog |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests (82+ passing) |
| `npm run preview` | Preview production build |
