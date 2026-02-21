import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import ScoreDisplay from "@/components/ScoreDisplay";
import { BuilderBlock } from "@/types/prompt";
import { scorePrompt } from "@/utils/promptScorer";
import { usePrompts } from "@/hooks/usePrompts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { GripVertical, Copy, Save, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const DEFAULT_BLOCKS: BuilderBlock[] = [
  { id: "1", type: "role", label: "Role", content: "", enabled: true },
  { id: "2", type: "task", label: "Task", content: "", enabled: true },
  { id: "3", type: "context", label: "Context", content: "", enabled: true },
  { id: "4", type: "constraints", label: "Constraints", content: "", enabled: true },
  { id: "5", type: "outputFormat", label: "Output Format", content: "", enabled: true },
  { id: "6", type: "example", label: "Example (optional)", content: "", enabled: false },
];

const BLOCK_PREFIXES: Record<string, string> = {
  role: "## Role\n",
  task: "## Task\n",
  context: "## Context\n",
  constraints: "## Constraints\n",
  outputFormat: "## Output Format\n",
  example: "## Example\n",
};

export default function Builder() {
  const [blocks, setBlocks] = useState<BuilderBlock[]>(DEFAULT_BLOCKS);
  const { addPrompt } = usePrompts();

  const assembled = useMemo(() => {
    return blocks
      .filter((b) => b.enabled && b.content.trim())
      .map((b) => BLOCK_PREFIXES[b.type] + b.content)
      .join("\n\n");
  }, [blocks]);

  const score = useMemo(() => (assembled ? scorePrompt(assembled) : null), [assembled]);

  const updateBlock = (id: string, content: string) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, content } : b)));
  };

  const toggleBlock = (id: string) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b)));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(assembled);
    toast.success("Copied to clipboard");
  };

  const handleSave = () => {
    if (!assembled) return;
    addPrompt("Built Prompt", assembled, ["builder"]);
    toast.success("Saved to library");
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
            Modular <span className="text-gradient-primary">Builder</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Assemble prompts from structured blocks
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {blocks.map((block, i) => (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`surface-elevated rounded-lg p-4 transition-all ${
                  !block.enabled ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">
                    {block.label}
                  </span>
                  <Switch checked={block.enabled} onCheckedChange={() => toggleBlock(block.id)} />
                </div>
                {block.enabled && (
                  <Textarea
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, e.target.value)}
                    placeholder={`Enter ${block.label.toLowerCase()}...`}
                    rows={2}
                    className="bg-background border-border resize-none text-sm"
                  />
                )}
              </motion.div>
            ))}
          </div>

          <div className="space-y-4">
            {score && (
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                className="surface-elevated rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">Live Score</h3>
                </div>
                <ScoreDisplay score={score} />
              </motion.div>
            )}

            {assembled && (
              <div className="surface-elevated rounded-lg p-4 space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Assembled Prompt
                </label>
                <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap max-h-64 overflow-y-auto bg-background rounded p-3 border border-border">
                  {assembled}
                </pre>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-xs flex-1">
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </Button>
                  <Button size="sm" onClick={handleSave} className="gap-1.5 text-xs flex-1">
                    <Save className="w-3.5 h-3.5" /> Save
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
