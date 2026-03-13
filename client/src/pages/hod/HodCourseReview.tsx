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
    CheckCircle,
    FolderOpen,
    RefreshCw,
    RotateCcw,
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

export default function HodCourseReviewPage() {
    const { courseFileId } = useParams<{ courseFileId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [courseFile, setCourseFile] = useState<CourseFileDetails | null>(null);
    const [headings, setHeadings] = useState<HeadingNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showReturnDialog, setShowReturnDialog] = useState(false);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showEnhancedView, setShowEnhancedView] = useState(false);
    const [smartAuditMode, setSmartAuditMode] = useState(false);
    const [commentTarget, setCommentTarget] = useState<{
        headingId?: number;
        documentId?: number;
        headingTitle?: string;
        fileName?: string;
    } | null>(null);
    const [viewingFile, setViewingFile] = useState<{ id: number; name: string } | null>(null);

    useEffect(() => {
        if (courseFileId) loadCourseFileData(parseInt(courseFileId));
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
            }
        } catch (error) {
            console.error("Failed to load course file:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!courseFileId) return;
        setSubmitting(true);
        try {
            const res = await authFetch(`/api/review/course-file/${courseFileId}/approve/hod`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ comment: comment || "Final approval granted" }),
            });
            if (res.ok) {
                toast({ title: "Approved", description: "Course file has been finalized." });
                navigate("/hod/executive-reviews");
            }
        } finally {
            setSubmitting(false);
            setShowApproveDialog(false);
        }
    };

    const handleReturn = async () => {
        if (!courseFileId || !comment.trim()) return;
        setSubmitting(true);
        try {
            const res = await authFetch(`/api/review/course-file/${courseFileId}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: comment }),
            });
            if (res.ok) {
                toast({ title: "Returned", description: "File sent back for corrections." });
                navigate("/hod/executive-reviews");
            }
        } finally {
            setSubmitting(false);
            setShowReturnDialog(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div>;

    const canTakeAction = courseFile?.status === "UNDER_REVIEW_HOD";

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">HOD Final Review</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="font-mono">{courseFile?.courseCode}</Badge>
                            <span className="text-slate-400 text-sm">•</span>
                            <p className="text-slate-600 font-medium">{courseFile?.courseTitle}</p>
                        </div>
                    </div>
                </div>

                {canTakeAction && (
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" onClick={() => setShowEnhancedView(true)}><LayoutGrid className="h-4 w-4 mr-2" />Professional View</Button>
                        <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => setShowReturnDialog(true)}><RotateCcw className="h-4 w-4 mr-2" />Return Fixes</Button>
                        <Button className="bg-green-600 hover:bg-green-700 shadow-md shadow-green-100" onClick={() => setShowApproveDialog(true)}><CheckCircle className="h-4 w-4 mr-2" />Final Approval</Button>
                    </div>
                )}
            </div>

            <Card className="bg-slate-50/50 border-none shadow-none">
                <CardContent className="pt-10 pb-6">
                    <div className="flex items-center w-full max-w-2xl mx-auto px-4">
                        <div className="flex flex-col items-center flex-1 relative">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-600 text-white shadow-sm"><User className="h-5 w-5" /></div>
                            <span className="text-[11px] font-bold mt-2 text-slate-500 uppercase">Teacher</span>
                            <div className="absolute top-5 left-[60%] w-[80%] h-0.5 bg-green-200 -z-10" />
                        </div>
                        <div className="flex flex-col items-center flex-1 relative">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-600 text-white shadow-sm"><ShieldCheck className="h-5 w-5" /></div>
                            <span className="text-[11px] font-bold mt-2 text-slate-500 uppercase">Subject Head</span>
                            <div className="absolute top-5 left-[60%] w-[80%] h-0.5 bg-green-200 -z-10" />
                        </div>
                        <div className="flex flex-col items-center flex-1">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all shadow-md ${(courseFile?.status === 'UNDER_REVIEW_HOD' || courseFile?.status === 'SUBMITTED') ? 'bg-purple-100 border-purple-600 text-purple-700 ring-4 ring-purple-50 animate-pulse' : (courseFile?.status === 'APPROVED' || courseFile?.status === 'FINAL_APPROVED') ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}><CheckCircle2 className="h-6 w-6" /></div>
                            <span className="text-[11px] font-bold mt-2 text-slate-900 uppercase">HOD Review</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white border-l-4 border-blue-500 shadow-sm"><CardContent className="p-4 flex items-center gap-4"><div className="p-3 bg-blue-50 rounded-xl text-blue-600"><FileText className="h-6 w-6" /></div><div><p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Documents</p><p className="text-2xl font-black text-slate-800">{stats.totalFiles}</p></div></CardContent></Card>
                <Card className="bg-white border-l-4 border-amber-500 shadow-sm"><CardContent className="p-4 flex items-center gap-4"><div className="p-3 bg-amber-50 rounded-xl text-amber-600"><Clock className="h-6 w-6" /></div><div><p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Pending</p><p className="text-2xl font-black text-slate-800">{stats.pending}</p></div></CardContent></Card>
                <Card className="bg-white border-l-4 border-green-500 shadow-sm"><CardContent className="p-4 flex items-center gap-4"><div className="p-3 bg-green-50 rounded-xl text-green-600"><CheckCircle2 className="h-6 w-6" /></div><div><p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Approved</p><p className="text-2xl font-black text-slate-800">{stats.approved}</p></div></CardContent></Card>
                <Card className="bg-white border-l-4 border-red-500 shadow-sm"><CardContent className="p-4 flex items-center gap-4"><div className="p-3 bg-red-50 rounded-xl text-red-600"><XCircle className="h-6 w-6" /></div><div><p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Queries</p><p className="text-2xl font-black text-slate-800">{stats.wrong}</p></div></CardContent></Card>
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
                        <Card className="border-purple-200 bg-purple-50/30 shadow-sm">
                            <CardHeader className="py-3 border-b border-purple-100 bg-purple-100/30">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-purple-900 uppercase tracking-tighter">
                                    <RefreshCw className="h-4 w-4 animate-spin-slow" />
                                    Executive Revision Hub ({changedItems.length} items to verify)
                                </CardTitle>
                                <Button
                                    variant={smartAuditMode ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSmartAuditMode(!smartAuditMode)}
                                    className={`h-8 rounded-xl font-black text-[10px] uppercase transition-all shadow-sm ${smartAuditMode ? 'bg-purple-600 hover:bg-purple-700 ring-4 ring-purple-100' : 'bg-white border-purple-200 text-purple-600 hover:bg-purple-50'}`}
                                >
                                    <ShieldCheck className={`h-3.5 w-3.5 mr-2 ${smartAuditMode ? 'animate-bounce' : ''}`} />
                                    {smartAuditMode ? "Smart view active" : "Smart Check"}
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
                                                    el.classList.add('ring-4', 'ring-purple-500', 'ring-offset-2', 'bg-purple-100');
                                                    setTimeout(() => el.classList.remove('ring-4', 'ring-purple-500', 'ring-offset-2', 'bg-purple-100'), 2000);
                                                }
                                            }}
                                            className="px-3 py-1.5 bg-white border border-purple-200 rounded-xl shadow-sm cursor-pointer hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all flex items-center gap-2 group"
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

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><FileText className="h-5 w-5 text-blue-500" /> Administrative Details</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                        <div><Label className="text-slate-500 text-xs uppercase font-bold">Faculty</Label><p className="font-semibold text-slate-800">{courseFile?.teacherName}</p></div>
                        <div><Label className="text-slate-500 text-xs uppercase font-bold">Session</Label><p className="font-semibold text-slate-800">{courseFile?.academicYear}</p></div>
                        <div><Label className="text-slate-500 text-xs uppercase font-bold">Section</Label><p className="font-semibold text-slate-800">{courseFile?.section}</p></div>
                        <div><Label className="text-slate-500 text-xs uppercase font-bold">Submission</Label><p className="font-semibold text-slate-800">{courseFile?.submittedDate ? safeToLocaleDateString(courseFile.submittedDate) : "N/A"}</p></div>
                        <div><Label className="text-slate-500 text-xs uppercase font-bold">Workflow Status</Label><div className="mt-1"><Badge className={(courseFile?.status === "APPROVED" || courseFile?.status === "FINAL_APPROVED") ? "bg-green-600" : "bg-blue-600"}>{courseFile?.status.replace(/_/g, " ")}</Badge></div></div>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-lg border-slate-200">
                <CardHeader className="bg-slate-50/50 border-b"><CardTitle className="flex items-center gap-2 text-slate-800"><FolderOpen className="h-5 w-5 text-blue-600" /> Document Repository Structure</CardTitle></CardHeader>
                <CardContent className="p-6">
                    {headings.length === 0 ? <div className="text-center py-10 opacity-30"><FolderOpen className="h-12 w-12 mx-auto" /><p>No files available</p></div> : (
                        <CourseFileTree
                            courseFileId={parseInt(courseFileId!)}
                            courseCode={courseFile?.courseCode || ""}
                            courseTitle={courseFile?.courseTitle || ""}
                            headings={headings as any}
                            isReadOnly={false}
                            onRefresh={() => loadCourseFileData(parseInt(courseFileId!))}
                            smartAuditMode={smartAuditMode}
                            onComment={(headingId, documentId, title) => setCommentTarget({ headingId, documentId, headingTitle: !documentId ? title : undefined, fileName: documentId ? title : undefined })}
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <DialogContent>
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-600" /> Complete Final Approval</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="bg-green-50 p-3 rounded text-sm text-green-700">Confirming final approval will archive this course file as a completed record.</div>
                        <div><Label>Closing Remarks (Optional)</Label><Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Enter final remarks..." rows={3} /></div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setShowApproveDialog(false)}>Cancel</Button><Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={submitting}>Confirm Approval</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
                <DialogContent>
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><XCircle className="h-5 w-5 text-orange-600" /> Return for Corrections</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-500">The file will be returned to the instructor for required modifications.</p>
                        <div><Label>Mandatory Feedback *</Label><Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Reason for return..." rows={4} /></div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setShowReturnDialog(false)}>Cancel</Button><Button variant="destructive" onClick={handleReturn} disabled={submitting || !comment.trim()}>Return to Teacher</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {viewingFile && <FileViewerModal isOpen={!!viewingFile} onClose={() => setViewingFile(null)} fileId={String(viewingFile.id)} fileName={viewingFile.name} />}
            {showEnhancedView && courseFileId && <EnhancedCourseFileView courseFileId={parseInt(courseFileId)} courseName={`${courseFile?.courseCode} - ${courseFile?.courseTitle}`} courseCode={courseFile?.courseCode || ""} teacherName={courseFile?.teacherName} onClose={() => setShowEnhancedView(false)} useReviewApi={true} />}
            {commentTarget && courseFileId && <InlineCommentDialog courseFileId={parseInt(courseFileId)} headingId={commentTarget.headingId} documentId={commentTarget.documentId} headingTitle={commentTarget.headingTitle} fileName={commentTarget.fileName} isOpen={!!commentTarget} onClose={() => setCommentTarget(null)} onSuccess={() => loadCourseFileData(parseInt(courseFileId))} />}
        </div>
    );
}
