import { authFetch } from "@/utils/authFetch";

export interface Approval {
    id: number;
    courseFileId: number;
    approverId: number;
    stage: "SUBJECT_HEAD" | "HOD" | "AUDIT";
    status: "PENDING" | "APPROVED" | "REJECTED";
    comment?: string;
    actedAt?: string;
}

export interface PendingApprovalDto {
    id: number;
    courseFileId: number;
    courseCode: string;
    courseTitle: string;
    teacherName: string;
    submittedDate: string;
    stage: string;
}

// Get pending approvals for Subject Head
export const getSubjectHeadPendingApprovals = async (): Promise<PendingApprovalDto[]> => {
    const res = await authFetch("/api/subject-head/pending-approvals");
    if (!res.ok) {
        console.warn("Pending approvals endpoint may not exist");
        return [];
    }
    return res.json();
};

// Get pending approvals for HOD
export const getHodPendingApprovals = async (): Promise<PendingApprovalDto[]> => {
    const res = await authFetch("/api/hod/pending-approvals");
    if (!res.ok) {
        console.warn("HOD pending approvals endpoint may not exist");
        return [];
    }
    return res.json();
};

// Approve a course file
export const approveCourseFile = async (
    courseFileId: number,
    comment?: string
): Promise<Approval> => {
    const res = await authFetch(`/api/approval/${courseFileId}/approve`, {
        method: "POST",
        body: JSON.stringify({ comment }),
    });
    if (!res.ok) throw new Error("Failed to approve course file");
    return res.json();
};

// Reject a course file
export const rejectCourseFile = async (
    courseFileId: number,
    comment: string
): Promise<Approval> => {
    const res = await authFetch(`/api/approval/${courseFileId}/reject`, {
        method: "POST",
        body: JSON.stringify({ comment }),
    });
    if (!res.ok) throw new Error("Failed to reject course file");
    return res.json();
};

// Forward to next stage (Subject Head -> HOD)
export const forwardToHod = async (
    courseFileId: number,
    comment?: string
): Promise<Approval> => {
    const res = await authFetch(`/api/approval/${courseFileId}/forward`, {
        method: "POST",
        body: JSON.stringify({ comment }),
    });
    if (!res.ok) throw new Error("Failed to forward course file");
    return res.json();
};
