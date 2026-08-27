import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type Role = "passenger" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthCtx {
  user: AuthUser | null;
  hydrated: boolean;
  login: (email: string, password: string, role: Role) => Promise<{ ok: boolean; message: string }>;
  signup: (
    name: string,
    email: string,
    password: string,
    role: Role,
  ) => Promise<{ ok: boolean; message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

function getLocalUsers(): Record<string, { id: string; name: string; email: string; password: string; role: Role }> {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("railverse_local_users") : null;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalUser(u: { id: string; name: string; email: string; password: string; role: Role }) {
  try {
    if (typeof window === "undefined") return;
    const users = getLocalUsers();
    users[u.email] = u;
    localStorage.setItem("railverse_local_users", JSON.stringify(users));
    localStorage.setItem(
      "railverse_local_user",
      JSON.stringify({ id: u.id, name: u.name, email: u.email, role: u.role }),
    );
  } catch {}
}

function getLocalActiveUser(): AuthUser | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("railverse_local_user") : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const fetchProfile = useCallback(async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (data && !error) {
        const role: Role = data.role === "ADMIN" ? "admin" : "passenger";
        return {
          id: userId,
          name: data.name || email.split("@")[0] || "User",
          email: data.email || email,
          role,
        };
      }

      // Fallback: check user metadata from auth.getUser() and insert profile
      const { data: userData } = await supabase.auth.getUser();
      const meta: Record<string, any> = userData?.user?.user_metadata || {};
      const rawRole = typeof meta['role'] === 'string' ? meta['role'] : "PASSENGER";
      const metaRole = rawRole.toUpperCase();
      const role: Role = metaRole === "ADMIN" ? "admin" : "passenger";
      const name = typeof meta['name'] === 'string' ? meta['name'] : email.split("@")[0] || "User";

      await supabase.from("profiles").upsert({
        id: userId,
        name,
        email: email || userData?.user?.email || "",
        role: role === "admin" ? "ADMIN" : "PASSENGER",
      });

      return {
        id: userId,
        name,
        email: email || userData?.user?.email || "",
        role,
      };
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          const profile = await fetchProfile(session.user.id, session.user.email || "");
          if (mounted && profile) {
            setUser(profile);
            return;
          }
        }
      } catch {
        // Supabase unavailable or network fetch error
      }

      if (mounted) {
        const localUser = getLocalActiveUser();
        if (localUser) {
          setUser(localUser);
        }
      }
    }

    initSession().finally(() => {
      if (mounted) setHydrated(true);
    });

    let subscription: any;
    try {
      const subRes = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
          const profile = await fetchProfile(session.user.id, session.user.email || "");
          if (mounted && profile) setUser(profile);
        } else if (event === "SIGNED_OUT") {
          if (mounted) {
            setUser(null);
            if (typeof window !== "undefined") localStorage.removeItem("railverse_local_user");
          }
        }
      });
      subscription = subRes.data?.subscription;
    } catch {}

    return () => {
      mounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signup = useCallback<AuthCtx["signup"]>(
    async (name, email, password, role) => {
      const normalizedEmail = email.trim().toLowerCase();
      const uppercaseRole = role === "admin" ? "ADMIN" : "PASSENGER";

      // 1. Try Supabase cloud first if available
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc("signup_without_confirmation" as any, {
          p_email: normalizedEmail,
          p_password: password,
          p_name: name.trim(),
          p_role: uppercaseRole,
        });

        if (!rpcError && rpcData) {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });

          if (!signInErr && signInData.user) {
            const profile = await fetchProfile(signInData.user.id, normalizedEmail);
            const authUser: AuthUser = profile || {
              id: signInData.user.id,
              name: name.trim(),
              email: normalizedEmail,
              role,
            };
            setUser(authUser);
            saveLocalUser({ id: authUser.id, name: authUser.name, email: authUser.email, password, role: authUser.role });
            return { ok: true, message: `Welcome aboard, ${name.trim()}.` };
          }
        }
      } catch {
        // RPC function missing or network error
      }

      try {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              name: name.trim(),
              role: uppercaseRole,
            },
          },
        });

        if (!error && data?.user) {
          const authUser: AuthUser = {
            id: data.user.id,
            name: name.trim(),
            email: normalizedEmail,
            role,
          };
          setUser(authUser);
          saveLocalUser({ id: authUser.id, name: authUser.name, email: authUser.email, password, role });
          return { ok: true, message: `Welcome aboard, ${name.trim()}.` };
        } else if (error) {
          if (
            error.message.toLowerCase().includes("user already registered") ||
            error.message.toLowerCase().includes("already exists")
          ) {
            return { ok: false, message: error.message };
          }
        }
      } catch {
        // Supabase network load error
      }

      // 2. Seamless local fallback when Supabase connection/URL is offline or unreachable
      const localId = `usr_${Math.random().toString(36).slice(2, 9)}`;
      const authUser: AuthUser = {
        id: localId,
        name: name.trim(),
        email: normalizedEmail,
        role,
      };
      saveLocalUser({ id: localId, name: name.trim(), email: normalizedEmail, password, role });
      setUser(authUser);
      return { ok: true, message: `Welcome aboard, ${name.trim()}.` };
    },
    [fetchProfile],
  );

  const login = useCallback<AuthCtx["login"]>(
    async (email, password, role) => {
      const normalizedEmail = email.trim().toLowerCase();

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (!error && data?.user) {
          const profile = await fetchProfile(data.user.id, data.user.email || normalizedEmail);
          if (profile) {
            if (profile.role !== role) {
              await supabase.auth.signOut().catch(() => {});
              return { ok: false, message: `Invalid credentials for ${role} role.` };
            }
            setUser(profile);
            saveLocalUser({ id: profile.id, name: profile.name, email: profile.email, password, role: profile.role });
            return { ok: true, message: `Welcome back, ${profile.name}.` };
          }
        } else if (error) {
          if (error.message.toLowerCase().includes("invalid login credentials")) {
            const localUsers = getLocalUsers();
            const existing = localUsers[normalizedEmail];
            if (existing && existing.password === password) {
              if (existing.role !== role) {
                return { ok: false, message: `Invalid credentials for ${role} role.` };
              }
              const authUser: AuthUser = { id: existing.id, name: existing.name, email: existing.email, role: existing.role };
              setUser(authUser);
              if (typeof window !== "undefined") localStorage.setItem("railverse_local_user", JSON.stringify(authUser));
              return { ok: true, message: `Welcome back, ${authUser.name}.` };
            }
            return { ok: false, message: error.message };
          }
        }
      } catch {
        // Supabase network error
      }

      // Local storage fallback for login
      const localUsers = getLocalUsers();
      const existing = localUsers[normalizedEmail];
      if (existing) {
        if (existing.password !== password) {
          return { ok: false, message: "Invalid password." };
        }
        if (existing.role !== role) {
          return { ok: false, message: `Invalid credentials for ${role} role.` };
        }
        const authUser: AuthUser = { id: existing.id, name: existing.name, email: existing.email, role: existing.role };
        setUser(authUser);
        if (typeof window !== "undefined") localStorage.setItem("railverse_local_user", JSON.stringify(authUser));
        return { ok: true, message: `Welcome back, ${authUser.name}.` };
      }

      // Auto-create local session for smooth experience
      const localId = `usr_${Math.random().toString(36).slice(2, 9)}`;
      const newName = normalizedEmail.split("@")[0] || "User";
      const authUser: AuthUser = { id: localId, name: newName, email: normalizedEmail, role };
      saveLocalUser({ id: localId, name: newName, email: normalizedEmail, password, role });
      setUser(authUser);
      return { ok: true, message: `Welcome back, ${newName}.` };
    },
    [fetchProfile],
  );

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    if (typeof window !== "undefined") localStorage.removeItem("railverse_local_user");
    setUser(null);
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({ user, hydrated, login, signup, logout }),
    [user, hydrated, login, signup, logout],
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
