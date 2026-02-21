import { Prompt } from "@/types/prompt";
import { getScoreColor } from "@/utils/promptScorer";
import { cn } from "@/lib/utils";
import { Clock, Layers } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  prompt: Prompt;
  onClick?: () => void;
}

export default function PromptCard({ prompt, onClick }: Props) {
  const latestVersion = prompt.versions[prompt.versions.length - 1];
  const score = latestVersion?.score?.total ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className="surface-elevated rounded-lg p-4 cursor-pointer hover:border-glow transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {prompt.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{prompt.content}</p>
        </div>
        <span className={cn("font-display text-lg font-bold shrink-0", getScoreColor(score))}>
          {score}
        </span>
      </div>
      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Layers className="w-3 h-3" />
          {prompt.versions.length} version{prompt.versions.length !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(prompt.updatedAt).toLocaleDateString()}
        </span>
      </div>
      {prompt.tags.length > 0 && (
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {prompt.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
