import { useState, useCallback, useEffect } from "react";
import Layout from "@/components/Layout";
import ScoreDisplay from "@/components/ScoreDisplay";
import { scorePrompt } from "@/utils/promptScorer";
import { scorePromptAI, comparePromptsAI, type CompareResult } from "@/services/aiService";
import { isAIAvailable } from "@/lib/gemini";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart3, Trophy, Save, Trash2, Clock, Loader2, Zap, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Experiment, PromptScore } from "@/types/prompt";

const fadeSlideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 300, damping: 24 },
};

export default function Compare() {
  const { user } = useAuth();
  const [promptA, setPromptA] = useState("");
  const [promptB, setPromptB] = useState("");
  const [scoreA, setScoreA] = useState<PromptScore | null>(null);
  const [scoreB, setScoreB] = useState<PromptScore | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [experimentName, setExperimentName] = useState("");
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const aiOn = isAIAvailable();

  // Load experiments from Supabase
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("experiments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setExperiments(
            data.map((row: any) => ({
              id: row.id,
              name: row.name,
              promptA: row.prompt_a,
              promptB: row.prompt_b,
              scoreA: row.score_a || undefined,
              scoreB: row.score_b || undefined,
              createdAt: row.created_at,
            }))
          );
        }
      });
  }, [user?.id]);

  const winner = scoreA && scoreB
    ? scoreA.total > scoreB.total ? "A" : scoreB.total > scoreA.total ? "B" : "tie"
    : null;

  const handleCompare = async () => {
    if (!promptA.trim() || !promptB.trim()) return;
    setLoading(true);
    setAiAnalysis(null);
    try {
      if (aiOn) {
        const [sA, sB] = await Promise.all([
          scorePromptAI(promptA),
          scorePromptAI(promptB),
        ]);
        setScoreA(sA);
        setScoreB(sB);
      } else {
        setScoreA(scorePrompt(promptA));
        setScoreB(scorePrompt(promptB));
      }
    } catch {
      setScoreA(scorePrompt(promptA));
      setScoreB(scorePrompt(promptB));
      toast.error("AI scoring unavailable — used local scorer");
    } finally {
      setLoading(false);
    }
  };

  const handleAICompare = async () => {
    if (!promptA.trim() || !promptB.trim()) return;
    setLoading(true);
    try {
      const result = await comparePromptsAI(promptA, promptB);
      setAiAnalysis(result);
    } catch {
      toast.error("AI comparison failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExperiment = useCallback(async () => {
    if (!promptA.trim() || !promptB.trim()) {
      toast.error("Both prompts are required");
      return;
    }
    if (!user?.id) return;

    const name = experimentName.trim() || `Experiment ${experiments.length + 1}`;

    const { data: row, error } = await supabase
      .from("experiments")
      .insert({
        user_id: user.id,
        name,
        prompt_a: promptA,
        prompt_b: promptB,
        score_a: scoreA || null,
        score_b: scoreB || null,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to save experiment");
      return;
    }

    const exp: Experiment = {
      id: row.id,
      name,
      promptA,
      promptB,
      scoreA: scoreA || undefined,
      scoreB: scoreB || undefined,
      createdAt: row.created_at,
    };
    setExperiments((prev) => [exp, ...prev]);
    setExperimentName("");
    toast.success("Experiment saved");
  }, [promptA, promptB, scoreA, scoreB, experimentName, experiments.length, user?.id]);

  const loadExperiment = (exp: Experiment) => {
    setPromptA(exp.promptA);
    setPromptB(exp.promptB);
    setScoreA(null);
    setScoreB(null);
    setAiAnalysis(null);
    setShowHistory(false);
    toast.success(`Loaded: ${exp.name}`);
  };

  const deleteExperiment = async (id: string) => {
    const { error } = await supabase.from("experiments").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete experiment");
      return;
    }
    setExperiments((prev) => prev.filter((e) => e.id !== id));
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
                onChange={(e) => { setPromptA(e.target.value); setScoreA(null); setScoreB(null); setAiAnalysis(null); }}
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
              onClick={handleCompare}
              disabled={!promptA.trim() || !promptB.trim() || loading}
              className="gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
              {loading ? "Scoring..." : "Compare Scores"}
            </Button>
          </motion.div>
          {aiOn && (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                onClick={handleAICompare}
                disabled={!promptA.trim() || !promptB.trim() || loading}
                className="gap-2"
              >
                <Brain className="w-4 h-4" /> AI Analysis
              </Button>
            </motion.div>
          )}
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

        {/* AI Analysis Panel */}
        <AnimatePresence>
          {aiAnalysis && (
            <motion.div
              key="ai-analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="mt-4 surface-elevated rounded-lg p-5 space-y-4"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">AI Analysis</h3>
              </div>
              <p className="text-sm text-muted-foreground">{aiAnalysis.analysis}</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-primary uppercase">Prompt A Strengths</p>
                  <ul className="space-y-1">
                    {aiAnalysis.strengthsA.map((s, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                        <span className="text-primary">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-accent uppercase">Prompt B Strengths</p>
                  <ul className="space-y-1">
                    {aiAnalysis.strengthsB.map((s, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                        <span className="text-accent">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Recommendation</p>
                <p className="text-sm">{aiAnalysis.recommendation}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
