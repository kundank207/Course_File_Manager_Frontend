import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  FolderOpen,
  Plus,
  Upload,
  MoreVertical,
  Trash2,
  Edit2,
  Download,
  X,
  Loader2,
  Eye,
  ExternalLink,
  MessageSquare,
  CheckSquare,
  AlertTriangle,
  RotateCcw,
  Flag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { authFetch } from "@/utils/authFetch";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { FileViewerModal } from "./FileViewerModal";
import { ResubmitDialog } from "./ResubmitDialog";

export interface CourseFile {
  id: string;
  name: string;
  size?: string;
  date?: string;
  version?: number;
  status?: string;
  reviewerFeedback?: string;
  teacherNote?: string;
  isResubmitted?: boolean;
}

export interface TreeNode {
  id: string;
  name: string;
  level: number;
  children: TreeNode[];
  files: CourseFile[];
  completed: boolean;
  isTemplateNode?: boolean;
  needsFix?: boolean;
}

interface CourseStructureTreeProps {
  templateName?: string;
  courseName?: string;
  courseCode?: string;
  courseFileId?: number | null;
  initialStructure: TreeNode;
  onStructureChange: (structure: TreeNode) => void;
  onRefresh?: () => void;
  onOpenComment?: (target: { headingId?: number; documentId?: number; headingTitle?: string; fileName?: string }) => void;
  status?: string;
}

export const calculateCompletion = (node: TreeNode): number => {
  let totalSections = 0;
  let completedSections = 0;

  const traverse = (n: TreeNode) => {
    // Skip the root container node for percentage calculation
    if (n.id !== "root") {
      totalSections++;
      if (n.files.length > 0 || n.completed) {
        completedSections++;
      }
    }
    n.children.forEach(traverse);
  };

  traverse(node);
  return totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
};

export const countFiles = (node: TreeNode): number => {
  let count = node.files.length;
  node.children.forEach(child => {
    count += countFiles(child);
  });
  return count;
};

export function CourseStructureTree({
  templateName,
  courseCode,
  courseFileId,
  initialStructure,
  onStructureChange,
  onRefresh,
  status
}: CourseStructureTreeProps) {
  const { activeRole } = useAuth();
  const [data, setData] = useState<TreeNode>(initialStructure);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const highlightedDocId = searchParams.get('docId');
  const highlightedHeadingId = searchParams.get('headingId');

  const completion = calculateCompletion(data);
  const totalFiles = countFiles(data);

  // Persistence: Track all open nodes globally in this tree
  const storageKey = `expanded_nodes_${courseFileId}`;

  const [openNodeIds, setOpenNodeIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Error loading expanded nodes", e);
    }
    return new Set(["root"]);
  });

  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const lastScrolledId = useRef<string | null>(null);
  const initialExpandTriggered = useRef(false);

  // Sync openNodeIds to localStorage
  useEffect(() => {
    if (courseFileId) {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(openNodeIds)));
    }
  }, [openNodeIds, storageKey, courseFileId]);

  const toggleNode = (nodeId: string) => {
    setOpenNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  useEffect(() => {
    const paths = new Set<string>();
    let foundAny = false;

    const checkNode = (node: TreeNode, path: string[]) => {
      let containsFlagged = false;

      // Check files in this node
      if (node.files.some(f => {
        const s = f.status?.toString().toUpperCase();
        return (s === 'REJECTED' || s === 'CHANGES_REQUESTED' || String(f.id) === highlightedDocId);
      })) {
        containsFlagged = true;
      }

      // Check highlighted heading
      if (String(node.id) === highlightedHeadingId) {
        containsFlagged = true;
      }

      // Check children
      node.children.forEach(child => {
        if (checkNode(child, [...path, node.id])) {
          containsFlagged = true;
        }
      });

      if (containsFlagged) {
        path.forEach(p => paths.add(p));
        paths.add(node.id);
        foundAny = true;
      }
      return containsFlagged;
    };

    checkNode(data, []);
    // Initial expand only: Don't keep forcing it if the user manually closes things later
    if (foundAny && !initialExpandTriggered.current) {
      setExpandedPaths(paths);
      setOpenNodeIds(prev => new Set([...Array.from(prev), ...Array.from(paths)]));
      initialExpandTriggered.current = true;
    }
  }, [data, highlightedDocId, highlightedHeadingId]);

  // Sync data when initialStructure prop changes
  useEffect(() => {
    setData(initialStructure);
  }, [initialStructure]);

  // Handle scrolling to highlighted items
  useEffect(() => {
    const currentId = highlightedDocId ? `doc-${highlightedDocId}` : highlightedHeadingId ? `heading-${highlightedHeadingId}` : null;

    // Check if we already scrolled to this highlight in this session to prevent re-scrolling on state refreshes
    const sessionKey = `scrolled_${courseFileId}_${currentId}`;
    const alreadyScrolled = currentId ? window.sessionStorage.getItem(sessionKey) : 'false';

    if (currentId && !alreadyScrolled) {
      const scrollWithRetry = (attempts = 0) => {
        const id = highlightedDocId ? `doc-${highlightedDocId}` : `heading-${highlightedHeadingId}`;
        const element = document.getElementById(id);

        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-4', 'ring-blue-500', 'ring-offset-4', 'border-blue-500', 'bg-blue-50');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-blue-500', 'ring-offset-4', 'border-blue-500', 'bg-blue-50');
          }, 5000);

          window.sessionStorage.setItem(sessionKey, 'true');
          lastScrolledId.current = currentId;
        } else if (attempts < 5) {
          setTimeout(() => scrollWithRetry(attempts + 1), 500);
        }
      };

      scrollWithRetry();
    }
  }, [highlightedDocId, highlightedHeadingId, expandedPaths, courseFileId]);

  // FIND ALL FLAGGED ITEMS FOR TEACHER ALERT
  const flaggedItems: CourseFile[] = [];
  const findFlagged = (node: TreeNode) => {
    node.files.forEach(f => {
      const s = f.status?.toString().toUpperCase();
      if (s === 'REJECTED' || s === 'CHANGES_REQUESTED') flaggedItems.push(f);
    });
    node.children.forEach(findFlagged);
  };
  findFlagged(data);

  return (
    <div className="space-y-4">
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
              const el = document.getElementById(`doc-${flaggedItems[0].id}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-4', 'ring-red-500', 'ring-offset-2', 'bg-red-50');
                setTimeout(() => el.classList.remove('ring-4', 'ring-red-500', 'ring-offset-2', 'bg-red-50'), 3000);
              }
            }}
          >
            Jump to First Conflict
          </Button>
        </div>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gradient-to-r from-slate-50 to-blue-50/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Template: {templateName || "Course Syllabus Template"}</p>
            </div>
            <Badge
              variant="secondary"
              className={cn(
                "text-xs font-medium",
                completion >= 75 ? "bg-green-100 text-green-700" :
                  completion >= 50 ? "bg-blue-100 text-blue-700" :
                    "bg-orange-100 text-orange-700"
              )}
            >
              {completion}% Complete
            </Badge>
          </div>
        </div>

        <div className="p-4">
          <RootSectionNode
            node={data}
            courseCode={courseCode || ""}
            courseFileId={courseFileId || null}
            onRefresh={onRefresh}
            status={status}
            expandedPaths={expandedPaths}
            openNodeIds={openNodeIds}
            onToggle={toggleNode}
          />
        </div>
      </div>
    </div>
  );
}

interface RootSectionNodeProps {
  node: TreeNode;
  courseCode: string;
  courseFileId: number | null;
  onRefresh?: () => void;
  status?: string;
  expandedPaths: Set<string>;
  openNodeIds: Set<string>;
  onToggle: (id: string) => void;
}

function RootSectionNode({ node, courseCode, courseFileId, onRefresh, status, expandedPaths, openNodeIds, onToggle }: RootSectionNodeProps) {
  const isOpen = openNodeIds.has(node.id);
  const completion = calculateCompletion(node);
  const fileCount = countFiles(node);

  return (
    <div className="space-y-2">
      <div
        className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 cursor-pointer hover:border-blue-200 transition-colors"
        onClick={() => onToggle(node.id)}
      >
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-blue-100">
          {isOpen ? <ChevronDown className="h-4 w-4 text-blue-600" /> : <ChevronRight className="h-4 w-4 text-blue-600" />}
        </Button>

        <FolderOpen className="h-5 w-5 text-blue-600" />

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-900">{node.name}</span>
            <Badge variant="outline" className="text-xs bg-white">{fileCount} files</Badge>
          </div>
        </div>

        <div className="w-48 hidden md:block">
          <Progress value={completion} className="h-2" />
        </div>
      </div>

      {isOpen && (
        <div className="ml-4 space-y-2 border-l-2 border-blue-100 pl-4">
          {node.children.map(child => (
            <SectionNode
              key={child.id}
              node={child}
              courseCode={courseCode}
              courseFileId={courseFileId}
              onRefresh={onRefresh}
              depth={1}
              status={status}
              expandedPaths={expandedPaths}
              openNodeIds={openNodeIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SectionNodeProps {
  node: TreeNode;
  courseCode: string;
  courseFileId: number | null;
  onRefresh?: () => void;
  depth: number;
  status?: string;
  expandedPaths: Set<string>;
  parentIsEditable?: boolean;
  openNodeIds: Set<string>;
  onToggle: (id: string) => void;
}

function SectionNode({
  node,
  courseCode,
  courseFileId,
  onRefresh,
  depth,
  status,
  expandedPaths,
  parentIsEditable = false,
  openNodeIds,
  onToggle
}: SectionNodeProps) {
  const isOpen = openNodeIds.has(node.id);
  const isAutoExpanded = expandedPaths.has(node.id);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [searchParams] = useSearchParams();
  const highlightedDocId = searchParams.get('docId');

  // Logic: Editable if DRAFT or any type of return status (Revision Needed)
  const isLockedStatus =
    status === "SUBMITTED" ||
    status === "UNDER_REVIEW_HOD" ||
    status === "APPROVED" ||
    status === "FINAL_APPROVED" ||
    status === "ARCHIVED";

  // A section is editable if the overall status allows editing (is NOT locked)
  const isEditable = !isLockedStatus;

  const canModifyStructure = isEditable;
  const canUpload = isEditable;
  const canDeleteFile = isEditable;

  const hasChildren = node.children.length > 0 || node.files.length > 0;
  const fileCount = countFiles(node);
  const completion = calculateCompletion(node);

  const handleSaveEdit = async () => {
    if (!editName.trim() || node.isTemplateNode) return;

    setIsLoading(true);
    try {
      const res = await authFetch(`/api/teacher/headings/${node.id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: editName.trim() })
      });

      if (res.ok) {
        toast({ title: "Success", description: "Section renamed" });
        onRefresh?.();
      } else {
        throw new Error("Failed to rename");
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to rename section", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsEditing(false);
    }
  };

  const handleAddSub = async () => {
    if (!newSubName.trim() || !courseFileId) return;

    setIsLoading(true);
    try {
      const res = await authFetch('/api/teacher/headings', {
        method: 'POST',
        body: JSON.stringify({
          courseFileId: courseFileId,
          parentHeadingId: Number(node.id),
          title: newSubName.trim(),
          orderIndex: node.children.length + 1
        })
      });

      if (res.ok) {
        toast({ title: "Success", description: "Sub-section added" });
        onRefresh?.();
      } else {
        throw new Error("Failed to add");
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to add sub-section", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setNewSubName("");
      setIsAddingSub(false);
      // Ensure the node is open after adding a sub
      if (!isOpen) onToggle(node.id);
    }
  };

  const handleDelete = async () => {
    if (node.isTemplateNode) return;

    setIsLoading(true);
    try {
      const res = await authFetch(`/api/teacher/headings/${node.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast({ title: "Success", description: "Section deleted" });
        onRefresh?.();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete section", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('headingId', node.id);
      formData.append('courseCode', courseCode || 'UNKNOWN');

      // Get token from courseflow_auth storage
      const authStr = localStorage.getItem('courseflow_auth');
      const auth = authStr ? JSON.parse(authStr) : null;
      const token = auth?.token;

      if (!token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch('/api/teacher/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        toast({ title: "Success", description: `File "${file.name}" uploaded` });
        onRefresh?.();
      } else {
        const errorData = await res.text();
        console.error("Upload error:", res.status, errorData);
        throw new Error(errorData || "Upload failed");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to upload file", variant: "destructive" });
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    setIsLoading(true);
    try {
      const res = await authFetch(`/api/teacher/documents/${fileId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast({ title: "Success", description: "File deleted" });
        onRefresh?.();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Delete failed");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete file", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      const authStr = localStorage.getItem('courseflow_auth');
      const auth = authStr ? JSON.parse(authStr) : null;
      const token = auth?.token;

      const res = await fetch(`/api/teacher/documents/download/${fileId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to download file", variant: "destructive" });
    }
  };

  const bgColors = [
    "bg-amber-50 border-amber-200 hover:border-amber-300",
    "bg-green-50 border-green-200 hover:border-green-300",
    "bg-purple-50 border-purple-200 hover:border-purple-300",
    "bg-pink-50 border-pink-200 hover:border-pink-300"
  ];
  const bgClass = bgColors[(depth - 1) % bgColors.length];

  return (
    <div className="space-y-2">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileUpload}
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
      />

      <div
        id={`heading-${node.id}`}
        className={cn(
          "group flex items-center gap-2 p-3 rounded-lg border transition-all",
          bgClass,
          isLoading && "opacity-50"
        )}>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => onToggle(node.id)}
          disabled={isLoading}
        >
          {hasChildren ? (
            isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
          )}
        </Button>

        <div className="flex-1 flex items-center gap-2">
          {isEditing ? (
            <div className="flex gap-2 items-center">
              <Input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="h-8 text-sm max-w-[200px]"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
              />
              <Button size="sm" variant="default" onClick={handleSaveEdit} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          ) : (
            <>
              <span className={cn("font-medium text-sm", node.isTemplateNode && "text-slate-700")}>
                {node.name}
              </span>
              {node.isTemplateNode && (
                <Badge variant="outline" className="text-[10px] h-4 px-1 bg-white border-blue-200 text-blue-600">Template</Badge>
              )}
              {fileCount > 0 && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{fileCount} files</Badge>
              )}
            </>
          )}
        </div>

        {node.children.length > 0 && (
          <div className="w-32 hidden lg:block">
            <Progress value={completion} className="h-1.5" />
          </div>
        )}

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}

          {canUpload && (
            <Button variant="ghost" size="sm" className="h-7 w-7" onClick={() => fileInputRef.current?.click()} disabled={isLoading} title="Upload File">
              <Upload className="h-3.5 w-3.5 text-blue-600" />
            </Button>
          )}

          {canModifyStructure && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7" disabled={isLoading}>
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => {
                  setIsAddingSub(true);
                  if (!isOpen) onToggle(node.id);
                }}>
                  <Plus className="h-4 w-4 mr-2" /> Add Sub-Section
                </DropdownMenuItem>
                {!node.isTemplateNode && (
                  <>
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit2 className="h-4 w-4 mr-2" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete Section
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {isAddingSub && (
        <div className="ml-8 flex gap-2 items-center p-2 bg-muted/50 rounded-lg border border-dashed">
          <Input
            placeholder="New sub-section name..."
            value={newSubName}
            onChange={e => setNewSubName(e.target.value)}
            className="h-8 text-sm flex-1"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleAddSub()}
          />
          <Button size="sm" onClick={handleAddSub} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsAddingSub(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isOpen && hasChildren && (
        <div className="ml-6 space-y-1.5 border-l-2 border-muted pl-4">
          {node.files.map(file => (
            <FileItem
              key={file.id}
              file={file}
              onDelete={() => handleDeleteFile(file.id)}
              onDownload={() => handleDownloadFile(file.id, file.name)}
              onRefresh={onRefresh}
              isEditable={canDeleteFile}
              overallStatus={status}
            />
          ))}

          {node.children.map(child => (
            <SectionNode
              key={child.id}
              node={child}
              courseCode={courseCode}
              courseFileId={courseFileId}
              onRefresh={onRefresh}
              depth={depth + 1}
              status={status}
              expandedPaths={expandedPaths}
              parentIsEditable={isEditable}
              openNodeIds={openNodeIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}



interface FileItemProps {
  file: CourseFile;
  onDelete: () => void;
  onDownload: () => void;
  onRefresh?: () => void;
  isEditable?: boolean;
  overallStatus?: string;
}

function FileItem({ file, onDelete, onDownload, onRefresh, isEditable = true, overallStatus }: FileItemProps) {
  const { activeRole } = useAuth();
  const [searchParams] = useSearchParams();

  // Strict File Locking
  // Can only delete/replace if the overall status allows editing
  const isLockedStatus =
    overallStatus === "SUBMITTED" ||
    overallStatus === "UNDER_REVIEW_HOD" ||
    overallStatus === "APPROVED" ||
    overallStatus === "FINAL_APPROVED" ||
    overallStatus === "ARCHIVED";

  // Permissions for editing: either status is DRAFT/REJECTED or the file itself is flagged
  const isFlagged = file.status?.toString().toUpperCase() === 'REJECTED' ||
    file.status?.toString().toUpperCase() === 'CHANGES_REQUESTED';

  const canModify = !isLockedStatus || isFlagged;

  const [isViewing, setIsViewing] = useState(false);
  const [showViewOptions, setShowViewOptions] = useState(false);
  const [isResubmitOpen, setIsResubmitOpen] = useState(false);
  const handleOpenInNewTab = () => {
    const authStr = localStorage.getItem('courseflow_auth');
    const auth = authStr ? JSON.parse(authStr) : null;
    const token = auth?.token;

    if (token) {
      // Fetch the file and open in new tab
      fetch(`/api/teacher/documents/view/${file.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
        })
        .catch(err => console.error('Error opening file:', err));
    }
    setShowViewOptions(false);
  };

  const handleOpenInside = () => {
    setShowViewOptions(false);
    setIsViewing(true);
  };

  useEffect(() => {
    if (String(file.id) === searchParams.get('docId')) {
      const el = document.getElementById(`doc-${file.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Pulse effect is already handled by the Badge in the render
      }
    }
  }, [searchParams, file.id]);

  return (
    <>
      <div
        id={`doc-${file.id}`}
        className="group flex items-center gap-3 p-2.5 rounded-lg bg-white border hover:border-slate-300 hover:shadow-sm transition-all"
      >  <FileText className="h-4 w-4 text-orange-500 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {file.size} • v{file.version || 1} • {file.date}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {String(file.id) === searchParams.get('docId') && (
            <Badge className="bg-blue-600 text-white animate-pulse">HIGHLIGHTED ITEM</Badge>
          )}
          {(file.status?.toString().toUpperCase() === 'REJECTED' || file.status?.toString().toUpperCase() === 'CHANGES_REQUESTED') && (
            <Badge variant="destructive" className="text-[9px] font-black animate-pulse">FIX REQUIRED</Badge>
          )}
          {file.isResubmitted && (file.status?.toString().toUpperCase() === 'PENDING_REVIEW' || file.status?.toString().toUpperCase() === 'SUBMITTED' || file.status?.toString().toUpperCase() === 'DRAFT') && (
            <Badge className="bg-indigo-600 text-white text-[9px] font-black shadow-lg shadow-indigo-200 animate-pulse flex items-center gap-1 border-none px-2 py-1">
              <CheckSquare className="h-3 w-3" />
              NEW FIX APPLIED
            </Badge>
          )}

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" className="h-7 w-7" onClick={() => setShowViewOptions(true)} title="View">
              <Eye className="h-3.5 w-3.5 text-blue-600" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7" onClick={onDownload} title="Download">
              <Download className="h-3.5 w-3.5 text-blue-600" />
            </Button>

            {/* Teacher Fix Action */}
            {activeRole === 'TEACHER' && isFlagged && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                onClick={() => setIsResubmitOpen(true)}
                title="Replace with fix"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}

            {isEditable && canModify && (
              <Button variant="ghost" size="sm" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={onDelete} title="Delete">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Resubmit Dialog */}
      {isResubmitOpen && (
        <ResubmitDialog
          document={{ id: parseInt(file.id), fileName: file.name }}
          isOpen={isResubmitOpen}
          onClose={() => setIsResubmitOpen(false)}
          onSuccess={() => {
            setIsResubmitOpen(false);
            onRefresh?.();
          }}
        />
      )}

      {/* FEEDBACK BLOCK */}
      {(file.status?.toString().toUpperCase() === 'REJECTED' || file.status?.toString().toUpperCase() === 'CHANGES_REQUESTED') && (file.reviewerFeedback || file.isResubmitted === false) && (
        <div className="mt-2 ml-7 bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-700 shadow-sm animate-in slide-in-from-top-2">
          <div className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-bold uppercase text-[9px] mb-1 opacity-70 tracking-widest">Reviewer Feedback</p>
              <p className="font-semibold leading-relaxed">{file.reviewerFeedback || "Needs attention or replacement."}</p>
            </div>
          </div>
        </div>
      )}

      {/* View Options Dialog */}
      {showViewOptions && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowViewOptions(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">View Document</h3>
            <p className="text-sm text-muted-foreground mb-5">
              How would you like to view <span className="font-medium text-foreground">{file.name}</span>?
            </p>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleOpenInside}
                className="w-full justify-start gap-3 h-12"
                variant="outline"
              >
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Eye className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Open Inside</p>
                  <p className="text-xs text-muted-foreground">View in resizable modal</p>
                </div>
              </Button>

              <Button
                onClick={handleOpenInNewTab}
                className="w-full justify-start gap-3 h-12"
                variant="outline"
              >
                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <ExternalLink className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Open in New Tab</p>
                  <p className="text-xs text-muted-foreground">Opens in a new browser tab</p>
                </div>
              </Button>
            </div>

            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => setShowViewOptions(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <FileViewerModal
        isOpen={isViewing}
        onClose={() => setIsViewing(false)}
        fileId={file.id}
        fileName={file.name}
      />
    </>
  );
}

