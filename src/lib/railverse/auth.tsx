import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";

export type Role = "passenger" | "admin";

export interface AuthUser {
  name: string;
  email: string;
  role: Role;
}

interface StoredUser extends AuthUser {
  password: string;
}

interface AuthCtx {
  user: AuthUser | null;
  hydrated: boolean;
  login: (email: string, password: string, role: Role) => { ok: boolean; message: string };
  signup: (
    name: string,
    email: string,
    password: string,
    role: Role,
  ) => { ok: boolean; message: string };
  logout: () => void;
}

const USERS_KEY = "railverse.users.v1";
const SESSION_KEY = "railverse.session.v1";

const AuthContext = createContext<AuthCtx | null>(null);

function readUsers(): StoredUser[] {
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next: AuthUser | null) => {
    setUser(next);
    if (next) window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(SESSION_KEY);
  }, []);

  const signup = useCallback<AuthCtx["signup"]>(
    (name, email, password, role) => {
      const normalized = email.trim().toLowerCase();
      const users = readUsers();
      if (users.some((u) => u.email === normalized && u.role === role)) {
        return { ok: false, message: "An account with this email already exists." };
      }
      const next: StoredUser = { name: name.trim(), email: normalized, password, role };
      writeUsers([...users, next]);
      persist({ name: next.name, email: next.email, role });
      return { ok: true, message: `Welcome aboard, ${next.name}.` };
    },
    [persist],
  );

  const login = useCallback<AuthCtx["login"]>(
    (email, password, role) => {
      const normalized = email.trim().toLowerCase();
      const found = readUsers().find(
        (u) => u.email === normalized && u.role === role && u.password === password,
      );
      if (!found) return { ok: false, message: "Invalid credentials for this role." };
      persist({ name: found.name, email: found.email, role });
      return { ok: true, message: `Welcome back, ${found.name}.` };
    },
    [persist],
  );

  const value = useMemo<AuthCtx>(
    () => ({ user, hydrated, login, signup, logout: () => persist(null) }),
    [user, hydrated, login, signup, persist],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useRequireRole(role: Role) {
  const { user, hydrated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      navigate({ to: "/auth", search: { mode: "login" }, replace: true });
    } else if (user.role !== role) {
      navigate({ to: user.role === "admin" ? "/admin" : "/passenger", replace: true });
    }
  }, [hydrated, user, role, navigate]);

  return hydrated && user?.role === role;
}
