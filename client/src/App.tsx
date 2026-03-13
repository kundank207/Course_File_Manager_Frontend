import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/ErrorBoundary";

import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PermissionProvider } from "@/contexts/PermissionContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

/* ===================== AUTH PAGES ===================== */
import LoginPage from "@/pages/auth/Login";
import SignupPage from "@/pages/auth/Register";
import ForgotPasswordPage from "@/pages/auth/ForgotPassword";

/* ===================== LAYOUTS ===================== */
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

/* ===================== TEACHER ===================== */
import Dashboard from "@/pages/dashboard/Dashboard";
import CoursesPage from "@/pages/dashboard/Courses";
import FilesPage from "@/pages/dashboard/Files";
import UploadPage from "@/pages/dashboard/Upload";
import ReportsPage from "@/pages/dashboard/Reports";
import SettingsPage from "@/pages/dashboard/Settings";
import CommentsPage from "@/pages/dashboard/Comments";
import TemplateSelectionPage from "@/pages/dashboard/TemplateSelection";
import CourseStructurePage from "@/pages/dashboard/CourseStructure";
import TeacherNotesUploadPage from "@/pages/dashboard/TeacherNotesUpload";
import ApprovalWorkflowPage from "@/pages/dashboard/ApprovalWorkflow";
import ViewCourseFilePage from "@/pages/dashboard/ViewCourseFile";

/* ===================== HOD ===================== */
import HodDashboardPage from "@/pages/hod/HodDashboard";
import AssignCoursesPage from "@/pages/hod/HodAssignCourse.tsx";
import DepartmentFacultyPage from "@/pages/hod/DepartmentFaculty";
import DepartmentManagementPage from "./pages/hod/AddCoursePage";
import HodApprovalsPage from "@/pages/hod/HodApprovals";
import HodApprovedRecordsPage from "@/pages/hod/HodApprovedRecords";
import HodCourseReviewPage from "@/pages/hod/HodCourseReview";
import HodTeachersPage from "@/pages/hod/HodTeachers";
import HodTeacherActivityPage from "@/pages/hod/HodTeacherActivity";
import HodMissingCoveragePage from "@/pages/hod/HodMissingCoverage";
import HodTemplateBuilderPage from "@/pages/hod/HodTemplateBuilder";
import HodCommentsPage from "@/pages/hod/HodComments";
import HodSettingsPage from "@/pages/hod/HodSettings";
import CalendarPage from "@/pages/common/Calendar";

/* ===================== ADMIN ===================== */
import AdminLoginPage from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsersPage from "@/pages/admin/AdminUsers";
import AdminFacultyPage from "@/pages/admin/FacultyDashboard";
import AdminRolesPage from "@/pages/admin/AdminRoles";
import AdminInstitutesPage from "@/pages/admin/AdminInstitutes";
import AdminDepartmentsPage from "@/pages/admin/AdminDepartments";
import AdminProgramsPage from "@/pages/admin/AdminPrograms";
import AdminTemplatesPage from "@/pages/admin/AdminTemplates";
//import AdminAuditLogsPage from "@/pages/admin/AdminAuditLogs";
import AdminAuditLogsPage from "@/pages/admin/AdminAuditLogs";
import AdminSettingsPage from "@/pages/admin/AdminSettings";
import SystemHealthDashboard from "@/pages/admin/SystemHealthDashboard";
import AdminChat from "@/pages/admin/AdminChat";

/* ===================== SUBJECT HEAD ===================== */
// ... (skipping lines for brevity in instruction, using actual lines in replacement)
import SubjectHeadDashboardPage from "@/pages/subjectHead/SubjectHeadDashboard";
import SubjectHeadCourseReviewPage from "@/pages/subjectHead/SubjectHeadCourseReview";
import SubjectHeadSubjectsPage from "@/pages/subjectHead/SubjectHeadSubjects";
import SubjectHeadReviewsPage from "@/pages/subjectHead/SubjectHeadReviews";
import SubjectHeadCommentsPage from "@/pages/subjectHead/SubjectHeadComments";
import SubjectHeadSettingsPage from "@/pages/subjectHead/SubjectHeadSettings";
import SubjectHeadReportsPage from "@/pages/subjectHead/ReportsPage";
import SubjectHeadApprovalsPage from "@/pages/subjectHead/SubjectHeadApprovals";

/* ===================== FALLBACK ===================== */
import NotFound from "@/pages/not-found";

function Router() {
  const { activeRole, refreshKey, permissions, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col gap-4 h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        <p className="text-muted-foreground">Loading...</p>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
          className="text-sm text-red-500 hover:underline"
        >
          Reset Application
        </button>
      </div>
    );
  }

  return (
    <Routes key={`${activeRole}-${refreshKey}-${permissions?.join(",")}`}>
      {/* ================= PUBLIC ================= */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* ================= ADMIN ================= */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredPermission="admin:dashboard">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="faculty" element={<AdminFacultyPage />} />
        <Route path="roles" element={<AdminRolesPage />} />
        <Route path="institutes" element={<AdminInstitutesPage />} />
        <Route path="departments" element={<AdminDepartmentsPage />} />
        <Route path="programs" element={<AdminProgramsPage />} />
        <Route path="activity" element={<AdminAuditLogsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="system-health" element={<SystemHealthDashboard />} />
        <Route path="messages" element={<AdminChat />} />
      </Route>

      {/* ================= HOD ================= */}
      <Route
        path="/hod"
        element={
          <ProtectedRoute requiredPermission="hod:dashboard">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HodDashboardPage />} />
        <Route path="dashboard" element={<HodDashboardPage />} />
        <Route path="overview" element={<HodDashboardPage />} />
        <Route path="executive-reviews" element={<HodApprovalsPage />} />
        <Route path="approved-records" element={<HodApprovedRecordsPage />} />
        <Route path="review/:courseFileId" element={<HodCourseReviewPage />} />
        <Route path="courses" element={<AssignCoursesPage />} />
        <Route path="department-faculty" element={<DepartmentFacultyPage />} />
        <Route path="department-management" element={<DepartmentManagementPage />} />
        <Route path="teachers" element={<HodTeachersPage />} />
        <Route path="teacher-activity/:teacherId" element={<HodTeacherActivityPage />} />
        <Route path="missing-coverage" element={<HodMissingCoveragePage />} />
        <Route path="templates" element={<HodTemplateBuilderPage />} />
        <Route path="comments" element={<HodCommentsPage />} />
        <Route path="settings" element={<HodSettingsPage />} />
        <Route path="calendar" element={<CalendarPage />} />
      </Route>

      {/* ================= SUBJECTHEAD ================= */}
      <Route
        path="/subject-head"
        element={
          <ProtectedRoute requiredPermission="subjecthead:dashboard">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SubjectHeadDashboardPage />} />
        <Route path="dashboard" element={<SubjectHeadDashboardPage />} />
        <Route path="subjects" element={<SubjectHeadSubjectsPage />} />
        <Route path="reviews" element={<SubjectHeadReviewsPage />} />
        <Route path="comments" element={<SubjectHeadCommentsPage />} />
        <Route path="settings" element={<SubjectHeadSettingsPage />} />
        <Route path="review/:courseFileId" element={<SubjectHeadCourseReviewPage />} />
        <Route path="courses" element={<SubjectHeadSubjectsPage />} />
        <Route path="history" element={<SubjectHeadApprovalsPage />} />
        <Route path="reports" element={<SubjectHeadReportsPage />} />
        {/* Permission-gated routes */}
        <Route path="approvals" element={<SubjectHeadApprovalsPage />} />
        <Route path="files" element={<FilesPage />} />
        <Route path="templates" element={<TemplateSelectionPage />} />
        <Route path="faculty-list" element={<DepartmentFacultyPage />} />
        <Route path="add-course" element={<DepartmentManagementPage />} />
      </Route>


      {/* ================= TEACHER ================= */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute requiredPermission="teacher:dashboard">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="files" element={<FilesPage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="comments" element={<CommentsPage />} />
        <Route path="template-selection" element={<TemplateSelectionPage />} />
        <Route path="course-structure/:courseId" element={<CourseStructurePage />} />
        <Route path="teacher-notes" element={<TeacherNotesUploadPage />} />
        <Route path="approvals" element={<ApprovalWorkflowPage />} />
        <Route path="view-course-file" element={<ViewCourseFilePage />} />
        {/* Permission-gated routes (reuse HOD pages) */}
        <Route path="faculty-list" element={<DepartmentFacultyPage />} />
        <Route path="add-course" element={<DepartmentManagementPage />} />
        <Route path="assign-course" element={<AssignCoursesPage />} />
      </Route>

      {/* ================= LEGACY REDIRECTS ================= */}
      <Route path="/dashboard" element={<Navigate to="/teacher/dashboard" replace />} />
      <Route path="/courses" element={<Navigate to="/teacher/courses" replace />} />
      <Route path="/teacher-notes" element={<Navigate to="/teacher/teacher-notes" replace />} />

      {/* ================= FALLBACK ================= */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  console.log("App mounting...");
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <PermissionProvider>
              <TooltipProvider>
                <Toaster />
                <ErrorBoundary>
                  <Router />
                </ErrorBoundary>
              </TooltipProvider>
            </PermissionProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
