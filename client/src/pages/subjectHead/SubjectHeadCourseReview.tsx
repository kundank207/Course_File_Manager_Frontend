import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/utils/authFetch";
import { FileViewerModal } from "@/components/FileViewerModal";
import {
    ArrowLeft,
    FileText,
    XCircle,
    Send,
    FolderOpen,
    RefreshCw,
    LayoutGrid,
    MessageSquare,
    CheckCircle2,
    Clock,
    User,
    ShieldCheck,
} from "lucide-react";
import { EnhancedCourseFileView } from "@/components/EnhancedCourseFileView";
import { InlineCommentDialog } from "@/components/InlineCommentDialog";
import { safeToLocaleDateString } from "@/utils/dateUtils";
import { CourseFileTree, HeadingNode, DocumentItem } from "@/components/CourseFileTree";

/* =======================
   TYPES
======================= */

interface CourseFileDetails {
    id: number;
    courseCode: string;
    courseTitle: string;
    teacherName: string;
    academicYear: string;
    status: string;
    submittedDate: string;
    section: string;
}

/* =======================
   COMPONENT
======================= */

export default function SubjectHeadCourseReviewPage() {
    const { courseFileId } = useParams<{ courseFileId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [courseFile, setCourseFile] = useState<CourseFileDetails | null>(null);
    const [headings, setHeadings] = useState<HeadingNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedHeadings, setExpandedHeadings] = useState<Set<number>>(new Set());

    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showEnhancedView, setShowEnhancedView] = useState(false);
    const [smartAuditMode, setSmartAuditMode] = useState(false);

    // Comment dialog state
    const [commentTarget, setCommentTarget] = useState<{
        headingId?: number;
        documentId?: number;
        headingTitle?: string;
        fileName?: string;
    } | null>(null);

    // File viewer
    const [viewingFile, setViewingFile] = useState<{ id: number; name: string } | null>(null);

    /* =======================
       LOAD DATA
    ======================= */

    useEffect(() => {
        if (courseFileId) {
            loadCourseFileData(parseInt(courseFileId));
        }
    }, [courseFileId]);

    const loadCourseFileData = async (id: number) => {
        setLoading(true);
        try {
            const statusRes = await authFetch(`/api/review/course-file/${id}`);
            if (statusRes.ok) {
                const data = await statusRes.json();
                setCourseFile({
                    id: data.id,
                    courseCode: data.courseCode || "",
                    courseTitle: data.courseTitle || "",
                    teacherName: data.teacherName || "",
                    academicYear: data.academicYear || "",
                    status: data.status || "PENDING",
                    submittedDate: data.submittedDate || "",
                    section: data.section || "",
                });
            }

            const treeRes = await authFetch(`/api/review/course-file/${id}/tree`);
            if (treeRes.ok) {
                const tree = await treeRes.json();
                setHeadings(tree || []);
                const allIds = new Set<number>();
                const collectIds = (items: HeadingNode[]) => {
                    items.forEach(item => {
                        allIds.add(item.id);
                        if (item.children) collectIds(item.children);
                    });
                };
                collectIds(tree || []);
                setExpandedHeadings(allIds);
            }
        } catch (error) {
            console.error("Failed to load course file:", error);
            toast({
                title: "Error",
                description: "Failed to load course file details",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    /* =======================
       ACTIONS
    ======================= */

    const handleForward = async () => {
        if (!courseFileId) return;
        setSubmitting(true);
        try {
            const res = await authFetch(`/api/review/course-file/${courseFileId}/approve/subject-head`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ comment: comment || "Forwarded to HOD for final approval" }),
            });

            if (res.ok) {
                toast({ title: "Success", description: "Course file forwarded to HOD for approval" });
                navigate("/subject-head/reviews");
            } else {
                const error = await res.json();
                throw new Error(error.error || "Failed to forward");
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to forward course file", variant: "destructive" });
        } finally {
            setSubmitting(false);
            setShowApproveDialog(false);
        }
    };

    const handleReject = async () => {
        if (!courseFileId || !comment.trim()) {
            toast({ title: "Required", description: "Please provide a reason for rejection", variant: "destructive" });
            return;
        }
        setSubmitting(true);
        try {
            const res = await authFetch(`/api/review/course-file/${courseFileId}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: comment }),
            });

            if (res.ok) {
                toast({ title: "Returned", description: "Course file has been returned to teacher with feedback" });
                navigate("/subject-head/reviews");
            } else {
                const error = await res.json();
                throw new Error(error.error || "Failed to return");
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to return course file", variant: "destructive" });
        } finally {
            setSubmitting(false);
            setShowRejectDialog(false);
        }
    };

    /* =======================
       UI
    ======================= */

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const canTakeAction = courseFile?.status === "SUBMITTED";

    const getStats = () => {
        let totalFiles = 0, pending = 0, approved = 0, wrong = 0;
        const countRecursive = (items: HeadingNode[]) => {
            items.forEach(h => {
                const docs = h.documents || [];
                totalFiles += docs.length;
                docs.forEach(d => {
                    if (d.status === 'APPROVED') approved++;
                    else if (d.status === 'PENDING_REVIEW') pending++;
                    if (d.isActive === false) wrong++;
                });
                if (h.children) countRecursive(h.children);
            });
        };
        countRecursive(headings);
        return { totalFiles, pending, approved, wrong };
    };

    const stats = getStats();

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Course File Review</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="font-mono">{courseFile?.courseCode}</Badge>
                            <span className="text-slate-400 text-sm">•</span>
                            <p className="text-slate-600 font-medium">{courseFile?.courseTitle}</p>
                        </div>
                    </div>
                </div>

                {canTakeAction && (
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-all font-semibold"
                            onClick={() => setShowEnhancedView(true)}
                        >
                            <LayoutGrid className="h-4 w-4 mr-2" />
                            Professional View
                        </Button>
                        <Button
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 transition-all font-semibold"
                            onClick={() => setShowRejectDialog(true)}
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Return Fixes
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700 shadow-md shadow-green-100 transition-all font-semibold px-6"
                            onClick={() => setShowApproveDialog(true)}
                        >
                            <Send className="h-4 w-4 mr-2" />
                            Forward to HOD
                        </Button>
                    </div>
                )}
            </div>

            {/* WORKFLOW PROGRESS */}
            <Card className="bg-slate-50/50 border-none shadow-none overflow-hidden">
                <CardContent className="pt-10 pb-6">
                    <div className="flex items-center w-full max-w-2xl mx-auto px-4">
                        <div className="flex flex-col items-center flex-1 relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-sm ${courseFile?.status === 'DRAFT' ? 'bg-blue-100 border-blue-600 text-blue-700' : 'bg-green-600 border-green-600 text-white'}`}>
                                <User className="h-5 w-5" />
                            </div>
                            <span className="text-[11px] font-bold mt-2 text-slate-500 uppercase tracking-tighter">Teacher</span>
                            <div className="absolute top-5 left-[60%] w-[80%] h-0.5 bg-slate-200 -z-10" />
                        </div>

                        <div className="flex flex-col items-center flex-1 relative">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-md ${courseFile?.status === 'SUBMITTED' ? 'bg-amber-100 border-amber-600 text-amber-700 ring-4 ring-amber-50' : (courseFile?.status === 'UNDER_REVIEW_HOD' || courseFile?.status === 'APPROVED') ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <span className="text-[11px] font-bold mt-2 text-slate-900 uppercase tracking-tighter">Subject Head</span>
                            <div className="absolute top-6 left-[60%] w-[80%] h-0.5 bg-slate-200 -z-10" />
                        </div>

                        <div className="flex flex-col items-center flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-sm ${courseFile?.status === 'UNDER_REVIEW_HOD' ? 'bg-purple-100 border-purple-600 text-purple-700 animate-pulse' : courseFile?.status === 'APPROVED' ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <span className="text-[11px] font-bold mt-2 text-slate-500 uppercase tracking-tighter">HOD Approval</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* REVIEW SUMMARY DASHBOARD */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white border-l-4 border-blue-500 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><FileText className="h-6 w-6" /></div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Total Presence</p>
                            <p className="text-2xl font-black text-slate-800">{stats.totalFiles}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-amber-500 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><Clock className="h-6 w-6" /></div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">To Review</p>
                            <p className="text-2xl font-black text-slate-800">{stats.pending}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-green-500 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-green-50 rounded-xl text-green-600"><CheckCircle2 className="h-6 w-6" /></div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Checked OK</p>
                            <p className="text-2xl font-black text-slate-800">{stats.approved}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-red-500 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-red-50 rounded-xl text-red-600"><XCircle className="h-6 w-6" /></div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Need Fix</p>
                            <p className="text-2xl font-black text-slate-800">{stats.wrong}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* REVISION AUDIT HUB (Quick Links to Changes) */}
            {(() => {
                const changedItems: { id: number, name: string, heading: string, isResubmitted: boolean }[] = [];
                const collectChanged = (items: HeadingNode[]) => {
                    items.forEach(h => {
                        const docs: DocumentItem[] = (h.documents || h.files || []) as DocumentItem[];
                        docs.forEach(d => {
                            const s = String(d.status).toUpperCase();
                            if (d.isResubmitted && s === 'PENDING_REVIEW') {
                                changedItems.push({ id: d.id, name: d.fileName || d.file_name || "Unknown", heading: h.title, isResubmitted: true });
                            }
                        });
                        if (h.children) collectChanged(h.children);
                    });
                };
                collectChanged(headings);

                if (changedItems.length > 0) {
                    return (
                        <Card className="border-blue-200 bg-blue-50/30 shadow-sm">
                            <CardHeader className="py-3 border-b border-blue-100 bg-blue-100/30">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-900 uppercase tracking-tighter">
                                    <RefreshCw className="h-4 w-4 animate-spin-slow" />
                                    Revision Audit Hub ({changedItems.length} items to verify)
                                </CardTitle>
                                <Button
                                    variant={smartAuditMode ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSmartAuditMode(!smartAuditMode)}
                                    className={`h-8 rounded-xl font-black text-[10px] uppercase transition-all shadow-sm ${smartAuditMode ? 'bg-blue-600 hover:bg-blue-700 ring-4 ring-blue-100' : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50'}`}
                                >
                                    <ShieldCheck className={`h-3.5 w-3.5 mr-2 ${smartAuditMode ? 'animate-bounce' : ''}`} />
                                    {smartAuditMode ? "Smart View Active" : "Enable Smart Check"}
                                </Button>
                            </CardHeader>
                            <CardContent className="p-3">
                                <div className="flex flex-wrap gap-2">
                                    {changedItems.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => {
                                                const el = document.getElementById(`doc-${item.id}`);
                                                if (el) {
                                                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    el.classList.add('ring-4', 'ring-blue-500', 'ring-offset-2', 'bg-blue-100');
                                                    setTimeout(() => el.classList.remove('ring-4', 'ring-blue-500', 'ring-offset-2', 'bg-blue-100'), 2000);
                                                }
                                            }}
                                            className="px-3 py-1.5 bg-white border border-blue-200 rounded-xl shadow-sm cursor-pointer hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all flex items-center gap-2 group"
                                        >
                                            <FileText className="h-3.5 w-3.5" />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase leading-none">{item.name}</span>
                                                <span className="text-[8px] font-bold opacity-60 uppercase truncate max-w-[100px]">{item.heading}</span>
                                            </div>
                                            {item.isResubmitted && <Badge className="h-3 px-1 text-[7px] bg-amber-400 text-slate-900 border-none">FIX</Badge>}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    );
                }
                return null;
            })()}

            {/* COURSE INFO */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Course File Details
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                            <Label className="text-muted-foreground font-semibold">Teacher</Label>
                            <p className="font-medium text-slate-800">{courseFile?.teacherName || "N/A"}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground font-semibold">Academic Year</Label>
                            <p className="font-medium text-slate-800">{courseFile?.academicYear || "N/A"}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground font-semibold">Section</Label>
                            <p className="font-medium text-slate-800">{courseFile?.section || "N/A"}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground font-semibold">Submitted On</Label>
                            <p className="font-medium text-slate-800">{courseFile?.submittedDate ? safeToLocaleDateString(courseFile.submittedDate) : "N/A"}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground font-semibold">Status</Label>
                            <Badge variant="outline" className={courseFile?.status === "SUBMITTED" ? "bg-yellow-100 text-yellow-700 border-yellow-200" : courseFile?.status === "APPROVED" ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100"}>
                                {(courseFile?.status || "").replace(/_/g, " ") || "PENDING"}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* HEADING TREE */}
            <Card className="shadow-lg border-slate-200 overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b">
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                        <FolderOpen className="h-5 w-5 text-blue-600" />
                        Course File Structure
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {headings.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium">Structure is currently empty</p>
                            <p className="text-sm">No documents have been uploaded for review yet.</p>
                        </div>
                    ) : (
                        <div className="p-6">
                            <CourseFileTree
                                courseFileId={parseInt(courseFileId!)}
                                courseCode={courseFile?.courseCode || ""}
                                courseTitle={courseFile?.courseTitle || ""}
                                headings={headings as any}
                                isReadOnly={true}
                                onRefresh={() => loadCourseFileData(parseInt(courseFileId!))}
                                smartAuditMode={smartAuditMode}
                                onComment={(headingId, documentId, title) => {
                                    setCommentTarget({
                                        headingId,
                                        documentId,
                                        headingTitle: !documentId ? title : undefined,
                                        fileName: documentId ? title : undefined,
                                    });
                                }}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* DIALOGS */}
            <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <DialogContent>
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-green-600" /> Forward to HOD</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Forward this course file for final HOD approval.</p>
                        <div><Label>Comments (Optional)</Label><Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add any comments for the HOD..." rows={3} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowApproveDialog(false)}>Cancel</Button>
                        <Button className="bg-green-600 hover:bg-green-700" onClick={handleForward} disabled={submitting}>
                            {submitting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />} Forward
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><XCircle className="h-5 w-5 text-red-600" /> Return to Teacher</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Provide feedback for required corrections.</p>
                        <div><Label>Reason *</Label><Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Enter feedback..." rows={4} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={submitting || !comment.trim()}>{submitting ? "Returning..." : "Return Fixes"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {viewingFile && (
                <FileViewerModal isOpen={!!viewingFile} onClose={() => setViewingFile(null)} fileId={String(viewingFile.id)} fileName={viewingFile.name} />
            )}

            {showEnhancedView && courseFileId && (
                <EnhancedCourseFileView courseFileId={parseInt(courseFileId)} courseName={`${courseFile?.courseCode} - ${courseFile?.courseTitle}`} courseCode={courseFile?.courseCode || ""} teacherName={courseFile?.teacherName} onClose={() => setShowEnhancedView(false)} useReviewApi={true} />
            )}

            {commentTarget && courseFileId && (
                <InlineCommentDialog courseFileId={parseInt(courseFileId)} headingId={commentTarget.headingId} documentId={commentTarget.documentId} headingTitle={commentTarget.headingTitle} fileName={commentTarget.fileName} isOpen={!!commentTarget} onClose={() => setCommentTarget(null)} onSuccess={() => courseFileId && loadCourseFileData(parseInt(courseFileId))} />
            )}
        </div>
    );
}
