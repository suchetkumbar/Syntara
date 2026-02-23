import { useState, useMemo, useCallback } from "react";
import Layout from "@/components/Layout";
import ScoreDisplay from "@/components/ScoreDisplay";
import { scorePrompt } from "@/utils/promptScorer";
import { useAuth } from "@/contexts/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart3, Trophy, Save, Trash2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Experiment } from "@/types/prompt";

const fadeSlideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring", stiffness: 300, damping: 24 },
};

function getExperimentsKey(userId: string | undefined) {
  return userId ? `syntara_user_${userId}_experiments` : "syntara_experiments";
}

function loadExperiments(userId: string | undefined): Experiment[] {
  try {
    const raw = localStorage.getItem(getExperimentsKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveExperiments(userId: string | undefined, experiments: Experiment[]) {
  localStorage.setItem(getExperimentsKey(userId), JSON.stringify(experiments));
}

export default function Compare() {
  const { user } = useAuth();
  const [promptA, setPromptA] = useState("");
  const [promptB, setPromptB] = useState("");
  const [scored, setScored] = useState(false);
  const [experimentName, setExperimentName] = useState("");
  const [experiments, setExperiments] = useState<Experiment[]>(() => loadExperiments(user?.id));
  const [showHistory, setShowHistory] = useState(false);

  const scoreA = useMemo(() => (scored && promptA ? scorePrompt(promptA) : null), [scored, promptA]);
  const scoreB = useMemo(() => (scored && promptB ? scorePrompt(promptB) : null), [scored, promptB]);

  const winner = scoreA && scoreB
    ? scoreA.total > scoreB.total ? "A" : scoreB.total > scoreA.total ? "B" : "tie"
    : null;

  const handleSaveExperiment = useCallback(() => {
    if (!promptA.trim() || !promptB.trim()) {
      toast.error("Both prompts are required");
      return;
    }
    const exp: Experiment = {
      id: crypto.randomUUID(),
      name: experimentName.trim() || `Experiment ${experiments.length + 1}`,
      promptA,
      promptB,
      scoreA: scoreA || undefined,
      scoreB: scoreB || undefined,
      createdAt: new Date().toISOString(),
    };
    const updated = [exp, ...experiments];
    setExperiments(updated);
    saveExperiments(user?.id, updated);
    setExperimentName("");
    toast.success("Experiment saved");
  }, [promptA, promptB, scoreA, scoreB, experimentName, experiments, user?.id]);

  const loadExperiment = (exp: Experiment) => {
    setPromptA(exp.promptA);
    setPromptB(exp.promptB);
    setScored(false);
    setShowHistory(false);
    toast.success(`Loaded: ${exp.name}`);
  };

  const deleteExperiment = (id: string) => {
    const updated = experiments.filter((e) => e.id !== id);
    setExperiments(updated);
    saveExperiments(user?.id, updated);
    toast.success("Experiment deleted");
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <motion.div {...fadeSlideUp} className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
              A/B <span className="text-gradient-primary">Compare</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Compare two prompt versions side by side
            </p>
          </div>
          {experiments.length > 0 && (
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="gap-1.5 text-xs"
              >
                <Clock className="w-3.5 h-3.5" />
                History ({experiments.length})
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* History panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="surface-elevated rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Saved Experiments
                </p>
                {experiments.map((exp, i) => (
                  <motion.div
                    key={exp.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <button onClick={() => loadExperiment(exp)} className="flex-1 text-left">
                      <p className="text-sm font-medium">{exp.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(exp.createdAt).toLocaleString()}
                      </p>
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => deleteExperiment(exp.id)}
                      className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Prompt A */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.08 }}
            className="space-y-4"
          >
            <div className={`surface-elevated rounded-lg p-4 space-y-3 transition-all duration-300 ${winner === "A" ? "ring-2 ring-primary/40 glow-primary" : ""}`}>
              <label className="text-xs font-semibold text-primary uppercase tracking-wider">
                Prompt A
              </label>
              <Textarea
                value={promptA}
                onChange={(e) => { setPromptA(e.target.value); setScored(false); }}
                placeholder="Paste first prompt..."
                rows={8}
                className="bg-background border-border resize-none font-mono text-sm"
              />
            </div>
            <AnimatePresence mode="wait">
              {scoreA && (
                <motion.div
                  key="scoreA"
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="surface-elevated rounded-lg p-4"
                >
                  <ScoreDisplay score={scoreA} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Prompt B */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.12 }}
            className="space-y-4"
          >
            <div className={`surface-elevated rounded-lg p-4 space-y-3 transition-all duration-300 ${winner === "B" ? "ring-2 ring-accent/40" : ""}`}>
              <label className="text-xs font-semibold text-accent uppercase tracking-wider">
                Prompt B
              </label>
              <Textarea
                value={promptB}
                onChange={(e) => { setPromptB(e.target.value); setScored(false); }}
                placeholder="Paste second prompt..."
                rows={8}
                className="bg-background border-border resize-none font-mono text-sm"
              />
            </div>
            <AnimatePresence mode="wait">
              {scoreB && (
                <motion.div
                  key="scoreB"
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="surface-elevated rounded-lg p-4"
                >
                  <ScoreDisplay score={scoreB} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => setScored(true)}
              disabled={!promptA.trim() || !promptB.trim()}
              className="gap-2"
            >
              <BarChart3 className="w-4 h-4" /> Compare Scores
            </Button>
          </motion.div>
          <div className="flex gap-2 items-center">
            <Input
              value={experimentName}
              onChange={(e) => setExperimentName(e.target.value)}
              placeholder="Experiment name (optional)"
              className="bg-card border-border w-48 text-sm h-9"
            />
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button variant="outline" size="sm" onClick={handleSaveExperiment} className="gap-1.5 h-9">
                <Save className="w-3.5 h-3.5" /> Save
              </Button>
            </motion.div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {winner && (
            <motion.div
              key={winner}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 20, mass: 0.8 }}
              className="mt-6 surface-elevated rounded-lg p-5 text-center"
            >
              <motion.div
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.15 }}
                className="inline-flex mb-2"
              >
                <Trophy className={`w-6 h-6 ${winner === "tie" ? "text-warning" : "text-primary"}`} />
              </motion.div>
              <p className="text-sm font-medium">
                {winner === "A"
                  ? `🏆 Prompt A wins by ${scoreA!.total - scoreB!.total} points`
                  : winner === "B"
                    ? `🏆 Prompt B wins by ${scoreB!.total - scoreA!.total} points`
                    : "⚡ It's a tie!"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
