import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import ScoreDisplay from "@/components/ScoreDisplay";
import TokenEstimate from "@/components/TokenEstimate";
import { generateOptimizedPrompt, STRATEGY_META, PromptStrategy } from "@/utils/promptGenerator";
import { scorePrompt } from "@/utils/promptScorer";
import { usePrompts } from "@/hooks/usePrompts";
import { PromptScore } from "@/types/prompt";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, Copy, Save, Wand2, BarChart3, Brain, MessagesSquare, BookOpen, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const strategyIcons: Record<PromptStrategy, React.ElementType> = {
  standard: Sparkles,
  "chain-of-thought": Brain,
  "few-shot": BookOpen,
  "system-prompt": Terminal,
};

export default function Index() {
  const [mode, setMode] = useState<"generate" | "improve">("generate");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [score, setScore] = useState<PromptScore | null>(null);
  const [strategy, setStrategy] = useState<PromptStrategy>("standard");
  const { addPrompt } = usePrompts();

  // Keyboard shortcut: Ctrl+Enter to generate/optimize
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (input.trim()) {
          if (mode === "generate") handleGenerate();
          else handleImprove();
        } else {
          toast.error("Please enter a prompt idea first");
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const handleGenerate = () => {
    if (!input.trim()) {
      toast.error("Please enter a prompt idea first");
      return;
    }
    const result = generateOptimizedPrompt(input, strategy);
    setOutput(result);
    setScore(null);
  };

  const handleImprove = () => {
    if (!input.trim()) {
      toast.error("Please enter a prompt to improve");
      return;
    }
    const result = generateOptimizedPrompt(input, strategy);
    setOutput(result);
    setScore(null);
  };

  const handleScore = () => {
    const textToScore = output || input;
    if (!textToScore.trim()) {
      toast.error("Nothing to score yet");
      return;
    }
    setScore(scorePrompt(textToScore));
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard");
  };

  const handleSave = () => {
    if (!output) return;
    const title = input.slice(0, 50) || "Untitled Prompt";
    addPrompt(title, output, [strategy]);
    toast.success("Saved to Library");
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
            Prompt <span className="text-gradient-primary">Generator</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Craft high-quality AI prompts from a simple idea{" "}
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border font-mono">
              Ctrl+Enter
            </kbd>
          </p>
        </motion.div>

        {/* Mode tabs */}
        <div className="flex gap-1 bg-card p-1 rounded-lg w-fit border border-border">
          {(["generate", "improve"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="relative px-4 py-2 text-sm font-medium rounded-md transition-colors z-10"
            >
              {mode === m && (
                <motion.div
                  layoutId="mode-tab"
                  className="absolute inset-0 bg-primary/10 rounded-md"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span className={`relative z-10 ${mode === m ? "text-primary" : "text-muted-foreground"}`}>
                {m === "generate" ? "✨ Generate" : "🔧 Improve"}
              </span>
            </button>
          ))}
        </div>

        {/* Strategy selector */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 block">
            Strategy
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(STRATEGY_META) as PromptStrategy[]).map((s) => {
              const Icon = strategyIcons[s];
              const active = strategy === s;
              return (
                <motion.button
                  key={s}
                  onClick={() => setStrategy(s)}
                  whileTap={{ scale: 0.97 }}
                  className={`relative flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all ${active
                      ? "border-primary/40 text-primary bg-primary/5"
                      : "border-border text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/50"
                    }`}
                >
                  {active && (
                    <motion.div
                      layoutId="strategy-active"
                      className="absolute inset-0 border-2 border-primary/30 rounded-lg"
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{STRATEGY_META[s].label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Input */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="surface-elevated rounded-lg p-4 space-y-3"
          >
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {mode === "generate" ? "Your Idea" : "Prompt to Improve"}
            </label>
            {mode === "generate" ? (
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your prompt idea in a few words..."
                className="bg-background border-border"
              />
            ) : (
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste an existing prompt to optimize..."
                rows={6}
                className="bg-background border-border resize-none font-mono text-sm"
              />
            )}
            <div className="flex gap-2">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button onClick={mode === "generate" ? handleGenerate : handleImprove} className="gap-2">
                  {mode === "generate" ? <Sparkles className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                  {mode === "generate" ? "Generate Prompt" : "Optimize"}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Output */}
        <AnimatePresence>
          {output && (
            <motion.div
              key="output"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="surface-elevated rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Result
                </label>
                <div className="flex gap-1.5">
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Button size="sm" variant="ghost" onClick={handleCopy} className="gap-1.5 h-7 text-xs">
                      <Copy className="w-3 h-3" /> Copy
                    </Button>
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Button size="sm" variant="ghost" onClick={handleSave} className="gap-1.5 h-7 text-xs">
                      <Save className="w-3 h-3" /> Save
                    </Button>
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Button size="sm" variant="ghost" onClick={handleScore} className="gap-1.5 h-7 text-xs">
                      <BarChart3 className="w-3 h-3" /> Score
                    </Button>
                  </motion.div>
                </div>
              </div>
              <pre className="text-sm font-mono whitespace-pre-wrap bg-background rounded-md p-3 border border-border max-h-80 overflow-y-auto">
                {output}
              </pre>
              <TokenEstimate text={output} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Score panel */}
        <AnimatePresence>
          {score && (
            <motion.div
              key="score"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="surface-elevated rounded-lg p-4"
            >
              <ScoreDisplay score={score} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
