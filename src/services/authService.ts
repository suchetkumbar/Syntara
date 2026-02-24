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
        const normalizedEmail = email.toLowerCase().trim();
        const trimmedName = name.trim();

        const { data, error } = await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
                data: { name: trimmedName },
            },
        });

        if (error) throw new Error(error.message);
        if (!data.user) throw new Error("Registration failed — no user returned");

        // If Supabase returned a session the user is already confirmed & signed in
        if (data.session) {
            return {
                userId: data.user.id,
                email: data.user.email || normalizedEmail,
                name: trimmedName,
            };
        }

        // No session → email confirmation may be required.
        // Attempt to sign in immediately (works when "Confirm email" is disabled
        // in Supabase or the user was auto-confirmed).
        const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password,
            });

        if (signInError) {
            // If sign-in truly fails because confirmation IS required,
            // surface a friendly message instead of the raw Supabase error.
            if (signInError.message.toLowerCase().includes("email not confirmed")) {
                throw new Error(
                    "Account created! Please check your email to confirm your account, then sign in."
                );
            }
            throw new Error(signInError.message);
        }

        if (!signInData.user) throw new Error("Registration succeeded but auto-login failed");

        return {
            userId: signInData.user.id,
            email: signInData.user.email || normalizedEmail,
            name: trimmedName,
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
