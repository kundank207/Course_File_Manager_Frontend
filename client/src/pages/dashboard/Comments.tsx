import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, MessageSquare, Send, Reply, RefreshCw, Plus, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "@/utils/authFetch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CommentReply {
  id: number;
  author: string;
  avatar: string;
  authorDesignation?: string;
  text: string;
  createdAt: string;
}

interface Comment {
  id: number;
  text: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    designation: string;
    avatar: string;
  };
  courseFile?: {
    id: number;
    courseCode: string;
    courseTitle: string;
  };
  document?: {
    id: number;
    fileName: string;
  };
  heading?: {
    id: number;
    title: string;
  };
  replies: CommentReply[];
}

interface CourseFile {
  id: number;
  courseCode: string;
  courseTitle: string;
}

export default function CommentsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // New comment dialog
  const [showNewComment, setShowNewComment] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [selectedCourseFile, setSelectedCourseFile] = useState<string>("");
  const [courseFiles, setCourseFiles] = useState<CourseFile[]>([]);

  useEffect(() => {
    loadComments();
    loadCourseFiles();
  }, []);

  const loadComments = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/comments/my-comments");
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseFiles = async () => {
    try {
      const res = await authFetch("/api/teacher/course-files/my");
      if (res.ok) {
        const data = await res.json();
        setCourseFiles(data.map((cf: any) => ({
          id: cf.id,
          courseCode: cf.course?.code || cf.courseCode || "",
          courseTitle: cf.course?.title || cf.courseTitle || ""
        })));
      }
    } catch (error) {
      console.error("Failed to load course files:", error);
    }
  };

  const filteredComments = comments.filter(c =>
    (c.document?.fileName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.courseFile?.courseCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReply = async (commentId: number) => {
    if (!replyText.trim()) return;

    setSubmitting(true);
    try {
      const res = await authFetch(`/api/comments/${commentId}/reply`, {
        method: "POST",
        body: JSON.stringify({ text: replyText }),
      });

      if (res.ok) {
        const newReply = await res.json();
        setComments(comments.map(c =>
          c.id === commentId
            ? {
              ...c,
              replies: [...c.replies, {
                id: newReply.id,
                author: newReply.author?.name || "You",
                avatar: newReply.author?.name ? getInitials(newReply.author.name) : "YO",
                text: newReply.text,
                createdAt: newReply.createdAt
              }]
            }
            : c
        ));
        setReplyText("");
        setReplyingTo(null);
        toast({ title: "Reply added", description: "Your reply has been posted" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to post reply", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateComment = async () => {
    if (!newCommentText.trim() || !selectedCourseFile) {
      toast({ title: "Error", description: "Please select a course file and enter a comment", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      console.log("Creating comment:", { courseFileId: selectedCourseFile, text: newCommentText });

      const res = await authFetch("/api/comments", {
        method: "POST",
        body: JSON.stringify({
          courseFileId: parseInt(selectedCourseFile),
          text: newCommentText,
        }),
      });

      console.log("Response status:", res.status);

      if (res.ok) {
        const data = await res.json();
        console.log("Comment created:", data);
        setShowNewComment(false);
        setNewCommentText("");
        setSelectedCourseFile("");
        loadComments();
        toast({ title: "Comment created", description: "Your comment has been posted" });
      } else {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("Create comment failed:", res.status, errorData);
        toast({ title: "Error", description: errorData.error || `Failed to create comment (${res.status})`, variant: "destructive" });
      }
    } catch (error) {
      console.error("Create comment exception:", error);
      toast({ title: "Error", description: "Failed to create comment", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return "Just now";
  };

  const getRoleBadge = (designation: string) => {
    if (!designation) return "Member";
    const lower = designation.toLowerCase();
    if (lower.includes("hod")) return "HOD";
    if (lower.includes("subject") || lower.includes("head")) return "Subject Head";
    if (lower.includes("professor") || lower.includes("instructor")) return "Instructor";
    return designation;
  };

  const navigateToContext = (comment: Comment) => {
    if (!comment.courseFile?.id) return;

    // Determine the base path based on the current URL or role
    const isTeacherRoute = window.location.pathname.includes('/teacher');

    let base = isTeacherRoute ? '/teacher/course-structure/' : '/teacher/view-course-file';
    let path = `${base}${comment.courseFile.id}`;

    // If it's the old query-param style view-course-file
    if (base.includes('view-course-file')) {
      path = `/teacher/view-course-file?id=${comment.courseFile.id}`;
    }

    if (comment.document?.id) {
      path += (path.includes('?') ? '&' : '?') + `docId=${comment.document.id}`;
    } else if (comment.heading?.id) {
      path += (path.includes('?') ? '&' : '?') + `headingId=${comment.heading.id}`;
    }

    navigate(path);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Comments & Discussions</h1>
        <p className="text-muted-foreground mt-1">Collaborate with colleagues on course files and materials.</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search comments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Badge variant="outline">{comments.length} Comments</Badge>
        <Button onClick={() => setShowNewComment(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Comment
        </Button>
        <Button variant="outline" onClick={loadComments}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {filteredComments.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center space-y-3">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
              <p className="text-muted-foreground">No comments found.</p>
              <Button variant="outline" onClick={() => setShowNewComment(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Start a Discussion
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredComments.map((comment) => (
            <Card key={comment.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{comment.author?.avatar || "??"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{comment.author?.name || "Unknown"}</p>
                        <Badge variant="outline" className="text-[10px]">
                          {getRoleBadge(comment.author?.designation)}
                        </Badge>
                      </div>
                      <p
                        className="text-xs text-muted-foreground mt-1 cursor-pointer hover:underline underline-offset-2 transition-all"
                        onClick={() => navigateToContext(comment)}
                      >
                        {comment.document ? (
                          <>On <span className="font-mono font-bold text-primary">{comment.document.fileName}</span> in {comment.courseFile?.courseCode}</>
                        ) : comment.heading ? (
                          <>On <span className="font-bold text-primary">{comment.heading.title}</span> in {comment.courseFile?.courseCode}</>
                        ) : (
                          <>On <span className="font-bold text-primary">{comment.courseFile?.courseCode}</span> - {comment.courseFile?.courseTitle}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatTime(comment.createdAt)}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg">{comment.text}</p>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-8 space-y-3 pt-2 border-l-2 border-muted-foreground/20 pl-4">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex items-start gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px]">{reply.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold">{reply.author}</p>
                            <span className="text-xs text-muted-foreground">{formatTime(reply.createdAt)}</span>
                          </div>
                          <p className="text-xs text-foreground mt-1 bg-background p-2 rounded border">{reply.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply & Context Input */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {replyingTo === comment.id ? (
                    <div className="flex-1 flex gap-2">
                      <Input
                        placeholder="Write a reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleReply(comment.id);
                          }
                        }}
                        className="text-sm"
                        disabled={submitting}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleReply(comment.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={!replyText.trim() || submitting}
                      >
                        {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReplyingTo(comment.id)}
                        className="text-xs"
                      >
                        <Reply className="h-3 w-3 mr-1" /> Reply
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>


      {/* New Comment Dialog */}
      <Dialog open={showNewComment} onOpenChange={setShowNewComment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              New Comment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Course File</Label>
              <Select value={selectedCourseFile} onValueChange={setSelectedCourseFile}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course file..." />
                </SelectTrigger>
                <SelectContent>
                  {courseFiles.map((cf) => (
                    <SelectItem key={cf.id} value={String(cf.id)}>
                      {cf.courseCode} - {cf.courseTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Comment</Label>
              <Textarea
                placeholder="Write your comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewComment(false)}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleCreateComment}
              disabled={submitting || !newCommentText.trim() || !selectedCourseFile}
            >
              {submitting ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Post Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
