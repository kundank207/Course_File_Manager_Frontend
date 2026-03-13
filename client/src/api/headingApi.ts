import { authFetch } from "@/utils/authFetch";

const API = "/api/teacher/heading";

export interface HeadingTreeDto {
    id: number;
    title: string;
    orderIndex: number;
    children: HeadingTreeDto[];
    documents: DocumentDto[];
}

export interface DocumentDto {
    id: number;
    fileName: string;
    filePath: string;
    type: string;
    fileSize: number;
    versionNo: number;
    uploadedAt: string;
}

export interface Heading {
    id: number;
    title: string;
    orderIndex: number;
    parentHeadingId?: number;
    courseFileId: number;
}

// Get heading tree for a course file
export const getHeadingTree = async (courseFileId: number): Promise<HeadingTreeDto[]> => {
    const res = await authFetch(`${API}/tree/${courseFileId}`);
    if (!res.ok) throw new Error("Failed to load heading tree");
    return res.json();
};

// Get child headings of a parent
export const getChildHeadings = async (parentId: number): Promise<Heading[]> => {
    const res = await authFetch(`${API}/root/${parentId}`);
    if (!res.ok) throw new Error("Failed to load child headings");
    return res.json();
};

// Add sub-heading under a parent
export const addSubHeading = async (parentId: number, title: string): Promise<Heading> => {
    const res = await authFetch(`${API}/${parentId}?title=${encodeURIComponent(title)}`, {
        method: "POST",
    });
    if (!res.ok) throw new Error("Failed to add sub-heading");
    return res.json();
};
