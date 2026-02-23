import { useState } from "react";
import Layout from "@/components/Layout";
import ScoreDisplay from "@/components/ScoreDisplay";
import { generateOptimizedPrompt } from "@/utils/promptGenerator";
import { scorePrompt } from "@/utils/promptScorer";
import { usePrompts } from "@/hooks/usePrompts";
import { PromptScore } from "@/types/prompt";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, Copy, Save, Wand2, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeSlideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function Generator() {
  const [idea, setIdea] = useState("");
  const [generated, setGenerated] = useState("");
  const [score, setScore] = useState<PromptScore | null>(null);
  const [mode, setMode] = useState<"generate" | "improve">("generate");
  const { addPrompt } = usePrompts();

  const handleGenerate = () => {
    if (!idea.trim()) {
      toast.error("Enter an idea or prompt first");
      return;
    }
    const result = generateOptimizedPrompt(idea);
    setGenerated(result);
    setScore(scorePrompt(result));
  };

  const handleScore = () => {
    if (!generated.trim()) return;
    setScore(scorePrompt(generated));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generated);
    toast.success("Copied to clipboard");
  };

  const handleSave = () => {
    if (!generated.trim()) return;
    const title = idea.trim() || "Untitled Prompt";
    addPrompt(title, generated, ["generated"]);
    toast.success("Saved to library");
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <motion.div variants={stagger} initial="initial" animate="animate">
          <motion.div variants={fadeSlideUp} className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
              Prompt <span className="text-gradient-primary">Generator</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Turn ideas into optimized, structured prompts
            </p>
          </motion.div>

          {/* Mode tabs with layoutId indicator */}
          <motion.div variants={fadeSlideUp} className="flex gap-2 mb-6">
            {(["generate", "improve"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === m
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
              >
                {mode === m && (
                  <motion.div
                    layoutId="mode-indicator"
                    className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-lg"
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  />
                )}
                <span className="relative z-10">
                  {m === "generate" ? "Generate" : "Improve"}
                </span>
              </button>
            ))}
          </motion.div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input */}
          <div className="lg:col-span-2 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 24 }}
              className="surface-elevated rounded-lg p-4 space-y-3"
            >
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {mode === "generate" ? "Your Idea" : "Paste Prompt to Improve"}
              </label>
              <AnimatePresence mode="wait">
                {mode === "generate" ? (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Input
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                      placeholder="e.g., Write a blog post about AI ethics"
                      className="bg-background border-border"
                      onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="textarea"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Textarea
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                      placeholder="Paste your existing prompt here..."
                      rows={4}
                      className="bg-background border-border resize-none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <Button onClick={handleGenerate} className="w-full sm:w-auto gap-2">
                <Wand2 className="w-4 h-4" />
                {mode === "generate" ? "Generate Prompt" : "Optimize Prompt"}
              </Button>
            </motion.div>

            <AnimatePresence mode="wait">
              {generated && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  className="surface-elevated rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Result
                    </label>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={handleScore} className="gap-1.5 text-xs">
                        <BarChart3 className="w-3.5 h-3.5" /> Score
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleSave} className="gap-1.5 text-xs">
                        <Save className="w-3.5 h-3.5" /> Save
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={generated}
                    onChange={(e) => {
                      setGenerated(e.target.value);
                      setScore(null);
                    }}
                    rows={12}
                    className="bg-background border-border font-mono text-sm resize-none"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Score panel */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {score && (
                <motion.div
                  key={score.total}
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="surface-elevated rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <Sparkles className="w-4 h-4 text-primary" />
                    </motion.div>
                    <h3 className="text-sm font-semibold">Prompt Score</h3>
                  </div>
                  <ScoreDisplay score={score} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Layout>
  );
}
