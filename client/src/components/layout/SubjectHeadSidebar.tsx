import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { authFetch } from "@/utils/authFetch";
import {
  Home,
  BookOpen,
  FileText,
  MessageSquare,
  Settings,
  Mail,
  Shield,
  BarChart2,
  User,
  Plus,
  UploadCloud,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarHeader } from "./SidebarHeader";
import { UserAvatar } from "../common/UserAvatar";

// All possible sidebar items with permission requirements
const subjectHeadItems = [
  // Base items
  { icon: Home, label: "Dashboard", href: "/subject-head/dashboard", requiredPermission: null },
  { icon: BookOpen, label: "Subjects", href: "/subject-head/subjects", requiredPermission: null },
  { icon: FileText, label: "Reviews", href: "/subject-head/reviews", requiredPermission: null },
  // Permission-gated items
  { icon: Shield, label: "Approvals", href: "/subject-head/approvals", requiredPermission: "approve_file" },
  { icon: FileText, label: "Course Files", href: "/subject-head/files", requiredPermission: "create_course_file" },
  { icon: User, label: "Faculty List", href: "/subject-head/faculty-list", requiredPermission: "manage_dept" },
  { icon: Plus, label: "Add Course", href: "/subject-head/add-course", requiredPermission: "manage_dept" },
  { icon: BarChart2, label: "Reports", href: "/subject-head/reports", requiredPermission: null },
  // Always visible
  { icon: MessageSquare, label: "Comments", href: "/subject-head/comments", requiredPermission: null },
  { icon: Settings, label: "Settings", href: "/subject-head/settings", requiredPermission: null },
];

interface ProfileData {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentName?: string;
  profileImageUrl?: string | null;
}

export function SubjectHeadSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, switchRole, activeRole, hasPermission } = useAuth();
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



  const handleSwitchToTeacher = () => {
    switchRole("TEACHER");
    navigate("/teacher/dashboard");
  };

  // Filter items based on permissions
  const filteredItems = subjectHeadItems.filter(item => {
    if (!item.requiredPermission) return true;
    return hasPermission(item.requiredPermission);
  });

  return (
    <aside className="flex flex-col h-full w-64 border-r bg-sidebar">
      <SidebarHeader
        title="CourseFlow"
        subtitle={`${profile?.departmentName || ""} (Subject Head)`}
      />

      {/* Switch to Teacher Button REMOVED - using global RoleSwitcher */}

      <nav className="flex-1 p-4 space-y-1">
        {filteredItems.map((item) => {
          const active = location.pathname === item.href;

          return (
            <Link key={item.href} to={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Info + Help Email at Bottom */}
      <div className="p-4 border-t border-sidebar-border/50 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <UserAvatar
            firstName={profile?.firstName}
            lastName={profile?.lastName}
            imageUrl={profile?.profileImageUrl}
            size="sm"
          />
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
