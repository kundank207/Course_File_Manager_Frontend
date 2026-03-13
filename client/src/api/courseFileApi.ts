import { authFetch } from "@/utils/authFetch";

const API = "/api/teacher/course-file";

export interface CourseFile {
    id: number;
    courseId: number;
    academicYear: string;
    createdBy: number;
    status: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
    createdAt: string;
}

// Create a new course file for a course
export const createCourseFile = async (courseId: number): Promise<CourseFile> => {
    const res = await authFetch(`${API}/${courseId}`, {
        method: "POST",
    });
    if (!res.ok) throw new Error("Failed to create course file");
    return res.json();
};

// Get course file by ID (if backend supports this)
export const getCourseFile = async (courseFileId: number): Promise<CourseFile> => {
    const res = await authFetch(`${API}/${courseFileId}`);
    if (!res.ok) throw new Error("Failed to load course file");
    return res.json();
};

// Get all course files for current teacher
export const getMyCourseFiles = async (): Promise<CourseFile[]> => {
    const res = await authFetch(`${API}/my-files`);
    if (!res.ok) {
        // Endpoint might not exist yet, return empty array
        console.warn("Course files endpoint not available");
        return [];
    }
    return res.json();
};

// Submit course file for approval
export const submitCourseFile = async (courseFileId: number): Promise<CourseFile> => {
    const res = await authFetch(`${API}/${courseFileId}/submit`, {
        method: "POST",
    });
    if (!res.ok) throw new Error("Failed to submit course file");
    return res.json();
};
