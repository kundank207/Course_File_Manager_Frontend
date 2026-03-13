import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2, Info } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { authFetch } from "@/utils/authFetch";
import { toast } from "sonner";

// STRICT COLOR RULES
const FILE_TYPE_COLORS = {
  "PDF": "#3B82F6",    // Blue
  "DOCX": "#10B981",   // Green
  "Images": "#0F766E", // Dark Teal
  "Other": "#FACC15"   // Yellow
};

interface MonthlyData {
  month: string;
  count: number;
}

interface FileTypeData {
  type: string;
  count: number;
}

interface CourseStat {
  courseCode: string;
  courseTitle: string;
  totalFiles: number;
}

export default function ReportsPage() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [fileTypeData, setFileTypeData] = useState<FileTypeData[]>([]);
  const [topCourses, setTopCourses] = useState<CourseStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [monthRes, typeRes, courseRes] = await Promise.all([
        authFetch("/api/teacher/reports/monthly-uploads"),
        authFetch("/api/teacher/reports/file-types"),
        authFetch("/api/teacher/reports/top-courses")
      ]);

      if (monthRes.ok) setMonthlyData(await monthRes.json());
      if (typeRes.ok) setFileTypeData(await typeRes.json());
      if (courseRes.ok) setTopCourses(await courseRes.json());

    } catch (error) {
      console.error("Failed to fetch teacher reports:", error);
      toast.error("Failed to load report analytics");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    try {
      const res = await authFetch("/api/teacher/reports/export/csv");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Teacher_Report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("CSV Exported successfully (Backend)");
        return;
      }

      let csvContent = "\uFEFFCSV Report\n\n";
      csvContent += "MONTHLY UPLOAD ACTIVITY\nMonth,Files Uploaded\n";
      monthlyData.forEach(m => csvContent += `${m.month},${m.count}\n`);
      csvContent += "\nFILE TYPE DISTRIBUTION\nType,Count\n";
      fileTypeData.forEach(t => csvContent += `${t.type},${t.count}\n`);
      csvContent += "\nCONTENT BY COURSE\nCourse Code,Course Title,Total Files\n";
      topCourses.forEach(c => csvContent += `${c.courseCode},${c.courseTitle},${c.totalFiles}\n`);

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.body.appendChild(document.createElement("a"));
      link.href = url;
      link.download = `Teacher_Report_Local_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      document.body.removeChild(link);
      toast.success("CSV Exported (Local)");
    } catch (err) {
      toast.error("Failed to export CSV");
    }
  };

  const exportPDF = async () => {
    try {
      toast.info("Generating professional PDF report...");
      const res = await authFetch("/api/teacher/reports/export/pdf");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Teacher_Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("PDF Generated successfully");
      } else {
        window.print();
      }
    } catch (err) {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Aggregating report data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 print:p-0">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Detailed performance and content metrics for your courses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} className="hover:bg-muted group">
            <Download className="mr-2 h-4 w-4 group-hover:translate-y-0.5 transition-transform" /> Export CSV
          </Button>
          <Button onClick={exportPDF} className="bg-primary hover:shadow-md transition-all">
            <FileText className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Uploads */}
        <Card className="shadow-none border-muted/70 bg-muted/5">
          <CardHeader>
            <CardTitle className="text-lg">Monthly Uploads</CardTitle>
            <CardDescription>Activity overview for the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <defs>
                    <linearGradient id="monthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                  <XAxis
                    dataKey="month"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(16, 185, 129, 0.05)', radius: 8 }}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#monthGradient)"
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* File Type Distribution */}
        <Card className="shadow-none border-muted/70 bg-muted/5">
          <CardHeader>
            <CardTitle className="text-lg">File Distribution</CardTitle>
            <CardDescription>Content type breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fileTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="count"
                    nameKey="type"
                    stroke="none"
                    animationDuration={1500}
                  >
                    {fileTypeData.map((entry) => (
                      <Cell
                        key={entry.type}
                        fill={FILE_TYPE_COLORS[entry.type as keyof typeof FILE_TYPE_COLORS] || "#e2e8f0"}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip
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

      {/* Top Courses */}
      <Card className="shadow-none border-muted/70">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">Top Courses by Content</CardTitle>
            <CardDescription>Sorted by total files uploaded</CardDescription>
          </div>
          <div className="bg-primary/10 text-primary p-2 rounded-full">
            <Info className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mt-2">
            {topCourses.length > 0 ? (
              topCourses.map((course, i) => (
                <div key={course.courseCode} className="flex items-center justify-between p-4 rounded-xl border border-muted hover:border-primary/30 transition-all hover:bg-primary/[0.01]">
                  <div className="flex items-center gap-5">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted font-bold text-xs text-muted-foreground">
                      {i + 1}
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-foreground leading-none">{course.courseTitle}</p>
                      <p className="text-[10px] text-muted-foreground tracking-widest uppercase font-semibold">{course.courseCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-bold text-foreground">{course.totalFiles}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Files</span>
                    </div>
                    <div className={`h-10 w-1 rounded-full ${i === 0 ? 'bg-primary' : 'bg-muted'}`} />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center text-muted-foreground border-2 border-dashed rounded-2xl border-muted/50">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>No content data available to report yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
