import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Loader2, Calendar, Activity, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/utils/authFetch";
import { toast } from "sonner";
import { useState } from "react";

export default function AdminAuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: async () => {
      const res = await authFetch("/api/admin/dashboard/activity");
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    }
  });

  const parseDetails = (details: string) => {
    try {
      const parsed = typeof details === "string" ? JSON.parse(details) : details;
      return parsed.message || parsed.event || details;
    } catch (e) {
      return details;
    }
  };

  const filteredLogs = logs?.filter((log: any) =>
    log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportCSV = () => {
    try {
      if (!logs || logs.length === 0) {
        toast.error("No data available to export");
        return;
      }

      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Timestamp,Actor,Action,Details\n";

      logs.forEach((log: any) => {
        const row = [
          `"${log.timestamp}"`,
          `"${log.actor}"`,
          `"${log.action}"`,
          `"${parseDetails(log.details).replace(/"/g, '""')}"`
        ].join(",");
        csvContent += row + "\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `System_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Audit logs exported to CSV");
    } catch (err) {
      toast.error("Failed to export logs");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hydrating Audit Registry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest mb-3 border border-blue-100">
            <Activity size={12} className="text-blue-600" />
            Security Compliance
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white uppercase">System Audit Logs</h1>
          <p className="text-slate-500 font-medium mt-1">Surveillance registry for all administrative and user interactions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={exportCSV} className="h-12 px-6 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-widest transition-all hover:shadow-lg active:scale-95">
            <DownloadIcon className="mr-2 h-4 w-4" /> Export Registry
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-premium bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <Input
                className="h-12 pl-12 bg-slate-50/50 border-none rounded-xl font-medium text-sm focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-all placeholder:text-slate-300"
                placeholder="Search by actor, action or event keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="h-12 px-6 rounded-xl bg-slate-50 text-slate-500 border-none font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                <Filter size={14} /> Total Events: {filteredLogs?.length || 0}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/30 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-black text-slate-400 text-[10px] uppercase tracking-widest py-6 pl-8">Event Timeline</TableHead>
                  <TableHead className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Authority (Actor)</TableHead>
                  <TableHead className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Protocol (Action)</TableHead>
                  <TableHead className="font-black text-slate-400 text-[10px] uppercase tracking-widest pr-8">Context Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs && filteredLogs.length > 0 ? (
                  filteredLogs.map((log: any) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-all border-slate-100 dark:border-slate-800">
                      <TableCell className="pl-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600">
                            <Calendar size={14} />
                          </div>
                          <span className="text-[11px] font-bold text-slate-500 tabular-nums">{log.timestamp}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-300">
                            {log.actor.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{log.actor}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "px-3 py-1 rounded-lg font-bold text-[9px] uppercase tracking-widest border-none",
                          log.action?.includes("Deleted") || log.action?.includes("Terminated") ? "bg-rose-50 text-rose-600" :
                            log.action?.includes("Approved") || log.action?.includes("Authorized") ? "bg-emerald-50 text-emerald-600" :
                              "bg-indigo-50 text-indigo-600"
                        )}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-8">
                        <div className="max-w-[450px]">
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50/50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100/50 dark:border-slate-700 italic">
                            {parseDetails(log.details)}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                          <Activity className="h-6 w-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching registry entries</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DownloadIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  )
}
