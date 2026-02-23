import { useState } from "react";
import Layout from "@/components/Layout";
import PromptCard from "@/components/PromptCard";
import ScoreDisplay from "@/components/ScoreDisplay";
import { usePrompts } from "@/hooks/usePrompts";
import { Prompt } from "@/types/prompt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Trash2, Clock, FolderOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const cardVariants = {
  initial: { opacity: 0, y: 16, scale: 0.97 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.05,
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

export default function LibraryPage() {
  const { prompts, deletePrompt, updatePrompt } = usePrompts();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Prompt | null>(null);
  const [editContent, setEditContent] = useState("");

  const filtered = prompts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase())
  );

  const openPrompt = (p: Prompt) => {
    setSelected(p);
    setEditContent(p.content);
  };

  const handleUpdate = () => {
    if (!selected) return;
    updatePrompt(selected.id, editContent, "Manual edit");
    toast.success("Prompt updated — new version created");
    setSelected(null);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
            Prompt <span className="text-gradient-primary">Library</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {prompts.length} prompt{prompts.length !== 1 ? "s" : ""} saved
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="relative mb-6"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts..."
            className="pl-9 bg-card border-border"
          />
        </motion.div>

        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-16"
            >
              <motion.div
                initial={{ y: 8 }}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="inline-block mb-3"
              >
                <FolderOpen className="w-10 h-10 text-muted-foreground/50" />
              </motion.div>
              <p className="text-muted-foreground text-sm">
                {prompts.length === 0 ? "No prompts yet. Generate one to get started!" : "No matching prompts."}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              className="grid sm:grid-cols-2 gap-3"
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <AnimatePresence>
                {filtered.map((p, i) => (
                  <motion.div
                    key={p.id}
                    custom={i}
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    layout
                  >
                    <PromptCard prompt={p} onClick={() => openPrompt(p)} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            {selected && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display">{selected.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={10}
                    className="font-mono text-sm resize-none"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleUpdate} className="flex-1">Save New Version</Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        deletePrompt(selected.id);
                        setSelected(null);
                        toast.success("Prompt deleted");
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Version history */}
                  <div className="border-t border-border pt-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Version History
                    </h4>
                    <div className="space-y-3">
                      {[...selected.versions].reverse().map((v, i) => (
                        <motion.div
                          key={v.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="surface-elevated rounded p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(v.createdAt).toLocaleString()}
                            </span>
                            <span className="font-mono">{v.note}</span>
                          </div>
                          {v.score && <ScoreDisplay score={v.score} />}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
