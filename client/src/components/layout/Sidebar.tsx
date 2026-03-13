import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { authFetch } from "@/utils/authFetch";
import { Mail } from "lucide-react";
import {
  LayoutDashboard,
  BookOpen,
  FolderOpen,
  Upload,
  BarChart3,
  Settings,
  MessageSquare,
  FileText,
} from "lucide-react";

// Define sidebar items for Teacher
const teacherSidebarItems = [
  { href: "/teacher", label: "Dashboard", icon: LayoutDashboard, permission: "teacher:dashboard" },
  { href: "/teacher/courses", label: "My Courses", icon: BookOpen, permission: "teacher:courses" },
  { href: "/teacher/files", label: "Course Files", icon: FolderOpen, permission: "teacher:files" },
  { href: "/teacher/upload", label: "Upload", icon: Upload, permission: "teacher:upload" },
  { href: "/teacher/comments", label: "Comments", icon: MessageSquare, permission: "teacher:comments" },
  { href: "/teacher/reports", label: "Reports", icon: BarChart3, permission: "teacher:reports" },
  { href: "/teacher/settings", label: "Settings", icon: Settings }, // Settings might be generic
];

// Define sidebar items for HOD
const hodSidebarItems = [
  { href: "/hod", label: "Dept. Overview", icon: LayoutDashboard, permission: "hod:dashboard" },
  { href: "/hod/department-faculty", label: "Faculty-List", icon: FileText, permission: "hod:faculty" },
  { href: "/hod/department-management", label: "ADD Course", icon: BookOpen, permission: "hod:courses:manage" },
  { href: "/hod/courses", label: "Assign-Course", icon: FolderOpen, permission: "hod:courses:assign" },
  { href: "/hod/templates", label: "Create Template", icon: FileText, permission: "hod:templates" },
  { href: "/hod/approvals", label: "Approve Files", icon: Upload, permission: "hod:approvals" },
  { href: "/hod/comments", label: "Comments", icon: MessageSquare, permission: "hod:comments" },
  { href: "/hod/teachers", label: "Faculty Performance", icon: BarChart3, permission: "hod:performance" },
  { href: "/hod/calendar", label: "Dept. Calendar", icon: Settings, permission: "hod:calendar" },
  { href: "/hod/settings", label: "Settings", icon: Settings },
];

// Define sidebar items for Subject Head
const subjectHeadSidebarItems = [
  { href: "/subject-head", label: "Dashboard", icon: LayoutDashboard, permission: "subjecthead:dashboard" },
  { href: "/subject-head/subjects", label: "Subjects", icon: BookOpen, permission: "subjecthead:subjects" },
  { href: "/subject-head/reviews", label: "Reviews", icon: FolderOpen, permission: "subjecthead:reviews" },
  { href: "/subject-head/comments", label: "Comments", icon: MessageSquare, permission: "subjecthead:comments" },
  { href: "/subject-head/settings", label: "Settings", icon: Settings },
];

interface ProfileData {
  name: string;
  email: string;
  departmentName?: string;
  profileImageUrl?: string | null;
}

export function Sidebar({ className }: { className?: string }) {
  const location = useLocation();
  const { user, activeRole, hasPermission } = useAuth();
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
      console.error("Failed to load profile:", error);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/public/settings");
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

  // Select and filter sidebar items based on the current active role
  const getSidebarItems = () => {
    let items: any[] = [];

    switch (activeRole) {
      case "ADMIN":
        // Admin items are usually separate, but if we have them here:
        items = []; // Admin has its own sidebar often, but let's be safe
        break;
      case "HOD":
        items = hodSidebarItems;
        break;
      case "SUBJECTHEAD":
        items = subjectHeadSidebarItems;
        break;
      case "TEACHER":
        items = teacherSidebarItems;
        break;
      default:
        items = [];
    }

    // Filter based on hasPermission
    return items.filter(item => {
      if (!item.permission) return true;
      return hasPermission(item.permission);
    });
  };

  const sidebarItems = getSidebarItems();
  const basePath = location.pathname.split("/")[1]; // 'teacher', 'hod', or 'subject-head'

  const getInitials = (name?: string) => {
    if (!name) return user?.username?.substring(0, 2).toUpperCase() || "US";
    const parts = name.split(" ");
    return parts.length >= 2
      ? (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  return (
    <aside className={cn("flex flex-col h-full border-r bg-sidebar text-sidebar-foreground", className)}>
      <div className="p-6 flex items-center gap-2 border-b border-sidebar-border/50">
        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-primary-foreground"
          >
            <path d="M2 6h4" />
            <path d="M2 10h4" />
            <path d="M2 14h4" />
            <path d="M2 18h4" />
            <rect width="16" height="20" x="4" y="2" rx="2" />
            <path d="M16 2v20" />
          </svg>
        </div>
        <div>
          <span className="font-bold text-xl tracking-tight block leading-none">CourseFlow</span>
          <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
            {profile?.departmentName || (activeRole === "HOD" ? "HOD" : activeRole === "SUBJECTHEAD" ? "Subject Head" : activeRole || "Teacher")}
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        <div className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== "/" && location.pathname.startsWith(item.href));
            return (
              <Link key={item.href} to={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer group",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive ? "text-sidebar-primary-foreground" : "text-muted-foreground group-hover:text-sidebar-accent-foreground")} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Info + Help Email at Bottom */}
      <div className="p-4 border-t border-sidebar-border/50 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold overflow-hidden">
            {profile?.profileImageUrl ? (
              <img src={profile.profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <span className="text-primary">{getInitials(profile?.name)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.name || user?.username || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{profile?.email || user?.email || "user@example.com"}</p>
          </div>
        </div>

        {/* Help Email */}
        <div className="flex items-center gap-2 px-2 py-2 bg-muted/50 rounded-lg">
          <Mail className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Help & Support</p>
            <a
              href={`mailto:${helpEmail}`}
              className="text-xs text-primary hover:underline truncate block"
            >
              {helpEmail}
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
