import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { authFetch } from "@/utils/authFetch";
import { toast } from "sonner";

// User specified colors
const FILE_TYPE_COLORS = {
    "PDF": "#3B82F6",
    "DOCX": "#10B981",
    "Images": "#0F766E",
    "Other": "#FACC15"
};

interface SummaryData {
    totalFiles: number;
    pendingFiles: number;
    approvedFiles: number;
    totalUploads: number;
}

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
    uploads: number;
}

export default function SubjectHeadReportsPage() {
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [fileTypeData, setFileTypeData] = useState<FileTypeData[]>([]);
    const [topCourses, setTopCourses] = useState<CourseStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sumRes, monthRes, typeRes, courseRes] = await Promise.all([
                authFetch("/api/reports/summary"),
                authFetch("/api/reports/monthly-uploads"),
                authFetch("/api/reports/file-types"),
                authFetch("/api/reports/top-courses")
            ]);

            if (sumRes.ok) setSummary(await sumRes.json());
            if (monthRes.ok) setMonthlyData(await monthRes.json());
            if (typeRes.ok) setFileTypeData(await typeRes.json());
            if (courseRes.ok) setTopCourses(await courseRes.json());

        } catch (error) {
            console.error("Failed to fetch report data:", error);
            toast.error("Failed to load analytics data");
        } finally {
            setLoading(false);
        }
    };

    const exportCSV = () => {
        try {
            let csvContent = "data:text/csv;charset=utf-8,";

            // Header
            csvContent += "Category,Key,Value\n";

            // Summary
            if (summary) {
                csvContent += `Summary,Total Files,${summary.totalFiles}\n`;
                csvContent += `Summary,Pending Review,${summary.pendingFiles}\n`;
                csvContent += `Summary,Total Uploads,${summary.totalUploads}\n`;
            }

            // Monthly
            monthlyData.forEach(m => {
                csvContent += `Monthly Uploads,${m.month},${m.count}\n`;
            });

            // File Types
            fileTypeData.forEach(t => {
                csvContent += `File Types,${t.type},${t.count}\n`;
            });

            // Courses
            topCourses.forEach(c => {
                csvContent += `Top Courses,${c.courseCode} - ${c.courseTitle},${c.uploads}\n`;
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `SubjectHead_Report_${new Date().toLocaleDateString()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("CSV Exported successfully");
        } catch (err) {
            toast.error("Failed to export CSV");
        }
    };

    const exportPDF = () => {
        toast.info("Preparing PDF... Please use Browser Print for best results.");
        setTimeout(() => {
            window.print();
        }, 500);
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Generating Report Data...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10 print:p-0">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
                <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={exportCSV}>
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                    <Button onClick={exportPDF}>
                        <FileText className="mr-2 h-4 w-4" /> Export PDF
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4 print:grid-cols-4">
                <Card className="bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900 shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Total Courses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-blue-700">{summary?.totalFiles || 0}</p>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900 shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Pending Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-amber-700">{summary?.pendingFiles || 0}</p>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900 shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Approved</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-emerald-700">{summary?.approvedFiles || 0}</p>
                    </CardContent>
                </Card>
                <Card className="bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900 shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Total Uploads</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-indigo-700">{summary?.totalUploads || 0}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Monthly Uploads</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData}>
                                    <defs>
                                        <linearGradient id="subjectHeadMonthGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#1e40af" stopOpacity={1} />
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
                                        cursor={{ fill: 'rgba(37, 99, 235, 0.05)', radius: 8 }}
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
                                        fill="url(#subjectHeadMonthGradient)"
                                        radius={[6, 6, 0, 0]}
                                        barSize={40}
                                        animationDuration={1500}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>File Types Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
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
                                                fill={FILE_TYPE_COLORS[entry.type as keyof typeof FILE_TYPE_COLORS] || "#cbd5e1"}
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

            <Card>
                <CardHeader>
                    <CardTitle>Top Courses by Content</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {topCourses.length > 0 ? (
                            topCourses.map((course, i) => (
                                <div key={course.courseCode} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-muted-foreground w-6 text-center">{i + 1}</span>
                                        <div>
                                            <p className="font-medium">{course.courseTitle}</p>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">{course.courseCode}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl font-bold text-primary">{course.uploads}</span>
                                        <span className="text-xs text-muted-foreground">files</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-10 text-center text-muted-foreground">
                                No course data available yet.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
