import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Beaker, Sparkles, Blocks, Library, GitCompare, BookTemplate, BarChart3, Settings, Menu, X, LogOut, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useGlobalShortcuts } from "@/hooks/useKeyboardShortcuts";
import KeyboardShortcutsHelp from "@/components/KeyboardShortcutsHelp";

const navItems = [
  { to: "/", icon: Sparkles, label: "Generator" },
  { to: "/builder", icon: Blocks, label: "Builder" },
  { to: "/library", icon: Library, label: "Library" },
  { to: "/compare", icon: GitCompare, label: "Compare" },
  { to: "/templates", icon: BookTemplate, label: "Templates" },
  { to: "/dashboard", icon: BarChart3, label: "Dashboard" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const pageTransition = {
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(4px)" },
};

const pageSpring = {
  type: "spring" as const,
  stiffness: 260,
  damping: 25,
  mass: 0.8,
};

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  useGlobalShortcuts(() => setShortcutsOpen((v) => !v));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.name
    ? user.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "?";

  return (
    <>
      <div className="flex h-screen bg-background">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
          <div className="flex items-center gap-2.5 px-6 py-5 border-b border-border">
            <motion.div
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10"
              whileHover={{ scale: 1.1, rotate: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <Beaker className="w-4.5 h-4.5 text-primary" />
            </motion.div>
            <span className="font-display text-lg font-bold tracking-tight">Syntara</span>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-primary/10 rounded-lg glow-primary"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <item.icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar footer — user + controls */}
          <div className="px-3 py-3 border-t border-border space-y-2">
            <div className="flex items-center gap-2 px-2">
              <button
                onClick={toggle}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {theme === "dark" ? (
                    <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <Sun className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <Moon className="w-4 h-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
              <div className="flex-1" />
              <p className="text-[10px] text-muted-foreground font-mono">v0.2.0</p>
            </div>

            {user && (
              <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
                <motion.button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  whileTap={{ scale: 0.9 }}
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile header */}
        <div className="flex flex-col flex-1 min-w-0">
          <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <Beaker className="w-5 h-5 text-primary" />
              <span className="font-display text-lg font-bold">Syntara</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={toggle} className="p-2 text-muted-foreground">
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <motion.button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="text-muted-foreground p-2"
                whileTap={{ scale: 0.9 }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {mobileOpen ? (
                    <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </header>

          <AnimatePresence>
            {mobileOpen && (
              <motion.nav
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="md:hidden border-b border-border bg-card overflow-hidden"
              >
                <div className="px-3 py-2 space-y-1">
                  {navItems.map((item, i) => {
                    const active = location.pathname === item.to;
                    return (
                      <motion.div
                        key={item.to}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Link
                          to={item.to}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                            active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </Link>
                      </motion.div>
                    );
                  })}
                  {user && (
                    <motion.div
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive/80 hover:bg-destructive/10 w-full transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.nav>
            )}
          </AnimatePresence>

          <main className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={pageTransition}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageSpring}
                className="h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <KeyboardShortcutsHelp open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </>
  );
}
