import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { approvals, course_files, courses, teachers } from "@/lib/dummy-data";
import { CheckCircle2, XCircle, MessageSquare, Eye } from "lucide-react";

export default function ApprovalWorkflowPage() {
  const [selectedApprovalId, setSelectedApprovalId] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [showDetail, setShowDetail] = useState(false);

  const currentApproval = approvals.find(a => a.id === selectedApprovalId);
  const currentCourseFile = currentApproval ? course_files.find(cf => cf.id === currentApproval.course_file_id) : null;
  const currentCourse = currentCourseFile ? courses.find(c => c.id === currentCourseFile.course_id) : null;
  const createdByTeacher = currentCourseFile ? teachers.find(t => t.id === currentCourseFile.created_by) : null;

  const handleApprove = () => {
    alert("Course File Approved! Activity logged and notification sent.");
    setComment("");
  };

  const handleReject = () => {
    alert("Course File Rejected! Teacher notified to make changes.");
    setComment("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Approval Workflow</h1>
        <p className="text-muted-foreground mt-1">Review and approve course files submitted by teachers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Pending Approvals ({approvals.filter(a => a.status === "PENDING").length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {approvals.map((approval) => {
              const courseFile = course_files.find(cf => cf.id === approval.course_file_id);
              const course = courses.find(c => c.id === courseFile?.course_id);
              const teacher = teachers.find(t => t.id === courseFile?.created_by);

              return (
                <div
                  key={approval.id}
                  onClick={() => {
                    setSelectedApprovalId(approval.id);
                    setShowDetail(true);
                  }}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedApprovalId === approval.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-border hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{course?.code}</p>
                      <p className="text-xs text-muted-foreground mt-1">{teacher?.name}</p>
                    </div>
                    <Badge variant={approval.status === "PENDING" ? "outline" : "default"}>
                      {approval.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Approval Details */}
        {showDetail && currentApproval && currentCourseFile && currentCourse && createdByTeacher && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {currentCourse.code} - {currentCourse.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Course File Details</h3>
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Submitted By</p>
                    <p className="text-sm font-medium">{createdByTeacher.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Academic Year</p>
                    <p className="text-sm font-medium">{currentCourseFile.academic_year}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Current Status</p>
                    <Badge>{currentCourseFile.status}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Approval Stage</p>
                    <p className="text-sm font-medium">{currentApproval.stage}</p>
                  </div>
                </div>
              </div>

              {/* Course Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Course Information</h3>
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Course Code</p>
                    <p className="text-sm font-medium">{currentCourse.code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Credits</p>
                    <p className="text-sm font-medium">{currentCourse.credits}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Contact Hours</p>
                    <p className="text-sm font-medium">{currentCourse.contact_hour}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Semester</p>
                    <p className="text-sm font-medium">Sem {currentCourse.semester_id}</p>
                  </div>
                </div>
              </div>

              {/* Previous Comments */}
              {currentApproval.comment && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Submission Comment
                  </h3>
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-900">{currentApproval.comment}</p>
                  </div>
                </div>
              )}

              {/* Approval Decision */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Your Decision</h3>
                <Textarea
                  placeholder="Add approval comment (optional)..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={handleApprove} className="flex-1 bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button onClick={handleReject} variant="outline" className="flex-1 text-red-600 border-red-300">
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>

              {/* Info */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-900">
                <p>📝 Approval will be logged in Activity Log and teacher will be notified via Notification table.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!showDetail && (
          <Card className="lg:col-span-2">
            <CardContent className="pt-6 text-center py-12">
              <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">Select a course file to review approval details</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
