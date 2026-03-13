import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, BarChart, Bar, LabelList
} from 'recharts';
import {
  AlertCircle, TrendingUp, Users, Database, Settings,
  Activity, UserPlus, CheckCircle2, Download, Trash2,
  ShieldCheck, RefreshCw, Clock, ExternalLink, Megaphone,
  Zap, BarChart3, FilePieChart, LayoutDashboard, Globe
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/adminApi";
import { formatBytes, cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'];

// Mock Department Data for Compliance Chart
export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [announcement, setAnnouncement] = useState({ title: "", message: "" });
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: adminApi.getDashboardStats
  });

  const { data: growthData } = useQuery({
    queryKey: ['adminGrowth'],
    queryFn: adminApi.getGrowthStats
  });

  const { data: complianceStats, isLoading: complianceLoading, isError: complianceError } = useQuery({
    queryKey: ['adminCompliance'],
    queryFn: adminApi.getComplianceStats
  });

  const { data: activityLogs } = useQuery({
    queryKey: ['adminActivity'],
    queryFn: adminApi.getActivityLogs
  });

  const { data: distributionData } = useQuery({
    queryKey: ['adminDistribution'],
    queryFn: adminApi.getDistributionStats
  });

  const { data: healthData } = useQuery({
    queryKey: ['adminHealth'],
    queryFn: adminApi.getSystemHealth
  });

  const handleBroadcast = async () => {
    if (!announcement.title || !announcement.message) {
      toast({ title: "Validation Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    setIsBroadcasting(true);
    try {
      await adminApi.broadcastAnnouncement(announcement.title, announcement.message);
      toast({ title: "Broadcast Success", description: "Announcement sent to all users." });
      setAnnouncement({ title: "", message: "" });
      queryClient.invalidateQueries({ queryKey: ['adminActivity'] });
    } catch (error) {
      toast({ title: "Broadcast Failed", description: "Could not send announcement", variant: "destructive" });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const kpiStats = [
    { label: "Total Users", value: (stats?.totalUsers || 0).toString(), icon: Users, color: "blue" },
    { label: "Total Courses", value: (stats?.totalCourses || 0).toString(), icon: TrendingUp, color: "green" },
    { label: "Total Files", value: (stats?.totalDocuments || 0).toString(), icon: AlertCircle, color: "orange" },
    { label: "Storage Used", value: formatBytes(stats?.totalStorageUsed || 0), icon: Database, color: "purple" },
  ];

  if (statsLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      <p className="text-muted-foreground italic font-medium">Syncing with live system data...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">Central Operations</h1>
            <Badge variant="outline" className="h-6 bg-blue-50 text-blue-600 border-blue-100 text-[10px] uppercase font-black tracking-widest">
              Live Control
            </Badge>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Monitor performance hubs, system vitals, and institutional growth.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/settings">
            <Button size="lg" className="bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-2xl shadow-lg ring-4 ring-slate-100 dark:ring-blue-900/20">
              <Settings className="h-4 w-4 mr-2" />
              System Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* QUICK ACTIONS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Verify Users", icon: UserPlus, link: "/admin/users", color: "bg-emerald-50 text-emerald-600", desc: "Pending approvals" },
          { label: "Faculty Hub", icon: Users, link: "/admin/faculty", color: "bg-blue-50 text-blue-600", desc: "Manage staff" },
          { label: "Course Matrix", icon: LayoutDashboard, link: "/admin/programs", color: "bg-indigo-50 text-indigo-600", desc: "Academic setup" },
          { label: "Diagnostic", icon: Activity, link: "/admin/system-health", color: "bg-rose-50 text-rose-600", desc: "Health report" },
        ].map((action, i) => (
          <Link key={i} to={action.link}>
            <Card className="group border-none shadow-premium hover:shadow-xl transition-all duration-300 rounded-[1.5rem] cursor-pointer bg-white dark:bg-slate-900 overflow-hidden">
              <CardContent className="p-5">
                <div className={cn("p-2.5 rounded-xl w-fit mb-3 transition-transform group-hover:scale-110 group-hover:rotate-3", action.color)}>
                  <action.icon size={20} />
                </div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white mb-1">{action.label}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{action.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiStats.map((stat) => (
          <KPICard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN: Main Charts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* System Growth Area Chart */}
            <Card className="border-none shadow-premium bg-white dark:bg-slate-900 rounded-[2rem]">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                  Growth Matrix
                  <Zap className="h-4 w-4 text-amber-500" />
                </CardTitle>
                <CardDescription className="text-lg font-bold text-slate-800 dark:text-white mt-1">Institutional Expansion</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="h-[250px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={growthData || []} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.03} />
                      <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={10}
                        fontWeight={900}
                        tickLine={false}
                        axisLine={false}
                        dy={15}
                        tick={{ fill: '#64748b' }}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={10}
                        fontWeight={900}
                        tickLine={false}
                        axisLine={false}
                        dx={-5}
                        tick={{ fill: '#64748b' }}
                      />
                      <Tooltip
                        cursor={{ stroke: '#4f46e5', strokeWidth: 1, strokeDasharray: '4 4' }}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(12px)',
                          borderRadius: '20px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
                          padding: '12px'
                        }}
                        itemStyle={{ color: '#4f46e5', fontWeight: 900, fontSize: '13px' }}
                        labelStyle={{ fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}
                        formatter={(value: any) => [`${value} New Users`, "Growth"]}
                      />
                      <Area
                        type="natural"
                        dataKey="uploads"
                        stroke="#4f46e5"
                        strokeWidth={5}
                        fillOpacity={1}
                        fill="url(#colorGrowth)"
                        animationBegin={300}
                        animationDuration={3000}
                        animationEasing="ease-in-out"
                        activeDot={{
                          r: 8,
                          fill: '#4f46e5',
                          stroke: '#fff',
                          strokeWidth: 3,
                          className: "animate-pulse"
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Departmental Compliance Bar Chart */}
            <Card className="border-none shadow-premium bg-white dark:bg-slate-900 rounded-[2rem]">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                  Performance Hub
                  <BarChart3 className="h-4 w-4 text-emerald-500" />
                </CardTitle>
                <CardDescription className="text-lg font-bold text-slate-800 dark:text-white mt-1">Approval Compliance</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="h-[250px] w-full mt-4 flex items-center justify-center">
                  {complianceLoading ? (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Matrix...</span>
                    </div>
                  ) : complianceError ? (
                    <div className="flex flex-col items-center gap-2 text-rose-500 text-center">
                      <AlertCircle className="h-6 w-6" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Feed Sync Failed</span>
                    </div>
                  ) : complianceStats && complianceStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={complianceStats || []}
                        layout="vertical"
                        margin={{ left: 5, right: 60, top: 10, bottom: 10 }}
                        barGap={12}
                      >
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#34d399" />
                          </linearGradient>
                        </defs>
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="department"
                          type="category"
                          stroke="#64748b"
                          fontSize={10}
                          fontWeight={800}
                          axisLine={false}
                          tickLine={false}
                          width={100}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #f1f5f9',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                            backdropFilter: 'blur(8px)',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)'
                          }}
                          formatter={(value: any, name: any, props: any) => {
                            if (name === "approved") return [`${value} Files (${props.payload.percentage}%)`, "Approved"];
                            return [value, "In Queue"];
                          }}
                        />
                        <Bar
                          dataKey="approved"
                          fill="url(#barGradient)"
                          radius={[0, 100, 100, 0]}
                          barSize={22}
                          stackId="a"
                          animationDuration={2500}
                        >
                          <LabelList
                            dataKey="percentage"
                            position="right"
                            offset={15}
                            formatter={(v: any) => `${v}%`}
                            style={{ fill: '#059669', fontSize: '12px', fontWeight: '900' }}
                          />
                        </Bar>
                        <Bar
                          dataKey="pending"
                          fill="#f1f5f9"
                          radius={[0, 100, 100, 0]}
                          barSize={22}
                          stackId="a"
                          animationDuration={2500}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-300 text-center">
                      <Database className="h-8 w-8 mb-1" />
                      <span className="text-[10px] font-black uppercase tracking-widest">No Node Data Found</span>
                    </div>
                  )}
                </div>
                {complianceStats && complianceStats.length > 0 && (
                  <div className="flex items-center justify-center gap-6 mt-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200" />
                      <span className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">Approved</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-200" />
                      <span className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">In Queue</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Activity Logs Matched Design */}
          <Card className="border-none shadow-premium bg-white dark:bg-slate-900 rounded-[2rem]">
            <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  Live Audit Feed
                </CardTitle>
              </div>
              <Link to="/admin/activity">
                <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest hover:bg-slate-50">Archive Data</Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {activityLogs?.slice(0, 8).map((log: any) => (
                  <div key={log.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800 shadow-sm">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-blue-600 shadow-sm">
                      <Zap size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200">{log.action}</p>
                        <span className="text-[10px] font-bold text-slate-400 tabular-nums">{log.timestamp.split(' ')[1]}</span>
                      </div>
                      <p className="text-[10px] font-medium text-slate-500 truncate italic">By {log.actor} • System Verified</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Sidebar Content */}
        <div className="space-y-6">
          {/* GLOBAL ANNOUNCEMENT BOX - BROADCASTING */}
          <Card className="border-none shadow-premium bg-slate-900 text-white rounded-[2rem] overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Megaphone size={120} />
            </div>
            <CardHeader className="p-8 relative z-10">
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-blue-400">Broadcasting Hub</CardTitle>
              <CardDescription className="text-lg font-bold text-white mt-1">System-Wide Release</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 relative z-10 space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Message Title</label>
                  <Input
                    placeholder="E.g., Submission Deadline Update"
                    className="bg-white/10 border-white/5 text-white placeholder:text-white/30 rounded-xl h-11 focus:border-blue-500 focus:ring-0"
                    value={announcement.title}
                    onChange={e => setAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Announcement Content</label>
                  <Textarea
                    placeholder="Compose message for all faculty members..."
                    className="bg-white/10 border-white/5 text-white placeholder:text-white/30 rounded-xl min-h-[120px] focus:border-blue-500 focus:ring-0 resize-none"
                    value={announcement.message}
                    onChange={e => setAnnouncement(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>
                <Button
                  onClick={handleBroadcast}
                  disabled={isBroadcasting}
                  className="w-full bg-blue-600 hover:bg-blue-500 rounded-2xl h-12 font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-900/40"
                >
                  {isBroadcasting ? <RefreshCw className="animate-spin h-4 w-4" /> : <Globe className="h-4 w-4 mr-2" />}
                  Release To Live Environment
                </Button>
                <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-widest">
                  Caution: This will trigger real-time notifications for all users.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Infrastructure Health Sidebar */}
          <Card className="border-none shadow-premium bg-white dark:bg-slate-900 rounded-[2rem]">
            <CardHeader className="p-8">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Hardware Vitals</CardTitle>
              <CardDescription className="text-lg font-bold text-slate-800 dark:text-white mt-1">System Integrity</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database size={16} className="text-emerald-600" />
                    <span className="text-xs font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-tight">Database Grid</span>
                  </div>
                  <Badge className="bg-emerald-600 text-white border-none text-[8px] font-black uppercase">Online</Badge>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Clock size={16} className="text-blue-600" />
                      <span className="text-xs font-black text-blue-900 dark:text-blue-400 uppercase tracking-tight">Storage Flux</span>
                    </div>
                    <span className="text-[10px] font-black text-blue-600">{healthData?.storageUsagePercent || 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${healthData?.storageUsagePercent || 0}%` }} />
                  </div>
                </div>
              </div>
              <Link to="/admin/system-health" className="block mt-4">
                <Button variant="outline" className="w-full border-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-slate-800 transition-colors">
                  Detailed Diagnostics
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
