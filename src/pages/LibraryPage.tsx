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
import { Search, Trash2, Clock, FolderOpen, Download, Upload, FileDown } from "lucide-react";
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
  const { prompts, deletePrompt, updatePrompt, addPrompt } = usePrompts();
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

  // Export all prompts as JSON
  const handleExportAll = () => {
    if (prompts.length === 0) {
      toast.error("No prompts to export");
      return;
    }
    const data = JSON.stringify(prompts, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `syntara-prompts-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${prompts.length} prompts`);
  };

  // Export single prompt as Markdown
  const handleExportMarkdown = (p: Prompt) => {
    const md = `# ${p.title}\n\n${p.content}\n\n---\n*Tags: ${p.tags.join(", ") || "none"}*\n*Created: ${new Date(p.createdAt).toLocaleString()}*\n`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${p.title.replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as Markdown");
  };

  // Import prompts from JSON
  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error("Invalid format");
        let count = 0;
        for (const p of data) {
          if (p.title && p.content) {
            addPrompt(p.title, p.content, p.tags || []);
            count++;
          }
        }
        toast.success(`Imported ${count} prompts`);
      } catch {
        toast.error("Invalid file format — expected Syntara JSON export");
      }
    };
    input.click();
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="mb-6 flex items-start justify-between"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
              Prompt <span className="text-gradient-primary">Library</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {prompts.length} prompt{prompts.length !== 1 ? "s" : ""} saved
            </p>
          </div>
          <div className="flex gap-1.5">
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="sm" onClick={handleExportAll} className="gap-1.5 text-xs">
                <Download className="w-3.5 h-3.5" /> Export
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="sm" onClick={handleImport} className="gap-1.5 text-xs">
                <Upload className="w-3.5 h-3.5" /> Import
              </Button>
            </motion.div>
          </div>
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
                    <motion.div whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleExportMarkdown(selected)}
                        title="Export as Markdown"
                      >
                        <FileDown className="w-4 h-4" />
                      </Button>
                    </motion.div>
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
