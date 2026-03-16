import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { ChatWidget } from "@/components/chat/ChatWidget";

// 🔥 NEW role-based sidebars
import TeacherSidebar from "./TeacherSidebar";
import HodSidebar from "./HodSidebar";
import { SubjectHeadSidebar } from "./SubjectHeadSidebar";
import { AdminSidebar } from "./AdminSidebar";

export function DashboardLayout({ children }: { children?: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { activeRole, hasPermission } = useAuth();

  // 🛡️ ROLE-BASED SIDEBAR SELECTION
  let SidebarContent = null;
  switch (activeRole) {
    case "ADMIN": SidebarContent = <AdminSidebar />; break;
    case "HOD": SidebarContent = <HodSidebar />; break;
    case "SUBJECTHEAD": SidebarContent = <SubjectHeadSidebar />; break;
    case "TEACHER": SidebarContent = <TeacherSidebar />; break;
    default: SidebarContent = null;
  }
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* ================= Desktop Sidebar ================= */}
      <div className="hidden md:block w-64 h-full shrink-0">
        {SidebarContent}
      </div>

      {/* ================= Mobile Sidebar ================= */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72 border-r">
          {SidebarContent}
        </SheetContent>
      </Sheet>

      {/* ================= Main Content ================= */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto w-full overflow-x-auto pb-4">
            <ErrorBoundary>
              {children ?? <Outlet />}
            </ErrorBoundary>
          </div>
        </main>
      </div>
      <ChatWidget />
    </div>
  );
}
