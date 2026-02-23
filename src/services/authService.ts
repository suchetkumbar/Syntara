import { v4Style } from "./idUtils";

export interface User {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    createdAt: string;
}

export interface AuthSession {
    userId: string;
    email: string;
    name: string;
    token: string;
    expiresAt: string;
}

const USERS_KEY = "syntara_users";
const SESSION_KEY = "syntara_session";

// Simple hash using Web Crypto (SHA-256)
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getUsers(): User[] {
    try {
        const raw = localStorage.getItem(USERS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveUsers(users: User[]) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function generateId(): string {
    return v4Style();
}

function generateToken(): string {
    return `${generateId()}-${Date.now()}`;
}

export const authService = {
    async register(
        name: string,
        email: string,
        password: string
    ): Promise<AuthSession> {
        const users = getUsers();
        const existing = users.find(
            (u) => u.email.toLowerCase() === email.toLowerCase()
        );
        if (existing) {
            throw new Error("An account with this email already exists");
        }

        const passwordHash = await hashPassword(password);
        const user: User = {
            id: generateId(),
            name: name.trim(),
            email: email.toLowerCase().trim(),
            passwordHash,
            createdAt: new Date().toISOString(),
        };

        users.push(user);
        saveUsers(users);

        const session = createSession(user);
        saveSession(session);
        return session;
    },

    async login(email: string, password: string): Promise<AuthSession> {
        const users = getUsers();
        const user = users.find(
            (u) => u.email.toLowerCase() === email.toLowerCase().trim()
        );
        if (!user) {
            throw new Error("Invalid email or password");
        }

        const passwordHash = await hashPassword(password);
        if (user.passwordHash !== passwordHash) {
            throw new Error("Invalid email or password");
        }

        const session = createSession(user);
        saveSession(session);
        return session;
    },

    logout() {
        localStorage.removeItem(SESSION_KEY);
    },

    getSession(): AuthSession | null {
        try {
            const raw = localStorage.getItem(SESSION_KEY);
            if (!raw) return null;
            const session: AuthSession = JSON.parse(raw);
            // Check expiry (7 days)
            if (new Date(session.expiresAt) < new Date()) {
                localStorage.removeItem(SESSION_KEY);
                return null;
            }
            return session;
        } catch {
            return null;
        }
    },

    getCurrentUser(): { id: string; name: string; email: string } | null {
        const session = this.getSession();
        if (!session) return null;
        return { id: session.userId, name: session.name, email: session.email };
    },
};

function createSession(user: User): AuthSession {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return {
        userId: user.id,
        email: user.email,
        name: user.name,
        token: generateToken(),
        expiresAt: expiresAt.toISOString(),
    };
}

function saveSession(session: AuthSession) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
