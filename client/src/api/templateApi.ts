import { authFetch } from "@/utils/authFetch";

const API = "/api/templates";

export interface Template {
    id?: number;
    name: string;
    description?: string;
    structure: string[];
    checklist: string[];
    departmentId?: number;
}

// Get all templates for current user's department
export const getTemplatesByDepartment = async (): Promise<Template[]> => {
    const res = await authFetch(`${API}/department`);
    if (!res.ok) throw new Error("Failed to load templates");
    return res.json();
};

// Create a new template
export const createTemplate = async (template: Template): Promise<Template> => {
    const res = await authFetch(API, {
        method: "POST",
        body: JSON.stringify(template),
    });
    if (!res.ok) throw new Error("Failed to create template");
    return res.json();
};

// Update template
export const updateTemplate = async (id: number, template: Template): Promise<Template> => {
    const res = await authFetch(`${API}/${id}`, {
        method: "PUT",
        body: JSON.stringify(template),
    });
    if (!res.ok) throw new Error("Failed to update template");
    return res.json();
};

// Delete template
export const deleteTemplate = async (id: number): Promise<void> => {
    const res = await authFetch(`${API}/${id}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete template");
};
