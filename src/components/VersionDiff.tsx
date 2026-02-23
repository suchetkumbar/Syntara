import { useMemo } from "react";
import { motion } from "framer-motion";

interface Props {
    oldText: string;
    newText: string;
}

interface DiffLine {
    type: "added" | "removed" | "unchanged";
    content: string;
}

function computeDiff(oldText: string, newText: string): DiffLine[] {
    const oldLines = oldText.split("\n");
    const newLines = newText.split("\n");
    const result: DiffLine[] = [];

    // Simple LCS-based diff
    const m = oldLines.length;
    const n = newLines.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (oldLines[i - 1] === newLines[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    // Backtrack to build diff
    let i = m, j = n;
    const stack: DiffLine[] = [];
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
            stack.push({ type: "unchanged", content: oldLines[i - 1] });
            i--; j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            stack.push({ type: "added", content: newLines[j - 1] });
            j--;
        } else {
            stack.push({ type: "removed", content: oldLines[i - 1] });
            i--;
        }
    }

    stack.reverse();
    return stack;
}

const typeStyles: Record<DiffLine["type"], string> = {
    added: "bg-success/10 text-success border-l-2 border-success/50",
    removed: "bg-destructive/10 text-destructive line-through border-l-2 border-destructive/50",
    unchanged: "text-muted-foreground",
};

const typePrefix: Record<DiffLine["type"], string> = {
    added: "+",
    removed: "−",
    unchanged: " ",
};

export default function VersionDiff({ oldText, newText }: Props) {
    const diff = useMemo(() => computeDiff(oldText, newText), [oldText, newText]);

    const addedCount = diff.filter((d) => d.type === "added").length;
    const removedCount = diff.filter((d) => d.type === "removed").length;

    if (addedCount === 0 && removedCount === 0) {
        return <p className="text-xs text-muted-foreground">No changes between these versions.</p>;
    }

    return (
        <div className="space-y-2">
            <div className="flex gap-3 text-[10px] font-mono">
                {addedCount > 0 && <span className="text-success">+{addedCount} added</span>}
                {removedCount > 0 && <span className="text-destructive">−{removedCount} removed</span>}
            </div>
            <div className="rounded-md border border-border overflow-hidden text-xs font-mono max-h-60 overflow-y-auto">
                {diff.map((line, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.01 }}
                        className={`px-3 py-0.5 ${typeStyles[line.type]}`}
                    >
                        <span className="inline-block w-4 opacity-60">{typePrefix[line.type]}</span>
                        {line.content || " "}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
