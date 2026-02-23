import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Beaker, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password) {
            toast.error("Please fill in all fields");
            return;
        }
        setLoading(true);
        try {
            await login(email, password);
            toast.success("Welcome back!");
            navigate("/");
        } catch (err: any) {
            toast.error(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-background">
            {/* Left panel — branding */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="relative z-10 text-center px-12"
                >
                    <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6"
                    >
                        <Beaker className="w-8 h-8 text-primary" />
                    </motion.div>
                    <h1 className="text-4xl font-display font-bold tracking-tight mb-3">
                        <span className="text-gradient-primary">Syntara</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-md">
                        Your AI prompt engineering workbench. Generate, score, compare,
                        and refine prompts with precision.
                    </p>
                    <div className="flex gap-6 mt-8 justify-center">
                        {["Generate", "Score", "Compare", "Build"].map((label, i) => (
                            <motion.div
                                key={label}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                className="text-xs text-muted-foreground font-mono px-3 py-1.5 rounded-lg bg-card border border-border"
                            >
                                {label}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-2.5 mb-10">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                            <Beaker className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-display text-xl font-bold tracking-tight">Syntara</span>
                    </div>

                    <h2 className="text-2xl font-display font-bold tracking-tight mb-1">
                        Welcome back
                    </h2>
                    <p className="text-sm text-muted-foreground mb-8">
                        Sign in to your account to continue
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="pl-10 bg-card border-border"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="pl-10 bg-card border-border"
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full gap-2" disabled={loading}>
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Sign In <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </Button>
                    </form>

                    <p className="text-sm text-muted-foreground text-center mt-6">
                        Don&apos;t have an account?{" "}
                        <Link
                            to="/signup"
                            className="text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                            Create one
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
