import { useEffect, useState } from "react";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, FileText, Clock, Upload, Target, BookOpen, MessageSquare, UploadCloud, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/utils/authFetch";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { GlobalAnnouncement } from "@/components/GlobalAnnouncement";
import { cn } from "@/lib/utils";

/* =======================
   TYPES
======================= */

interface DashboardStats {
  myCourses: number;
  courseFiles: number;
  totalDocuments: number;
  notifications: number;
}

interface CourseCompletion {
  courseCode: string;
  courseTitle: string;
  progress: number;
}

interface ActivityItem {
  action: string;
  details: string;
  timestamp: string;
}

interface DailyUpload {
  day: string;
  count: number;
}

interface Deadline {
  id: number;
  title: string;
  description: string;
  date: string;
  type: string;
}
interface FlaggedItem {
  docId: number;
  fileName: string;
  status: string;
  feedback: string;
  courseFileId: number;
  courseCode: string;
  headingTitle: string;
  flaggedAt: string;
  flaggedBy?: string;
}

/* =======================
   COMPONENT
======================= */

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState<DashboardStats>({
    myCourses: 0,
    courseFiles: 0,
    totalDocuments: 0,
    notifications: 0,
  });

  const [courseCompletions, setCourseCompletions] = useState<CourseCompletion[]>([]);
  const [uploadActivity, setUploadActivity] = useState<DailyUpload[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [profile, setProfile] = useState<{ name: string, firstName: string, lastName: string } | null>(null);
  const [flaggedItems, setFlaggedItems] = useState<FlaggedItem[]>([]);
  const [loading, setLoading] = useState(true);

  /* =======================
     LOAD DATA
  ======================= */

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, actRes, recRes, progRes, profRes, deadRes, flagRes] = await Promise.all([
        authFetch("/api/teacher/dashboard/summary"),
        authFetch("/api/teacher/dashboard/upload-activity"),
        authFetch("/api/teacher/dashboard/recent-activity"),
        authFetch("/api/teacher/dashboard/course-progress"),
        authFetch("/api/profile"),
        authFetch("/api/calendar/upcoming"),
        authFetch("/api/teacher/dashboard/flagged-items")
      ]);

      if (sumRes.ok) setStats(await sumRes.json());
      if (actRes.ok) setUploadActivity(await actRes.json());
      if (recRes.ok) setRecentActivity(await recRes.json());
      if (progRes.ok) setCourseCompletions(await progRes.json());
      if (profRes.ok) setProfile(await profRes.json());
      if (deadRes.ok) setDeadlines(await deadRes.json());
      if (flagRes.ok) setFlaggedItems(await flagRes.json());

    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Some dashboard components failed to load");
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     KPI DATA
  ======================= */

  const kpiData = [
    {
      label: "My Courses",
      value: String(stats.myCourses),
      change: "Active this semester",
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10"
    },
    {
      label: "Course Files",
      value: String(stats.courseFiles),
      change: "Created by you",
      icon: FileText,
      color: "text-indigo-600",
      bgColor: "bg-indigo-500/10"
    },
    {
      label: "Documents",
      value: String(stats.totalDocuments),
      change: "Uploaded files",
      icon: UploadCloud,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    },
    {
      label: "Notifications",
      value: String(stats.notifications),
      change: "Unread alerts",
      icon: MessageSquare,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10"
    },
  ];

  /* =======================
     UI
  ======================= */

  if (loading) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Gathering your teaching stats...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <GlobalAnnouncement />
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {profile ? `Welcome, ${profile.firstName} ${profile.lastName}` : `Welcome!`}
          </h1>
          <p className="text-muted-foreground mt-1">
            Teacher Dashboard • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/teacher/template-selection">
            <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md hover:shadow-xl transition-all duration-300 border-none px-6">
              <Upload className="h-4 w-4 mr-2" />
              Quick Upload
            </Button>
          </Link>
          <Button variant="outline" onClick={loadDashboardData} className="hover:bg-muted">
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((stat) => (
          <KPICard key={stat.label} {...stat} />
        ))}
      </div>

      {/* MID SECTION */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Upload Activity Chart */}
        {/* Upload Activity Chart */}
        <Card className="shadow-sm border-muted/50 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold">Upload Activity</CardTitle>
              <CardDescription className="text-[10px]">Weekly distribution</CardDescription>
            </div>
            <Badge variant="secondary" className="font-normal text-[10px] h-5">This Week</Badge>
          </CardHeader>
          <CardContent className="pl-1 flex-1">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={uploadActivity}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                  <XAxis
                    dataKey="day"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={5}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dx={-5}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(59, 130, 246, 0.05)', radius: 6 }}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(8px)',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      padding: '8px',
                      fontSize: '11px'
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#barGradient)"
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Course File Completion */}
        <Card className="shadow-sm border-muted/50 flex flex-col">
          <CardHeader className="py-4">
            <CardTitle className="text-base font-bold">Course Progress</CardTitle>
            <CardDescription className="text-[10px]">Headings with doc uploads</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
              {courseCompletions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                  <Target className="h-10 w-10 text-muted/30" />
                  <p className="text-sm text-muted-foreground">No active course files found</p>
                </div>
              ) : (
                courseCompletions.map((course: any) => (
                  <div key={course.id || course.courseCode} className="space-y-2 p-2.5 rounded-lg border border-muted/30 bg-muted/5 group hover:bg-muted/10 transition-colors">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 uppercase tracking-tighter text-xs">{course.courseCode}</span>
                        <span className="text-[10px] text-muted-foreground truncate w-32">{course.courseTitle}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-blue-600 block">{course.progress}%</span>
                        <Badge variant="outline" className={cn(
                          "text-[8px] px-1 py-0 font-bold uppercase border-opacity-50 mt-0.5",
                          course.status === "APPROVED" ? "bg-green-50 text-green-700 border-green-200" :
                            course.status === "REJECTED" ? "bg-red-50 text-red-700 border-red-200" :
                              "bg-blue-50 text-blue-700 border-blue-200"
                        )}>
                          {course.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Progress value={course.progress} className="h-1 rounded-full" />
                    </div>

                    <div className="pt-1.5 border-t border-muted/50">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Stage:</span>
                        <span className="text-[9px] font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase italic truncate max-w-[100px]">
                          {course.currentLocation || "Draft"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines (Moved Up) */}
        <Card className="shadow-sm border-muted/50 bg-orange-50/30 dark:bg-orange-950/10 flex flex-col">
          <CardHeader className="py-4">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Clock className="h-4 w-4 text-orange-600" />
              Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
              {deadlines.length > 0 ? (
                deadlines.slice(0, 4).map((d) => (
                  <div key={d.id} className="p-2.5 bg-white dark:bg-background border rounded-lg shadow-sm space-y-1.5 border-l-4 border-l-orange-500">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[8px] uppercase font-bold text-orange-600 border-orange-200">
                        {d.type}
                      </Badge>
                      <span className="text-[9px] font-medium text-muted-foreground">
                        {new Date(d.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs font-bold truncate">{d.title}</p>
                    {d.description && <p className="text-[10px] text-muted-foreground line-clamp-1">{d.description}</p>}
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-xs text-muted-foreground font-medium italic">No upcoming deadlines.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BOTTOM SECTION */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Flags / Required Actions */}
        {flaggedItems.length > 0 && (
          <Card className="md:col-span-3 border-red-200 bg-red-50/30 overflow-hidden shadow-md">
            <CardHeader className="bg-red-100/50 py-3 border-b border-red-200">
              <CardTitle className="flex items-center gap-2 text-base text-red-800">
                <AlertCircle className="h-5 w-5 text-red-600 animate-bounce" />
                Required Actions (Flagged Items)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 divide-x divide-red-100">
                {flaggedItems.map((item) => (
                  <div key={item.docId} className="p-4 hover:bg-white transition-colors relative group">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="destructive" className="text-[9px] font-black uppercase tracking-tighter">
                        {item.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-[10px] text-red-400 font-bold">{item.courseCode}</span>
                    </div>
                    <p className="font-bold text-slate-800 text-sm mb-1 truncate">{item.fileName}</p>
                    <p className="text-[11px] text-red-600 font-semibold mb-3 line-clamp-2 bg-red-50 p-2 rounded-lg border border-red-100">
                      "{item.feedback}"
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="italic">Reviewer: {item.flaggedBy || "HOD"}</span>
                      <Link to={`/teacher/course-structure/${item.courseFileId}?docId=${item.docId}`}>
                        <Button size="sm" variant="link" className="h-auto p-0 text-red-700 font-black hover:underline uppercase text-[10px]">
                          Jump to Fix →
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card className="md:col-span-2 shadow-sm border-muted/50 flex flex-col">
          <CardHeader className="py-4">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Activity className="h-4 w-4 text-primary" />
              Recent Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {recentActivity.length > 0 ? (
                recentActivity.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-all border-l-2 border-transparent hover:border-primary group">
                    <div className="rounded-full bg-primary/10 p-2 mt-0.5 flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">
                        {log.action}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                        {log.details.replace(/[{}]/g, '').replace(/"message":/g, '').replace(/"/g, '')}
                      </p>
                    </div>
                    <div className="text-[9px] font-black text-slate-400 whitespace-nowrap bg-slate-100 px-2 py-0.5 rounded-full uppercase">
                      {formatDistanceToNow(new Date(log.timestamp))} ago
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-10 text-muted-foreground text-xs font-medium italic">No recent activity.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="shadow-sm border-muted/50 bg-primary/[0.02]">
          <CardHeader className="py-4">
            <CardTitle className="text-base font-bold">Shortcuts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            <Link to="/teacher/courses" className="block group">
              <Button variant="ghost" className="w-full h-10 justify-between hover:bg-white dark:hover:bg-background border border-transparent hover:border-border shadow-none">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                    <BookOpen className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-medium">Assignments</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/teacher/files" className="block group">
              <Button variant="ghost" className="w-full h-10 justify-between hover:bg-white dark:hover:bg-background border border-transparent hover:border-border shadow-none">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-medium">Manage Files</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/teacher/reports" className="block group">
              <Button variant="ghost" className="w-full h-10 justify-between hover:bg-white dark:hover:bg-background border border-transparent hover:border-border shadow-none">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Target className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-medium">Analytics</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
