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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Loader2, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "@/api/hodApi";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CalendarEvent {
    id?: number;
    title: string;
    date: string;
    type: string;
    allDay: boolean;
    description: string;
}

interface Props {
    isOpen: boolean;
    onClose: (refresh?: boolean) => void;
    event?: CalendarEvent | null;
    initialDate?: Date | null;
}

const EVENT_TYPES = [
    { value: "meeting", label: "Faculty Meeting", color: "bg-blue-500" },
    { value: "exam", label: "Exam", color: "bg-red-500" },
    { value: "deadline", label: "Deadline", color: "bg-yellow-500" },
    { value: "notice", label: "Department Notice", color: "bg-green-500" },
];

export function HodCalendarEventModal({ isOpen, onClose, event, initialDate }: Props) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<CalendarEvent>({
        title: "",
        date: "",
        type: "meeting",
        allDay: true,
        description: "",
    });

    useEffect(() => {
        if (event) {
            setFormData({
                ...event,
                date: event.date.split('T')[0], // Ensure local date format YYYY-MM-DD
            });
        } else if (initialDate) {
            setFormData({
                title: "",
                date: format(initialDate, "yyyy-MM-dd"),
                type: "meeting",
                allDay: true,
                description: "",
            });
        } else {
            setFormData({
                title: "",
                date: format(new Date(), "yyyy-MM-dd"),
                type: "meeting",
                allDay: true,
                description: "",
            });
        }
    }, [event, initialDate, isOpen]);

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.date) {
            toast({
                title: "Missing Information",
                description: "Please provide a title and date for the event.",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);
            if (event?.id) {
                await updateCalendarEvent(event.id, formData);
                toast({ title: "Event Updated", description: "Calendar has been refreshed." });
            } else {
                await createCalendarEvent(formData);
                toast({ title: "Event Created", description: "Successfully added to the department calendar." });
            }
            onClose(true);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save calendar event. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!event?.id) return;
        if (!confirm("Are you sure you want to delete this event?")) return;

        try {
            setLoading(true);
            await deleteCalendarEvent(event.id);
            toast({ title: "Event Deleted", description: "Successfully removed from the calendar." });
            onClose(true);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete event.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                        {event ? "Edit Event" : "Create New Event"}
                    </DialogTitle>
                    <DialogDescription>
                        Schedule department activities and keep faculty informed.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Event Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Monthly Staff Review"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="type">Event Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(val) => setFormData({ ...formData, type: val })}
                            >
                                <SelectTrigger id="type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {EVENT_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2 w-2 rounded-full ${type.color}`} />
                                                {type.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="allDay" className="flex flex-col gap-1">
                            <span>All Day Event</span>
                            <span className="font-normal text-xs text-muted-foreground">Applies to the whole day</span>
                        </Label>
                        <Switch
                            id="allDay"
                            checked={formData.allDay}
                            onCheckedChange={(val) => setFormData({ ...formData, allDay: val })}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Provide more context about this event..."
                            className="max-h-[100px]"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>

                <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
                    <div>
                        {event && (
                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onClose()} disabled={loading}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {event ? "Update Event" : "Create Event"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
