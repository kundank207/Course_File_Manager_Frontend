import { useState, useEffect } from "react";
import { Megaphone, X, Bell, Info } from "lucide-react";
import { authFetch } from "@/utils/authFetch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function GlobalAnnouncement() {
    const [announcement, setAnnouncement] = useState<{ id: number; title: string; message: string; createdAt: string } | null>(null);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        fetchLatestAnnouncement();
    }, []);

    const fetchLatestAnnouncement = async () => {
        try {
            const res = await authFetch("/api/notifications/all");
            if (res.ok) {
                const data = await res.json();
                // Find the latest announcement that hasn't been dismissed (we'll use local storage for dismissal)
                const latestInfo = data.find((n: any) => n.type === "ANNOUNCEMENT");

                if (latestInfo) {
                    const dismissedId = localStorage.getItem(`dismissed_announcement_${latestInfo.id}`);
                    if (dismissedId !== String(latestInfo.id)) {
                        setAnnouncement(latestInfo);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch announcements", error);
        }
    };

    const handleDismiss = () => {
        if (announcement) {
            localStorage.setItem(`dismissed_announcement_${announcement.id}`, String(announcement.id));
            setIsVisible(false);
        }
    };

    return (
        <AnimatePresence>
            {(announcement && isVisible) && (
                <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: "auto", opacity: 1, marginTop: 0 }}
                    exit={{ height: 0, opacity: 0, marginTop: -24, transition: { duration: 0.3 } }}
                    className="overflow-hidden mb-6"
                >
                    <div className="relative overflow-hidden rounded-[1.5rem] border border-blue-100 bg-gradient-to-r from-blue-600 to-indigo-700 p-px shadow-lg">
                        <div className="relative flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-slate-900 px-6 py-4 rounded-[1.4rem] overflow-hidden">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                <Megaphone className="h-6 w-6" />
                            </div>

                            <div className="flex-1 space-y-1 text-center md:text-left z-10">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                    <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                                        {announcement.title}
                                    </h3>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                        System Broadcast
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium">
                                        {new Date(announcement.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    {announcement.message}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 z-20">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDismiss}
                                    className="h-8 w-8 rounded-full p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Design accents - added pointer-events-none to prevent click hijacking */}
                            <div className="absolute top-0 right-0 h-24 w-24 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 h-24 w-24 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2" />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
