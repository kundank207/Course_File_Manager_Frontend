
import { Home, BookOpen, FileText, Plus, BarChart2, Settings, UploadCloud, User, Shield, HardDrive, Building, Layers, Calendar, ClipboardCheck, History, MessageSquare } from "lucide-react";

export const currentUser = {
  id: 5,
  name: "Dr. Alan Turing",
  email: "alan.turing@university.edu",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  role: "HOD" as "Teacher" | "HOD" | "Admin",
  department: "Computer Science",
  institute: "Tech Institute of Science",
  teacher_id: 5,
};

// ========== INSTITUTE ==========
export const institutes = [
  { id: 1, name: "Tech Institute of Science", code: "TIS", address: "123 Science Blvd", email: "contact@tis.edu", phone: "+1 555-0101", website: "www.tis.edu" },
  { id: 2, name: "Global Arts College", code: "GAC", address: "45 Arts Way", email: "info@gac.edu", phone: "+1 555-0102", website: "www.gac.edu" }
];

// ========== DEPARTMENT ==========
export const departments = [
  { id: 1, name: "Computer Science", code: "CSE", institute_id: 1, hod_id: 5 },
  { id: 2, name: "Electronics", code: "ECE", institute_id: 1, hod_id: 6 },
  { id: 3, name: "English Literature", code: "ENG", institute_id: 2, hod_id: 7 }
];

// ========== TEACHER (from database) ==========
export const teachers = [
  { id: 1, department_id: 1, name: "Dr. Rajesh Kumar", employee_code: "TCS001", designation: "Assistant Professor", email_official: "rajesh.kumar@university.edu", contact_number: "+1-555-0201", is_active: true, joined_on: "2020-08-15" },
  { id: 2, department_id: 1, name: "Prof. Sarah Smith", employee_code: "TCS002", designation: "Associate Professor", email_official: "sarah.smith@university.edu", contact_number: "+1-555-0202", is_active: true, joined_on: "2018-06-20" },
  { id: 3, department_id: 1, name: "Dr. John Doe", employee_code: "TCS003", designation: "Assistant Professor", email_official: "john.doe@university.edu", contact_number: "+1-555-0203", is_active: true, joined_on: "2021-01-10" },
  { id: 5, department_id: 1, name: "Dr. Alan Turing", employee_code: "THOD001", designation: "HOD", email_official: "alan.turing@university.edu", contact_number: "+1-555-0205", is_active: true, joined_on: "2015-08-01" },
  { id: 6, department_id: 2, name: "Dr. Sarah Johnson", employee_code: "THOD002", designation: "HOD", email_official: "sarah.johnson@university.edu", contact_number: "+1-555-0206", is_active: true, joined_on: "2016-08-01" },
];

// ========== PROGRAM ==========
export const programs = [
  { id: 1, department_id: 1, name: "B.Tech", code: "BT", duration_year: 4, degree_type: "Undergraduate" },
  { id: 2, department_id: 1, name: "M.Tech", code: "MT", duration_year: 2, degree_type: "Postgraduate" },
  { id: 3, department_id: 2, name: "B.Tech Electronics", code: "BTE", duration_year: 4, degree_type: "Undergraduate" }
];

// ========== BRANCH ==========
export const branches = [
  { id: 1, program_id: 1, name: "Computer Science & Eng", code: "CSE" },
  { id: 2, program_id: 1, name: "Information Technology", code: "IT" },
  { id: 3, program_id: 3, name: "Electronics & Comm", code: "ECE" }
];

// ========== SEMESTER ==========
export const semesters = [
  { id: 1, program_id: 1, branch_id: 1, semester_number: 1, label: "B.Tech CSE - Semester 1" },
  { id: 2, program_id: 1, branch_id: 1, semester_number: 2, label: "B.Tech CSE - Semester 2" },
  { id: 3, program_id: 1, branch_id: 1, semester_number: 3, label: "B.Tech CSE - Semester 3" },
  { id: 4, program_id: 1, branch_id: 1, semester_number: 4, label: "B.Tech CSE - Semester 4" },
];

// ========== COURSE (from database) ==========
export const courses = [
  { id: 1, program_id: 1, branch_id: 1, semester_id: 1, code: "CS101", title: "Intro to Computer Science", credits: 4, contact_hour: 60 },
  { id: 2, program_id: 1, branch_id: 1, semester_id: 2, code: "CS201", title: "Data Structures", credits: 4, contact_hour: 60 },
  { id: 3, program_id: 1, branch_id: 1, semester_id: 3, code: "CS301", title: "Database Management", credits: 4, contact_hour: 60 },
  { id: 4, program_id: 1, branch_id: 1, semester_id: 4, code: "CS401", title: "Web Development", credits: 4, contact_hour: 60 },
];

// ========== COURSE_TEACHER (assigns teachers to courses) ==========
export const course_teacher = [
  { id: 1, course_id: 1, teacher_id: 1, section: "A", academic_year: "2026-2027" },
  { id: 2, course_id: 2, teacher_id: 1, section: "A", academic_year: "2026-2027" },
  { id: 3, course_id: 3, teacher_id: 2, section: "B", academic_year: "2026-2027" },
  { id: 4, course_id: 3, teacher_id: 1, section: "A", academic_year: "2026-2027" },
];

// ========== TEMPLATE (from database) ==========
export const templates = [
  {
    id: 1,
    department_id: 1,
    name: "Course Syllabus Template",
    description: "Standard course syllabus structure",
    structure: ["Course Outcomes", "Weekly Plan", "Textbooks & References", "Assessment Methods"],
    checklist: ["Syllabus approved", "Materials compiled"],
    created_by: 5
  },
  {
    id: 2,
    department_id: 1,
    name: "Lab Manual Structure",
    description: "Laboratory manual format",
    structure: ["Objective", "Equipment", "Procedure", "Expected Results", "Precautions"],
    checklist: ["Safety guidelines", "Equipment list verified"],
    created_by: 5
  },
  {
    id: 3,
    department_id: 1,
    name: "Exam Paper Format",
    description: "Question paper structure",
    structure: ["Section A", "Section B", "Section C", "Marking Scheme"],
    checklist: ["Questions verified", "Answers prepared"],
    created_by: 5
  }
];

// ========== COURSE_FILE (master file record) ==========
export const course_files = [
  { id: 1, course_id: 1, academic_year: "2026-2027", created_by: 1, status: "DRAFT", created_at: "2026-11-20" },
  { id: 2, course_id: 2, academic_year: "2026-2027", created_by: 1, status: "SUBMITTED", created_at: "2026-11-22" },
  { id: 3, course_id: 3, academic_year: "2026-2027", created_by: 2, status: "APPROVED", created_at: "2026-11-21" },
];

// ========== HEADING (tree structure for course file) ==========
// This maps to course_files[0] - CS101 Course File
export const headings = [
  { id: 1, course_file_id: 1, parent_heading_id: null, title: "Unit 1: Introduction", order_index: 1 },
  { id: 2, course_file_id: 1, parent_heading_id: 1, title: "Heading: Computer Basics", order_index: 1 },
  { id: 3, course_file_id: 1, parent_heading_id: 2, title: "Sub Heading: History of Computing", order_index: 1 },
  { id: 4, course_file_id: 1, parent_heading_id: 2, title: "Sub Heading: Components of Computer", order_index: 2 },
  { id: 5, course_file_id: 1, parent_heading_id: 1, title: "Heading: Software Concepts", order_index: 2 },
  { id: 6, course_file_id: 1, parent_heading_id: null, title: "Unit 2: Fundamentals", order_index: 2 },
];

// ========== DOCUMENT (files attached to headings) ==========
export const documents = [
  { id: 1, heading_id: 3, uploaded_by: 1, file_name: "Computing_History.pdf", file_path: "/uploads/doc1.pdf", type: "pdf", file_size: 2400000, version_no: 1, uploaded_at: "2026-11-20" },
  { id: 2, heading_id: 3, uploaded_by: 1, file_name: "History_Notes_v2.pdf", file_path: "/uploads/doc2.pdf", type: "pdf", file_size: 2600000, version_no: 2, uploaded_at: "2026-11-21" },
  { id: 3, heading_id: 4, uploaded_by: 1, file_name: "Computer_Components.pptx", file_path: "/uploads/doc3.pptx", type: "pptx", file_size: 5200000, version_no: 1, uploaded_at: "2026-11-20" },
  { id: 4, heading_id: 2, uploaded_by: 1, file_name: "Overview.docx", file_path: "/uploads/doc4.docx", type: "docx", file_size: 1800000, version_no: 1, uploaded_at: "2026-11-22" },
];

// ========== APPROVAL WORKFLOW ==========
export const approvals = [
  { id: 1, course_file_id: 2, approver_id: 5, stage: "HOD", status: "PENDING", comment: "Please verify all documents", acted_at: "2026-11-22" },
  { id: 2, course_file_id: 3, approver_id: 5, stage: "HOD", status: "APPROVED", comment: "Looks good", acted_at: "2026-11-21" },
];

// ========== NOTIFICATION ==========
export const notifications = [
  { id: 1, user_id: 1, type: "FILE_UPLOADED", payload: { file_name: "Computing_History.pdf", heading_id: 3, course_id: 1 }, is_read: false, created_at: "2026-11-22 10:30" },
  { id: 2, user_id: 1, type: "FILE_APPROVED", payload: { course_file_id: 3, approver_name: "Dr. Alan Turing" }, is_read: false, created_at: "2026-11-21 15:45" },
  { id: 3, user_id: 1, type: "COMMENT_ADDED", payload: { comment_id: 10, on_document: "Computing_History.pdf" }, is_read: true, created_at: "2026-11-20 09:15" },
];

// ========== ACTIVITY LOG ==========
export const activity_logs = [
  { id: 1, actor_id: 1, action: "HEADING_CREATED", target_type: "Heading", target_id: 3, details: { title: "Sub Heading: History of Computing" }, created_at: "2026-11-20 08:00" },
  { id: 2, actor_id: 1, action: "DOCUMENT_UPLOADED", target_type: "Document", target_id: 1, details: { file_name: "Computing_History.pdf", heading_id: 3 }, created_at: "2026-11-20 09:30" },
  { id: 3, actor_id: 1, action: "COURSE_FILE_SUBMITTED", target_type: "Course_File", target_id: 2, details: { course_id: 2, status: "SUBMITTED" }, created_at: "2026-11-22 11:00" },
  { id: 4, actor_id: 5, action: "APPROVAL_GIVEN", target_type: "Approval", target_id: 2, details: { course_file_id: 3, stage: "HOD", status: "APPROVED" }, created_at: "2026-11-21 14:30" },
];

// ========== COMMENT ==========
export const comments = [
  { id: 1, course_file_id: 1, heading_id: 3, document_id: 1, author_id: 5, text: "Please add more details about the origins of computing.", parent_comment_id: null, is_received: false, created_at: "2026-11-20 10:15" },
  { id: 2, course_file_id: 1, heading_id: 3, document_id: 1, author_id: 1, text: "I will update the document with more information.", parent_comment_id: 1, is_received: true, created_at: "2026-11-20 11:00" },
];

// ========== LEGACY FILES (for backward compatibility) ==========
export const files = [
  { id: 1, name: "Syllabus.pdf", type: "pdf", size: "2.4 MB", date: "2026-08-15", course: "CS101", tags: ["Important", "Admin"], version: 1.2, status: "Approved" },
  { id: 2, name: "Lecture 1 - Intro.pptx", type: "pptx", size: "15.8 MB", date: "2026-08-20", course: "CS101", tags: ["Lecture"], version: 1.0, status: "Approved" },
  { id: 3, name: "Project_Guidelines.docx", type: "docx", size: "450 KB", date: "2026-09-01", course: "CS101", tags: ["Project"], version: 2.1, status: "Pending" },
  { id: 4, name: "Dataset.csv", type: "csv", size: "5.2 MB", date: "2026-09-05", course: "MATH301", tags: ["Data"], version: 1.0, status: "Approved" },
  { id: 5, name: "Midterm_Review.pdf", type: "pdf", size: "1.1 MB", date: "2026-10-10", course: "MATH301", tags: ["Exam"], version: 1.1, status: "Rejected" },
];

export const sidebarItems = [
  // Use relative paths so Sidebar works inside /teacher and /subject-head layouts
  // Base items (always visible)
  { icon: Home, label: "Dashboard", href: "dashboard", requiredPermission: null },
  { icon: BookOpen, label: "My Courses", href: "courses", requiredPermission: null },
  // Permission-gated items
  { icon: FileText, label: "Course Files", href: "files", requiredPermission: "create_course_file" },
  { icon: UploadCloud, label: "Templates", href: "template-selection", requiredPermission: "create_course_file" },
  { icon: Shield, label: "Approvals", href: "approvals", requiredPermission: "approve_file" },
  { icon: User, label: "Faculty List", href: "faculty-list", requiredPermission: "manage_dept" },
  { icon: Plus, label: "Add Course", href: "add-course", requiredPermission: "manage_dept" },
  { icon: FileText, label: "Assign Course", href: "assign-course", requiredPermission: "manage_dept" },
  { icon: BarChart2, label: "Reports", href: "reports", requiredPermission: null },
  // Always visible
  { icon: MessageSquare, label: "Comments", href: "comments", requiredPermission: null },
  { icon: Settings, label: "Settings", href: "settings", requiredPermission: null },
];

// --- HOD DATA ---
export const hodStats = [
  { label: "Dept. Teachers", value: "18", change: "Computer Science", icon: User, color: "text-purple-600" },
  { label: "Pending Approvals", value: "7", change: "Requires review", icon: Shield, color: "text-orange-600" },
  { label: "Dept. Courses", value: "42", change: "Total active", icon: BookOpen, color: "text-blue-500" },
  { label: "Dept. Activity", value: "89%", change: "Weekly engagement", icon: BarChart2, color: "text-green-600" },
];

export const pendingApprovals = [
  { id: 101, teacher_id: 1, course_file_id: 2, course_code: "CS201", course_title: "Data Structures", stage: "HOD", status: "PENDING", submitted_date: "2026-11-22" },
  { id: 102, teacher_id: 1, course_file_id: 1, course_code: "CS101", course_title: "Intro to Computer Science", stage: "HOD", status: "PENDING", submitted_date: "2026-11-21" },
];

export const teacherPerformance = [
  { id: 1, teacher_id: 1, name: "Dr. Rajesh Kumar", courses: 3, uploads: 45, rating: 4.8, status: "Excellent" },
  { id: 2, teacher_id: 2, name: "Prof. Sarah Smith", courses: 2, uploads: 28, rating: 4.5, status: "Good" },
];

export const hodSidebarItems = [
  { icon: BarChart2, label: "Dept. Overview", href: "/hod/overview", requiredPermission: null },
  { icon: User, label: "Faculty-List", href: "/hod/department-faculty", requiredPermission: "manage_dept" },
  { icon: Plus, label: "ADD Course", href: "/hod/department-management", requiredPermission: "manage_dept" },
  { icon: FileText, label: "Assign-Course", href: "/hod/courses", requiredPermission: "manage_dept" },
  { icon: FileText, label: "Create Template", href: "/hod/templates", requiredPermission: null },
  { icon: Shield, label: "Executive Reviews", href: "/hod/executive-reviews", requiredPermission: "approve_file" },
  { icon: History, label: "Approved Records", href: "/hod/approved-records", requiredPermission: "approve_file" },
  { icon: MessageSquare, label: "Comments", href: "/hod/comments", requiredPermission: null },
  { icon: User, label: "Faculty Performance", href: "/hod/teachers", requiredPermission: "view_reports" },
  { icon: Calendar, label: "Dept. Calendar", href: "/hod/calendar", requiredPermission: null },
];

export const recentActivity = [
  { id: 1, user: "Dr. Rajesh Kumar", action: "uploaded", file: "Computing_History.pdf", course: "CS101", time: "2 hours ago" },
  { id: 2, user: "Prof. Sarah Smith", action: "submitted", file: "Course File - Data Structures", course: "CS201", time: "4 hours ago" },
];

export const auditLogs = [
  { id: 1, actor: "Dr. Rajesh Kumar (Teacher)", action: "DOCUMENT_UPLOADED", targetType: "Document", targetId: "Doc-1", details: "Computing_History.pdf uploaded", timestamp: "2026-11-22 10:30 AM" },
  { id: 2, actor: "Dr. Alan Turing (HOD)", action: "APPROVAL_GIVEN", targetType: "Approval", targetId: "Appr-2", details: "Course File Approved", timestamp: "2026-11-21 14:30 AM" },
];

export const calendarEvents = [
  { id: 1, title: "Mid-Semester Exams", date: "2026-12-10", type: "Exam" },
  { id: 2, title: "Course File Submission Deadline", date: "2026-12-05", type: "Deadline" },
];

export const kpiStats = [
  { label: "My Courses", value: "4", change: "Active this semester", icon: BookOpen, color: "text-blue-600" },
  { label: "Course Files", value: "3", change: "2 Pending Approval", icon: FileText, color: "text-indigo-600" },
  { label: "Documents Uploaded", value: "24", change: "+5 this week", icon: UploadCloud, color: "text-amber-500" },
  { label: "Notifications", value: "8", change: "3 unread", icon: MessageSquare, color: "text-emerald-600" },
];

// --- ADMIN DATA ---
export const adminSidebarItems = [
  { icon: Home, label: "Dashboard", href: "/admin", permission: "admin:dashboard" },
  { icon: Building, label: "Institutes", href: "/admin/institutes", permission: "admin:institutes" },
  { icon: Layers, label: "Departments", href: "/admin/departments", permission: "admin:departments" },
  { icon: BookOpen, label: "Programs & Courses", href: "/admin/programs", permission: "admin:courses" },
  { icon: User, label: "Users", href: "/admin/users", permission: "admin:users" },
  { icon: User, label: "Faculty", href: "/admin/faculty", permission: "admin:faculty" },
  { icon: Shield, label: "Roles", href: "/admin/roles", permission: "admin:roles" },

  { icon: MessageSquare, label: "Messages", href: "/admin/messages", permission: "admin:messages" },
  //{ icon: History, label: "Audit Logs", href: "/admin/audit-logs" },
  { icon: Settings, label: "System Settings", href: "/admin/settings", permission: "admin:settings" },
];

export const adminStats = [
  { label: "Total Users", value: "2,543", change: "+125 this week", icon: User, color: "text-blue-600" },
  { label: "Total Courses", value: "48", change: "+3 new courses", icon: BookOpen, color: "text-indigo-600" },
  { label: "Total Documents", value: "12,450", change: "+1.2k files", icon: FileText, color: "text-amber-500" },
  { label: "Storage Used", value: "450 GB", change: "45% of 1TB", icon: HardDrive, color: "text-emerald-600" },
];

export const users = [
  { id: 1, name: "Dr. Rajesh Kumar", email: "rajesh.kumar@university.edu", role: "Teacher", teacher_id: 1, status: "Active", joined: "2020-08-15" },
  { id: 2, name: "Dr. Alan Turing", email: "alan.turing@university.edu", role: "HOD", teacher_id: 5, status: "Active", joined: "2015-08-01" },
  { id: 3, name: "Sarah Connor", email: "s.connor@university.edu", role: "Admin", teacher_id: null, status: "Active", joined: "2025-01-10" },
];

export const roles = [
  { id: 1, name: "Admin", users: 3, permissions: ["all"] },
  { id: 2, name: "HOD", users: 12, permissions: ["approve_file", "manage_dept", "view_reports"] },
  { id: 3, name: "Teacher", users: 45, permissions: ["create_course_file", "upload_document", "submit_file"] },
];
