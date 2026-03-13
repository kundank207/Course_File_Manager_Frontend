import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Award, Send, Loader2 } from "lucide-react";
import { getFacultyPerformance, sendAppreciation } from "@/api/hodApi";
import { useToast } from "@/hooks/use-toast";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    initialTeacherId?: number;
}

export function HodAppreciationModal({ isOpen, onClose, initialTeacherId }: Props) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [selectedTeacher, setSelectedTeacher] = useState<string>("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (isOpen) {
            loadTeachers();
            if (initialTeacherId) {
                setSelectedTeacher(initialTeacherId.toString());
            }
        }
    }, [isOpen, initialTeacherId]);

    const loadTeachers = async () => {
        try {
            const perf = await getFacultyPerformance();
            setTeachers(perf);
        } catch (error) {
            console.error("Failed to load teachers for appreciation:", error);
        }
    };

    const handleSend = async () => {
        if (!selectedTeacher || !message.trim()) {
            toast({
                title: "Validation Error",
                description: "Please select a teacher and enter a message.",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);
            await sendAppreciation(Number(selectedTeacher), message);
            toast({
                title: "Appreciation Sent!",
                description: "The faculty member has been notified of your feedback.",
            });
            setMessage("");
            onClose();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send appreciation. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-500" />
                        Send Faculty Appreciation
                    </DialogTitle>
                    <DialogDescription>
                        Recognize outstanding contribution and boost faculty engagement.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Select Faculty Member</Label>
                        <Select
                            value={selectedTeacher}
                            onValueChange={setSelectedTeacher}
                            disabled={!!initialTeacherId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a teacher..." />
                            </SelectTrigger>
                            <SelectContent>
                                {teachers.map((t) => (
                                    <SelectItem key={t.id} value={t.id.toString()}>
                                        {t.name} ({t.designation})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Your Message</Label>
                        <Textarea
                            placeholder="Write a few positive words about their contribution..."
                            className="min-h-[120px]"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSend} disabled={loading} className="bg-yellow-600 hover:bg-yellow-700">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                        Send Recognition
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
