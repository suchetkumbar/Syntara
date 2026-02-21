import { PromptScore } from "@/types/prompt";
import { getScoreColor, getScoreLabel } from "@/utils/promptScorer";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const labels: Record<string, string> = {
  role: "Role",
  specificity: "Specificity",
  clarity: "Clarity",
  structure: "Structure",
  constraints: "Constraints",
  outputFormat: "Output Format",
};

const maxScores: Record<string, number> = {
  role: 15,
  specificity: 15,
  clarity: 10,
  structure: 20,
  constraints: 20,
  outputFormat: 20,
};

export default function ScoreDisplay({ score }: { score: PromptScore }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn("text-4xl font-display font-bold", getScoreColor(score.total))}
        >
          {score.total}
        </motion.span>
        <div>
          <p className={cn("text-sm font-semibold", getScoreColor(score.total))}>
            {getScoreLabel(score.total)}
          </p>
          <p className="text-xs text-muted-foreground">out of 100</p>
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(score.breakdown).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{labels[key]}</span>
              <span className="font-mono text-foreground">{value}/{maxScores[key]}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(value / maxScores[key]) * 100}%` }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="h-full rounded-full bg-primary"
              />
            </div>
          </div>
        ))}
      </div>

      {score.suggestions.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Suggestions</p>
          {score.suggestions.map((s, i) => (
            <p key={i} className="text-xs text-muted-foreground flex gap-1.5">
              <span className="text-warning">→</span> {s}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
