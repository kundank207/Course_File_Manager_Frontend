import { useState, useEffect } from "react";
import { teachers } from "@/lib/dummy-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageSquare, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminCommunicationPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [subject, setSubject] = useState("");
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("admin_messages");
    if (stored) {
      setMessages(JSON.parse(stored));
    }
  }, []);

  const handleSendMessage = () => {
    if (!selectedTeacher || !subject || !messageText) {
      toast({ title: "Error", description: "Please fill all fields" });
      return;
    }

    const newMessage = {
      id: Math.max(...messages.map(m => m.id), 0) + 1,
      from_user_id: 0, // Admin
      to_user_id: parseInt(selectedTeacher),
      subject,
      message: messageText,
      timestamp: new Date().toLocaleString(),
      read: false
    };

    const updated = [...messages, newMessage];
    setMessages(updated);
    localStorage.setItem("admin_messages", JSON.stringify(updated));
    
    toast({ title: "Success", description: "Message sent to " + teachers.find(t => t.id === parseInt(selectedTeacher))?.name });
    setSelectedTeacher("");
    setSubject("");
    setMessageText("");
    setIsSendOpen(false);
  };

  const handleDeleteMessage = (id: number) => {
    const updated = messages.filter(m => m.id !== id);
    setMessages(updated);
    localStorage.setItem("admin_messages", JSON.stringify(updated));
    toast({ title: "Deleted", description: "Message removed" });
  };

  const getTeacherName = (teacherId: number) => {
    return teachers.find(t => t.id === teacherId)?.name || "Unknown";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Communication Hub</h1>
          <p className="text-muted-foreground mt-1">Send messages to teachers and HODs.</p>
        </div>
        <Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> Send Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Send Message to Teacher/HOD</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Recipient</Label>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Teacher/HOD" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(t => (
                      <SelectItem key={t.id} value={t.id.toString()}>{t.name} ({t.designation})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input placeholder="e.g. Course File Submission" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea placeholder="Type your message here..." value={messageText} onChange={(e) => setMessageText(e.target.value)} className="min-h-32" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-700">
                <Send className="mr-2 h-4 w-4" /> Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {messages.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No messages sent yet. Click "Send Message" to get started.</p>
            </CardContent>
          </Card>
        ) : (
          messages.map(msg => (
            <Card key={msg.id} className="hover:border-blue-500 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{msg.subject}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">To: {getTeacherName(msg.to_user_id)}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDeleteMessage(msg.id)} data-testid={`button-delete-message-${msg.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">{msg.message}</p>
                <p className="text-xs text-muted-foreground">{msg.timestamp}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
