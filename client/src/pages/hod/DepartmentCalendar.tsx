import { useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCalendarEvents, deleteCalendarEvent, createCalendarEvent } from "@/api/hodApi";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Event {
    id: number;
    title: string;
    description: string;
    date: string;
    type: "MEETING" | "EXAM" | "DEADLINE";
}

export default function DepartmentCalendar() {
    const { toast } = useToast();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: "",
        description: "",
        date: format(new Date(), "yyyy-MM-dd"),
        type: "DEADLINE" as const,
    });

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const data = await getCalendarEvents();
            // The API returns { events: [], upcoming: [] }
            setEvents(data.events || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async () => {
        try {
            await createCalendarEvent(newEvent);
            toast({ title: "Success", description: "Event created successfully" });
            setIsModalOpen(false);
            setNewEvent({
                title: "",
                description: "",
                date: format(new Date(), "yyyy-MM-dd"),
                type: "DEADLINE",
            });
            loadEvents();
        } catch (err) {
            toast({ title: "Error", description: "Failed to create event", variant: "destructive" });
        }
    };

    const days = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
    });

    const getEventsForDay = (day: Date) =>
        events.filter(e => isSameDay(new Date(e.date), day));

    const handleDelete = async (id: number) => {
        try {
            await deleteCalendarEvent(id);
            setEvents(events.filter(e => e.id !== id));
            toast({ title: "Success", description: "Event removed" });
        } catch (err) {
            toast({ title: "Error", description: "Failed to delete event", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Department Calendar</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Event / Deadline
                </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* CALENDAR VIEW */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>{format(currentDate, "MMMM yyyy")}</CardTitle>
                        <div className="flex gap-1">
                            <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-7 gap-2">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                                <div key={d} className="text-center text-xs font-semibold text-muted-foreground pb-2">{d}</div>
                            ))}
                            {days.map(day => (
                                <div key={day.toString()} className="min-h-[80px] border rounded-md p-1 space-y-1">
                                    <span className="text-xs text-muted-foreground">{format(day, "d")}</span>
                                    {getEventsForDay(day).map(e => (
                                        <div key={e.id} className="text-[10px] p-1 rounded bg-primary/10 text-primary truncate border border-primary/20">
                                            {e.title}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* AGENDA VIEW */}
                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Agenda</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {events.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">No events scheduled</p>
                        ) : (
                            events.slice(0, 10).map(e => (
                                <div key={e.id} className="flex gap-3 justify-between p-3 border rounded-lg bg-muted/30">
                                    <div className="space-y-1">
                                        <Badge variant="outline" className={e.type === "DEADLINE" ? "border-orange-500 text-orange-600" : ""}>
                                            {e.type}
                                        </Badge>
                                        <p className="font-medium text-sm">{e.title}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <CalendarIcon className="h-3 w-3" />
                                            {format(new Date(e.date), "PPP")}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)} className="text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* CREATE EVENT MODAL */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Department Event</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Event Title</Label>
                            <Input
                                id="title"
                                value={newEvent.title}
                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                placeholder="e.g. Syllabus Submission Deadline"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={newEvent.date}
                                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Event Type</Label>
                                <Select
                                    value={newEvent.type}
                                    onValueChange={(val: any) => setNewEvent({ ...newEvent, type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DEADLINE">Deadline</SelectItem>
                                        <SelectItem value="MEETING">Meeting</SelectItem>
                                        <SelectItem value="EXAM">Exam</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={newEvent.description}
                                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                placeholder="Details about this event..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateEvent} disabled={!newEvent.title}>Create Event</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
