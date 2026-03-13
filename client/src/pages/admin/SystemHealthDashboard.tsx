
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, BarChart, Bar } from 'recharts';
import { Download, Database, Users, Server, Activity, ArrowLeft, Calendar, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api/adminApi";
import { formatBytes } from "@/lib/utils";
import { Link } from "react-router-dom";

const COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

export default function SystemHealthDashboard() {
    const { data: health, isLoading: healthLoading } = useQuery({
        queryKey: ['adminHealth'],
        queryFn: adminApi.getSystemHealth
    });

    const { data: details, isLoading: detailsLoading } = useQuery({
        queryKey: ['adminHealthDetails'],
        queryFn: adminApi.getDetailedHealth
    });

    if (healthLoading || detailsLoading) return <div className="p-8 text-center text-muted-foreground">Loading system diagnostics...</div>;

    // Convert growth map to chart array
    const growthData = details?.userGrowthData ? Object.entries(details.userGrowthData).map(([name, uploads]) => ({ name, uploads })) : [];

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/admin/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">System Health & Diagnostics</h1>
                        <p className="text-muted-foreground mt-1">Real-time performance metrics and system analysis.</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => adminApi.exportCSV()}>
                        <Download className="h-4 w-4 mr-2" /> Export CSV
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => adminApi.exportPDF()}>
                        <Download className="h-4 w-4 mr-2" /> Generate PDF Report
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
                            <Database className="h-4 w-4" /> Database
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{health?.database === 'UP' ? 'Connected' : 'Offline'}</div>
                        <p className="text-xs text-muted-foreground mt-1">Status: {health?.database}</p>
                    </CardContent>
                </Card>

                <Card className="bg-green-50/50 dark:bg-green-950/10 border-green-100 dark:border-green-900">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                            <Users className="h-4 w-4" /> User Base
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{health?.activeUsers} / {health?.totalUsers}</div>
                        <p className="text-xs text-muted-foreground mt-1">Active / Total registered</p>
                    </CardContent>
                </Card>

                <Card className="bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
                            <Server className="h-4 w-4" /> Storage Usage
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{health?.storageUsagePercent}%</div>
                        <div className="w-full bg-amber-200 dark:bg-amber-900/40 rounded-full h-1.5 mt-2">
                            <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: `${health?.storageUsagePercent}%` }}></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={health?.database === 'UP' ? "bg-purple-50/50 dark:bg-purple-950/10 border-purple-100 dark:border-purple-900" : "bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900"}>
                    <CardHeader className="pb-2">
                        <CardTitle className={health?.database === 'UP' ? "text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center gap-2" : "text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2"}>
                            <Activity className="h-4 w-4" /> Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{health?.database === 'UP' ? 'Optimized' : 'Degraded'}</div>
                        <p className="text-xs text-muted-foreground mt-1">{health?.database === 'UP' ? 'System operating within normal parameters' : 'Connectivity issues detected'}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Registration & Activity Growth</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={growthData}>
                                <defs>
                                    <linearGradient id="growthBarGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#2563eb" stopOpacity={1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(59, 130, 246, 0.05)', radius: 8 }}
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                        backdropFilter: 'blur(8px)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Bar
                                    dataKey="uploads"
                                    fill="url(#growthBarGradient)"
                                    radius={[6, 6, 0, 0]}
                                    barSize={40}
                                    animationDuration={1500}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Content Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={details?.fileTypeDistribution || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={105}
                                    dataKey="value"
                                    nameKey="name"
                                    paddingAngle={8}
                                    stroke="none"
                                    animationDuration={1500}
                                >
                                    {(details?.fileTypeDistribution || []).map((_: any, index: number) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
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
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-premium bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
                <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
                                <Activity className="h-5 w-5 text-blue-600" />
                                Immutable Audit Ledger
                            </CardTitle>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-[0.2em]">Real-time Cryptographic System Surveillance</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="h-8 px-4 border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50/50">
                                Global Events: {details?.recentSystemActivities?.length || 0}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="max-h-[600px] overflow-y-auto custom-scrollbar p-0">
                        <div className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
                            {(() => {
                                const activities = details?.recentSystemActivities || [];
                                if (activities.length === 0) {
                                    return (
                                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                                            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                <Activity className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-widest">No Protocol Logs Detected</p>
                                        </div>
                                    );
                                }

                                // Group by date for professional look
                                const groups: Record<string, any[]> = {};
                                activities.forEach((a: any) => {
                                    const dateObj = new Date(a.createdAt);
                                    const dateStr = dateObj.toLocaleDateString(undefined, {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    });
                                    if (!groups[dateStr]) groups[dateStr] = [];
                                    groups[dateStr].push(a);
                                });

                                return Object.entries(groups).map(([date, items]) => (
                                    <div key={date}>
                                        <div className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md px-8 py-3 border-y border-slate-100/50 dark:border-slate-800/50 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Calendar className="h-3 w-3" />
                                                {date}
                                            </span>
                                            <span className="text-[10px] font-bold text-blue-500/50 lowercase italic">{items.length} units</span>
                                        </div>
                                        <div className="p-4 md:p-8 space-y-4">
                                            {items.map((activity: any) => {
                                                const parsedDetails = (() => {
                                                    try {
                                                        const p = typeof activity.details === 'string' ? JSON.parse(activity.details) : activity.details;
                                                        return p.message || p.event || activity.details;
                                                    } catch (e) {
                                                        return activity.details;
                                                    }
                                                })();

                                                const getActionIcon = (action: string) => {
                                                    if (action.includes("Approved")) return <ShieldCheck className="text-emerald-500" size={14} />;
                                                    if (action.includes("Deleted") || action.includes("Rejected")) return <Trash2 className="text-rose-500" size={14} />;
                                                    if (action.includes("Registration")) return <UserPlus className="text-blue-500" size={14} />;
                                                    if (action.includes("Download")) return <Download className="text-indigo-500" size={14} />;
                                                    return <Activity className="text-slate-400" size={14} />;
                                                };

                                                return (
                                                    <div key={activity.id} className="group relative flex gap-6 p-4 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 border border-transparent hover:border-slate-100 dark:hover:border-slate-800/50 shadow-sm hover:shadow-lg hover:shadow-slate-100/50">
                                                        {/* Icon Box */}
                                                        <div className="mt-1 h-10 w-10 shrink-0 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all duration-500">
                                                            {getActionIcon(activity.action)}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                                                                <div className="flex flex-col gap-0.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight">
                                                                            {activity.action}
                                                                        </h4>
                                                                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-2 py-0 h-4 border-slate-200 dark:border-slate-700 text-slate-400">
                                                                            {activity.targetType}
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">By SYSTEM AUTHORITY</p>
                                                                </div>
                                                                <div className="flex flex-col md:items-end gap-0.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                    <span className="text-slate-800 dark:text-white tabular-nums">
                                                                        {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                                    </span>
                                                                    <span className="text-blue-500/60 lowercase italic">protocol verified</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-100/30 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-800/50 italic">
                                                                {parsedDetails}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
