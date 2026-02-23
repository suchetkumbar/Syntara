export interface Prompt {
  id: string;
  title: string;
  content: string;
  versions: PromptVersion[];
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface PromptVersion {
  id: string;
  content: string;
  score: PromptScore | null;
  createdAt: string;
  note: string;
}

export interface PromptScore {
  total: number;
  breakdown: ScoreBreakdown;
  suggestions: string[];
}

export interface ScoreBreakdown {
  specificity: number;
  clarity: number;
  structure: number;
  constraints: number;
  outputFormat: number;
  role: number;
}

export interface BuilderBlock {
  id: string;
  label: string;
  content: string;
  enabled: boolean;
}

export interface Experiment {
  id: string;
  name: string;
  promptA: string;
  promptB: string;
  scoreA?: PromptScore;
  scoreB?: PromptScore;
  createdAt: string;
}
