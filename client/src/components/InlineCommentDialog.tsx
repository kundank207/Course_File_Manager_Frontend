import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/utils/authFetch";
import { Send, MessageSquare, Reply, Loader2 } from "lucide-react";

interface CommentAuthor {
    id: number;
    name: string;
    designation: string;
    avatar: string;
}

interface CommentReply {
    id: number;
    text: string;
    author: string;
    avatar: string;
    authorDesignation: string;
    createdAt: string;
}

interface CommentItem {
    id: number;
    text: string;
    author: CommentAuthor;
    createdAt: string;
    heading?: { id: number; title: string };
    document?: { id: number; fileName: string };
    replies: CommentReply[];
}

interface InlineCommentDialogProps {
    courseFileId: number;
    headingId?: number;
    documentId?: number;
    headingTitle?: string;
    fileName?: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function InlineCommentDialog({
    courseFileId,
    headingId,
    documentId,
    headingTitle,
    fileName,
    isOpen,
    onClose,
    onSuccess,
}: InlineCommentDialogProps) {
    const { toast } = useToast();
    const [comments, setComments] = useState<CommentItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyText, setReplyText] = useState("");

    useEffect(() => {
        if (isOpen && courseFileId) {
            loadComments();
        }
    }, [isOpen, courseFileId, headingId, documentId]);

    const loadComments = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`/api/comments/course-file/${courseFileId}`);
            if (res.ok) {
                const allComments: CommentItem[] = await res.json();
                // If no specific heading or document, show all comments
                // Otherwise filter for specific heading or document
                let filtered = allComments;
                if (documentId) {
                    filtered = allComments.filter((c) => c.document?.id === documentId);
                } else if (headingId) {
                    filtered = allComments.filter((c) => c.heading?.id === headingId && !c.document);
                }
                // Show all comments if no filter is specified
                setComments(filtered);
            }
        } catch (error) {
            console.error("Failed to load comments:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitComment = async () => {
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            const payload: Record<string, any> = {
                courseFileId,
                text: newComment.trim(),
            };
            if (headingId) payload.headingId = headingId;
            if (documentId) payload.documentId = documentId;

            const res = await authFetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast({
                    title: "Comment added",
                    description: "Your comment has been posted successfully.",
                });
                setNewComment("");
                loadComments();
                if (onSuccess) onSuccess();
            } else {
                throw new Error("Failed to add comment");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to add comment",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = async (commentId: number) => {
        if (!replyText.trim()) return;

        setSubmitting(true);
        try {
            const res = await authFetch(`/api/comments/${commentId}/reply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: replyText.trim() }),
            });

            if (res.ok) {
                toast({
                    title: "Reply added",
                    description: "Your reply has been posted.",
                });
                setReplyText("");
                setReplyingTo(null);
                loadComments();
            } else {
                throw new Error("Failed to reply");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to add reply",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getInitials = (name: string) => {
        if (!name) return "??";
        const parts = name.split(" ");
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                        Comments
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        {fileName ? `File: ${fileName}` : headingTitle ? `Heading: ${headingTitle}` : ""}
                    </p>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-30" />
                            <p>No comments yet</p>
                            <p className="text-sm">Be the first to add a comment</p>
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
                                {/* Comment header */}
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                            {comment.author?.avatar || getInitials(comment.author?.name || "")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-sm">{comment.author?.name}</span>
                                            {comment.author?.designation && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {comment.author.designation}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                                    </div>
                                </div>

                                {/* Comment text */}
                                <p className="text-sm text-gray-700 pl-11">{comment.text}</p>

                                {/* Replies */}
                                {comment.replies && comment.replies.length > 0 && (
                                    <div className="pl-11 space-y-2 mt-2">
                                        {comment.replies.map((reply) => (
                                            <div key={reply.id} className="bg-white border rounded-md p-2">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                                                            {reply.avatar || getInitials(reply.author)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-medium">{reply.author}</span>
                                                    {reply.authorDesignation && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {reply.authorDesignation}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1 pl-8">{reply.text}</p>
                                                <p className="text-xs text-gray-400 pl-8">{formatDate(reply.createdAt)}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Reply button */}
                                <div className="pl-11">
                                    {replyingTo === comment.id ? (
                                        <div className="flex gap-2 mt-2">
                                            <Textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Write a reply..."
                                                className="text-sm min-h-[60px]"
                                            />
                                            <div className="flex flex-col gap-1">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleReply(comment.id)}
                                                    disabled={submitting || !replyText.trim()}
                                                >
                                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setReplyingTo(null);
                                                        setReplyText("");
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-xs text-blue-600"
                                            onClick={() => setReplyingTo(comment.id)}
                                        >
                                            <Reply className="h-3 w-3 mr-1" />
                                            Reply
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* New comment input */}
                <div className="border-t pt-3 mt-2">
                    <div className="flex gap-2">
                        <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="text-sm min-h-[60px]"
                        />
                        <Button
                            onClick={handleSubmitComment}
                            disabled={submitting || !newComment.trim()}
                            className="self-end"
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
