import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  Send,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Clock,
  User as UserIcon,
  MessageSquare,
  FileText,
  ShieldCheck,
  CheckSquare,
  FolderOpen,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Flag,
  MoreVertical,
  ThumbsUp,
  Trash2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/utils/authFetch";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

export interface HeadingNode {
  id: number;
  title: string;
  parentHeadingId?: number | null;
  parent_heading_id?: number | null;
  orderIndex?: number;
  order_index?: number;
  documents?: DocumentItem[];
  files?: DocumentItem[];
  children?: HeadingNode[];
}

export interface DocumentItem {
  id: number;
  fileName: string;
  file_name?: string;
  filePath: string;
  file_path?: string;
  type: string;
  fileSize: number;
  file_size?: number;
  versionNo: number;
  version_no?: number;
  uploadedAt: string;
  uploaded_at?: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED';
  versionNo_workflow?: number; // legacy support
  submittedAt?: string;
  reviewDeadline?: string;
  reviewedAt?: string;
  reviewedByName?: string;
  isActive: boolean;
  teacherNote?: string;
  isResubmitted?: boolean;
  reviewerFeedback?: string;
}

interface TreeItemProps {
  node: HeadingNode;
  level: number;
  isReadOnly?: boolean;
  onRefresh?: () => void;
  onComment?: (headingId: number, documentId?: number, title?: string) => void;
  expandedNodes: Set<number>;
  toggleNode: (id: number) => void;
  highlightedDocId?: number | null;
  highlightedHeadingId?: number | null;
  smartAuditMode?: boolean;
  headings: HeadingNode[];
}

const TreeItem: React.FC<TreeItemProps> = ({
  node,
  level,
  isReadOnly = true,
  onRefresh,
  onComment,
  expandedNodes,
  toggleNode,
  highlightedDocId,
  highlightedHeadingId,
  smartAuditMode,
  headings
}) => {
  const isExpanded = expandedNodes.has(node.id);
  const { activeRole } = useAuth();
  const { toast } = useToast();
  const [isActionLoading, setIsActionLoading] = useState<number | null>(null);

  // Resubmit State
  const [isResubmitOpen, setIsResubmitOpen] = useState(false);
  const [resubmitDoc, setResubmitDoc] = useState<DocumentItem | null>(null);
  const [resubmitNote, setResubmitNote] = useState("");
  const [resubmitFile, setResubmitFile] = useState<File | null>(null);
  const [isSubmittingFix, setIsSubmittingFix] = useState(false);
  const scrollPositionRef = useRef<number>(0);
  const isRefreshingRef = useRef<boolean>(false);

  // Workflow Feedback State
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ doc: DocumentItem, action: string } | null>(null);
  const [actionFeedback, setActionFeedback] = useState("");

  const headingRef = useRef<HTMLDivElement>(null);
  const documentRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Relevance Helper
  const isDocRelevant = (d: DocumentItem) => {
    const s = String(d.status).toUpperCase();
    return !!d.isResubmitted && s === 'PENDING_REVIEW';
  };

  const isHeadingRelevant = (node: HeadingNode): boolean => {
    const docs = node.documents || node.files || [];
    if (docs.some(isDocRelevant)) return true;
    if (node.children && node.children.some(isHeadingRelevant)) return true;
    return false;
  };

  const nodeDocuments = (node.documents || node.files || []).filter(d => {
    if (!smartAuditMode) return true;
    return isDocRelevant(d);
  });

  const childHeadings = (node.children || []).filter(c => {
    if (!smartAuditMode) return true;
    return isHeadingRelevant(c);
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = (document: DocumentItem) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
    window.location.href = `${baseUrl}/api/teacher/documents/download/${document.id}`;
  };

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const handlePreview = async (document: DocumentItem) => {
    setSelectedDoc(document);
    setIsPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError(null);

    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
      setFileUrl(null);
    }

    try {
      const res = await authFetch(`/api/teacher/documents/view/${document.id}`);
      if (!res.ok) throw new Error("Security handshake failed.");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setFileUrl(url);
    } catch (err: any) {
      setPreviewError(err.message || "Audability stream interrupted.");
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  const handleWorkflowAction = async (document: DocumentItem, action: string, feedback?: string) => {
    setIsActionLoading(document.id);
    try {
      let path = `/api/teacher/documents/${document.id}/${action}`;
      if (feedback) {
        path += `?feedback=${encodeURIComponent(feedback)}`;
      }

      const res = await authFetch(path, { method: 'POST' });
      if (res.ok) {
        // CAPTURE SCROLL BEFORE REFRESH
        scrollPositionRef.current = window.scrollY;
        isRefreshingRef.current = true;

        toast({
          title: action === 'reject' ? "Asset Flagged" : action === 'delete' ? "Asset Removed" : "Asset Verified",
          description: action === 'reject' ? "Added to conflict list." : action === 'delete' ? "File deleted successfully." : "Compliance passed successfully."
        });
        if (onRefresh) onRefresh();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast({
          title: "Action Failed",
          description: errData.error || "Compliance exception detected.",
          variant: "destructive"
        });
      }
    } finally {
      setIsActionLoading(null);
    }
  };

  const openFeedbackDialog = (doc: DocumentItem, action: string) => {
    setPendingAction({ doc, action });
    setActionFeedback("");
    setFeedbackDialogOpen(true);
  };

  const handleFeedbackSubmit = () => {
    if (pendingAction) {
      const isReject = pendingAction.action === 'reject';
      if (isReject && !actionFeedback.trim()) {
        toast({ title: "Reason Required", description: "Please explain the conflict reason.", variant: "destructive" });
        return;
      }

      const feedbackToUse = actionFeedback.trim() || (pendingAction.action === 'approve' ? "Approved" : "Flagged for Conflict");
      handleWorkflowAction(pendingAction.doc, pendingAction.action, feedbackToUse);
      setFeedbackDialogOpen(false);
    }
  };

  const handleDelete = async (document: DocumentItem) => {
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) return;

    setIsActionLoading(document.id);
    try {
      const res = await authFetch(`/api/teacher/documents/${document.id}`, { method: 'DELETE' });
      if (res.ok) {
        // CAPTURE SCROLL
        scrollPositionRef.current = window.scrollY;
        isRefreshingRef.current = true;

        toast({
          title: "Document Deleted",
          description: "The file has been permanently removed."
        });
        if (onRefresh) onRefresh();
      } else {
        const error = await res.json().catch(() => ({ error: "Failed to delete" }));
        toast({
          title: "Delete Failed",
          description: error.error || "Only creator can delete this file.",
          variant: "destructive"
        });
      }
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleResubmit = async () => {
    if (!resubmitDoc || !resubmitFile || !resubmitNote.trim()) return;

    setIsSubmittingFix(true);
    try {
      const formData = new FormData();
      formData.append("file", resubmitFile);
      formData.append("teacherNote", resubmitNote);

      const res = await authFetch(`/api/teacher/documents/${resubmitDoc.id}/resubmit`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        // CAPTURE SCROLL
        scrollPositionRef.current = window.scrollY;
        isRefreshingRef.current = true;

        toast({
          title: "Asset Re-submitted",
          description: "Your fix has been forwarded to the reviewer."
        });
        setIsResubmitOpen(false);
        setResubmitNote("");
        setResubmitFile(null);
        if (onRefresh) onRefresh();
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to resubmit.");
      }
    } catch (err: any) {
      toast({
        title: "Resubmission Failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmittingFix(false);
    }
  };

  // Scroll into view if highlighted
  useEffect(() => {
    if (highlightedHeadingId === node.id && headingRef.current) {
      headingRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedHeadingId, node.id]);

  useEffect(() => {
    if (highlightedDocId && documentRefs.current.has(highlightedDocId)) {
      if (isRefreshingRef.current) {
        window.scrollTo(0, scrollPositionRef.current);
        isRefreshingRef.current = false;
        return;
      }
      const el = documentRefs.current.get(highlightedDocId);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (isRefreshingRef.current) {
      window.scrollTo(0, scrollPositionRef.current);
      isRefreshingRef.current = false;
    }
  }, [highlightedDocId, isExpanded, headings]);

  // PROFESSIONAL STATUS SYSTEM
  const getStatusDisplay = (doc: DocumentItem) => {
    const isAdmin = activeRole === 'HOD' || activeRole === 'SUBJECTHEAD';

    // 1. If explicitly rejected by Subject Head
    if (!doc.isActive || doc.status === 'REJECTED' || doc.status === 'CHANGES_REQUESTED') {
      return (
        <Badge variant="destructive" className="bg-red-600/10 text-red-700 border-red-200/50 font-black shadow-sm px-3 uppercase text-[9px] gap-1">
          <AlertTriangle className="h-3 w-3" /> Flagged for Repair
        </Badge>
      );
    }

    // 2. If resubmitted (Show as UPDATED for Reviewer)
    if (doc.isResubmitted && doc.status === 'PENDING_REVIEW') {
      return (
        <Badge className="bg-blue-600 text-white border-blue-200/50 font-black shadow-sm px-3 uppercase text-[9px] gap-1 animate-pulse">
          <RotateCcw className="h-3 w-3" /> Fix Applied
        </Badge>
      );
    }

    // 3. If approved
    if (doc.status === 'APPROVED') {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200/50 font-black shadow-sm px-3 uppercase text-[9px] gap-1">
          <CheckCircle2 className="h-3 w-3" /> System Verified
        </Badge>
      );
    }

    // 4. Default State (Pending Review)
    return (
      <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 font-black shadow-sm px-3 uppercase text-[9px] gap-1">
        <ShieldCheck className="h-3 w-3 opacity-50" /> Routine Compliant
      </Badge>
    );
  };

  const hasChildren = childHeadings.length > 0;
  const hasDocuments = nodeDocuments.length > 0;
  const canExpand = hasChildren || hasDocuments;

  return (
    <div className="space-y-3">
      {/* HEADING ROW */}
      <div
        ref={headingRef}
        onClick={() => canExpand && toggleNode(node.id)}
        className={`p-4 rounded-2xl transition-all duration-300 border group cursor-pointer ${level === 0 ? 'bg-white shadow-xl border-slate-100 hover:border-blue-200 ring-1 ring-slate-200/50' : 'bg-slate-50/50 border-slate-200/50 hover:bg-slate-100'} ${isExpanded && level === 0 ? 'border-blue-200 ring-2 ring-blue-50/50 shadow-2xl' : ''} ${highlightedHeadingId === node.id ? 'ring-2 ring-amber-400 border-amber-400 bg-amber-50' : ''}`}
      >
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300 ${isExpanded ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'} group-hover:scale-110`}>
            {hasChildren ? <FolderOpen className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4 opacity-50" />}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className={`font-black tracking-tight ${level === 0 ? 'text-slate-900 text-[15px] uppercase' : 'text-slate-700 font-bold'}`}>
                {node.title}
              </span>
              {hasDocuments && (
                <Badge variant="outline" className={`text-[9px] font-black border-slate-200 px-2 py-0 ${smartAuditMode ? 'bg-blue-600 text-white border-blue-600' : 'bg-white/50'}`}>
                  {nodeDocuments.length} {smartAuditMode ? 'NEW FIXES' : 'ASSETS'}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canExpand ? (
              <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-blue-600 transition-colors">
                {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </div>
            ) : (
              <Clock className="h-4 w-4 text-slate-200" />
            )}
            {onComment && (
              <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl" onClick={(e) => { e.stopPropagation(); onComment(node.id, undefined, node.title); }}>
                <MessageSquare className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* DOCUMENTS LIST */}
      {hasDocuments && isExpanded && (
        <div className="ml-8 grid gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
          {nodeDocuments.map((doc) => (
            <div
              key={doc.id}
              id={`doc-${doc.id}`}
              ref={(el) => { if (el) documentRefs.current.set(doc.id, el); }}
              className={`p-4 rounded-2xl border bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-xl hover:translate-x-1 ${(doc.status === 'REJECTED' || doc.status === 'CHANGES_REQUESTED') ? 'border-red-100 bg-red-50/5' : 'border-slate-200'} ${highlightedDocId === doc.id ? 'ring-2 ring-amber-400 border-amber-400 bg-amber-50' : ''}`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${(doc.status === 'REJECTED' || doc.status === 'CHANGES_REQUESTED') ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
                    {(doc.status === 'REJECTED' || doc.status === 'CHANGES_REQUESTED') ? <Flag className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className={`text-sm font-black tracking-tight ${(doc.status === 'REJECTED' || doc.status === 'CHANGES_REQUESTED') ? 'text-red-900' : 'text-slate-900'}`}>
                      {doc.fileName || doc.file_name}
                      {doc.versionNo > 1 && <span className="ml-2 text-[9px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase font-black">Rev {doc.versionNo}</span>}
                      {doc.isResubmitted && <span className="ml-1 text-[8px] bg-amber-100 text-amber-700 px-1 rounded uppercase font-bold tracking-tighter self-center">Updated FIX</span>}
                    </h4>
                    <div className="flex flex-col gap-1 mt-1 font-bold text-slate-400 uppercase tracking-tighter">
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(doc.uploadedAt || doc.uploaded_at!).toLocaleDateString()}</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-sm">{formatFileSize(doc.fileSize || doc.file_size!)}</span>
                        {doc.reviewedByName && <span className="flex items-center gap-1 text-emerald-600"><CheckSquare className="h-3 w-3" /> Reviewer: {doc.reviewedByName}</span>}
                      </div>

                      {/* FLAG FEEDBACK (Inline) */}
                      {(doc.status === 'REJECTED' || doc.status === 'CHANGES_REQUESTED') && doc.reviewerFeedback && (
                        <div className="normal-case text-[11px] text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 mt-2 flex items-start gap-3 shadow-sm">
                          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                          <div className="flex flex-col gap-1">
                            <span className="font-black uppercase text-[9px] tracking-widest opacity-60">Reviewer Feedback</span>
                            <span className="font-bold leading-relaxed">{doc.reviewerFeedback}</span>
                          </div>
                        </div>
                      )}

                      {doc.teacherNote && (
                        <div className="normal-case text-[11px] text-blue-600 bg-blue-50/50 p-2 rounded-lg border border-blue-100 mt-1 flex items-start gap-2 italic">
                          <MessageSquare className="h-3 w-3 mt-0.5" />
                          <span><b>Teacher Note:</b> {doc.teacherNote}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusDisplay(doc)}

                  <div className="flex items-center gap-2 ml-4 border-l pl-4 border-slate-100">

                    {/* ACTIONS HUB */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-slate-200 bg-white">
                        <div className="px-2 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Actions</div>

                        {/* Reviewer Actions */}
                        {((activeRole === 'HOD') || (activeRole === 'SUBJECTHEAD' && doc.status !== 'APPROVED')) && doc.isActive && (
                          <>
                            <DropdownMenuItem onClick={() => openFeedbackDialog(doc, 'approve')} className="rounded-xl py-2 cursor-pointer focus:bg-emerald-50 focus:text-emerald-700">
                              <ThumbsUp className="h-4 w-4 mr-2" />
                              <span className="font-bold">Explicitly Verify</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openFeedbackDialog(doc, 'request-changes')} className="rounded-xl py-2 cursor-pointer focus:bg-amber-50 focus:text-amber-700">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              <span className="font-bold">Request Minor Fixes</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openFeedbackDialog(doc, 'reject')} className="rounded-xl py-2 cursor-pointer focus:bg-red-50 focus:text-red-700">
                              <Flag className="h-4 w-4 mr-2" />
                              <span className="font-bold">Flag as Conflict</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}

                        {/* Teacher Actions */}
                        {activeRole === 'TEACHER' && (
                          <>
                            {(doc.status === 'REJECTED' || doc.status === 'CHANGES_REQUESTED') && (
                              <DropdownMenuItem onClick={() => { setResubmitDoc(doc); setIsResubmitOpen(true); }} className="rounded-xl py-2 cursor-pointer focus:bg-blue-50 focus:text-blue-700">
                                <RotateCcw className="h-4 w-4 mr-2" />
                                <span className="font-bold">Replace & Fix Asset</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDelete(doc)} className="rounded-xl py-2 cursor-pointer focus:bg-red-50 focus:text-red-700 text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              <span className="font-bold">Remove Asset</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}

                        <DropdownMenuItem onClick={() => handlePreview(doc)} className="rounded-xl py-2 cursor-pointer">
                          <Eye className="h-4 w-4 mr-2" />
                          <span className="font-bold">View Asset</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(doc)} className="rounded-xl py-2 cursor-pointer">
                          <Download className="h-4 w-4 mr-2" />
                          <span className="font-bold">Download Copy</span>
                        </DropdownMenuItem>

                        {onComment && (
                          <DropdownMenuItem onClick={() => onComment(node.id, doc.id, doc.fileName || doc.file_name)} className="rounded-xl py-2 cursor-pointer">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            <span className="font-bold">Audit Discussion</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* QUICK ACTIONS BUTTONS */}
                    <div className="flex gap-1 items-center">
                      <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg" onClick={() => handlePreview(doc)} title="Quick View"><Eye className="h-4 w-4" /></Button>

                      {/* Direct Flag Button for Reviewers */}
                      {((activeRole === 'HOD') || (activeRole === 'SUBJECTHEAD' && doc.status !== 'APPROVED')) && doc.isActive && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg"
                          onClick={() => openFeedbackDialog(doc, 'reject')}
                          title="Point out mistake (Flag)"
                        >
                          <Flag className="h-4 w-4" />
                        </Button>
                      )}

                      {activeRole === 'TEACHER' && (doc.status === 'REJECTED' || doc.status === 'CHANGES_REQUESTED') && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg"
                            onClick={() => { setResubmitDoc(doc); setIsResubmitOpen(true); }}
                            title="Fix & Resubmit"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg"
                            onClick={() => handleDelete(doc)}
                            title="Remove flagged file"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RECURSIVE CHILDREN */}
      {hasChildren && isExpanded && (
        <div className="ml-6 space-y-4 border-l-4 border-blue-50/50 pl-6 mt-4">
          {childHeadings.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              level={level + 1}
              isReadOnly={isReadOnly}
              onRefresh={onRefresh}
              onComment={onComment}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
              highlightedDocId={highlightedDocId}
              highlightedHeadingId={highlightedHeadingId}
              smartAuditMode={smartAuditMode}
              headings={headings}
            />
          ))}
        </div>
      )}

      {/* SECURE PREVIEW MODAL */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-6xl h-[95vh] rounded-[40px] overflow-hidden p-0 border-none shadow-2xl flex flex-col bg-slate-950">
          <div className="flex-1 relative flex flex-col items-center justify-center">
            <div className="absolute top-6 left-6 z-50 flex items-center gap-3">
              <Badge className="bg-white/10 backdrop-blur-3xl border-white/10 text-white px-4 py-2 text-[10px] font-black tracking-widest uppercase">SECURE AUDIT PREVIEW</Badge>
              <span className="text-white/40 font-black text-[10px] bg-white/5 px-3 py-2 rounded-2xl backdrop-blur-md uppercase tracking-tight max-w-[200px] truncate">{selectedDoc?.fileName}</span>
            </div>

            <Button onClick={() => setIsPreviewOpen(false)} className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 backdrop-blur-3xl border border-white/20 text-white rounded-full h-12 w-12 z-50 transition-all hover:scale-110 active:scale-90"><XCircle className="h-6 w-6" /></Button>

            {previewLoading && (
              <div className="flex flex-col items-center gap-6">
                <div className="h-16 w-16 rounded-3xl border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Syncing Secure Stream...</p>
              </div>
            )}

            {previewError && (
              <div className="flex flex-col items-center text-center p-12 bg-white/5 backdrop-blur-3xl rounded-[40px] border border-white/10 max-w-sm">
                <AlertCircle className="h-16 w-16 text-red-500 mb-6" />
                <h3 className="text-white font-black uppercase text-lg mb-2">Access Denied</h3>
                <p className="text-white/40 text-[11px] font-bold leading-relaxed mb-8">{previewError}</p>
                <Button variant="outline" onClick={() => selectedDoc && handlePreview(selectedDoc)} className="w-full border-white/10 text-white/80 hover:bg-white/10 rounded-2xl h-12 font-black uppercase text-[11px]">Retry Authorization</Button>
              </div>
            )}

            {!previewLoading && !previewError && fileUrl && (
              <iframe src={fileUrl} className="w-full h-full border-none shadow-2xl" title="Secure Asset Stream" />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* RESUBMIT DIALOG */}
      <Dialog open={isResubmitOpen} onOpenChange={setIsResubmitOpen}>
        <DialogContent className="max-w-md rounded-[40px] p-8 bg-white overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-2">Resubmit Fix</DialogTitle>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
              REPLACING: <span className="text-blue-600 italic font-black">{resubmitDoc?.fileName}</span>
            </p>
          </DialogHeader>

          <div className="mt-8 space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-2">Corrected Document</label>
              <div className="relative group">
                <input
                  type="file"
                  onChange={(e) => setResubmitFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  accept=".pdf,.png,.jpg,.jpeg"
                />
                <div className="p-10 border-2 border-dashed border-slate-200 rounded-[30px] text-center group-hover:border-blue-500/50 transition-all bg-slate-50/50 group-hover:bg-blue-50/50">
                  <FolderOpen className="h-8 w-8 text-slate-300 mx-auto mb-3 group-hover:text-blue-500" />
                  <p className="text-xs font-bold text-slate-500 group-hover:text-blue-600">
                    {resubmitFile ? resubmitFile.name : "Tap to select corrected file"}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-2 font-black uppercase tracking-widest">PDF, PNG, JPG supported</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-2">Message to Reviewer</label>
              <textarea
                value={resubmitNote}
                onChange={(e) => setResubmitNote(e.target.value)}
                placeholder="Explain what you have changed/fixed..."
                className="w-full h-32 p-5 rounded-[30px] bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-bold text-sm text-slate-900 placeholder:text-slate-300 outline-none"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                className="flex-1 bg-slate-900 hover:bg-blue-600 text-white rounded-[30px] h-14 font-black uppercase tracking-widest text-xs transition-all active:scale-95 disabled:bg-slate-100 disabled:text-slate-300"
                onClick={handleResubmit}
                disabled={!resubmitFile || !resubmitNote.trim() || isSubmittingFix}
              >
                {isSubmittingFix ? <Loader2 className="h-5 w-5 animate-spin" /> : <ThumbsUp className="h-5 w-5 mr-3" />}
                Transmit Fix
              </Button>
              <Button
                variant="outline"
                className="rounded-[30px] h-14 px-8 border-slate-200 text-slate-400 font-bold uppercase text-[10px] hover:bg-slate-50"
                onClick={() => setIsResubmitOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* FEEDBACK INPUT DIALOG (FOR HOD/SH) */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="max-w-md rounded-[40px] p-8 bg-white overflow-hidden shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-2">Review Action Note</DialogTitle>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
              {pendingAction?.action === 'reject' ? "FLAGGING CONFLICT FOR" : "VERIFICATION NOTE FOR"} : <span className="text-blue-600 italic font-black">{pendingAction?.doc.fileName}</span>
            </p>
          </DialogHeader>

          <div className="mt-8 space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-2">Mandatory Feedback / Reason</label>
              <textarea
                value={actionFeedback}
                onChange={(e) => setActionFeedback(e.target.value)}
                placeholder={pendingAction?.action === 'reject' ? "Why is this document wrong? (e.g. wrong year, signature missing...)" : "Add an approval note (optional)..."}
                className={`w-full h-32 p-5 rounded-[30px] bg-slate-50 border-transparent focus:bg-white focus:ring-4 transition-all font-bold text-sm text-slate-900 placeholder:text-slate-300 outline-none ${pendingAction?.action === 'reject' ? 'focus:ring-red-100' : 'focus:ring-emerald-100'}`}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                className={`flex-1 rounded-[30px] h-14 font-black uppercase tracking-widest text-xs transition-all active:scale-95 text-white ${pendingAction?.action === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                onClick={handleFeedbackSubmit}
                disabled={pendingAction?.action === 'reject' && !actionFeedback.trim()}
              >
                {pendingAction?.action === 'reject' ? <Flag className="h-5 w-5 mr-3" /> : <ShieldCheck className="h-5 w-5 mr-3" />}
                Confirm Action
              </Button>
              <Button
                variant="outline"
                className="rounded-[30px] h-14 px-8 border-slate-200 text-slate-400 font-bold uppercase text-[10px] hover:bg-slate-50"
                onClick={() => setFeedbackDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface CourseFileTreeProps {
  courseFileId: number;
  courseCode: string;
  courseTitle: string;
  headings: HeadingNode[];
  isReadOnly?: boolean;
  onRefresh?: () => void;
  onComment?: (headingId: number, documentId?: number, title?: string) => void;
  smartAuditMode?: boolean;
}

export const CourseFileTree: React.FC<CourseFileTreeProps> = ({
  courseFileId,
  courseCode,
  courseTitle,
  headings,
  isReadOnly = true,
  onRefresh,
  onComment,
  smartAuditMode
}) => {
  const { activeRole } = useAuth();
  const [searchParams] = useSearchParams();
  const highlightedDocId = searchParams.get('docId') ? parseInt(searchParams.get('docId')!) : null;
  const highlightedHeadingId = searchParams.get('headingId') ? parseInt(searchParams.get('headingId')!) : null;

  // Expansion Persistence
  const storageKey = `expanded_headings_${courseFileId}`;
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  // Initialization: Load from localStorage or URL highlights
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    let initialExpanded = new Set<number>();

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) initialExpanded = new Set(parsed);
      } catch (e) {
        console.warn("Failed to parse saved tree state");
      }
    }

    // If highlighting OR flagged items exist, expand the path
    if (highlightedDocId || highlightedHeadingId || headings.length > 0 || smartAuditMode) {
      const parentPaths = new Set<number>();

      const isDocRelevant = (d: DocumentItem) => {
        const s = String(d.status).toUpperCase();
        return !!d.isResubmitted && s === 'PENDING_REVIEW';
      };

      const findPath = (items: HeadingNode[], targetDocId?: number, targetHeadingId?: number): boolean => {
        let pathFound = false;
        for (const item of items) {
          // Check for highlighted heading
          if (targetHeadingId === item.id) {
            pathFound = true;
          }

          // Check for highlighted doc
          const docs = item.documents || item.files || [];
          if (targetDocId && docs.some(d => d.id === targetDocId)) {
            parentPaths.add(item.id);
            pathFound = true;
          }

          // Smart Audit Mode Auto-Expand
          if (smartAuditMode && docs.some(isDocRelevant)) {
            parentPaths.add(item.id);
            pathFound = true;
          }

          // AUTO-EXPAND FLAGGED ITEMS
          if (docs.some(d => d.status === 'REJECTED' || d.status === 'CHANGES_REQUESTED')) {
            parentPaths.add(item.id);
            pathFound = true;
          }

          // AUTO-EXPAND RESUBMITTED ITEMS (For Reviewer)
          if (docs.some(isDocRelevant)) {
            parentPaths.add(item.id);
            pathFound = true;
          }

          if (item.children && findPath(item.children, targetDocId, targetHeadingId)) {
            parentPaths.add(item.id);
            pathFound = true;
          }
        }
        return pathFound;
      };

      findPath(headings, highlightedDocId || undefined, highlightedHeadingId || undefined);
      parentPaths.forEach(id => initialExpanded.add(id));
    }

    setExpandedNodes(initialExpanded);
  }, [courseFileId, headings, highlightedDocId, highlightedHeadingId, smartAuditMode]);

  const toggleNode = useCallback((id: number) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
      return next;
    });
  }, [storageKey]);

  const buildTree = (input: HeadingNode[]): HeadingNode[] => {
    const hasExistingStructure = input.some(h => (h.children && h.children.length > 0) || (h.documents && h.documents.length > 0) || (h.files && h.files.length > 0));
    if (hasExistingStructure) {
      return [...input].sort((a, b) => (a.orderIndex ?? a.order_index ?? 0) - (b.orderIndex ?? b.order_index ?? 0));
    }

    const map = new Map<number, HeadingNode>();
    const roots: HeadingNode[] = [];
    input.forEach(h => map.set(h.id, { ...h, children: h.children || [] }));
    input.forEach(h => {
      const node = map.get(h.id)!;
      const pId = h.parentHeadingId ?? h.parent_heading_id;
      if (!pId) roots.push(node);
      else {
        const parent = map.get(pId);
        if (parent) {
          if (!parent.children) parent.children = [];
          parent.children.push(node);
        }
      }
    });
    return roots.sort((a, b) => (a.orderIndex ?? a.order_index ?? 0) - (b.orderIndex ?? b.order_index ?? 0));
  };

  const tree = buildTree(headings);
  const total = headings.reduce((s, h) => s + (h.documents?.length || h.files?.length || 0), 0);

  // FIND ALL FLAGGED ITEMS FOR TEACHER ALERT
  const flaggedItems: DocumentItem[] = [];
  const findFlagged = (items: HeadingNode[]) => {
    items.forEach(h => {
      const docs = h.documents || h.files || [];
      docs.forEach(d => {
        if (d.status === 'REJECTED' || d.status === 'CHANGES_REQUESTED') flaggedItems.push(d);
      });
      if (h.children) findFlagged(h.children);
    });
  };
  findFlagged(headings);

  return (
    <div className="space-y-8">
      {/* TEACHER ATTENTION ALERT */}
      {activeRole === 'TEACHER' && flaggedItems.length > 0 && (
        <div className="bg-red-600 h-20 rounded-[30px] shadow-2xl shadow-red-200 flex items-center justify-between px-10 border-4 border-red-500 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-6">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
              <AlertTriangle className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-white font-black text-lg uppercase tracking-tight leading-none">Action Required: {flaggedItems.length} Conflict(s)</h3>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">Reviewer has flagged errors. Please scroll to items marked in RED.</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="bg-white/10 hover:bg-white/20 text-white rounded-2xl h-10 px-6 font-black uppercase text-[10px] tracking-widest border border-white/20"
            onClick={() => {
              const firstFlagged = document.getElementById(`doc-${flaggedItems[0].id}`);
              firstFlagged?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          >
            Jump to First Conflict
          </Button>
        </div>
      )}

      {/* REPOSITORY HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 p-10 rounded-[40px] shadow-2xl relative overflow-hidden gap-8">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/20 blur-[150px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-indigo-600/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/20 text-[9px] font-black tracking-[0.2em] px-3 py-1 uppercase">Cloud Repository</Badge>
            <Badge className="bg-white/5 text-white/40 border-white/5 text-[9px] font-black tracking-[0.2em] px-3 py-1 uppercase">v{total > 0 ? '1.0.5' : '0.0.0'}</Badge>
          </div>
          <p className="text-blue-400/60 font-black text-xs uppercase tracking-[0.3em] mb-1">{courseCode}</p>
          <h2 className="text-4xl font-black text-white tracking-tight leading-tight max-w-2xl">{courseTitle}</h2>
        </div>

        <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[35px] border border-white/10 text-center relative z-10 min-w-[150px] group hover:bg-white/10 transition-all cursor-default">
          <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-3 opacity-60">Verified Assets</p>
          <div className="flex items-baseline justify-center gap-1">
            <p className="text-5xl font-black text-white tracking-tighter">{total}</p>
          </div>
          <div className="mt-4 flex flex-col gap-1.5">
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-[70%]" />
            </div>
            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Storage Synchronized</p>
          </div>
        </div>
      </div>

      {/* TREE STRUCTURE */}
      <div className="space-y-8 pb-20">
        {tree.length > 0 ? (
          tree.filter(r => {
            if (!smartAuditMode) return true;
            const isDocRelevant = (d: DocumentItem) => {
              const s = String(d.status).toUpperCase();
              return !!d.isResubmitted && s === 'PENDING_REVIEW';
            };
            const isHeadingRelevant = (node: HeadingNode): boolean => {
              const docs = node.documents || node.files || [];
              if (docs.some(isDocRelevant)) return true;
              if (node.children && node.children.some(isHeadingRelevant)) return true;
              return false;
            };
            return isHeadingRelevant(r);
          }).map(r => (
            <TreeItem
              key={r.id}
              node={r}
              level={0}
              isReadOnly={isReadOnly}
              onRefresh={onRefresh}
              onComment={onComment}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
              highlightedDocId={highlightedDocId}
              highlightedHeadingId={highlightedHeadingId}
              smartAuditMode={smartAuditMode}
              headings={headings}
            />
          ))
        ) : (
          <div className="text-center py-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[50px]">
            <div className="h-24 w-24 bg-white rounded-[35px] shadow-sm flex items-center justify-center mx-auto mb-6 ring-1 ring-slate-100">
              <FolderOpen className="h-10 w-10 text-slate-200" />
            </div>
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No structural nodes detected in repository</p>
          </div>
        )}
      </div>
    </div>
  );
};
