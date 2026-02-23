import { useMemo, useState } from "react";
import { estimateTokens, estimateCosts, getContextWarning } from "@/services/placeholder/tokenEstimator";
import { Coins, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TokenEstimate({ text }: { text: string }) {
    const [expanded, setExpanded] = useState(false);
    const tokens = useMemo(() => estimateTokens(text), [text]);
    const costs = useMemo(() => estimateCosts(tokens), [tokens]);
    const warning = useMemo(() => getContextWarning(tokens), [tokens]);

    if (tokens === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs"
        >
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
                <Coins className="w-3 h-3" />
                <span className="font-mono">~{tokens.toLocaleString()} tokens</span>
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-1.5"
                    >
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground font-mono">
                            {costs.map(({ model, cost }) => (
                                <span key={model}>
                                    {model}: <span className="text-foreground">{cost}</span>
                                </span>
                            ))}
                        </div>
                        {warning && (
                            <p className="mt-1 text-warning">{warning}</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
