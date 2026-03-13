import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationApi, NotificationItem } from "@/api/notificationApi";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { safeFormatDistanceToNow } from "@/utils/dateUtils";

export function NotificationDropdown() {
    const { user } = useAuth();
    const { client, isConnected } = useSocket();
    const queryClient = useQueryClient();
    const [unreadCount, setUnreadCount] = useState(0);

    const { data: notifications } = useQuery({
        queryKey: ['notifications'],
        queryFn: notificationApi.getNotifications,
        enabled: !!user,
    });

    const { data: unreadStats } = useQuery({
        queryKey: ['unreadCount'],
        queryFn: notificationApi.getUnreadCount,
        enabled: !!user,
    });

    useEffect(() => {
        if (unreadStats) setUnreadCount(unreadStats.count);
    }, [unreadStats]);

    useEffect(() => {
        if (!client || !isConnected || !user) return;

        // Subscribe to NEW backend topic structure
        const topic = `/topic/notifications/${user.id}`;
        const subscription = client.subscribe(topic, (message) => {
            const newNotification = JSON.parse(message.body);

            // Optimistic update
            queryClient.setQueryData<NotificationItem[]>(['notifications'], (old) => {
                return [newNotification, ...(old || [])];
            });

            // Update local count
            setUnreadCount(prev => prev + 1);

            // Invalidate queries to stay in sync
            queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [client, isConnected, user, queryClient]);


    const handleMarkAsRead = async (id: number) => {
        try {
            await notificationApi.markAsRead(id);
            queryClient.setQueryData<NotificationItem[]>(['notifications'], (old) => {
                return (old || []).map(n => n.id === id ? { ...n, isRead: true } : n);
            });
            setUnreadCount(prev => Math.max(0, prev - 1));
            queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            queryClient.setQueryData<NotificationItem[]>(['notifications'], (old) => {
                return (old || []).map(n => ({ ...n, isRead: true }));
            });
            setUnreadCount(0);
            queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-muted/50 transition-colors">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] min-w-[18px] h-[18px] flex items-center justify-center animate-in zoom-in"
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 px-2 hover:bg-primary/10 text-primary"
                            onClick={handleMarkAllRead}
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[400px]">
                    {!notifications || notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`flex items-start gap-3 p-4 border-b last:border-0 transition-colors hover:bg-muted/30 cursor-pointer ${!notif.isRead ? "bg-primary/5 border-l-2 border-l-primary" : ""
                                        }`}
                                    onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                                >
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className={`text-sm font-medium ${!notif.isRead ? "text-primary" : ""}`}>
                                                {(notif.type || "").replace(/_/g, ' ')}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground">
                                                {safeFormatDistanceToNow(notif.createdAt, { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                            {notif.payload && notif.payload.startsWith('{') ?
                                                JSON.parse(notif.payload).message || "System notification" :
                                                notif.payload}
                                        </p>
                                    </div>
                                    {!notif.isRead && (
                                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0 shadow-sm shadow-primary/50" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <DropdownMenuSeparator className="m-0" />
                <Button variant="ghost" className="w-full h-10 text-xs rounded-none hover:bg-muted">
                    View Audit Logs
                </Button>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
