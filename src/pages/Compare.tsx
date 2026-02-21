import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import ScoreDisplay from "@/components/ScoreDisplay";
import { scorePrompt } from "@/utils/promptScorer";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export default function Compare() {
  const [promptA, setPromptA] = useState("");
  const [promptB, setPromptB] = useState("");
  const [scored, setScored] = useState(false);

  const scoreA = useMemo(() => (scored && promptA ? scorePrompt(promptA) : null), [scored, promptA]);
  const scoreB = useMemo(() => (scored && promptB ? scorePrompt(promptB) : null), [scored, promptB]);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
            A/B <span className="text-gradient-primary">Compare</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compare two prompt versions side by side
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Prompt A */}
          <div className="space-y-4">
            <div className="surface-elevated rounded-lg p-4 space-y-3">
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
            {scoreA && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="surface-elevated rounded-lg p-4"
              >
                <ScoreDisplay score={scoreA} />
              </motion.div>
            )}
          </div>

          {/* Prompt B */}
          <div className="space-y-4">
            <div className="surface-elevated rounded-lg p-4 space-y-3">
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
            {scoreB && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="surface-elevated rounded-lg p-4"
              >
                <ScoreDisplay score={scoreB} />
              </motion.div>
            )}
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <Button
            onClick={() => setScored(true)}
            disabled={!promptA.trim() || !promptB.trim()}
            className="gap-2"
          >
            <BarChart3 className="w-4 h-4" /> Compare Scores
          </Button>
        </div>

        {scoreA && scoreB && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 surface-elevated rounded-lg p-4 text-center"
          >
            <p className="text-sm text-muted-foreground">
              {scoreA.total > scoreB.total
                ? `Prompt A wins by ${scoreA.total - scoreB.total} points`
                : scoreB.total > scoreA.total
                ? `Prompt B wins by ${scoreB.total - scoreA.total} points`
                : "It's a tie!"}
            </p>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
