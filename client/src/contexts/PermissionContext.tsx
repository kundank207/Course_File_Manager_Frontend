import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authFetch } from "@/utils/authFetch";
import { useAuth } from "./AuthContext";

interface PermissionContextType {
    permissions: string[];
    loading: boolean;
    hasPermission: (permission: string) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated, activeRole } = useAuth();
    const [permissions, setPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPermissions = async () => {
        if (!isAuthenticated) {
            setPermissions([]);
            setLoading(false);
            return;
        }

        try {
            const res = await authFetch("/api/profile/permissions");
            if (res.ok) {
                const data: any = await res.json();
                setPermissions(data.permissions || []);
            }
        } catch (error) {
            console.error("Failed to fetch permissions:", error);
            setPermissions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // If AuthContext already has permissions, use them first
        if (isAuthenticated && user?.permissions) {
            setPermissions(user.permissions);
            setLoading(false);
        } else {
            // Otherwise fetch from backend
            fetchPermissions();
        }
    }, [isAuthenticated, activeRole, user]);

    const hasPermission = (permission: string): boolean => {
        if (permissions.includes("all")) return true;
        return permissions.includes(permission);
    };

    const hasAnyPermission = (perms: string[]): boolean => {
        if (permissions.includes("all")) return true;
        return perms.some(p => permissions.includes(p));
    };

    return (
        <PermissionContext.Provider
            value={{
                permissions,
                loading,
                hasPermission,
                hasAnyPermission,
                refreshPermissions: fetchPermissions,
            }}
        >
            {children}
        </PermissionContext.Provider>
    );
}

export function usePermissions() {
    const context = useContext(PermissionContext);
    if (context === undefined) {
        throw new Error("usePermissions must be used within a PermissionProvider");
    }
    return context;
}
