import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import ScoreDisplay from "@/components/ScoreDisplay";
import TokenEstimate from "@/components/TokenEstimate";
import PromptDebugPanel from "@/components/PromptDebugPanel";
import ModelOptimizer from "@/components/ModelOptimizer";
import { generateOptimizedPrompt, STRATEGY_META, PromptStrategy } from "@/utils/promptGenerator";
import { scorePrompt } from "@/utils/promptScorer";
import { debugPrompt } from "@/services/placeholder/promptDebugger";
import { generatePromptAI, scorePromptAI, debugPromptAI, improvePromptAI } from "@/services/aiService";
import { isAIAvailable } from "@/lib/gemini";
import { usePrompts } from "@/hooks/usePrompts";
import { PromptScore } from "@/types/prompt";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, Copy, Save, Wand2, BarChart3, Brain, BookOpen, Terminal, Bug, Cpu, Loader2, Zap } from "lucide-react";
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
  const [debugIssues, setDebugIssues] = useState<ReturnType<typeof debugPrompt> | null>(null);
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiUsed, setAiUsed] = useState(false);
  const { addPrompt } = usePrompts();
  const aiOn = isAIAvailable();

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

  const getErrorMsg = (err: unknown, fallbackLabel: string) => {
    const status = (err as { status?: number }).status;
    if (status === 429) return "Gemini rate limit reached — wait ~1 min and retry. Used local " + fallbackLabel;
    return "AI unavailable — used local " + fallbackLabel;
  };

  const handleGenerate = async () => {
    if (!input.trim()) { toast.error("Please enter a prompt idea first"); return; }
    setLoading(true);
    setScore(null);
    setDebugIssues(null);
    try {
      if (aiOn) {
        const { prompt, usedAI } = await generatePromptAI(input, strategy);
        setOutput(prompt);
        setAiUsed(usedAI);
      } else {
        setOutput(generateOptimizedPrompt(input, strategy));
        setAiUsed(false);
      }
    } catch (err) {
      setOutput(generateOptimizedPrompt(input, strategy));
      setAiUsed(false);
      toast.error(getErrorMsg(err, "generation"));
    } finally {
      setLoading(false);
    }
  };

  const handleImprove = async () => {
    if (!input.trim()) { toast.error("Please enter a prompt to improve"); return; }
    setLoading(true);
    setScore(null);
    setDebugIssues(null);
    try {
      if (aiOn) {
        const { improved, usedAI } = await improvePromptAI(input);
        setOutput(improved);
        setAiUsed(usedAI);
      } else {
        setOutput(generateOptimizedPrompt(input, strategy));
        setAiUsed(false);
      }
    } catch (err) {
      setOutput(generateOptimizedPrompt(input, strategy));
      setAiUsed(false);
      toast.error(getErrorMsg(err, "generation"));
    } finally {
      setLoading(false);
    }
  };

  const handleScore = async () => {
    const textToScore = output || input;
    if (!textToScore.trim()) { toast.error("Nothing to score yet"); return; }
    setLoading(true);
    try {
      if (aiOn) {
        setScore(await scorePromptAI(textToScore));
      } else {
        setScore(scorePrompt(textToScore));
      }
    } catch (err) {
      setScore(scorePrompt(textToScore));
      toast.error(getErrorMsg(err, "scorer"));
    } finally {
      setLoading(false);
    }
  };

  const handleDebug = async () => {
    const textToDebug = output || input;
    if (!textToDebug.trim()) { toast.error("Nothing to debug yet"); return; }
    setLoading(true);
    try {
      if (aiOn) {
        setDebugIssues(await debugPromptAI(textToDebug));
      } else {
        setDebugIssues(debugPrompt(textToDebug));
      }
    } catch (err) {
      setDebugIssues(debugPrompt(textToDebug));
      toast.error(getErrorMsg(err, "debugger"));
    } finally {
      setLoading(false);
    }
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
          transition={{ type: "spring" as const, stiffness: 300, damping: 24 }}
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
                  transition={{ type: "spring" as const, stiffness: 350, damping: 30 }}
                />
              )}
              <span className={`relative z-10 ${mode === m ? "text-primary" : "text-muted-foreground"}`}>
                {m === "generate" ? "✨ Generate" : "🔧 Improve"}
              </span>
            </button>
          ))}
        </div>

        {/* Strategy selector */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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
                      transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
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
            <div className="flex gap-2 items-center">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button onClick={mode === "generate" ? handleGenerate : handleImprove} className="gap-2" disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : mode === "generate" ? (
                    <Sparkles className="w-4 h-4" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  {loading ? "Thinking..." : mode === "generate" ? "Generate Prompt" : "Optimize"}
                </Button>
              </motion.div>
              {aiOn && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  <Zap className="w-3 h-3" /> AI Powered
                </span>
              )}
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
              transition={{ type: "spring" as const, stiffness: 300, damping: 24 }}
              className="surface-elevated rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Result
                  </label>
                  {aiUsed && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">
                      <Zap className="w-2.5 h-2.5" /> AI
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5 flex-wrap">
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
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Button size="sm" variant="ghost" onClick={handleDebug} className="gap-1.5 h-7 text-xs">
                      <Bug className="w-3 h-3" /> Debug
                    </Button>
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Button size="sm" variant="ghost" onClick={() => setShowOptimizer(!showOptimizer)} className="gap-1.5 h-7 text-xs">
                      <Cpu className="w-3 h-3" /> Model
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

        {/* Model Optimizer Panel */}
        <AnimatePresence>
          {showOptimizer && output && (
            <motion.div
              key="optimizer"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring" as const, stiffness: 350, damping: 25 }}
              className="surface-elevated rounded-lg p-4"
            >
              <ModelOptimizer
                prompt={output}
                onApply={(optimized) => {
                  setOutput(optimized);
                  setScore(null);
                  setDebugIssues(null);
                  setShowOptimizer(false);
                  toast.success("Model-optimized prompt applied");
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Debug panel */}
        <AnimatePresence>
          {debugIssues && (
            <motion.div
              key="debug"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: "spring" as const, stiffness: 350, damping: 25 }}
              className="surface-elevated rounded-lg p-4"
            >
              <PromptDebugPanel issues={debugIssues} />
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
              transition={{ type: "spring" as const, stiffness: 350, damping: 25 }}
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
