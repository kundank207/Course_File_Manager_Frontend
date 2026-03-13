import { authFetch } from "@/utils/authFetch";

const API = "http://localhost:8080/api/branch";

export const getBranches = async (programId: number) => {
  const res = await authFetch(`${API}?programId=${programId}`);

  if (!res.ok) return [];

  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const getAllBranches = async () => {
  const res = await authFetch(`${API}/all`);

  if (!res.ok) return [];

  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const createBranch = (data: any) =>
  authFetch(API, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateBranch = (id: number, data: any) =>
  authFetch(`${API}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteBranch = (id: number) =>
  authFetch(`${API}/${id}`, {
    method: "DELETE",
  });
