import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { authFetch } from "@/utils/authFetch";

/* =======================
   TYPES
======================= */

export type UserRole = "ADMIN" | "TEACHER" | "HOD" | "SUBJECTHEAD";

export interface User {
  id: number;
  username: string;
  email?: string;
  role: UserRole;
  roles: string[];
  activeRole: UserRole;
  teacherId?: number;
  departmentId?: number;
  token: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  activeRole: UserRole | null;
  permissions: string[];
  isSubjectHead: boolean;
  refreshKey: number;

  login: (userData: any) => void;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<{ success: boolean; message?: string }>;
  hasPermission: (permission: string) => boolean;
  getRoleBasedRedirect: (role: UserRole) => string;
}

/* =======================
   CONTEXT
======================= */

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = "courseflow_auth";

/* =======================
   HELPERS
======================= */

const parseJwt = (token: string) => {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

/* =======================
   PROVIDER
======================= */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Safe check for subject head using roles array
  const isSubjectHead = Array.isArray(user?.roles) && user.roles.includes("SUBJECTHEAD");

  /* =======================
     LOAD FROM STORAGE
  ======================= */

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      try {
        const userData = JSON.parse(stored);
        const token = userData.token;
        const decoded = parseJwt(token);

        if (decoded && decoded.activeRole) {
          const role = decoded.activeRole as UserRole;
          const rolesArr = Array.isArray(decoded.roles) ? decoded.roles : [];
          const permsArr = Array.isArray(decoded.permissions) ? decoded.permissions : [];

          const safeUser: User = {
            ...userData,
            activeRole: role,
            roles: rolesArr,
            permissions: permsArr,
          };

          setUser(safeUser);
          setActiveRole(role);
          setPermissions(permsArr);
        } else {
          throw new Error("Invalid token or missing activeRole");
        }
      } catch (err) {
        console.error("Auth initialization failed", err);
        localStorage.removeItem(STORAGE_KEY);
        resetAuth();
      }
    }

    setLoading(false);
  }, []);

  /* =======================
     HELPERS
  ======================= */

  const resetAuth = () => {
    setUser(null);
    setActiveRole(null);
    setPermissions([]);
  };

  /* =======================
     ACTIONS
  ======================= */

  const login = (userData: any) => {
    const decoded = parseJwt(userData.token);
    if (!decoded || !decoded.activeRole) {
      console.error("Login failed: JWT missing activeRole");
      return;
    }

    const role = decoded.activeRole as UserRole;
    const rolesArr = Array.isArray(decoded.roles) ? decoded.roles : [];
    const permsFromToken = Array.isArray(decoded.permissions) ? decoded.permissions : [];
    // Prioritize body permissions if available (e.g. if token payload is minimized)
    const permsFromBody = Array.isArray(userData.permissions) ? userData.permissions : [];
    const finalPerms = permsFromBody.length > 0 ? permsFromBody : permsFromToken;

    // Ensure state updates FIRST
    const userToSet: User = {
      ...userData,
      activeRole: role,
      roles: rolesArr,
      permissions: finalPerms,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(userToSet));
    setUser(userToSet);
    setActiveRole(role);
    setPermissions(finalPerms);
    // NO navigate here
  };

  const logout = () => {
    resetAuth();
    localStorage.removeItem(STORAGE_KEY);
  };

  const switchRole = async (role: UserRole): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await authFetch("/api/auth/switch-role", {
        method: "POST",
        body: JSON.stringify({ message: "Switching role", role: role }), // Send as JSON explicitly
      });

      if (res.ok) {
        const data = await res.json();
        const decoded = parseJwt(data.token);

        if (user && decoded?.activeRole) {
          // ... existing logic ...
          const roleVal = decoded.activeRole as UserRole;
          const rolesArr = Array.isArray(decoded.roles) ? decoded.roles : [];
          const permsArr = Array.isArray(decoded.permissions) ? decoded.permissions : [];

          const updatedUser: User = {
            ...user,
            token: data.token,
            activeRole: roleVal,
            roles: rolesArr,
            permissions: permsArr
          };

          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
          setUser(updatedUser);
          setActiveRole(roleVal);
          setPermissions(permsArr);
          setRefreshKey((prev) => prev + 1);
          return { success: true };
        }
      }

      const text = await res.text();
      console.error("Switch role failed:", res.status, text);
      return { success: false, message: `Failed: ${res.status} ${text}` };

    } catch (error: any) {
      console.error("Error switching role:", error);
      return { success: false, message: error.message || "Network error" };
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!permission) return false;
    // CRASH-PROOF: Ensure permissions is an array
    if (!Array.isArray(permissions)) return false;

    // ADMIN bypass
    if (activeRole === 'ADMIN') return true;

    // Check for 'all' or specific permission
    return permissions.includes('all') || permissions.includes(permission);
  };

  /* =======================
     REDIRECT UTILS
  ======================= */

  const getRoleBasedRedirect = (role: UserRole): string => {
    switch (role) {
      case "ADMIN": return "/admin";
      case "HOD": return "/hod/dashboard";
      case "SUBJECTHEAD": return "/subject-head/dashboard";
      case "TEACHER": return "/teacher/dashboard";
      default: return "/login";
    }
  };

  /* =======================
     CONTEXT VALUE
  ======================= */

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    activeRole,
    permissions,
    isSubjectHead,
    refreshKey,
    switchRole,
    login,
    logout,
    hasPermission,
    getRoleBasedRedirect,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
