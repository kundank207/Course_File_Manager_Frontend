import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Plus, Trash2, Upload, Download, Edit2, Check, X, FolderOpen, FileText, Bell } from "lucide-react";
import { course_files, headings, documents, course_teacher, courses, templates } from "@/lib/dummy-data";

// ========== DATABASE ENTITY INTERFACES ==========
interface Document {
  id: number;
  heading_id: number;
  uploaded_by: number;
  file_name: string;
  file_path: string;
  type: string;
  file_size: number;
  version_no: number;
  uploaded_at: string;
}

interface Heading {
  id: number;
  course_file_id: number;
  parent_heading_id: number | null;
  title: string;
  order_index: number;
}

interface TreeNode {
  id: number;
  heading_id: number;
  parent_heading_id: number | null;
  title: string;
  order_index: number;
  children: TreeNode[];
  documents: Document[];
}

export default function TeacherNotesUploadPage() {
  const [selectedCourseFileId, setSelectedCourseFileId] = useState<number>(1);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set([0]));
  const [editingNode, setEditingNode] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Get current teacher's assigned courses
  const teacherAssignments = course_teacher.filter(ct => ct.teacher_id === 1); // teacher_id = 1 (Dr. Rajesh)
  const myAssignedCourses = courses.filter(c => teacherAssignments.some(ta => ta.course_id === c.id));

  // Get current course file
  const currentCourseFile = course_files.find(cf => cf.id === selectedCourseFileId);
  const currentCourse = courses.find(c => c.id === currentCourseFile?.course_id);

  // Build tree structure from Heading table
  const buildTreeFromHeadings = (): TreeNode[] => {
    const headingsByFile = headings.filter(h => h.course_file_id === selectedCourseFileId);
    const nodeMap = new Map<number, TreeNode>();

    headingsByFile.forEach(h => {
      const nodeDocuments = documents.filter(d => d.heading_id === h.id);
      nodeMap.set(h.id, {
        id: h.id,
        heading_id: h.id,
        parent_heading_id: h.parent_heading_id,
        title: h.title,
        order_index: h.order_index,
        children: [],
        documents: nodeDocuments,
      });
    });

    const roots: TreeNode[] = [];
    nodeMap.forEach(node => {
      if (node.parent_heading_id === null) {
        roots.push(node);
      } else {
        const parent = nodeMap.get(node.parent_heading_id);
        if (parent) parent.children.push(node);
      }
    });

    return roots.sort((a, b) => a.order_index - b.order_index);
  };

  const tree = buildTreeFromHeadings();

  const toggleNode = (nodeId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const calculateProgress = (nodes: TreeNode[]): { completed: number; total: number } => {
    let completed = 0;
    let total = 0;

    const traverse = (n: TreeNode) => {
      if (n.documents.length > 0) {
        completed += n.documents.length;
      }
      total += n.documents.length;

      n.children.forEach(traverse);
    };

    nodes.forEach(traverse);
    if (total === 0) total = 1;
    return { completed, total };
  };

  const progress = calculateProgress(tree);
  const progressPercent = (progress.completed / progress.total) * 100;

  const renderTreeNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="space-y-2">
        {/* Node Header */}
        <div className="flex items-center gap-2 p-3 bg-card border rounded-lg hover:bg-muted/50 transition-colors group">
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="p-0.5 hover:bg-muted rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}

          <FolderOpen className="h-4 w-4 text-amber-600" />

          <div className="flex-1 min-w-0">
            {editingNode === node.id ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  className="h-7 text-sm"
                  autoFocus
                />
                <Button size="sm" className="h-7 px-2">
                  <Check className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div>
                <p className="font-medium text-sm truncate">{node.title}</p>
                {node.documents.length > 0 && (
                  <p className="text-xs text-green-600">✓ {node.documents.length} document(s)</p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingNode(node.id)}>
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            {hasChildren && (
              <Button size="icon" variant="ghost" className="h-7 w-7">
                <Plus className="h-3.5 w-3.5 text-green-600" />
              </Button>
            )}
            <Button size="icon" variant="ghost" className="h-7 w-7">
              <Trash2 className="h-3.5 w-3.5 text-red-600" />
            </Button>
          </div>
        </div>

        {/* Documents List */}
        {node.documents.length > 0 && isExpanded && (
          <div className="ml-6 space-y-2">
            {node.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm group border border-muted"
              >
                <div className="flex items-center gap-2 flex-1">
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  <div>
                    <p className="font-medium text-xs">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      v{doc.version_no} • {Math.round(doc.file_size / 1024)} KB • {doc.uploaded_at}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-6 w-6">
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6">
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6">
                    <Trash2 className="h-3 w-3 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {isExpanded && (
          <div className="ml-6">
            <Button size="sm" variant="outline" className="h-8 text-xs">
              <Upload className="h-3 w-3 mr-1" />
              Upload Document
            </Button>
          </div>
        )}

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-6 space-y-2 border-l-2 border-muted pl-2">
            {node.children.sort((a, b) => a.order_index - b.order_index).map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Course File Manager</h1>
          <p className="text-muted-foreground mt-1">
            {currentCourse?.code} - {currentCourse?.title} | {currentCourseFile?.academic_year}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setShowTemplateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Use Template
          </Button>
        </div>
      </div>

      {/* Course File Status */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <Badge>{currentCourseFile?.status}</Badge>
            <p className="text-xs text-muted-foreground mt-2">File Status</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{progress.completed}/{progress.total}</p>
            <p className="text-xs text-muted-foreground">Sections Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{Math.round(progressPercent)}%</p>
            <p className="text-xs text-muted-foreground">Overall Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{documents.filter(d => headings.find(h => h.course_file_id === selectedCourseFileId && h.id === d.heading_id)).length}</p>
            <p className="text-xs text-muted-foreground">Total Documents</p>
          </CardContent>
        </Card>
      </div>

      {/* Course File Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Assigned Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {myAssignedCourses.map((course) => (
              <div
                key={course.id}
                onClick={() => setSelectedCourseFileId(course_files.find(cf => cf.course_id === course.id)?.id || 1)}
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  currentCourse?.id === course.id
                    ? "border-blue-600 bg-blue-50"
                    : "border-border hover:border-blue-300"
                }`}
              >
                <p className="font-medium text-sm">
                  {course.code} - {course.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {course_teacher.find(ct => ct.course_id === course.id)?.section} Section
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Choose Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-3 border-2 rounded-lg cursor-pointer hover:border-blue-600 transition-all"
                >
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                  <div className="mt-2 space-y-1">
                    {template.structure.map((section, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground">• {section}</p>
                    ))}
                  </div>
                </div>
              ))}
              <Button onClick={() => setShowTemplateModal(false)} className="w-full mt-4">
                Done
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Course Structure Tree */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Course Structure</CardTitle>
          <Progress value={progressPercent} className="h-2 flex-1 ml-4 max-w-[200px]" />
        </CardHeader>
        <CardContent className="space-y-4">
          {tree.length > 0 ? (
            <div className="space-y-3">
              {tree.map((node) => renderTreeNode(node))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No headings yet. Use a template to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Heading
        </Button>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Upload className="h-4 w-4 mr-2" />
          Submit Course File
        </Button>
      </div>

      {/* API ENDPOINTS FOR BACKEND DEVELOPER */}
      {/* 
      
      ========== REQUIRED BACKEND API ENDPOINTS ==========
      
      1. GET /api/course-files/:courseFileId
         Returns: Course_File with nested Heading tree and Document list
         Maps: course_files -> headings -> documents
      
      2. POST /api/headings
         Payload: { course_file_id, parent_heading_id, title, order_index }
         Maps: INSERT INTO Heading table
      
      3. PUT /api/headings/:headingId
         Payload: { title, order_index, parent_heading_id }
         Maps: UPDATE Heading table
      
      4. DELETE /api/headings/:headingId
         Maps: DELETE FROM Heading table
      
      5. POST /api/documents/upload
         Payload: FormData { heading_id, file, uploaded_by }
         Creates: Document record, stores file_path
         Maps: INSERT INTO Document table
      
      6. DELETE /api/documents/:documentId
         Maps: DELETE FROM Document table
      
      7. GET /api/course-teacher/:teacherId/courses
         Returns: All courses assigned to teacher
         Maps: Course_Teacher, Course tables
      
      8. POST /api/course-files/:courseFileId/submit
         Updates: Course_File.status = 'SUBMITTED'
         Creates: Activity_Log entry
      
      9. GET /api/approvals/pending/:approverId
         Returns: Pending approvals for HOD
         Maps: Approval table with Course_File details
      
      10. PUT /api/approvals/:approvalId
          Payload: { status, comment }
          Updates: Approval.status, creates Notification
      
      11. POST /api/notifications/:userId/mark-read
      
      12. GET /api/activity-logs?targetType=Document&targetId=X
          Maps: Activity_Log table
      
      */}
    </div>
  );
}
