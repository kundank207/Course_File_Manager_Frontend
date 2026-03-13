import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { CourseStructureTree, TreeNode, calculateCompletion, countFiles } from "@/components/CourseStructureTree";
import { EnhancedCourseFileView } from "@/components/EnhancedCourseFileView";
import { InlineCommentDialog } from "@/components/InlineCommentDialog";
import { Download, Save, HelpCircle, ArrowLeft, Upload, RefreshCw, Send, AlertCircle, LayoutGrid, MessageSquare, Archive } from "lucide-react";
import { authFetch } from "@/utils/authFetch";
import { useToast } from "@/hooks/use-toast";

const mockInitialStructure: TreeNode = {
  id: "root",
  name: "Loading Course...",
  level: 0,
  children: [],
  files: [],
  completed: false,
  isTemplateNode: true
};

// Convert backend tree response to frontend TreeNode format
const convertBackendToTreeNode = (
  backendNodes: any[],
  courseName: string,
  parentLevel: number = 0,
  isRootLevel: boolean = true
): TreeNode => {
  const children: TreeNode[] = backendNodes.map((node: any) => ({
    id: String(node.id),
    name: node.title,
    level: parentLevel + 1,
    children: node.children && node.children.length > 0
      ? node.children.map((child: any) => convertSingleNode(child, parentLevel + 1))
      : [],
    files: (node.files || []).map((f: any) => ({
      id: String(f.id),
      name: f.fileName,
      size: formatFileSize(f.fileSize),
      date: f.uploadedAt ? new Date(f.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
      version: f.versionNo || 1,
      status: f.status,
      reviewerFeedback: f.reviewerFeedback,
      teacherNote: f.teacherNote,
      isResubmitted: f.isResubmitted
    })),
    completed: (node.files || []).length > 0,
    isTemplateNode: node.parentHeadingId === null,
    needsFix: node.needsFix
  }));

  return {
    id: "root",
    name: courseName,
    level: 0,
    children,
    files: [],
    completed: false,
    isTemplateNode: true
  };
};

const convertSingleNode = (node: any, parentLevel: number): TreeNode => ({
  id: String(node.id),
  name: node.title,
  level: parentLevel + 1,
  children: node.children && node.children.length > 0
    ? node.children.map((child: any) => convertSingleNode(child, parentLevel + 1))
    : [],
  files: (node.files || []).map((f: any) => ({
    id: String(f.id),
    name: f.fileName,
    size: formatFileSize(f.fileSize),
    date: f.uploadedAt ? new Date(f.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
    version: f.versionNo || 1,
    status: f.status,
    reviewerFeedback: f.reviewerFeedback,
    teacherNote: f.teacherNote,
    isResubmitted: f.isResubmitted
  })),
  completed: (node.files || []).length > 0,
  isTemplateNode: node.parentHeadingId === null,
  needsFix: node.needsFix
});

const formatFileSize = (bytes: number): string => {
  if (!bytes) return '0 KB';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export default function CourseStructurePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [structure, setStructure] = useState<TreeNode>(mockInitialStructure);
  const [templateName, setTemplateName] = useState<string>("Course Template");
  const [courseCode, setCourseCode] = useState<string>("");
  const [courseFileId, setCourseFileId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [courseFileStatus, setCourseFileStatus] = useState<string>("DRAFT");
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showEnhancedView, setShowEnhancedView] = useState(false);
  const [showCommentsDialog, setShowCommentsDialog] = useState(false);
  const [creatingRevision, setCreatingRevision] = useState(false);

  const loadStructure = async (isInitial = false) => {
    if (!courseId) return;

    if (isInitial) setLoading(true);
    try {
      // Get course file details from localStorage (set during template selection)
      const storedTemplate = localStorage.getItem("temp_selected_template");
      const storedCourse = localStorage.getItem("temp_selected_course");

      let courseName = "Course Structure";
      let tplName = "Course Template";
      let cCode = "";

      if (storedTemplate && storedCourse) {
        const template = JSON.parse(storedTemplate);
        const course = JSON.parse(storedCourse);
        courseName = `${course.code} - ${course.title}`;
        tplName = template.name || "Course Template";
        cCode = course.code || "";
      }

      setTemplateName(tplName);
      setCourseCode(cCode);
      setCourseFileId(Number(courseId));

      // Fetch status and tree concurrently
      const [statusRes, treeRes] = await Promise.all([
        authFetch(`/api/teacher/course-files/${courseId}/status`),
        authFetch(`/api/teacher/headings/course-file/${courseId}/tree`)
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setCourseFileStatus(statusData.status || "DRAFT");
      }

      if (treeRes.ok) {
        const data = await treeRes.json();
        const tree = convertBackendToTreeNode(data, courseName);
        setStructure(tree);
      } else {
        // If no headings yet, show empty structure with course name
        setStructure({
          ...mockInitialStructure,
          name: courseName,
          children: []
        });
      }
    } catch (err) {
      console.error("Error loading structure:", err);
      toast({
        title: "Error",
        description: "Failed to load course structure",
        variant: "destructive"
      });
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    loadStructure(true);
  }, [courseId]);

  useEffect(() => {
    if (refreshKey > 0) {
      loadStructure(false);
    }
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleStructureChange = (newStructure: TreeNode) => {
    setStructure(newStructure);
  };

  const handleSubmit = async () => {
    if (!courseFileId) return;

    setSubmitting(true);
    try {
      const res = await authFetch(`/api/teacher/course-files/${courseFileId}/submit`, {
        method: 'POST'
      });

      if (res.ok) {
        const data = await res.json();
        setCourseFileStatus(data.status);
        toast({
          title: "Success",
          // description: "Course file submitted for review",/
          description: data.message,
        });
        setShowSubmitDialog(false);
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed to submit");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit course file",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRevision = async () => {
    if (!courseFileId) return;

    setCreatingRevision(true);
    try {
      const res = await authFetch(`/api/teacher/course-file/${courseFileId}/revision`, {
        method: "POST"
      });

      if (res.ok) {
        const data = await res.json();
        toast({
          title: "New Version Created",
          description: `Version ${data.revisionNumber} is now ready for editing as a DRAFT.`,
        });
        // Navigate to the new course file ID
        navigate(`/teacher/course-structure/${data.id}`, { replace: true });
        // The useEffect will handle loading the new data
        setRefreshKey(prev => prev + 1);
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed to create revision");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create new revision",
        variant: "destructive"
      });
    } finally {
      setCreatingRevision(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await authFetch('/api/teacher/reports/export/pdf');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Course_File_Report_${courseCode}_${new Date().getTime()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast({ title: "Report Generated", description: "Your course file report has been downloaded." });
      } else {
        throw new Error("Failed to generate report");
      }
    } catch (error: any) {
      toast({ title: "Export Error", description: error.message || "Failed to export report", variant: "destructive" });
    }
  };

  const handleDownloadArchive = async () => {
    if (!courseFileId) return;
    try {
      const res = await authFetch(`/api/archive/download/${courseFileId}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Course_Archive_${courseCode || 'Course_File'}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast({ title: "Archive Generated", description: "Your Course File ZIP archive is ready." });
      } else {
        // Try to get error message from backend
        let errMsg = "You don't have permission or the archive is not available yet.";
        try {
          const errData = await res.json();
          if (errData && errData.message) errMsg = errData.message;
        } catch (e) { }

        toast({ title: "Access Restricted", description: errMsg, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Download Failed", description: "An error occurred while generating the archive.", variant: "destructive" });
    }
  };

  const canSubmit = courseFileStatus === "DRAFT" ||
    courseFileStatus === "REJECTED" ||
    courseFileStatus === "RETURNED_BY_SUBJECT_HEAD" ||
    courseFileStatus === "RETURNED_BY_HOD";

  const getStatusBadge = () => {
    const statusConfig: Record<string, { className: string; label: string }> = {
      DRAFT: { className: "bg-gray-100 text-gray-700", label: "Draft" },
      SUBMITTED: { className: "bg-yellow-100 text-yellow-700", label: "Awaiting Subject Head Review" },
      UNDER_REVIEW_HOD: { className: "bg-blue-100 text-blue-700", label: "Awaiting HOD Final Approval" },
      RETURNED_BY_SUBJECT_HEAD: { className: "bg-orange-100 text-orange-700", label: "Revision Needed (Subject Head)" },
      RETURNED_BY_HOD: { className: "bg-red-100 text-red-700", label: "Revision Needed (HOD)" },
      APPROVED: { className: "bg-green-100 text-green-700", label: "Approved by Subject Head" },
      FINAL_APPROVED: { className: "bg-emerald-100 text-emerald-800 shadow-sm border border-emerald-200 font-bold", label: "FINAL APPROVED & ARCHIVED" },
    };
    const config = statusConfig[courseFileStatus] || { className: "bg-gray-100", label: courseFileStatus };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-muted-foreground">Loading course structure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full shadow-sm hover:shadow-md transition-all"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {getStatusBadge()}
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-none px-1">
            {structure.name}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1.5 px-1">
            <LayoutGrid className="h-3.5 w-3.5 text-blue-500" />
            {templateName} • {courseCode}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center justify-start md:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-9 px-3 text-xs md:text-sm shadow-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2 hidden sm:inline" />
            <RefreshCw className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 text-xs md:text-sm bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 shadow-sm"
            onClick={() => setShowEnhancedView(true)}
          >
            <LayoutGrid className="h-4 w-4 mr-2 hidden sm:inline" />
            <LayoutGrid className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">Grid View</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 text-xs md:text-sm bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 shadow-sm"
            onClick={() => setShowCommentsDialog(true)}
          >
            <MessageSquare className="h-4 w-4 mr-2 hidden sm:inline" />
            <MessageSquare className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">Comments</span>
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadArchive}
            className="h-9 px-3 text-xs md:text-sm bg-slate-900 hover:bg-black text-white shadow-sm transition-all"
          >
            <Archive className="h-4 w-4 mr-2 hidden sm:inline" />
            <Archive className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">Archive ZIP</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-9 px-3 text-xs md:text-sm shadow-sm"
          >
            <Download className="h-4 w-4 mr-2 hidden sm:inline" />
            <Download className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">Export PDF</span>
          </Button>

          {canSubmit && (
            <Button
              size="sm"
              className="h-9 px-4 text-xs md:text-sm bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100 font-bold"
              onClick={() => setShowSubmitDialog(true)}
            >
              <Send className="h-4 w-4 mr-2" />
              Submit
            </Button>
          )}

          {(courseFileStatus === "APPROVED" || courseFileStatus === "FINAL_APPROVED") && (
            <Button
              size="sm"
              className="h-9 px-4 text-xs md:text-sm bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 font-bold"
              onClick={handleCreateRevision}
              disabled={creatingRevision}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${creatingRevision ? 'animate-spin' : ''}`} />
              Revision
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-4 md:p-6">
            <div className="text-center">
              <p className="text-lg md:text-2xl font-bold text-slate-900">{calculateCompletion(structure)}%</p>
              <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider">Completion</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-4 md:p-6">
            <div className="text-center">
              <p className="text-lg md:text-2xl font-bold text-slate-900">{countFiles(structure)}</p>
              <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Files</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-4 md:p-6">
            <div className="text-center">
              <p className="text-lg md:text-2xl font-bold text-slate-900">{structure.children.length}</p>
              <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider">Main Units</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="text-center flex flex-col items-center justify-center">
              <Badge variant="outline" className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border-emerald-200 px-2 py-0">SUPERVISED</Badge>
              <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">Ownership</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* REVISION/FIX HUB (Show if there are flagged items) */}
      {(() => {
        const flaggedDocs: { id: string, name: string, status: string, feedback: string, heading: string }[] = [];
        const findFlagged = (node: TreeNode) => {
          node.files.forEach(f => {
            const s = f.status?.toUpperCase();
            if (s === 'REJECTED' || s === 'CHANGES_REQUESTED') {
              flaggedDocs.push({ id: f.id, name: f.name, status: s, feedback: f.reviewerFeedback || "", heading: node.name });
            }
          });
          node.children.forEach(findFlagged);
        };
        findFlagged(structure);

        if (flaggedDocs.length > 0) {
          return (
            <Card className="border-red-200 bg-red-50/50 shadow-md animate-in fade-in slide-in-from-top-4 duration-500">
              <CardHeader className="py-3 border-b border-red-100 bg-red-100/30">
                <CardTitle className="text-sm font-black flex items-center gap-2 text-red-800 uppercase tracking-tighter">
                  <AlertCircle className="h-4 w-4 animate-bounce" />
                  Required Fixes Hub ({flaggedDocs.length} items flagged)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {flaggedDocs.map(doc => (
                    <div
                      key={doc.id}
                      onClick={() => {
                        const el = document.getElementById(`doc-${doc.id}`);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          el.classList.add('ring-4', 'ring-red-500', 'ring-offset-2', 'bg-red-50');
                          setTimeout(() => el.classList.remove('ring-4', 'ring-red-500', 'ring-offset-2', 'bg-red-50'), 3000);
                        }
                      }}
                      className="p-3 bg-white border border-red-100 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <Badge variant="destructive" className="text-[8px] h-4 px-1">{doc.status.replace('_', ' ')}</Badge>
                        <span className="text-[9px] font-black text-slate-400">JUMP TO FILE →</span>
                      </div>
                      <p className="text-xs font-black text-slate-800 truncate mb-1">{doc.name}</p>
                      <div className="text-[10px] text-red-600 bg-red-50/50 p-2 rounded-lg border border-red-50 line-clamp-2">
                        "{doc.feedback || "Feedback required"}"
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        }
        return null;
      })()}

      {/* Main Content */}
      <Tabs defaultValue="structure" className="space-y-4">
        <TabsList>
          <TabsTrigger value="structure">Course Structure</TabsTrigger>
          <TabsTrigger value="guide">How to Use</TabsTrigger>
        </TabsList>

        {/* Structure Tab */}
        <TabsContent value="structure">
          <CourseStructureTree
            templateName={templateName}
            courseCode={courseCode}
            courseFileId={courseFileId}
            initialStructure={structure}
            onStructureChange={handleStructureChange}
            onRefresh={handleRefresh}
            status={courseFileStatus}
          />
        </TabsContent>

        {/* Guide Tab */}
        <TabsContent value="guide" className="space-y-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-600" />
                How to Manage Your Course Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-3">
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white font-bold text-xs">1</div>
                <div>
                  <strong>Add Sub-Sections:</strong> Click the menu (⋮) on any section and select "Add Sub-Section"
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white font-bold text-xs">2</div>
                <div>
                  <strong>Upload Files:</strong> Click the <Upload className="h-3 w-3 inline" /> icon on any section to upload files
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white font-bold text-xs">3</div>
                <div>
                  <strong>Template Sections:</strong> Sections marked with <Badge variant="outline" className="text-[10px] h-4 px-1 bg-blue-50 text-blue-700">Template</Badge> cannot be renamed or deleted
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-green-600" />
              Submit Course File for Review
            </DialogTitle>
            <DialogDescription>
              Once submitted, your course file will be sent to the Subject Head for review.
              You will not be able to edit the course file until it is returned or approved.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Before you submit</p>
                  <ul className="text-sm text-amber-700 mt-1 space-y-1">
                    <li>• Ensure all required documents are uploaded</li>
                    <li>• Check that file names are correct</li>
                    <li>• Verify all sections are complete</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {submitting ? "Submitting..." : "Submit for Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Structured View */}
      {showEnhancedView && courseFileId && (
        <EnhancedCourseFileView
          courseFileId={courseFileId}
          courseName={structure.name}
          courseCode={courseCode}
          onClose={() => setShowEnhancedView(false)}
        />
      )}

      {/* Comments Dialog for viewing/replying to HOD/Subject Head comments */}
      {showCommentsDialog && courseFileId && (
        <InlineCommentDialog
          courseFileId={courseFileId}
          isOpen={showCommentsDialog}
          onClose={() => setShowCommentsDialog(false)}
        />
      )}
    </div>
  );
}
