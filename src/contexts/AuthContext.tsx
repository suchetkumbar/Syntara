import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { authService, AuthSession } from "@/services/authService";

interface AuthContextType {
    user: { id: string; name: string; email: string } | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthContextType["user"]>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Listen for Supabase auth state changes
    useEffect(() => {
        // Check initial session
        authService.getCurrentUser().then((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            }
            setIsLoading(false);
        });

        // Subscribe to auth changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === "SIGNED_OUT" || !session) {
                    setUser(null);
                } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("name")
                        .eq("id", session.user.id)
                        .single();

                    setUser({
                        id: session.user.id,
                        name: profile?.name || session.user.user_metadata?.name || "",
                        email: session.user.email || "",
                    });
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const session: AuthSession = await authService.login(email, password);
        setUser({ id: session.userId, name: session.name, email: session.email });
    }, []);

    const register = useCallback(
        async (name: string, email: string, password: string) => {
            const session: AuthSession = await authService.register(
                name,
                email,
                password
            );
            setUser({ id: session.userId, name: session.name, email: session.email });
        },
        []
    );

    const logout = useCallback(async () => {
        await authService.logout();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
