import { authFetch, safeJson } from "@/utils/authFetch";

export interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    totalCourses: number;
    totalDocuments: number;
    totalStorageUsed: number;
    storageUsedMB: number;
}

export const adminApi = {
    getDashboardStats: async (): Promise<DashboardStats> => {
        const res = await authFetch("/api/admin/dashboard/stats");
        if (!res.ok) throw new Error("Failed to fetch dashboard stats");
        return res.json();
    },

    getGrowthStats: async () => {
        const res = await authFetch("/api/admin/dashboard/growth");
        if (!res.ok) throw new Error("Failed to fetch growth stats");
        return res.json();
    },

    getActivityLogs: async () => {
        const res = await authFetch("/api/admin/dashboard/activity");
        if (!res.ok) throw new Error("Failed to fetch activity logs");
        return res.json();
    },
    getDistributionStats: async () => {
        const res = await authFetch("/api/admin/dashboard/distribution");
        if (!res.ok) throw new Error("Failed to fetch distribution stats");
        return res.json();
    },
    getComplianceStats: async () => {
        const res = await authFetch("/api/admin/dashboard/compliance");
        if (!res.ok) throw new Error("Failed to fetch compliance stats");
        return res.json();
    },
    getSystemHealth: async () => {
        const res = await authFetch("/api/admin/dashboard/health");
        if (!res.ok) throw new Error("Failed to fetch system health");
        return res.json();
    },
    getDetailedHealth: async () => {
        const res = await authFetch("/api/admin/dashboard/health/details");
        if (!res.ok) throw new Error("Failed to fetch detailed health stats");
        return res.json();
    },
    exportCSV: async () => {
        const res = await authFetch("/api/admin/dashboard/health/export/csv");
        if (!res.ok) throw new Error("Failed to export CSV");
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().split('T')[0];
        a.download = `system_report_${timestamp}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },
    exportPDF: async () => {
        const res = await authFetch("/api/admin/dashboard/health/export/pdf");
        if (!res.ok) throw new Error("Failed to export PDF");
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().split('T')[0];
        a.download = `system_report_${timestamp}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    // Notifications
    getNotifications: async () => {
        const res = await authFetch("/api/notifications");
        if (!res.ok) throw new Error("Failed to fetch notifications");
        return res.json();
    },
    markNotificationAsRead: async (id: number) => {
        const res = await authFetch(`/api/notifications/${id}/read`, {
            method: 'POST'
        });
        if (!res.ok) throw new Error("Failed to mark notification as read");
    },
    markAllNotificationsAsRead: async () => {
        const res = await authFetch(`/api/notifications/mark-all-read`, {
            method: 'POST'
        });
        if (!res.ok) throw new Error("Failed to mark all notifications as read");
    },

    // Chat
    getChatHistory: async (otherUserId: number) => {
        const res = await authFetch(`/api/chat/${otherUserId}/messages`);
        if (!res.ok) throw new Error("Failed to fetch chat history");
        const data = await safeJson(res);
        return data?.messages || [];
    },
    sendPrivateMessage: async (receiverId: number, message: string) => {
        const res = await authFetch(`/api/chat/${receiverId}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        if (!res.ok) throw new Error("Failed to send message");
        const data = await safeJson(res);
        return data?.message; // Returns the saved ChatMessage object
    },
    deleteMessage: async (messageId: number) => {
        const res = await authFetch(`/api/chat/${messageId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error("Failed to delete message");
        return safeJson(res);
    },
    markChatAsSeen: async (senderId: number) => {
        const res = await authFetch(`/api/chat/seen/${senderId}`, {
            method: 'POST'
        });
        if (!res.ok) throw new Error("Failed to mark chat as seen");
        return safeJson(res);
    },
    getTeachers: async () => {
        const res = await authFetch("/api/admin/teachers");
        if (!res.ok) throw new Error("Failed to fetch teachers");
        return res.json();
    },
    getChatTeachers: async () => {
        const res = await authFetch("/api/admin/chat/teachers");
        if (!res.ok) throw new Error("Failed to fetch chat teachers");
        return res.json();
    },
    broadcastAnnouncement: async (title: string, message: string) => {
        const res = await authFetch("/api/admin/broadcast", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, message })
        });
        if (!res.ok) throw new Error("Failed to broadcast announcement");
        return res.json();
    }
};
