import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, usersApi, getAccessToken, setTokens, clearTokens, isOwnerRole, type User as Journalist } from "./api-client";
export type { User as Journalist } from "./api-client";

const STORAGE_KEY = "dgn_admin_session";

type AdminAuthContextValue = {
  user: Journalist | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

function normalizeRole(roleStr?: string): Journalist["role"] {
  if (!roleStr) return "READER";
  const r = roleStr.toUpperCase();
  if (r === "OWNER" || r === "ADMIN" || r === "SUPERADMIN") return "OWNER";
  if (r === "EIC") return "EIC";
  if (r === "EDITOR" || r === "EDIT") return "EDITOR";
  if (r === "REPORTER" || r === "JOURNALIST") return "REPORTER";
  if (r === "READER") return "READER";
  return "READER";
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Journalist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let initialUser: Journalist | null = null;
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        initialUser = JSON.parse(raw);
        if (initialUser) {
          initialUser.role = normalizeRole(initialUser.role);
          setUser(initialUser);
        }
      }
    } catch {
      // ignore
    }
    setLoading(false);

    // Sync real role from backend if access token is present
    if (initialUser && getAccessToken() && isOwnerRole(initialUser.role)) {
      usersApi
        .list()
        .then((userList) => {
          const fresh = userList.find(
            (u) =>
              u.email.toLowerCase() === initialUser?.email.toLowerCase() ||
              u.id === initialUser?.id
          );
          if (fresh && fresh.role) {
            const freshRole = normalizeRole(fresh.role);
            const updated = { ...initialUser, ...fresh, role: freshRole };
            setUser(updated);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch {
              /* noop */
            }
          }
        })
        .catch(() => {
          /* noop if non-owner endpoint fetch fails */
        });
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setTokens(res.access, res.refresh);
    const normalizedUser = {
      ...res.user,
      role: normalizeRole(res.user.role),
    };
    setUser(normalizedUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedUser));
    } catch {
      // ignore
    }
  };

  const logout = async () => {
    clearTokens();
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <AdminAuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside <AdminAuthProvider>");
  return ctx;
}