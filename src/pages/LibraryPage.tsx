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
import { Search, Trash2, Clock, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

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
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
            Prompt <span className="text-gradient-primary">Library</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {prompts.length} prompt{prompts.length !== 1 ? "s" : ""} saved
          </p>
        </motion.div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts..."
            className="pl-9 bg-card border-border"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">
              {prompts.length === 0 ? "No prompts yet. Generate one to get started!" : "No matching prompts."}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {filtered.map((p) => (
              <PromptCard key={p.id} prompt={p} onClick={() => openPrompt(p)} />
            ))}
          </div>
        )}

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
                      {[...selected.versions].reverse().map((v) => (
                        <div key={v.id} className="surface-elevated rounded p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(v.createdAt).toLocaleString()}
                            </span>
                            <span className="font-mono">{v.note}</span>
                          </div>
                          {v.score && <ScoreDisplay score={v.score} />}
                        </div>
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
