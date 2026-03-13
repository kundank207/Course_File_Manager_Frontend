import { authFetch, safeJson } from "@/utils/authFetch";

export interface NotificationItem {
    id: number;
    type: string;
    payload: string;
    isRead: boolean;
    createdAt: string;
}

export const notificationApi = {
    getNotifications: async (): Promise<NotificationItem[]> => {
        const res = await authFetch("/api/notifications");
        if (!res.ok) throw new Error("Failed to fetch notifications");
        return res.json();
    },

    getUnreadCount: async (): Promise<{ count: number }> => {
        const res = await authFetch("/api/notifications/unread-count");
        if (!res.ok) throw new Error("Failed to fetch count");
        return res.json();
    },

    markAsRead: async (id: number) => {
        const res = await authFetch(`/api/notifications/${id}/read`, {
            method: "POST"
        });
        if (!res.ok) throw new Error("Failed to mark as read");
        return safeJson(res);
    },

    markAllAsRead: async () => {
        const res = await authFetch("/api/notifications/mark-all-read", {
            method: "POST"
        });
        if (!res.ok) throw new Error("Failed to mark all as read");
        return safeJson(res);
    },

    clearChatBySender: async (senderId: number) => {
        const res = await authFetch(`/api/notifications/clear-chat?senderId=${senderId}`, {
            method: "POST"
        });
        if (res.ok) return safeJson(res);
        return null;
    }
};
