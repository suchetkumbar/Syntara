import { useState, useMemo, useEffect } from "react";
import Layout from "@/components/Layout";
import ScoreDisplay from "@/components/ScoreDisplay";
import TokenEstimate from "@/components/TokenEstimate";
import { BuilderBlock } from "@/types/prompt";
import { scorePrompt } from "@/utils/promptScorer";
import { usePrompts } from "@/hooks/usePrompts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { GripVertical, Copy, Save, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const DEFAULT_BLOCKS: BuilderBlock[] = [
  { id: "role", label: "Role", content: "You are an expert AI assistant.", enabled: true },
  { id: "context", label: "Context", content: "The user needs help with...", enabled: true },
  { id: "task", label: "Task", content: "Your task is to...", enabled: true },
  { id: "constraints", label: "Constraints", content: "- Be specific and actionable\n- Avoid vague advice\n- Use examples", enabled: true },
  { id: "output", label: "Output Format", content: "Respond in structured markdown with headings and bullet points.", enabled: true },
  { id: "examples", label: "Examples", content: "For example:\nInput: ...\nOutput: ...", enabled: false },
];

function SortableBlock({
  block,
  onToggle,
  onContentChange,
}: {
  block: BuilderBlock;
  onToggle: () => void;
  onContentChange: (content: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <motion.div
        layout
        className={`surface-elevated rounded-lg border transition-all duration-200 ${isDragging ? "border-primary/40 shadow-lg" : "border-border"
          }`}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <motion.div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none"
            whileHover={{ scale: 1.15 }}
          >
            <GripVertical className="w-4 h-4" />
          </motion.div>
          <span className="text-sm font-medium flex-1">{block.label}</span>
          <motion.div whileTap={{ scale: 0.9 }}>
            <Switch checked={block.enabled} onCheckedChange={onToggle} />
          </motion.div>
        </div>
        <AnimatePresence initial={false}>
          {block.enabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3">
                <Textarea
                  value={block.content}
                  onChange={(e) => onContentChange(e.target.value)}
                  rows={3}
                  className="bg-background border-border resize-none font-mono text-sm"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default function Builder() {
  const [blocks, setBlocks] = useState<BuilderBlock[]>(DEFAULT_BLOCKS);
  const { addPrompt } = usePrompts();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const assembled = useMemo(
    () =>
      blocks
        .filter((b) => b.enabled)
        .map((b) => `## ${b.label}\n${b.content}`)
        .join("\n\n"),
    [blocks]
  );

  const assembledScore = useMemo(
    () => (assembled ? scorePrompt(assembled) : null),
    [assembled]
  );

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks((prev) => {
        const oldIndex = prev.findIndex((b) => b.id === active.id);
        const newIndex = prev.findIndex((b) => b.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const toggleBlock = (id: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b))
    );
  };

  const updateContent = (id: string, content: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content } : b))
    );
  };

  const handleCopy = () => {
    if (!assembled) return;
    navigator.clipboard.writeText(assembled);
    toast.success("Copied to clipboard");
  };

  const handleSave = () => {
    if (!assembled) {
      toast.error("Enable at least one block to save");
      return;
    }
    addPrompt("Builder Prompt", assembled, ["builder"]);
    toast.success("Saved to Library");
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="mb-6"
        >
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
            Modular <span className="text-gradient-primary">Builder</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Drag, toggle, and customize prompt blocks{" "}
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border font-mono">
              Ctrl+S
            </kbd>
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Blocks */}
          <div className="space-y-3">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                {blocks.map((block) => (
                  <SortableBlock
                    key={block.id}
                    block={block}
                    onToggle={() => toggleBlock(block.id)}
                    onContentChange={(c) => updateContent(block.id, c)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* Preview + Score */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.1 }}
              className="surface-elevated rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Assembled Prompt
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
                </div>
              </div>
              <pre className="text-sm font-mono whitespace-pre-wrap bg-background rounded-md p-3 border border-border max-h-64 overflow-y-auto">
                {assembled || "Enable blocks to preview..."}
              </pre>
              <TokenEstimate text={assembled} />
            </motion.div>

            <AnimatePresence>
              {assembledScore && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="surface-elevated rounded-lg p-4"
                >
                  <ScoreDisplay score={assembledScore} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Layout>
  );
}
