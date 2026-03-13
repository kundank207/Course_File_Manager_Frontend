import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, FileText, Eye, RefreshCw, Send, RotateCcw, AlertCircle, ShieldAlert, GraduationCap, Calendar, UserCheck, Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { authFetch } from "@/utils/authFetch";
import { History, GitCompare } from "lucide-react";
import { VersionComparisonModal } from "@/components/VersionComparisonModal";
import { ChangeLogModal } from "@/components/ChangeLogModal";

interface PendingApproval {
  id: number;
  courseFileId: number;
  courseCode: string;
  courseTitle: string;
  teacherName: string;
  academicYear: string;
  section: string;
  status: string;
  forwardedBy?: string;
  forwardedAt?: string;
  subjectHeadComment?: string;
  hasIncorrectFiles?: boolean;
  versionCount?: number;
}

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MoreHorizontal, ExternalLink, Download, Clock, TrendingUp, Zap, BookOpen, CheckSquare } from "lucide-react";

export default function HodApprovalsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [comment, setComment] = useState("");

  // Feature modals
  const [comparisonFile, setComparisonFile] = useState<PendingApproval | null>(null);
  const [logFile, setLogFile] = useState<PendingApproval | null>(null);

  useEffect(() => { loadPendingApprovals(); }, []);

  const loadPendingApprovals = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/hod/pending-approvals");
      if (res.ok) {
        const data = await res.json();
        setApprovals(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadArchive = async (item: PendingApproval) => {
    try {
      toast({ title: "Generating Archive...", description: "Please wait while we prepare the portfolio ZIP." });
      const res = await authFetch(`/api/archive/download/${item.courseFileId}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Executive_Review_${item.courseCode}_${new Date().getTime()}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast({ title: "Archive Generated", description: "Portfolio ZIP is ready for review." });
      } else {
        toast({ title: "Access Restricted", description: "You don't have permission to download this file.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Download Failed", variant: "destructive" });
    }
  };

  const handleApprove = async () => {
    if (!selectedApproval) return;
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/hod/approvals/${selectedApproval.id}/approve`, {
        method: "POST",
        body: JSON.stringify({ comment: comment || "Final approval granted" }),
      });
      if (res.ok) {
        toast({ title: "Approved", description: "Portfolio finalized successfully." });
        setShowApproveDialog(false);
        loadPendingApprovals();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!selectedApproval || !comment.trim()) return;
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/hod/approvals/${selectedApproval.id}/return`, {
        method: "POST",
        body: JSON.stringify({ comment }),
      });
      if (res.ok) {
        toast({ title: "Returned", description: "Feedback sent to the faculty member." });
        setShowReturnDialog(false);
        loadPendingApprovals();
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <div className="relative">
        <div className="h-16 w-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <ShieldAlert className="h-6 w-6 text-indigo-600 animate-pulse" />
        </div>
      </div>
      <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">Decrypting Audit Feed...</p>
    </div>
  );

  const urgentCount = approvals.filter(a => a.hasIncorrectFiles).length;

  return (
    <div className="space-y-8 p-1">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Executive Vetting
          </h1>
          <p className="text-muted-foreground mt-1">High-level quality assurance for academic portfolios.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadPendingApprovals} className="rounded-xl border-2 px-6 font-bold text-slate-600 hover:bg-slate-50 border-slate-200 transition-all hover:-translate-y-0.5">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Feed
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Pending Vetting", value: approvals.length, icon: FileText, color: "indigo", bg: "bg-indigo-50", text: "text-indigo-600", desc: "Files in review" },
          { label: "High Risk Files", value: urgentCount, icon: ShieldAlert, color: "rose", bg: "bg-rose-50", text: "text-rose-600", desc: "Quality issues detected" },
          { label: "Audit Progress", value: "98.4%", icon: UserCheck, color: "emerald", bg: "bg-emerald-50", text: "text-emerald-600", desc: "Quarterly completion" },
        ].map((stat, i) => (
          <Card key={i} className="rounded-xl bg-white overflow-hidden group hover:shadow-md transition-all border border-slate-200">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-4 rounded-3xl", stat.bg, stat.text)}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-200">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.1em]">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
                  <span className="text-xs font-medium text-muted-foreground mb-1">{stat.desc}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-xl bg-white dark:bg-slate-900 overflow-hidden border border-slate-200">
        <CardHeader className="bg-slate-50/50 p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <CardTitle className="text-xl font-bold text-slate-800 tracking-tight">Active Review Queue</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground uppercase mt-0.5">Automated Quality Analysis Enabled</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {approvals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 bg-slate-50/20">
              <div className="relative mb-8">
                <div className="h-24 w-24 bg-emerald-50 rounded-full flex items-center justify-center animate-pulse">
                  <CheckCircle className="h-12 w-12 text-emerald-500" />
                </div>
                <div className="absolute -top-2 -right-2 h-10 w-10 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                  <Zap className="h-6 w-6 text-amber-500 fill-amber-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Queue is Clear!</h3>
              <p className="text-muted-foreground font-medium max-w-sm text-center">Every course portfolio has been audited and finalized.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-4 pl-6 text-xs font-bold uppercase text-slate-500 tracking-wider">Portfolio Context</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-slate-500 tracking-wider">Lead Instructor</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-slate-500 tracking-wider text-center">Reference</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-slate-500 tracking-wider">Timeline</TableHead>
                    <TableHead className="text-right pr-6 text-xs font-bold uppercase text-slate-500 tracking-wider">Verification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="border-t">
                  {approvals.map((item) => (
                    <TableRow key={item.id} className="group hover:bg-slate-50 transition-all border-b">
                      <TableCell className="py-5 pl-6">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-slate-900 leading-none flex items-center gap-2">
                              {item.courseCode}
                              {item.hasIncorrectFiles && (
                                <span className="h-5 w-5 rounded-full bg-rose-100 flex items-center justify-center animate-pulse">
                                  <AlertCircle className="h-3 w-3 text-rose-500" />
                                </span>
                              )}
                            </p>
                            <p className="text-xs font-medium text-muted-foreground truncate max-w-[200px] uppercase tracking-wider">{item.courseTitle}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-slate-50 shadow-sm">
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-[10px] font-black uppercase tracking-widest">
                              {item.teacherName?.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-bold text-slate-800 tracking-tight">{item.teacherName}</p>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                              Faculty <div className="h-1 w-1 rounded-full bg-emerald-500" /> Primary
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex flex-col gap-1 p-2 bg-slate-50 rounded-2xl border border-slate-100 min-w-[100px]">
                          <span className="text-xs font-bold text-slate-900 px-2 py-0.5">{item.academicYear}</span>
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Sec {item.section || "C"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-indigo-400" />
                            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Forwarded From SH</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground bg-slate-100/50 w-fit px-2 py-0.5 rounded-md mt-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-[10px] font-medium tracking-tight">
                              {item.forwardedAt ? new Date(item.forwardedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Pending Timestamp'}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end items-center gap-2">
                          <Button size="sm" className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-95" onClick={() => navigate(`/hod/review/${item.id}`)}>
                            Validate
                            <CheckSquare className="h-4 w-4 ml-2" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-100 text-slate-400">
                                <MoreHorizontal className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border border-slate-200 shadow-xl bg-white">
                              <DropdownMenuLabel className="text-xs font-bold uppercase text-muted-foreground py-2 px-3">Executive Actions</DropdownMenuLabel>
                              <DropdownMenuItem className="rounded-lg py-2 px-3 text-sm font-semibold text-slate-700 hover:bg-indigo-50 cursor-pointer" onClick={() => handleDownloadArchive(item)}>
                                <Download className="h-4 w-4 mr-3 text-indigo-500" /> Build ZIP Archive
                              </DropdownMenuItem>
                              <DropdownMenuItem className="rounded-lg py-2 px-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer" onClick={() => { setSelectedApproval(item); setShowReturnDialog(true); }}>
                                <RotateCcw className="h-4 w-4 mr-3" /> Flashback to SH
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1 bg-slate-100" />
                              <DropdownMenuLabel className="text-xs font-bold uppercase text-muted-foreground py-2 px-3">Insights</DropdownMenuLabel>
                              {item.versionCount && item.versionCount >= 2 && (
                                <DropdownMenuItem className="rounded-lg py-2 px-3 text-sm font-semibold text-amber-600 hover:bg-amber-50 cursor-pointer" onClick={() => setComparisonFile(item)}>
                                  <GitCompare className="h-4 w-4 mr-3" /> Diff Comparison
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="rounded-lg py-2 px-3 text-sm font-semibold text-purple-600 hover:bg-purple-50 cursor-pointer" onClick={() => setLogFile(item)}>
                                <History className="h-4 w-4 mr-3" /> Trace Activity
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1 bg-slate-100" />
                              <DropdownMenuItem className="rounded-lg py-2 px-3 text-sm font-semibold text-muted-foreground hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/hod/review/${item.id}`)}>
                                <ExternalLink className="h-4 w-4 mr-3" /> Open Detailed View
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="sm:max-w-md rounded-xl border border-slate-200 shadow-2xl">
          <DialogHeader><DialogTitle className="text-xl font-bold text-green-700 flex items-center gap-2"><CheckCircle className="h-5 w-5" /> Executive Validation</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <p className="text-sm font-semibold text-green-800">I confirm that this course portfolio meets all department quality standards and academic requirements.</p>
            </div>
            <div><Label className="text-xs font-bold text-muted-foreground uppercase">Closing Remarks</Label><Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Enter audit remarks..." className="mt-2 min-h-[100px] border-slate-200 focus:ring-green-500 rounded-lg" /></div>
          </div>
          <DialogFooter className="gap-2 sm:gap-1"><Button variant="ghost" onClick={() => setShowApproveDialog(false)} className="rounded-lg font-bold">Rescind</Button><Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 rounded-lg font-bold px-6 shadow-md transition-all active:scale-95" disabled={actionLoading}>Finalize Portfolio</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FEATURE MODALS */}
      {comparisonFile && (
        <VersionComparisonModal
          isOpen={!!comparisonFile}
          onClose={() => setComparisonFile(null)}
          courseFileId={comparisonFile.courseFileId}
          courseTitle={`${comparisonFile.courseCode} - ${comparisonFile.courseTitle}`}
        />
      )}
      {logFile && (
        <ChangeLogModal
          isOpen={!!logFile}
          onClose={() => setLogFile(null)}
          courseFileId={logFile.courseFileId}
          courseTitle={`${logFile.courseCode} - ${logFile.courseTitle}`}
        />
      )}
    </div>
  );
}
