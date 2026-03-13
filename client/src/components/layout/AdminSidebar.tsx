import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { adminSidebarItems } from "@/lib/dummy-data";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { authFetch } from "@/utils/authFetch";
import { Mail } from "lucide-react";
import { UserAvatar } from "../common/UserAvatar";

interface ProfileData {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string | null;
  username: string;
}

export function AdminSidebar({ className }: { className?: string }) {
  const location = useLocation();
  const { user, hasPermission } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [helpEmail, setHelpEmail] = useState("cfmteam.help@gmail.com");

  useEffect(() => {
    loadProfile();
    loadSettings();
    window.addEventListener("profile-updated", loadProfile);
    return () => window.removeEventListener("profile-updated", loadProfile);
  }, []);

  const loadProfile = async () => {
    try {
      const res = await authFetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Failed to load admin profile:", error);
    }
  };

  const loadSettings = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(`${baseUrl}/api/public/settings`);
      if (res.ok) {
        const data = await res.json();
        if (data.support_email) {
          setHelpEmail(data.support_email);
        }
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };



  // Filter based on hasPermission
  const filteredItems = adminSidebarItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  return (
    <aside className={cn("flex flex-col h-full border-r bg-slate-900 text-slate-50", className)}>
      <div className="p-6 flex items-center gap-2 border-b border-slate-800">
        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-white"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div>
          <span className="font-bold text-xl tracking-tight block leading-none">AdminPanel</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">System Admin</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = item.href === "/admin"
            ? location.pathname === "/admin"
            : location.pathname.startsWith(item.href);

          return (
            <Link key={item.href} to={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer group",
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Info + Help Email at Bottom */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <UserAvatar
            firstName={profile?.firstName}
            lastName={profile?.lastName}
            imageUrl={profile?.profileImageUrl}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.name || profile?.username || user?.username || "Admin"}</p>
            <p className="text-xs text-slate-500 truncate">{profile?.email || user?.email || "admin@example.com"}</p>
          </div>
        </div>

        {/* Help Email */}
        <div className="flex items-center gap-2 px-2 py-2 bg-slate-800/50 rounded-lg">
          <Mail className="h-4 w-4 text-blue-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase text-slate-500 font-semibold">Help & Support</p>
            <a
              href={`mailto:${helpEmail}`}
              className="text-xs text-blue-400 hover:text-blue-300 truncate block"
            >
              {helpEmail}
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
