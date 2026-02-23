import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { usePrompts } from "@/hooks/usePrompts";
import { useTheme } from "@/hooks/useTheme";
import { getModelProfiles } from "@/services/placeholder/modelOptimizer";
import { STRATEGY_META, PromptStrategy } from "@/utils/promptGenerator";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
    User,
    Palette,
    Database,
    Info,
    Trash2,
    Download,
    Cloud,
    Moon,
    Sun,
    Keyboard,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const STRATEGIES = Object.keys(STRATEGY_META) as PromptStrategy[];

const sectionVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, type: "spring" as const, stiffness: 300, damping: 24 },
    }),
};

export default function Settings() {
    const { user, logout } = useAuth();
    const { prompts } = usePrompts();
    const { theme, toggle: toggleTheme } = useTheme();
    const models = useMemo(() => getModelProfiles(), []);

    const [defaultStrategy, setDefaultStrategy] = useState<PromptStrategy>(
        () => (localStorage.getItem("syntara_default_strategy") as PromptStrategy) || "standard"
    );
    const [defaultModel, setDefaultModel] = useState(
        () => localStorage.getItem("syntara_default_model") || "gpt-4o"
    );

    const handleStrategyChange = (s: PromptStrategy) => {
        setDefaultStrategy(s);
        localStorage.setItem("syntara_default_strategy", s);
        toast.success(`Default strategy set to ${STRATEGY_META[s].label}`);
    };

    const handleModelChange = (id: string) => {
        setDefaultModel(id);
        localStorage.setItem("syntara_default_model", id);
        const model = models.find((m) => m.id === id);
        toast.success(`Default model set to ${model?.name || id}`);
    };

    const handleClearAll = async () => {
        if (!confirm("This will delete ALL your prompts and experiments from the cloud. This cannot be undone. Continue?")) return;
        if (!user?.id) return;
        try {
            await supabase.from("experiments").delete().eq("user_id", user.id);
            await supabase.from("prompts").delete().eq("user_id", user.id);
            toast.success("All data cleared from cloud");
            window.location.reload();
        } catch {
            toast.error("Failed to clear data");
        }
    };

    const handleExportAll = async () => {
        if (!user?.id) return;
        const { data: promptsData } = await supabase
            .from("prompts")
            .select("*, prompt_versions(*)")
            .eq("user_id", user.id);
        const { data: experimentsData } = await supabase
            .from("experiments")
            .select("*")
            .eq("user_id", user.id);

        const backup = {
            exportedAt: new Date().toISOString(),
            user: { name: user.name, email: user.email },
            prompts: promptsData || [],
            experiments: experimentsData || [],
        };
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `syntara-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Full data backup exported");
    };

    const sections = [
        {
            icon: User,
            title: "Account",
            content: (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-muted-foreground text-xs">Name</p>
                            <p className="font-medium">{user?.name || "—"}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">Email</p>
                            <p className="font-medium">{user?.email || "—"}</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={logout} className="text-destructive hover:text-destructive">
                        Sign Out
                    </Button>
                </div>
            ),
        },
        {
            icon: Palette,
            title: "Preferences",
            content: (
                <div className="space-y-4">
                    {/* Theme */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Theme</p>
                        <div className="flex gap-2">
                            {(["dark", "light"] as const).map((t) => (
                                <motion.button
                                    key={t}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={t !== theme ? toggleTheme : undefined}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${theme === t ? "border-primary/40 text-primary bg-primary/5" : "border-border text-muted-foreground hover:bg-muted/50"
                                        }`}
                                >
                                    {t === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                                    {t === "dark" ? "Dark" : "Light"}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Default Strategy */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Default Strategy</p>
                        <div className="flex flex-wrap gap-2">
                            {STRATEGIES.map((s) => (
                                <motion.button
                                    key={s}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleStrategyChange(s)}
                                    className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-all ${defaultStrategy === s
                                        ? "border-primary/40 text-primary bg-primary/5"
                                        : "border-border text-muted-foreground hover:bg-muted/50"
                                        }`}
                                >
                                    {STRATEGY_META[s].label}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Default Model */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Default Model</p>
                        <div className="flex flex-wrap gap-2">
                            {models.map((m) => (
                                <motion.button
                                    key={m.id}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleModelChange(m.id)}
                                    className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-all ${defaultModel === m.id
                                        ? "border-primary/40 text-primary bg-primary/5"
                                        : "border-border text-muted-foreground hover:bg-muted/50"
                                        }`}
                                >
                                    {m.name}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            icon: Database,
            title: "Data Management",
            content: (
                <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="surface-elevated rounded-lg p-3 text-center">
                            <p className="text-lg font-display font-bold text-primary">{prompts.length}</p>
                            <p className="text-[10px] text-muted-foreground">Prompts</p>
                        </div>
                        <div className="surface-elevated rounded-lg p-3 text-center">
                            <p className="text-lg font-display font-bold text-primary">
                                {prompts.reduce((acc, p) => acc + p.versions.length, 0)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Versions</p>
                        </div>
                        <div className="surface-elevated rounded-lg p-3 text-center">
                            <p className="text-lg font-display font-bold text-primary">
                                <Cloud className="w-4 h-4 inline mr-1" />
                                Supabase
                            </p>
                            <p className="text-[10px] text-muted-foreground">Storage</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <motion.div whileTap={{ scale: 0.95 }}>
                            <Button variant="outline" size="sm" onClick={handleExportAll} className="gap-1.5">
                                <Download className="w-3.5 h-3.5" /> Export Backup
                            </Button>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.95 }}>
                            <Button variant="destructive" size="sm" onClick={handleClearAll} className="gap-1.5">
                                <Trash2 className="w-3.5 h-3.5" /> Clear All Data
                            </Button>
                        </motion.div>
                    </div>
                </div>
            ),
        },
        {
            icon: Keyboard,
            title: "Keyboard Shortcuts",
            content: (
                <div className="space-y-1.5">
                    {[
                        ["Ctrl + Enter", "Generate / Optimize prompt"],
                        ["Ctrl + S", "Save in Builder"],
                        ["Ctrl + K", "Focus search (Library / Templates)"],
                        ["Ctrl + /", "Show shortcuts help"],
                    ].map(([key, desc]) => (
                        <div key={key} className="flex items-center justify-between text-sm py-1">
                            <span className="text-muted-foreground">{desc}</span>
                            <kbd className="text-[10px] px-2 py-0.5 rounded bg-muted border border-border font-mono">{key}</kbd>
                        </div>
                    ))}
                </div>
            ),
        },
        {
            icon: Info,
            title: "About",
            content: (
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-display font-bold text-gradient-primary">Syntara</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">v0.5.0</span>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                        AI Prompt Engineering Workbench — craft, score, debug, and optimize prompts
                        with model-specific intelligence. Built with React, TypeScript, and Framer Motion.
                    </p>
                    <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                        <p>© {new Date().getFullYear()} Syntara • Data stored securely in Supabase</p>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <Layout>
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring" as const, stiffness: 300, damping: 24 }}
                >
                    <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
                        <span className="text-gradient-primary">Settings</span>
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage your account, preferences, and data</p>
                </motion.div>

                {sections.map((section, i) => (
                    <motion.div
                        key={section.title}
                        custom={i}
                        variants={sectionVariants}
                        initial="hidden"
                        animate="visible"
                        className="surface-elevated rounded-lg p-5 space-y-3"
                    >
                        <div className="flex items-center gap-2">
                            <section.icon className="w-4 h-4 text-primary" />
                            <h2 className="text-sm font-semibold">{section.title}</h2>
                        </div>
                        {section.content}
                    </motion.div>
                ))}
            </div>
        </Layout>
    );
}
