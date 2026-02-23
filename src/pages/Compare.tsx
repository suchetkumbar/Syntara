import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import ScoreDisplay from "@/components/ScoreDisplay";
import { scorePrompt } from "@/utils/promptScorer";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BarChart3, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const fadeSlideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring", stiffness: 300, damping: 24 },
};

export default function Compare() {
  const [promptA, setPromptA] = useState("");
  const [promptB, setPromptB] = useState("");
  const [scored, setScored] = useState(false);

  const scoreA = useMemo(() => (scored && promptA ? scorePrompt(promptA) : null), [scored, promptA]);
  const scoreB = useMemo(() => (scored && promptB ? scorePrompt(promptB) : null), [scored, promptB]);

  const winner = scoreA && scoreB
    ? scoreA.total > scoreB.total ? "A" : scoreB.total > scoreA.total ? "B" : "tie"
    : null;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <motion.div {...fadeSlideUp} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
            A/B <span className="text-gradient-primary">Compare</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compare two prompt versions side by side
          </p>
        </motion.div>

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

        <motion.div
          className="flex justify-center mt-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => setScored(true)}
              disabled={!promptA.trim() || !promptB.trim()}
              className="gap-2"
            >
              <BarChart3 className="w-4 h-4" /> Compare Scores
            </Button>
          </motion.div>
        </motion.div>

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
