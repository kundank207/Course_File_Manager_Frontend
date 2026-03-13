import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KPICard } from "@/components/dashboard/KPICard";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/utils/authFetch";
import { Input } from "@/components/ui/input";
import { GlobalAnnouncement } from "@/components/GlobalAnnouncement";
import {
  BookOpen,
  ClipboardCheck,
  FileCheck,
  Clock,
  Eye,
  CheckCircle,
  ShieldAlert,
  RefreshCw,
  LayoutGrid,
  Calendar,
  Archive,
  Search
} from "lucide-react";

interface PendingReview {
  id: number;
  courseFileId: number;
  courseCode: string;
  courseTitle: string;
  teacherName: string;
  submittedDate: string;
  status: string;
  hasIncorrectFiles?: boolean;
}

interface AssignedCourse {
  id: number;
  courseFileId: number;
  courseCode: string;
  courseTitle: string;
  teacherName: string;
  academicYear: string;
  section: string;
  status: string;
}

interface DashboardStats {
  assignedCourses: number;
  pendingReviews: number;
  approvedFiles: number;
  withHod: number;
  totalFiles: number;
}

export default function SubjectHeadDashboardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [stats, setStats] = useState<DashboardStats>({
    assignedCourses: 0,
    pendingReviews: 0,
    approvedFiles: 0,
    withHod: 0,
    totalFiles: 0
  });
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Pending Reviews
      const res = await authFetch("/api/subject-head/pending-approvals");
      if (res.ok) {
        const data = await res.json();
        setPendingReviews(Array.isArray(data) ? data : []);
      }

      // 2. Stats
      const statsRes = await authFetch("/api/subject-head/overview");
      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(prev => ({
          ...prev,
          approvedFiles: d.approvedFiles || 0,
          withHod: d.withHod || 0,
          totalFiles: d.totalFiles || 0
        }));
      }

      // 3. Courses
      const coursesRes = await authFetch("/api/subject-head/assigned-courses");
      if (coursesRes.ok) {
        const courses = await coursesRes.json();
        setStats(prev => ({
          ...prev,
          assignedCourses: Array.isArray(courses) ? courses.length : 0,
          pendingReviews: Array.isArray(courses) ? courses.filter((c: any) => c.status === "SUBMITTED").length : 0
        }));
      }

    } catch (error) {
      console.error("Dashboard load error:", error);
      toast({
        title: "Communication Error",
        description: "Failed to synchronize dashboard metrics.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = pendingReviews.filter(review => {
    const matchesSearch =
      review.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.teacherName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || review.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDownloadArchive = async (courseFileId: number, courseCode: string) => {
    try {
      const res = await authFetch(`/api/archive/download/${courseFileId}`);
      if (res.ok) {
        toast({ title: "Generating Archive...", description: "Please wait..." });
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Archive_${courseCode}_${new Date().getTime()}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast({ title: "Archive Generated", description: "Course File ZIP is ready." });
      } else {
        toast({ title: "Access restricted", description: "You don't have permission to download this file.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <RefreshCw className="h-10 w-10 animate-spin text-blue-600" />
      <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-[10px]">Synchronizing Course Data...</p>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 p-2 lg:p-4 animate-in fade-in duration-500">
      <GlobalAnnouncement />
      {/* Header Section - Adaptive */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-[1.5rem] shadow-sm border border-slate-100">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Verification Dashboard</h1>
          <p className="text-slate-400 font-medium tracking-tight text-[11px] uppercase">Monitoring & Validation Hub • {pendingReviews.length} Tasks Pending</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadDashboardData} className="h-9 px-4 rounded-xl font-bold border-slate-200 text-[11px] hover:bg-slate-50 transition-all">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
          <Button onClick={() => navigate("/subject-head/courses")} className="h-9 bg-blue-600 hover:bg-blue-700 font-bold rounded-xl shadow-lg shadow-blue-100 px-5 text-[11px] transition-all active:scale-95">
            <LayoutGrid className="h-3.5 w-3.5 mr-2" /> Assigned Courses
          </Button>
        </div>
      </div>

      {/* KPI Grid - Responsive */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Total Courses" value={String(stats.assignedCourses)} change="Assigned for Review" icon={BookOpen} color="text-blue-600" />
        <KPICard label="Pending Verification" value={String(pendingReviews.length)} change="Awaiting Action" icon={Clock} color="text-orange-600" />
        <KPICard label="Approved & Forwarded" value={String(stats.approvedFiles)} change="Sent to HOD" icon={FileCheck} color="text-green-600" />
        <KPICard label="Awaiting HOD Sign-off" value={String(stats.withHod)} change="Pending HOD approval" icon={ShieldAlert} color="text-purple-600" />
      </div>

      <Card className="rounded-2xl shadow-xl border-slate-200 overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-slate-800">Verification Tasks</CardTitle>
                <CardDescription className="font-bold text-slate-400 uppercase text-[9px] tracking-widest mt-0.5">
                  Course files requiring verification
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  placeholder="Find faculty or course..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="h-9 pl-9 rounded-xl border-slate-200 bg-white text-xs focus:ring-blue-500/10 placeholder:text-slate-400"
                />
              </div>
              <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                <Button
                  variant={statusFilter === "ALL" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter("ALL")}
                  className="h-7 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider"
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "SUBMITTED" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter("SUBMITTED")}
                  className="h-7 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider"
                >
                  New
                </Button>
                <Button
                  variant={statusFilter === "RESUBMITTED" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter("RESUBMITTED")}
                  className="h-7 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider"
                >
                  Fixes
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredReviews.length === 0 ? (
            <div className="text-center py-20 bg-slate-50/5">
              <div className="h-14 w-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <p className="text-lg font-black text-slate-800">Operational Excellence!</p>
              <p className="text-slate-400 text-[11px] font-medium max-w-xs mx-auto mt-1 uppercase tracking-tight">
                {searchTerm ? "No tasks match your current search" : "All course files are processed and verified"}
              </p>
              {searchTerm && (
                <Button variant="link" size="sm" onClick={() => setSearchTerm("")} className="text-blue-600 font-bold text-xs mt-2">
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar scroll-smooth">
              <Table>
                <TableHeader className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-sm">
                  <TableRow className="hover:bg-transparent border-b border-slate-200">
                    <TableHead className="font-black text-slate-500 pl-6 py-3 uppercase text-[9px] tracking-widest bg-slate-50/50">Course Details</TableHead>
                    <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest bg-slate-50/50">Faculty Owner</TableHead>
                    <TableHead className="font-black text-slate-500 text-center uppercase text-[9px] tracking-widest bg-slate-50/50">Submission</TableHead>
                    <TableHead className="font-black text-slate-500 uppercase text-[9px] tracking-widest bg-slate-50/50">Details</TableHead>
                    <TableHead className="text-right pr-6 font-black text-slate-500 uppercase text-[9px] tracking-widest bg-slate-50/50">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review) => (
                    <TableRow key={review.id} className={`hover:bg-blue-50/20 transition-all border-b border-slate-100 group ${review.status === "RESUBMITTED" ? "bg-orange-50/10" : ""}`}>
                      <TableCell className="pl-6 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="font-black text-slate-900 leading-none group-hover:text-blue-600 transition-colors uppercase tracking-tighter">{review.courseCode}</span>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[200px]">{review.courseTitle}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-slate-700 tracking-tight">{review.teacherName}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-[10px] font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-full inline-block border border-slate-200">
                          {new Date(review.submittedDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] font-black uppercase bg-blue-50 text-blue-700 border-blue-200">
                            {review.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleDownloadArchive(review.courseFileId, review.courseCode)} className="text-slate-600 hover:text-blue-600 hover:bg-blue-50">
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button size="sm" onClick={() => navigate(`/subject-head/review/${review.courseFileId}`)} className="h-9 bg-slate-900 hover:bg-black text-white font-bold rounded-xl px-4 shadow-md transition-all active:scale-95 text-[11px]">
                            Start Verification
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
