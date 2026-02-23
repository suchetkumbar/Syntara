import { useMemo } from "react";
import Layout from "@/components/Layout";
import { usePrompts } from "@/hooks/usePrompts";
import { scorePrompt, getScoreColor, getScoreLabel } from "@/utils/promptScorer";
import { BarChart3, Trophy, TrendingUp, FileText, Clock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring" as const, stiffness: 300, damping: 24, delay },
});

export default function Dashboard() {
    const { prompts } = usePrompts();

    const stats = useMemo(() => {
        if (prompts.length === 0) {
            return { total: 0, avgScore: 0, bestPrompt: null as null | { title: string; score: number }, totalVersions: 0, distribution: [] as { range: string; count: number; color: string }[], recentActivity: [] as { title: string; action: string; date: string }[], categoryBreakdown: [] as { name: string; value: number; max: number }[] };
        }

        // Score all prompts
        const scored = prompts.map((p) => {
            const score = scorePrompt(p.content);
            return { prompt: p, score: score.total, breakdown: score.breakdown };
        });

        const scores = scored.map((s) => s.score);
        const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const bestEntry = scored.reduce((best, curr) => (curr.score > best.score ? curr : best), scored[0]);
        const totalVersions = prompts.reduce((sum, p) => sum + p.versions.length, 0);

        // Score distribution
        const ranges = [
            { range: "0-20", min: 0, max: 20, color: "bg-destructive" },
            { range: "21-40", min: 21, max: 40, color: "bg-destructive/60" },
            { range: "41-60", min: 41, max: 60, color: "bg-warning" },
            { range: "61-80", min: 61, max: 80, color: "bg-primary/60" },
            { range: "81-100", min: 81, max: 100, color: "bg-success" },
        ];

        const distribution = ranges.map((r) => ({
            range: r.range,
            count: scores.filter((s) => s >= r.min && s <= r.max).length,
            color: r.color,
        }));

        // Category breakdown (average per scoring dimension)
        const avgBreakdown = {
            role: 0, specificity: 0, clarity: 0, structure: 0, constraints: 0, outputFormat: 0,
        };
        for (const s of scored) {
            for (const key of Object.keys(avgBreakdown) as (keyof typeof avgBreakdown)[]) {
                avgBreakdown[key] += s.breakdown[key];
            }
        }
        for (const key of Object.keys(avgBreakdown) as (keyof typeof avgBreakdown)[]) {
            avgBreakdown[key] = Math.round(avgBreakdown[key] / scored.length);
        }

        const maxScores: Record<string, number> = {
            role: 15, specificity: 15, clarity: 10, structure: 20, constraints: 20, outputFormat: 20,
        };

        const categoryBreakdown = Object.entries(avgBreakdown).map(([name, value]) => ({
            name: name === "outputFormat" ? "Output" : name.charAt(0).toUpperCase() + name.slice(1),
            value,
            max: maxScores[name],
        }));

        // Recent activity
        const allVersions = prompts.flatMap((p) =>
            p.versions.map((v) => ({ title: p.title, action: v.note || "Created", date: v.createdAt }))
        );
        allVersions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const recentActivity = allVersions.slice(0, 8);

        return {
            total: prompts.length,
            avgScore,
            bestPrompt: { title: bestEntry.prompt.title, score: bestEntry.score },
            totalVersions,
            distribution,
            recentActivity,
            categoryBreakdown,
        };
    }, [prompts]);

    const maxDistCount = Math.max(...stats.distribution.map((d) => d.count), 1);

    return (
        <Layout>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <motion.div {...fadeUp()}>
                    <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
                        Analytics <span className="text-gradient-primary">Dashboard</span>
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Track your prompt engineering progress
                    </p>
                </motion.div>

                {prompts.length === 0 ? (
                    <motion.div {...fadeUp(0.1)} className="text-center py-20">
                        <BarChart3 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">No data yet. Create prompts to see analytics!</p>
                    </motion.div>
                ) : (
                    <div className="space-y-6 mt-6">
                        {/* Stat cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                                { label: "Total Prompts", value: stats.total, icon: FileText, accent: "text-primary" },
                                { label: "Average Score", value: stats.avgScore, icon: TrendingUp, accent: getScoreColor(stats.avgScore) },
                                { label: "Best Score", value: stats.bestPrompt?.score ?? 0, icon: Trophy, accent: "text-success" },
                                { label: "Total Versions", value: stats.totalVersions, icon: Clock, accent: "text-accent" },
                            ].map((stat, i) => (
                                <motion.div
                                    key={stat.label}
                                    {...fadeUp(0.06 * i)}
                                    className="surface-elevated rounded-lg p-4 border border-border"
                                >
                                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                        <stat.icon className="w-4 h-4" />
                                        <span className="text-[10px] font-semibold uppercase tracking-wider">{stat.label}</span>
                                    </div>
                                    <p className={`text-2xl font-display font-bold ${stat.accent}`}>{stat.value}</p>
                                </motion.div>
                            ))}
                        </div>

                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Score distribution */}
                            <motion.div {...fadeUp(0.15)} className="surface-elevated rounded-lg p-4 border border-border">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                    <BarChart3 className="w-3.5 h-3.5" /> Score Distribution
                                </h3>
                                <div className="space-y-2">
                                    {stats.distribution.map((d) => (
                                        <div key={d.range} className="flex items-center gap-3 text-xs">
                                            <span className="w-12 text-right font-mono text-muted-foreground">{d.range}</span>
                                            <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(d.count / maxDistCount) * 100}%` }}
                                                    transition={{ duration: 0.6, delay: 0.2 }}
                                                    className={`h-full rounded-full ${d.color}`}
                                                />
                                            </div>
                                            <span className="w-6 font-mono text-foreground text-right">{d.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Category breakdown (radar-style bars) */}
                            <motion.div {...fadeUp(0.2)} className="surface-elevated rounded-lg p-4 border border-border">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5" /> Average Score by Category
                                </h3>
                                <div className="space-y-2.5">
                                    {stats.categoryBreakdown.map((cat) => (
                                        <div key={cat.name} className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">{cat.name}</span>
                                                <span className="font-mono text-foreground">{cat.value}/{cat.max}</span>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(cat.value / cat.max) * 100}%` }}
                                                    transition={{ duration: 0.5, delay: 0.3 }}
                                                    className="h-full rounded-full bg-primary"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        {/* Best prompt callout */}
                        {stats.bestPrompt && (
                            <motion.div
                                {...fadeUp(0.25)}
                                className="surface-elevated rounded-lg p-4 border border-border flex items-center gap-3"
                            >
                                <Trophy className="w-5 h-5 text-warning shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">Best Prompt</p>
                                    <p className="text-sm font-medium truncate">{stats.bestPrompt.title}</p>
                                </div>
                                <span className={`ml-auto text-xl font-display font-bold ${getScoreColor(stats.bestPrompt.score)}`}>
                                    {stats.bestPrompt.score}
                                </span>
                            </motion.div>
                        )}

                        {/* Recent activity */}
                        <motion.div {...fadeUp(0.3)} className="surface-elevated rounded-lg p-4 border border-border">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" /> Recent Activity
                            </h3>
                            <div className="space-y-2">
                                {stats.recentActivity.map((a, i) => (
                                    <motion.div
                                        key={`${a.date}-${i}`}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + i * 0.04 }}
                                        className="flex items-center gap-3 text-xs py-1.5"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                        <span className="font-medium truncate flex-1">{a.title}</span>
                                        <span className="text-muted-foreground shrink-0">{a.action}</span>
                                        <span className="text-muted-foreground font-mono shrink-0">
                                            {new Date(a.date).toLocaleDateString()}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
