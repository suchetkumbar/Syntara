import { supabase } from "@/lib/supabase";

export interface AuthSession {
    userId: string;
    email: string;
    name: string;
}

export const authService = {
    async register(
        name: string,
        email: string,
        password: string
    ): Promise<AuthSession> {
        const { data, error } = await supabase.auth.signUp({
            email: email.toLowerCase().trim(),
            password,
            options: {
                data: { name: name.trim() },
            },
        });

        if (error) throw new Error(error.message);
        if (!data.user) throw new Error("Registration failed — no user returned");

        return {
            userId: data.user.id,
            email: data.user.email || email,
            name: name.trim(),
        };
    },

    async login(email: string, password: string): Promise<AuthSession> {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.toLowerCase().trim(),
            password,
        });

        if (error) throw new Error(error.message);
        if (!data.user) throw new Error("Login failed — no user returned");

        // Fetch name from profile
        const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", data.user.id)
            .single();

        return {
            userId: data.user.id,
            email: data.user.email || email,
            name: profile?.name || data.user.user_metadata?.name || "",
        };
    },

    async logout(): Promise<void> {
        const { error } = await supabase.auth.signOut();
        if (error) throw new Error(error.message);
    },

    async getSession(): Promise<AuthSession | null> {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;

        const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", session.user.id)
            .single();

        return {
            userId: session.user.id,
            email: session.user.email || "",
            name: profile?.name || session.user.user_metadata?.name || "",
        };
    },

    async getCurrentUser(): Promise<{ id: string; name: string; email: string } | null> {
        const session = await this.getSession();
        if (!session) return null;
        return { id: session.userId, name: session.name, email: session.email };
    },
};
