import { useState, useEffect } from "react";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    eachDayOfInterval
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    Plus,
    Loader2,
    Info,
    CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getCalendarEvents } from "@/api/hodApi";
import { HodCalendarEventModal } from "@/components/hod/HodCalendarEventModal";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CalendarEvent {
    id: number;
    title: string;
    date: string;
    type: string;
    allDay: boolean;
    description: string;
}

const EVENT_TYPE_STYLES: Record<string, { bg: string, text: string, dot: string }> = {
    meeting: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
    exam: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", dot: "bg-red-500" },
    deadline: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300", dot: "bg-yellow-500" },
    notice: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", dot: "bg-green-500" },
};

export default function CalendarPage() {
    const { activeRole } = useAuth();
    const { toast } = useToast();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [upcoming, setUpcoming] = useState<CalendarEvent[]>([]);

    // Modal states
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const isHOD = activeRole === "HOD";

    useEffect(() => {
        loadData();
    }, [currentMonth]);

    const loadData = async () => {
        try {
            setLoading(true);
            const monthStr = format(currentMonth, "yyyy-MM");
            const data = await getCalendarEvents(monthStr);
            setEvents(data.events || []);
            setUpcoming(data.upcoming || []);
        } catch (error) {
            console.error("Failed to load calendar data:", error);
            toast({
                title: "Connection Error",
                description: "Could not sync with department calendar.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const handleDateClick = (date: Date) => {
        if (!isHOD) return;
        setSelectedEvent(null);
        setSelectedDate(date);
        setModalOpen(true);
    };

    const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
        e.stopPropagation();
        if (!isHOD) {
            // Show info for non-HOD? (Optional detail view)
            setSelectedEvent(event);
            setModalOpen(true);
            return;
        }
        setSelectedEvent(event);
        setSelectedDate(null);
        setModalOpen(true);
    };

    const renderHeader = () => (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <CalendarDays className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Department Calendar</h1>
                    <p className="text-muted-foreground mt-1">Academic schedule and official notifications.</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center bg-muted rounded-lg p-1">
                    <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-semibold text-sm w-32 text-center">
                        {format(currentMonth, "MMMM yyyy")}
                    </span>
                    <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                {isHOD && (
                    <Button onClick={() => handleDateClick(new Date())} className="shadow-sm">
                        <Plus className="h-4 w-4 mr-2" /> Add Event
                    </Button>
                )}
            </div>
        </div>
    );

    const renderDays = () => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return (
            <div className="grid grid-cols-7 border-b bg-muted/30">
                {days.map((day) => (
                    <div key={day} className="py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;

        const interval = eachDayOfInterval({ start: startDate, end: endDate });

        return (
            <div className="grid grid-cols-7 h-full">
                {interval.map((d, i) => {
                    const formattedDate = format(d, "d");
                    const dayEvents = events.filter((e) => isSameDay(new Date(e.date), d));
                    const isToday = isSameDay(d, new Date());
                    const isSelectedMonth = isSameMonth(d, monthStart);

                    return (
                        <div
                            key={d.toString()}
                            className={cn(
                                "border-r border-b p-2 min-h-[120px] relative transition-colors group cursor-pointer",
                                !isSelectedMonth ? "bg-muted/10 opacity-40" : "hover:bg-muted/5",
                                isToday && "bg-primary/5"
                            )}
                            onClick={() => handleDateClick(d)}
                        >
                            <span className={cn(
                                "text-sm font-medium flex items-center justify-center h-7 w-7 rounded-full",
                                isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                            )}>
                                {formattedDate}
                            </span>

                            <div className="mt-2 space-y-1">
                                {dayEvents.map((event) => {
                                    const style = EVENT_TYPE_STYLES[event.type] || EVENT_TYPE_STYLES.meeting;
                                    return (
                                        <div
                                            key={event.id}
                                            onClick={(e) => handleEventClick(e, event)}
                                            className={cn(
                                                "text-[10px] px-1.5 py-1 rounded truncate font-medium flex items-center gap-1 border border-transparent hover:border-current/20 transition-all active:scale-95",
                                                style.bg,
                                                style.text
                                            )}
                                            title={event.title}
                                        >
                                            <div className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                                            {event.title}
                                        </div>
                                    );
                                })}
                            </div>

                            {isHOD && isSelectedMonth && (
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Plus className="h-3 w-3 text-primary" />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {renderHeader()}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                    <Card className="overflow-hidden border-muted/50 shadow-md">
                        <CardContent className="p-0">
                            {renderDays()}
                            <div className="min-h-[600px]">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-[600px] gap-4">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <p className="text-muted-foreground animate-pulse">Syncing department schedule...</p>
                                    </div>
                                ) : (
                                    renderCells()
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="shadow-md border-muted/50">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5 text-orange-500" /> Upcoming
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 px-4 h-[550px] overflow-y-auto scrollbar-thin">
                            {upcoming.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                        <Info className="h-6 w-6" />
                                    </div>
                                    <p className="text-sm font-medium">No pending events</p>
                                    <p className="text-xs text-muted-foreground">The schedule is clear for now.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {upcoming.slice(0, 10).map((e) => {
                                        const d = new Date(e.date);
                                        const style = EVENT_TYPE_STYLES[e.type] || EVENT_TYPE_STYLES.meeting;

                                        return (
                                            <div
                                                key={e.id}
                                                className="group relative flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-all cursor-pointer border border-transparent hover:border-muted/50"
                                                onClick={(ev) => handleEventClick(ev as any, e)}
                                            >
                                                <div className="flex flex-col items-center justify-center bg-muted rounded-md min-w-[3.5rem] py-2 border shadow-sm group-hover:bg-primary/5 group-hover:border-primary/20 transition-colors">
                                                    <span className="text-[10px] font-bold uppercase text-muted-foreground group-hover:text-primary transition-colors">
                                                        {format(d, "MMM")}
                                                    </span>
                                                    <span className="text-xl font-black group-hover:scale-110 transition-transform">
                                                        {format(d, "dd")}
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-sm truncate leading-tight mb-1">{e.title}</h4>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge variant="outline" className={cn("text-[9px] h-4 py-0", style.text)}>
                                                            {e.type}
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <Clock className="h-2.5 w-2.5" /> {e.allDay ? "All Day" : "Scheduled"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-primary mb-2">
                                <Info className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Quick Note</span>
                            </div>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                                Events added here are visible to all department faculty and used for coordination and reporting.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <HodCalendarEventModal
                isOpen={modalOpen}
                onClose={(refresh) => {
                    setModalOpen(false);
                    if (refresh) loadData();
                }}
                event={selectedEvent}
                initialDate={selectedDate}
            />
        </div>
    );
}
