import { DebugIssue, IssueSeverity } from "@/services/placeholder/promptDebugger";
import { AlertTriangle, XCircle, Info, Bug } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const severityConfig: Record<IssueSeverity, { icon: React.ElementType; color: string; bg: string }> = {
    error: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
    warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
    info: { icon: Info, color: "text-primary", bg: "bg-primary/10" },
};

interface Props {
    issues: DebugIssue[];
}

export default function PromptDebugPanel({ issues }: Props) {
    if (issues.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-xs text-success py-2"
            >
                <Bug className="w-3.5 h-3.5" />
                <span>No issues found — prompt looks clean!</span>
            </motion.div>
        );
    }

    const errorCount = issues.filter((i) => i.severity === "error").length;
    const warnCount = issues.filter((i) => i.severity === "warning").length;
    const infoCount = issues.filter((i) => i.severity === "info").length;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 font-semibold text-muted-foreground uppercase tracking-wider">
                    <Bug className="w-3.5 h-3.5" /> Debug Results
                </span>
                {errorCount > 0 && <span className="text-destructive font-mono">{errorCount} error{errorCount > 1 ? "s" : ""}</span>}
                {warnCount > 0 && <span className="text-warning font-mono">{warnCount} warning{warnCount > 1 ? "s" : ""}</span>}
                {infoCount > 0 && <span className="text-primary font-mono">{infoCount} info</span>}
            </div>
            <AnimatePresence>
                {issues.map((issue, i) => {
                    const config = severityConfig[issue.severity];
                    const Icon = config.icon;
                    return (
                        <motion.div
                            key={`${issue.category}-${i}`}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className={`flex gap-2.5 p-2.5 rounded-lg ${config.bg} text-xs`}
                        >
                            <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${config.color}`} />
                            <div className="min-w-0">
                                <p className="font-medium">{issue.message}</p>
                                <p className="text-muted-foreground mt-0.5">💡 {issue.suggestion}</p>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
