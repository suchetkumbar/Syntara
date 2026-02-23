import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { TEMPLATES, CATEGORY_META, TemplateCategory, PromptTemplate } from "@/data/templateData";
import { usePrompts } from "@/hooks/usePrompts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Copy, Save, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const cardVariants = {
    initial: { opacity: 0, y: 16, scale: 0.97 },
    animate: (i: number) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { delay: i * 0.04, type: "spring" as const, stiffness: 300, damping: 24 },
    }),
};

export default function Templates() {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<TemplateCategory | "all">("all");
    const [preview, setPreview] = useState<PromptTemplate | null>(null);
    const { addPrompt } = usePrompts();

    const filtered = useMemo(() => {
        return TEMPLATES.filter((t) => {
            const matchCategory = activeCategory === "all" || t.category === activeCategory;
            const matchSearch =
                t.title.toLowerCase().includes(search.toLowerCase()) ||
                t.description.toLowerCase().includes(search.toLowerCase()) ||
                t.tags.some((tag) => tag.includes(search.toLowerCase()));
            return matchCategory && matchSearch;
        });
    }, [search, activeCategory]);

    const handleCopy = (prompt: string) => {
        navigator.clipboard.writeText(prompt);
        toast.success("Copied to clipboard");
    };

    const handleSave = (t: PromptTemplate) => {
        addPrompt(t.title, t.prompt, t.tags);
        toast.success("Saved to Library");
    };

    return (
        <Layout>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    className="mb-6"
                >
                    <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
                        Prompt <span className="text-gradient-primary">Templates</span>
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {TEMPLATES.length} curated templates to jumpstart your prompts
                    </p>
                </motion.div>

                {/* Search + Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="space-y-3 mb-6"
                >
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search templates..."
                            className="pl-9 bg-card border-border"
                        />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <motion.button
                            onClick={() => setActiveCategory("all")}
                            whileTap={{ scale: 0.95 }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeCategory === "all"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                        >
                            All
                        </motion.button>
                        {(Object.keys(CATEGORY_META) as TemplateCategory[]).map((cat) => (
                            <motion.button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                whileTap={{ scale: 0.95 }}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeCategory === cat
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                    }`}
                            >
                                {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* Grid */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${activeCategory}-${search}`}
                        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
                        initial="initial"
                        animate="animate"
                    >
                        {filtered.map((t, i) => (
                            <motion.div
                                key={t.id}
                                custom={i}
                                variants={cardVariants}
                                layout
                                className="surface-elevated rounded-lg p-4 flex flex-col gap-3 border border-border hover:border-primary/20 transition-all group"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-xs text-muted-foreground font-mono">
                                            {CATEGORY_META[t.category].emoji} {CATEGORY_META[t.category].label}
                                        </p>
                                        <h3 className="text-sm font-semibold mt-0.5 group-hover:text-primary transition-colors">
                                            {t.title}
                                        </h3>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{t.description}</p>
                                <div className="flex flex-wrap gap-1">
                                    {t.tags.slice(0, 3).map((tag) => (
                                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-1.5">
                                    <motion.div whileTap={{ scale: 0.9 }} className="flex-1">
                                        <Button size="sm" variant="ghost" className="w-full gap-1.5 h-7 text-xs" onClick={() => setPreview(t)}>
                                            <Eye className="w-3 h-3" /> Preview
                                        </Button>
                                    </motion.div>
                                    <motion.div whileTap={{ scale: 0.9 }}>
                                        <Button size="sm" variant="ghost" className="gap-1 h-7 text-xs" onClick={() => handleCopy(t.prompt)}>
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    </motion.div>
                                    <motion.div whileTap={{ scale: 0.9 }}>
                                        <Button size="sm" variant="ghost" className="gap-1 h-7 text-xs" onClick={() => handleSave(t)}>
                                            <Save className="w-3 h-3" />
                                        </Button>
                                    </motion.div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>

                {filtered.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16 text-sm text-muted-foreground"
                    >
                        No templates matching "{search}" in {activeCategory === "all" ? "all categories" : CATEGORY_META[activeCategory].label}
                    </motion.div>
                )}

                {/* Preview dialog */}
                <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                        {preview && (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="font-display flex items-center gap-2">
                                        {CATEGORY_META[preview.category].emoji} {preview.title}
                                    </DialogTitle>
                                </DialogHeader>
                                <p className="text-sm text-muted-foreground">{preview.description}</p>
                                <pre className="text-sm font-mono whitespace-pre-wrap bg-background rounded-md p-4 border border-border max-h-96 overflow-y-auto">
                                    {preview.prompt}
                                </pre>
                                <div className="flex gap-2">
                                    <Button className="flex-1 gap-1.5" onClick={() => { handleCopy(preview.prompt); setPreview(null); }}>
                                        <Copy className="w-4 h-4" /> Copy & Close
                                    </Button>
                                    <Button variant="outline" className="gap-1.5" onClick={() => { handleSave(preview); setPreview(null); }}>
                                        <Save className="w-4 h-4" /> Save to Library
                                    </Button>
                                </div>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </Layout>
    );
}
