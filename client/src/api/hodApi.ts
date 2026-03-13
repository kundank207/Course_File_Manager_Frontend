import { authFetch } from "@/utils/authFetch";

export const getOverview = async () => {
  const res = await authFetch("/api/hod/overview");
  if (!res.ok) throw new Error("Failed to fetch dashboard overview");
  return res.json();
};

export const getFacultyPerformance = async () => {
  const res = await authFetch("/api/hod/faculty/performance");
  if (!res.ok) throw new Error("Failed to fetch performance");
  return res.json();
};

export const getTopPerformer = async () => {
  const res = await authFetch("/api/hod/faculty/top-performer");
  if (!res.ok) throw new Error("Failed to fetch top performer");
  return res.json();
};

export const getMostActive = async () => {
  const res = await authFetch("/api/hod/faculty/most-active");
  if (!res.ok) throw new Error("Failed to fetch most active");
  return res.json();
};

export const getCourseCoverage = async () => {
  const res = await authFetch("/api/hod/department/course-coverage");
  if (!res.ok) throw new Error("Failed to fetch course coverage");
  return res.json();
};

export const getCalendarEvents = async (month?: string) => {
  const url = month ? `/api/calendar/events?month=${month}` : "/api/calendar/events";
  const res = await authFetch(url);
  if (!res.ok) throw new Error("Failed to fetch calendar events");
  return res.json();
};

export const createCalendarEvent = async (event: any) => {
  const res = await authFetch("/api/calendar/events", {
    method: "POST",
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error("Failed to create event");
  return res.json();
};

export const updateCalendarEvent = async (id: number, event: any) => {
  const res = await authFetch(`/api/calendar/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error("Failed to update event");
  return res.json();
};

export const deleteCalendarEvent = async (id: number) => {
  const res = await authFetch(`/api/calendar/events/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete event");
  return res;
};

export const sendAppreciation = async (teacherId: number, message: string) => {
  const res = await authFetch("/api/hod/faculty/appreciation/send", {
    method: "POST",
    body: JSON.stringify({ teacherId, message }),
  });
  if (!res.ok) throw new Error("Failed to send appreciation");
  return res.json();
};

export const getTeacherActivity = async (id: number) => {
  const res = await authFetch(`/api/hod/teacher/${id}/activity`);
  if (!res.ok) throw new Error("Failed to fetch teacher activity");
  return res.json();
};

export const getMissingMaterials = async () => {
  const res = await authFetch("/api/hod/courses/missing-materials");
  if (!res.ok) throw new Error("Failed to fetch missing materials");
  return res.json();
};

export const emailDepartment = async (subject: string, body: string) => {
  const res = await authFetch("/api/hod/email/department", {
    method: "POST",
    body: JSON.stringify({ subject, body }),
  });
  if (!res.ok) throw new Error("Failed to send department email");
  return res.json();
};

export const getHodList = async () => {
  const res = await authFetch("/api/admin/hods");
  if (!res.ok) throw new Error("Failed to fetch HOD list");
  return res.json();
};

// Maintain compatibility for now if needed, but we will update imports
export const getWeeklyEngagement = async () => {
  const res = await authFetch("/api/hod/department/weekly-engagement");
  if (!res.ok) throw new Error("Failed to fetch weekly engagement");
  return res.json();
};

export const getSubmissionHeatmap = async () => {
  const res = await authFetch("/api/hod/submission-heatmap");
  if (!res.ok) throw new Error("Failed to fetch heatmap");
  return res.json();
};

export const hodApi = {
  getOverview,
  getFacultyPerformance,
  getTopPerformer,
  getMostActive,
  getCourseCoverage,
  sendAppreciation,
  getTeacherActivity,
  getMissingMaterials,
  emailDepartment,
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getWeeklyEngagement,
  getHodList,
  getSubmissionHeatmap
};
