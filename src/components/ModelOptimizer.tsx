import { useState } from "react";
import { getModelProfiles, optimizeForModel, OptimizationResult } from "@/services/placeholder/modelOptimizer";
import { Button } from "@/components/ui/button";
import { Cpu, Check, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
    prompt: string;
    onApply: (optimized: string) => void;
}

export default function ModelOptimizer({ prompt, onApply }: Props) {
    const [selectedModel, setSelectedModel] = useState("gpt-4o");
    const [result, setResult] = useState<OptimizationResult | null>(null);
    const profiles = getModelProfiles();

    const handleOptimize = () => {
        if (!prompt.trim()) return;
        const r = optimizeForModel(prompt, selectedModel);
        setResult(r);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" /> Optimize for Model
                </label>
            </div>

            <div className="flex flex-wrap gap-1.5">
                {profiles.map((p) => (
                    <motion.button
                        key={p.id}
                        onClick={() => { setSelectedModel(p.id); setResult(null); }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${selectedModel === p.id
                                ? "bg-primary/10 text-primary border border-primary/30"
                                : "bg-muted text-muted-foreground border border-transparent hover:border-border"
                            }`}
                    >
                        {p.name}
                    </motion.button>
                ))}
            </div>

            {/* Tips */}
            <div className="text-[10px] text-muted-foreground space-y-0.5">
                {profiles.find((p) => p.id === selectedModel)?.tips.map((tip, i) => (
                    <p key={i} className="flex gap-1.5">
                        <span className="text-primary">•</span> {tip}
                    </p>
                ))}
            </div>

            <motion.div whileTap={{ scale: 0.97 }}>
                <Button size="sm" variant="outline" onClick={handleOptimize} className="gap-1.5 text-xs" disabled={!prompt.trim()}>
                    <Cpu className="w-3 h-3" /> Optimize
                </Button>
            </motion.div>

            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="space-y-2"
                    >
                        <div className="text-xs space-y-1">
                            {result.changes.map((c, i) => (
                                <p key={i} className="flex items-center gap-1.5 text-muted-foreground">
                                    <Check className="w-3 h-3 text-success" /> {c}
                                </p>
                            ))}
                        </div>
                        <motion.div whileTap={{ scale: 0.97 }}>
                            <Button
                                size="sm"
                                onClick={() => onApply(result.optimized)}
                                className="gap-1.5 text-xs"
                            >
                                Apply Changes <ArrowRight className="w-3 h-3" />
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
