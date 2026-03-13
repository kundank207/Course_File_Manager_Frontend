import { authFetch } from "@/utils/authFetch";

const API = "/api/semester";

export const getSemesters = async (programId: number, branchId: number) => {
  const res = await authFetch(
    `${API}?programId=${programId}&branchId=${branchId}`
  );

  if (!res.ok) return [];

  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const getAllSemesters = async () => {
  const res = await authFetch(`${API}/all`);

  if (!res.ok) return [];

  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const createSemester = (data: any) =>
  authFetch(API, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateSemester = (id: number, data: any) =>
  authFetch(`${API}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteSemester = (id: number) =>
  authFetch(`${API}/${id}`, {
    method: "DELETE",
  });

export const generateBulkSemesters = (data: any) =>
  authFetch(`${API}/generate-bulk`, {
    method: "POST",
    body: JSON.stringify(data),
  });
