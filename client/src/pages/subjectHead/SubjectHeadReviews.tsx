import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/utils/authFetch";
import {
    Clock,
    Eye,
    Send,
    RotateCcw,
    FileCheck,
    RefreshCw,
    AlertCircle,
    Archive,
    History,
    GitCompare,
    User,
    Calendar,
    BookOpen,
    ArrowRight,
    Search,
    ChevronRight,
    Filter
} from "lucide-react";
import { VersionComparisonModal } from "@/components/VersionComparisonModal";
import { ChangeLogModal } from "@/components/ChangeLogModal";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PendingReview {
    id: number;
    courseFileId: number;
    courseCode: string;
    courseTitle: string;
    teacherName: string;
    academicYear: string;
    section: string;
    status: string;
    submittedDate: string;
    versionCount?: number;
    revisionNumber?: number;
}

export default function SubjectHeadReviewsPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Dialog states
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showReturnDialog, setShowReturnDialog] = useState(false);
    const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null);
    const [comment, setComment] = useState("");

    // Feature modals
    const [comparisonFile, setComparisonFile] = useState<PendingReview | null>(null);
    const [logFile, setLogFile] = useState<PendingReview | null>(null);

    useEffect(() => {
        loadPendingReviews();
    }, []);

    const loadPendingReviews = async () => {
        setLoading(true);
        try {
            const res = await authFetch("/api/subject-head/pending-approvals");
            if (res.ok) {
                const data = await res.json();
                setPendingReviews(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Failed to load pending reviews:", error);
            toast({
                title: "Error",
                description: "Failed to load pending reviews",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedReview) return;
        setActionLoading(true);
        try {
            const res = await authFetch(`/api/subject-head/approvals/${selectedReview.id}/approve`, {
                method: "POST",
                body: JSON.stringify({ comment: comment || "Forwarded to HOD for final approval" }),
            });

            if (res.ok) {
                toast({ title: "Success", description: "Course file forwarded to HOD" });
                setShowApproveDialog(false);
                setComment("");
                loadPendingReviews();
            } else {
                const error = await res.json();
                throw new Error(error.error || "Failed to approve");
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to approve course file",
                variant: "destructive",
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleReturn = async () => {
        if (!selectedReview) return;
        if (!comment.trim()) {
            toast({
                title: "Error",
                description: "Please provide a comment explaining the issues",
                variant: "destructive",
            });
            return;
        }

        setActionLoading(true);
        try {
            const res = await authFetch(`/api/subject-head/approvals/${selectedReview.id}/return`, {
                method: "POST",
                body: JSON.stringify({ comment }),
            });

            if (res.ok) {
                toast({ title: "Success", description: "Course file returned to teacher" });
                setShowReturnDialog(false);
                setComment("");
                loadPendingReviews();
            } else {
                const error = await res.json();
                throw new Error(error.error || "Failed to return");
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to return course file",
                variant: "destructive",
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDownloadArchive = async (review: PendingReview) => {
        try {
            const res = await authFetch(`/api/archive/download/${review.courseFileId}`);
            if (res.ok) {
                toast({ title: "Generating Archive...", description: "Please wait while we prepare your course file ZIP." });
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Archive_${review.courseCode}_${new Date().getTime()}.zip`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
                toast({ title: "Archive Generated", description: "Course File ZIP is ready." });
            } else {
                let errMsg = "You don't have permission to download this archive.";
                try {
                    const errData = await res.json();
                    if (errData && (errData.message || errData.error)) errMsg = errData.message || errData.error;
                } catch (e) { }
                toast({ title: "Access Denied", description: errMsg, variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Error", description: "Failed to generate archive", variant: "destructive" });
        }
    };

    const filteredReviews = pendingReviews.filter(review =>
        review.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="relative h-16 w-16">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
                    <RefreshCw className="absolute inset-0 m-auto h-6 w-6 text-blue-600 animate-pulse" />
                </div>
                <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Syncing Pending Reviews...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section with Statistics */}
            <div className="relative overflow-hidden bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12">
                    <FileCheck size={180} className="text-blue-600" />
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-widest mb-1 border border-blue-100 shadow-sm">
                            <Clock className="h-2.5 w-2.5" />
                            Faculty Submission Queue
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Course File Verification</h1>
                        <p className="text-slate-500 max-w-lg font-medium text-xs leading-relaxed">
                            Review submitted course files, verify document compliance, and sign off to forward for HOD approval.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-slate-50 border border-slate-100 p-2 rounded-2xl flex items-center gap-6 px-6 shadow-inner">
                            <div className="text-center">
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Queue Total</p>
                                <p className="text-2xl font-black text-slate-900 leading-tight">{pendingReviews.length}</p>
                            </div>
                            <div className="w-px h-8 bg-slate-200"></div>
                            <Button
                                onClick={loadPendingReviews}
                                size="sm"
                                variant="ghost"
                                className="h-10 w-10 p-0 rounded-xl hover:bg-white hover:shadow-md transition-all active:scale-95 text-blue-600"
                            >
                                <RefreshCw className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50/50 p-2 rounded-[2rem] border border-slate-100 backdrop-blur-sm">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                        placeholder="Search by course, code or teacher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-14 pl-14 pr-6 rounded-[1.5rem] border-none bg-white shadow-sm shadow-slate-200/50 focus-visible:ring-2 focus-visible:ring-blue-500/20 placeholder:text-slate-400 font-medium"
                    />
                </div>
                <div className="flex items-center gap-2 pr-2">
                    <Button variant="outline" className="h-14 w-14 p-0 rounded-[1.5rem] border-white bg-white shadow-sm text-slate-500">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            {filteredReviews.length === 0 ? (
                <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-[2.5rem] overflow-hidden">
                    <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="h-24 w-24 rounded-[2rem] bg-white border border-slate-100 flex items-center justify-center mb-6 shadow-xl shadow-slate-200/50">
                            <FileCheck className="h-12 w-12 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Workspace Clean!</h3>
                        <p className="text-slate-500 font-medium max-w-xs mx-auto">
                            {searchTerm ? "No pending reviews match your current search criteria." : "Excellent work. You have cleared all pending course file reviews."}
                        </p>
                        {searchTerm && (
                            <Button
                                variant="link"
                                className="mt-4 text-blue-600 font-bold"
                                onClick={() => setSearchTerm("")}
                            >
                                Clear Search
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredReviews.map((review) => (
                        <div
                            key={review.id}
                            className="group relative bg-white border border-slate-200 rounded-[2rem] p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50 hover:border-blue-200 hover:-translate-y-1 overflow-hidden"
                        >
                            {/* Accent Decoration */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                                {/* Left Side: Course Information */}
                                <div className="flex-1 flex gap-6 items-start">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md">
                                        <BookOpen size={20} />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[9px] font-black tracking-widest text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase border border-blue-100">
                                                {review.courseCode}
                                            </span>
                                            <Badge variant="outline" className="rounded-md border-slate-200 font-bold text-[9px] h-5 text-slate-500 uppercase">
                                                Rev {review.revisionNumber || 1}
                                            </Badge>
                                            <div className="h-1 w-1 rounded-full bg-slate-300 mx-0.5"></div>
                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                <Calendar className="h-2.5 w-2.5" />
                                                {review.academicYear} • Sec {review.section || "A"}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-black text-slate-900 group-hover:text-blue-700 transition-colors uppercase tracking-tight leading-none">
                                            {review.courseTitle}
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 pr-3 pl-1 py-0.5 rounded-full border border-slate-100">
                                                <div className="h-5 w-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[9px] font-black text-blue-600">
                                                    {review.teacherName.charAt(0)}
                                                </div>
                                                {review.teacherName}
                                            </div>
                                            <span className="text-slate-300 text-[10px]">|</span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                Date: {review.submittedDate ? new Date(review.submittedDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : "Unknown"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Actions Bar */}
                                <div className="flex flex-wrap items-center gap-3 xl:border-l xl:border-slate-100 xl:pl-8">
                                    <TooltipProvider>
                                        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-10 w-10 p-0 rounded-xl hover:bg-white hover:text-blue-600 hover:shadow-sm"
                                                        onClick={() => setLogFile(review)}
                                                    >
                                                        <History className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Detailed log history</TooltipContent>
                                            </Tooltip>

                                            {review.versionCount && review.versionCount >= 2 && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-10 w-10 p-0 rounded-xl hover:bg-white hover:text-orange-600 hover:shadow-sm"
                                                            onClick={() => setComparisonFile(review)}
                                                        >
                                                            <GitCompare className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Compare with previous versions</TooltipContent>
                                                </Tooltip>
                                            )}

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-10 w-10 p-0 rounded-xl hover:bg-white hover:text-slate-900 hover:shadow-sm"
                                                        onClick={() => handleDownloadArchive(review)}
                                                    >
                                                        <Archive className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Download full package (ZIP)</TooltipContent>
                                            </Tooltip>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => navigate(`/subject-head/review/${review.id}`)}
                                                className="h-10 px-4 rounded-xl border-slate-200 font-bold text-[11px] text-slate-700 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center gap-2 group/btn shadow-sm"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                Review Course File
                                                <ArrowRight className="h-2.5 w-2.5 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                                            </Button>

                                            <div className="flex gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                                                <Button
                                                    className="h-10 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[8px] tracking-widest shadow-md shadow-green-100 transition-all active:scale-95 flex items-center gap-1.5"
                                                    onClick={() => {
                                                        setSelectedReview(review);
                                                        setComment("");
                                                        setShowApproveDialog(true);
                                                    }}
                                                >
                                                    <Send className="h-2.5 w-2.5" />
                                                    Forward to Head
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    className="h-10 px-4 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-700 font-black uppercase text-[8px] tracking-widest transition-all active:scale-95 flex items-center gap-1.5"
                                                    onClick={() => {
                                                        setSelectedReview(review);
                                                        setComment("");
                                                        setShowReturnDialog(true);
                                                    }}
                                                >
                                                    <RotateCcw className="h-2.5 w-2.5" />
                                                    Request Corrections
                                                </Button>
                                            </div>
                                        </div>
                                    </TooltipProvider>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Approve Dialog - Redesigned */}
            <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <DialogContent className="sm:max-w-md rounded-[2rem] gap-0 p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-8 text-white relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Send size={100} />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black tracking-tight leading-tight">Forward to HOD</DialogTitle>
                        </DialogHeader>
                        <p className="text-white/80 text-sm mt-2 font-medium">Verified all documents? This will route the course file to the HOD for final systemic approval.</p>
                    </div>

                    <div className="p-8 space-y-6 bg-white">
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-emerald-600 shadow-sm">
                                <BookOpen size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Course Target</p>
                                <p className="font-bold text-slate-900">{selectedReview?.courseCode} - {selectedReview?.courseTitle}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Optional Feedback</label>
                            <Textarea
                                placeholder="Anything the HOD should know about this submission? (optional)..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="min-h-[100px] rounded-2xl border-slate-200 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 font-medium resize-none shadow-inner"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Button
                                className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-200 transition-all active:scale-95"
                                onClick={handleApprove}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Send className="h-4 w-4 mr-2" />
                                )}
                                Confirm Forwarding
                            </Button>
                            <Button variant="ghost" className="h-12 rounded-xl text-slate-400 font-bold" onClick={() => setShowApproveDialog(false)}>
                                Dismiss
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Return Dialog - Redesigned */}
            <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
                <DialogContent className="sm:max-w-md rounded-[2rem] gap-0 p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 p-8 text-white relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <RotateCcw size={100} />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black tracking-tight leading-tight">Return for Revision</DialogTitle>
                        </DialogHeader>
                        <p className="text-white/80 text-sm mt-2 font-medium">Found issues? Send this back to the teacher with specific instructions for fixing the course file.</p>
                    </div>

                    <div className="p-8 space-y-6 bg-white">
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-orange-600 shadow-sm">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignee</p>
                                <p className="font-bold text-slate-900">{selectedReview?.teacherName}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correction Notes (Required)</label>
                            <Textarea
                                placeholder="Be specific about what documents are missing or incorrect..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="min-h-[120px] rounded-2xl border-slate-200 focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 font-medium resize-none shadow-inner"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Button
                                className="h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest shadow-lg shadow-orange-100 transition-all active:scale-95"
                                onClick={handleReturn}
                                disabled={actionLoading || !comment.trim()}
                            >
                                {actionLoading ? (
                                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                )}
                                Return for Revision
                            </Button>
                            <Button variant="ghost" className="h-12 rounded-xl text-slate-400 font-bold" onClick={() => setShowReturnDialog(false)}>
                                Back to Queue
                            </Button>
                        </div>
                    </div>
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
            ) || null}
            {logFile && (
                <ChangeLogModal
                    isOpen={!!logFile}
                    onClose={() => setLogFile(null)}
                    courseFileId={logFile.courseFileId}
                    courseTitle={`${logFile.courseCode} - ${logFile.courseTitle}`}
                />
            ) || null}
        </div>
    );
}
