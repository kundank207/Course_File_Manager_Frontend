import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { KPICard } from "@/components/dashboard/KPICard";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/utils/authFetch";
import { GlobalAnnouncement } from "@/components/GlobalAnnouncement";
import {
  getOverview,
  getFacultyPerformance,
  getWeeklyEngagement,
  getSubmissionHeatmap
} from "@/api/hodApi";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import {
  Clock,
  Trophy,
  Medal,
  Award,
  Zap,
  Target,
  FileCheck,
  LayoutGrid,
  ChevronRight,
  TrendingDown,
  Info,
  Shield,
  Star,
  TrendingUp,
  User,
  BookOpen,
  BarChart2
} from "lucide-react";

/* =======================
   TYPES
======================= */

interface DashboardStats {
  teacherCount: number;
  pendingApprovals: number;
  totalCourses: number;
  totalFiles: number;
  activityPercent: number;
}

interface PendingApproval {
  id: number;
  courseFileId: number;
  courseCode: string;
  courseTitle: string;
  teacherName: string;
  submittedDate: string;
  stage: string;
}

interface FacultyMember {
  id: number;
  name: string;
  email: string;
  role: string;
  designation: string;
  departmentName: string;
  totalUploads?: number;
}

/* =======================
   STATIC DATA FOR CHARTS
======================= */

const COLORS = ["#8b5cf6", "#6366f1", "#06b6d4", "#f43f5e", "#f59e0b"];

/* =======================
   COMPONENT
======================= */

export default function HodDashboardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { switchRole } = useAuth();

  const [stats, setStats] = useState<DashboardStats>({
    teacherCount: 0,
    pendingApprovals: 0,
    totalCourses: 0,
    totalFiles: 0,
    activityPercent: 0,
  });

  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [teachers, setTeachers] = useState<FacultyMember[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [engagementData, setEngagementData] = useState<any[]>([]);
  const [courseBreakdown, setCourseBreakdown] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);

  /* =======================
     LOAD DATA
  ======================= */

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [overview, performance, engagement, heatmap] = await Promise.all([
        getOverview(),
        getFacultyPerformance(),
        getWeeklyEngagement(),
        getSubmissionHeatmap()
      ]);

      // Set stats directly from overview/engagement
      setStats({
        teacherCount: overview.totalTeachers,
        totalCourses: overview.totalCourses,
        totalFiles: performance.reduce((acc: number, t: any) => acc + (t.totalUploads || 0), 0),
        pendingApprovals: overview.pendingApprovals,
        activityPercent: engagement.percentChange || overview.activityPercent || 0
      });

      setEngagementData(engagement.weeklyEngagementData || overview.weeklyEngagementData || []);
      setCourseBreakdown(overview.courseDistribution || []);
      setTeachers(performance || []);
      setHeatmapData(heatmap || []);

      try {
        const approvalsRes = await authFetch("/api/hod/pending-approvals");
        if (approvalsRes.ok) {
          const approvalsData = await approvalsRes.json();
          setPendingApprovals(Array.isArray(approvalsData) ? approvalsData : []);
        }
      } catch { }

    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load some dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     ROLE SWITCH HANDLER
  ======================= */

  const goToTeacherDashboard = () => {
    switchRole("TEACHER");
    navigate("/teacher/dashboard");
  };

  /* =======================
     CHART DATA
  ======================= */

  // handled via state from real API

  /* =======================
     KPI DATA
  ======================= */

  const kpiData = [
    {
      label: "Dept. Faculty",
      value: String(stats.teacherCount),
      change: "Faculty Command",
      icon: User,
      color: "text-purple-600",
      onClick: () => navigate("/hod/department-faculty"),
    },
    {
      label: "Executive Validation",
      value: String(stats.pendingApprovals),
      change: "Action Required",
      icon: Shield,
      color: "text-orange-600",
      onClick: () => navigate("/hod/executive-reviews"),
    },
    {
      label: "Department Courses",
      value: String(stats.totalCourses),
      change: "Active Inventory",
      icon: BookOpen,
      color: "text-blue-500",
      onClick: () => navigate("/hod/courses"),
    },
    {
      label: "Dept. Activity",
      value: stats.activityPercent + "%",
      change: "Weekly engagement",
      icon: BarChart2,
      color: "text-green-600",
      onClick: () => navigate("/hod/missing-coverage"),
    },
  ];


  /* =======================
     UI
  ======================= */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GlobalAnnouncement />
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-[1.5rem] shadow-sm border border-slate-100">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" /> Executive Command Center
          </h1>
          <p className="text-slate-400 font-medium tracking-tight text-[11px] uppercase">
            Strategize and oversee department course file compliance and faculty performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="h-9 bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-100 rounded-xl transition-all active:scale-95 text-xs px-5"
            onClick={() => navigate("/hod/executive-reviews")}
          >
            <Shield className="h-3.5 w-3.5 mr-2" />
            {stats.pendingApprovals > 0
              ? `Verification Needed (${stats.pendingApprovals})`
              : "Executive Validation"}
          </Button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((stat) => (
          <KPICard key={stat.label} {...stat} />
        ))}
      </div>

      {/* CHARTS */}
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Engagement Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Weekly Engagement
                <Badge variant={stats.activityPercent >= 0 ? "outline" : "destructive"}>
                  {stats.activityPercent >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
                  )}
                  {stats.activityPercent >= 0 ? "+" : ""}{stats.activityPercent}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={engagementData}>
                    <defs>
                      <linearGradient id="hodEngagementGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dx={-10}
                    />
                    <RechartsTooltip
                      cursor={{ fill: 'rgba(124, 58, 237, 0.05)', radius: 8 }}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Bar
                      dataKey="activity"
                      fill="url(#hodEngagementGradient)"
                      radius={[6, 6, 0, 0]}
                      barSize={32}
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Course Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Course Breakdown
                <span className="text-sm text-muted-foreground">
                  {stats.totalCourses} Courses
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={courseBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      dataKey="value"
                      paddingAngle={8}
                      stroke="none"
                      animationDuration={1500}
                    >
                      {(courseBreakdown || []).map((_, i) => (
                        <Cell
                          key={i}
                          fill={COLORS[i % COLORS.length]}
                          className="hover:opacity-80 transition-opacity cursor-pointer"
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      formatter={(value) => <span className="text-xs font-medium text-slate-600 uppercase tracking-tighter">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* UPDATED BOTTOM SECTION */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Performance Leaderboard instead of plain Faculty List */}
          <Card className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <CardHeader className="bg-slate-50/30 border-b p-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    Faculty Performance Leaderboard
                  </CardTitle>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-bold uppercase tracking-wider">Top contributing department faculty</p>
                </div>
                <Award className="h-8 w-8 text-slate-100" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {teachers.length === 0 ? (
                <p className="text-muted-foreground text-center py-10 italic">
                  Performance data gathering...
                </p>
              ) : (
                <div className="divide-y">
                  {[...teachers]
                    .sort((a, b) => (b.totalUploads || 0) - (a.totalUploads || 0))
                    .slice(0, 4)
                    .map((t, i) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm",
                            i === 0 ? "bg-amber-100 text-amber-600 border border-amber-200" :
                              i === 1 ? "bg-slate-100 text-slate-500 border border-slate-200" :
                                i === 2 ? "bg-orange-50 text-orange-600 border border-orange-100" :
                                  "bg-slate-50 text-slate-400"
                          )}>
                            {i === 0 ? <Medal className="h-5 w-5" /> : i + 1}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-none">{t.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold mt-1 tracking-wider">
                              {t.designation} • {t.totalUploads || 0} Artifacts
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${Math.min(((t.totalUploads || 0) / 20) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest">Activity Score</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              <div className="p-4 bg-slate-50 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-indigo-600 hover:text-indigo-700 font-bold hover:bg-indigo-50"
                  onClick={() => navigate("/hod/department-faculty")}
                >
                  Manage All Department Faculty
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Verification Queue instead of plain Pending Approvals */}
          <Card className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <CardHeader className="bg-slate-50/30 border-b p-6 pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-indigo-600" />
                    Course File Verification Queue
                  </CardTitle>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-bold uppercase tracking-wider">High priority executive approvals</p>
                </div>
                <Badge className="bg-rose-500 shadow-lg shadow-rose-100 border-none font-bold">
                  {pendingApprovals.length} Urgent
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="h-6 w-6 text-emerald-500" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Audit Status Clear</p>
                  <p className="text-[10px] text-muted-foreground mt-1 text-center max-w-[200px] mx-auto font-medium">No pending course files require your executive sign-off.</p>
                </div>
              ) : (
                pendingApprovals.slice(0, 4).map((a) => (
                  <div
                    key={a.id}
                    className="p-4 border rounded-xl hover:border-indigo-200 hover:bg-indigo-50/10 transition-all cursor-pointer group"
                    onClick={() => navigate(`/hod/review/${a.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{a.courseTitle}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[9px] font-black h-4 px-1 rounded-sm border-slate-200 text-slate-500 uppercase">{a.courseCode}</Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {a.submittedDate?.split("T")[0]}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))
              )}
              {pendingApprovals.length > 4 && (
                <Button
                  variant="outline"
                  className="w-full font-bold border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl"
                  onClick={() => navigate("/hod/executive-reviews")}
                >
                  Launch Review Portal
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* SUBMISSION HEATMAP Section (WOW Factor) */}
        <Card className="rounded-xl border border-slate-200 shadow-premium overflow-hidden">
          <CardHeader className="bg-slate-50/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-indigo-600" />
                  Submission Heatmap
                </CardTitle>
                <CardDescription className="text-xs">Visualizing daily department output intensity (Last 12 Weeks)</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground">Low</span>
                <div className="flex gap-1">
                  <div className="h-3 w-3 bg-slate-100 rounded-[2px]" />
                  <div className="h-3 w-3 bg-indigo-200 rounded-[2px]" />
                  <div className="h-3 w-3 bg-indigo-400 rounded-[2px]" />
                  <div className="h-3 w-3 bg-indigo-600 rounded-[2px]" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">Peak</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 overflow-x-auto">
            <div className="flex gap-1 min-w-[800px]">
              {Array.from({ length: 12 }).map((_, weekIndex) => (
                <div key={weekIndex} className="flex-1 flex flex-col gap-1">
                  <span className="text-[9px] text-muted-foreground mb-1 text-center font-bold">W{weekIndex + 1}</span>
                  {Array.from({ length: 7 }).map((_, dayIndex) => {
                    // Logic to find matching date in heatmapData
                    const date = new Date();
                    date.setDate(date.getDate() - (84 - (weekIndex * 7 + dayIndex)));
                    const dateStr = date.toISOString().split('T')[0];
                    const dayData = heatmapData.find(d => d.date === dateStr);
                    const count = dayData ? dayData.count : 0;

                    // Normalize intensity (0 to 1) based on some peak (e.g. 10)
                    const intensityValue = Math.min(count / 10, 1);

                    return (
                      <TooltipProvider key={dayIndex}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "h-8 rounded-[4px] border border-white/50 transition-all hover:scale-110 cursor-pointer",
                                intensityValue > 0.8 ? "bg-indigo-700" :
                                  intensityValue > 0.5 ? "bg-indigo-500" :
                                    intensityValue > 0.2 ? "bg-indigo-300" :
                                      intensityValue > 0 ? "bg-indigo-100" : "bg-slate-100"
                              )}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs font-bold">{date.toLocaleDateString()}</p>
                            <p className="text-[10px]">{count} Activities Recorded</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
