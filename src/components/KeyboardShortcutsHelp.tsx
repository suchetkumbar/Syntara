import { ALL_SHORTCUTS } from "@/hooks/useKeyboardShortcuts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Keyboard } from "lucide-react";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function KeyboardShortcutsHelp({ open, onOpenChange }: Props) {
    // Group shortcuts by context
    const contexts = [...new Set(ALL_SHORTCUTS.map((s) => s.context))];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-display">
                        <Keyboard className="w-5 h-5 text-primary" />
                        Keyboard Shortcuts
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    {contexts.map((ctx, ci) => (
                        <motion.div
                            key={ctx}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: ci * 0.06 }}
                        >
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                {ctx}
                            </p>
                            <div className="space-y-1">
                                {ALL_SHORTCUTS.filter((s) => s.context === ctx).map((s) => (
                                    <div
                                        key={s.key}
                                        className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
                                    >
                                        <span className="text-sm text-foreground">{s.description}</span>
                                        <kbd className="text-[10px] px-2 py-0.5 rounded bg-muted border border-border font-mono whitespace-nowrap">
                                            {s.key}
                                        </kbd>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
