import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Send, Loader2, Users } from "lucide-react";
import { emailDepartment } from "@/api/hodApi";
import { useToast } from "@/hooks/use-toast";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export function HodEmailDepartmentModal({ isOpen, onClose }: Props) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");

    const handleSend = async () => {
        if (!subject.trim() || !body.trim()) {
            toast({
                title: "Validation Error",
                description: "Please enter both subject and body for the email.",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);
            const res = await emailDepartment(subject, body);
            toast({
                title: "Broadcast Sent!",
                description: res.message || "Bulk email sent to department faculty.",
            });
            setSubject("");
            setBody("");
            onClose();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send broadcast email.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-blue-500" />
                        Broadcast to Department
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> This will send an email to all faculty members in your department.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Email Subject</Label>
                        <Input
                            placeholder="e.g. Documentation Deadline Reminder"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Message Body</Label>
                        <Textarea
                            placeholder="Enter the content of your announcement..."
                            className="min-h-[200px]"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSend} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                        Send Broadcast
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
