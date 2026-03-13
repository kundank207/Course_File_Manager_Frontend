import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredPermission,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, isAuthenticated, loading, activeRole, hasPermission } = useAuth();

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Basic Role Check - ensure user is allowed access
  if (requiredPermission && !hasPermission(requiredPermission)) {
    // 🛑 prevent infinite loop if strict permission is missing but role is correct
    // If the required permission matches the user's active role namespace, allow it as a fallback
    // e.g. "hod:dashboard" required, user is "HOD" -> Allow
    if (activeRole && requiredPermission.toLowerCase().startsWith(activeRole.toLowerCase())) {
      return <>{children}</>;
    }

    // If user logged in but unauthorized for this route -> go to their dashboard
    const theirDashboard = activeRole === "ADMIN" ? "/admin" :
      activeRole === "HOD" ? "/hod/dashboard" :
        activeRole === "SUBJECTHEAD" ? "/subject-head/dashboard" :
          "/teacher/dashboard"; // standardized paths

    // Prevent redirect loop if already at target
    if (window.location.pathname === theirDashboard || window.location.pathname === theirDashboard + "/") {
      return <div className="p-8 text-center"><h1>Access Denied</h1><p>You do not have the specific permission '{requiredPermission}'.</p></div>;
    }

    return <Navigate to={theirDashboard} replace />;
  }

  return <>{children}</>;
}
