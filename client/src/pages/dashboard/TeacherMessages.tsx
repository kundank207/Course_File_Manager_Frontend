import { useState, useEffect } from "react";
import { currentUser, teachers } from "@/lib/dummy-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Reply, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TeacherMessagesPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    // Load all messages (both admin messages and messages from localStorage)
    const adminMessages = localStorage.getItem("admin_messages");
    const teacherReplies = localStorage.getItem("teacher_replies");
    
    let allMessages: any[] = [];
    
    if (adminMessages) {
      const msgs = JSON.parse(adminMessages);
      // Filter messages sent to current teacher
      allMessages = msgs.filter((m: any) => m.to_user_id === currentUser.teacher_id);
    }

    // Add replies data
    if (teacherReplies) {
      const replies = JSON.parse(teacherReplies);
      allMessages = allMessages.map((msg: any) => ({
        ...msg,
        reply: replies.find((r: any) => r.message_id === msg.id)
      }));
    }

    setMessages(allMessages);
  }, []);

  const handleSendReply = (messageId: number) => {
    if (!replyText.trim()) {
      toast({ title: "Error", description: "Reply cannot be empty" });
      return;
    }

    const reply = {
      id: Math.random(),
      message_id: messageId,
      from_user_id: currentUser.teacher_id,
      text: replyText,
      timestamp: new Date().toLocaleString()
    };

    const existing = localStorage.getItem("teacher_replies") ? JSON.parse(localStorage.getItem("teacher_replies")!) : [];
    const updated = [...existing, reply];
    localStorage.setItem("teacher_replies", JSON.stringify(updated));

    setMessages(messages.map(m => 
      m.id === messageId ? { ...m, reply } : m
    ));

    toast({ title: "Success", description: "Reply sent" });
    setReplyingTo(null);
    setReplyText("");
  };

  const handleDeleteMessage = (id: number) => {
    const remaining = messages.filter(m => m.id !== id);
    setMessages(remaining);
    toast({ title: "Deleted", description: "Message removed from inbox" });
  };

  const getSenderName = (userId: number) => {
    if (userId === 0) return "Admin";
    return teachers.find(t => t.id === userId)?.name || "Unknown";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages & Inbox</h1>
        <p className="text-muted-foreground mt-1">View messages from admin and HODs, reply directly.</p>
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No messages yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map(msg => (
            <Card key={msg.id} className="hover:border-blue-500 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {msg.subject}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      From: <span className="font-semibold">{getSenderName(msg.from_user_id)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{msg.timestamp}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600"
                    onClick={() => handleDeleteMessage(msg.id)}
                    data-testid={`button-delete-message-${msg.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm">{msg.message}</p>
                </div>

                {/* Reply section */}
                {msg.reply ? (
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border-l-4 border-blue-500">
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">Your Reply:</p>
                    <p className="text-sm">{msg.reply.text}</p>
                    <p className="text-xs text-muted-foreground mt-2">{msg.reply.timestamp}</p>
                  </div>
                ) : (
                  <Dialog open={replyingTo === msg.id} onOpenChange={(open) => {
                    if (!open) {
                      setReplyingTo(null);
                      setReplyText("");
                    } else {
                      setReplyingTo(msg.id);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Reply className="mr-2 h-4 w-4" /> Reply
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reply to {getSenderName(msg.from_user_id)}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="bg-muted p-3 rounded text-sm italic border-l-2 border-blue-500">
                          "{msg.message}"
                        </div>
                        <div className="space-y-2">
                          <Label>Your Reply</Label>
                          <Textarea
                            placeholder="Type your reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="min-h-32"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={() => handleSendReply(msg.id)} className="bg-blue-600 hover:bg-blue-700">
                          <Send className="mr-2 h-4 w-4" /> Send Reply
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
