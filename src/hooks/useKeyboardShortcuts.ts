import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export interface ShortcutDef {
    key: string;
    ctrl?: boolean;
    description: string;
    handler: () => void;
}

/**
 * Global keyboard shortcuts hook.
 *
 * Registers a set of shortcuts on mount and cleans up on unmount.
 * Ignores events from inputs/textareas unless explicitly handled.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutDef[]) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // Skip if user is typing in an input
            const tag = (e.target as HTMLElement).tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

            for (const s of shortcuts) {
                const ctrl = s.ctrl ?? false;
                if (
                    (ctrl ? e.ctrlKey || e.metaKey : true) &&
                    e.key.toLowerCase() === s.key.toLowerCase()
                ) {
                    e.preventDefault();
                    s.handler();
                    return;
                }
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [shortcuts]);
}

/** Pre-built navigation shortcuts for the entire app */
export function useGlobalShortcuts(
    onToggleHelp: () => void
) {
    const navigate = useNavigate();
    const location = useLocation();

    const shortcuts: ShortcutDef[] = [
        {
            key: "/",
            ctrl: true,
            description: "Show keyboard shortcuts",
            handler: onToggleHelp,
        },
        {
            key: "k",
            ctrl: true,
            description: "Focus search (Library / Templates)",
            handler: () => {
                // Navigate to library if not already there
                if (location.pathname !== "/library" && location.pathname !== "/templates") {
                    navigate("/library");
                }
                // Focus the first search input on the page
                setTimeout(() => {
                    const input = document.querySelector<HTMLInputElement>('input[placeholder*="Search"]');
                    input?.focus();
                }, 100);
            },
        },
    ];

    useKeyboardShortcuts(shortcuts);
}

/** All shortcuts for the help dialog */
export const ALL_SHORTCUTS = [
    { key: "Ctrl + Enter", context: "Generator", description: "Generate / Optimize prompt" },
    { key: "Ctrl + S", context: "Builder", description: "Save current prompt" },
    { key: "Ctrl + K", context: "Global", description: "Focus search (Library / Templates)" },
    { key: "Ctrl + /", context: "Global", description: "Toggle shortcuts help" },
];
