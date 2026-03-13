// src/api/departmentApi.ts
import { authFetch } from "@/utils/authFetch";

const API = "/api/admin/departments";

export const getDepartments = async () => {
  const res = await authFetch(API);
  return res.json();
};

export const createDepartment = async (data: any) => {
  const res = await authFetch(API, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateDepartment = async (id: number, data: any) => {
  const res = await authFetch(`${API}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.json();
};

export const checkDeleteDepartment = async (id: number) => {
  const res = await authFetch(`${API}/${id}/check`, { method: "DELETE" });
  return res.text();
};

export const confirmDeleteDepartment = async (id: number) => {
  const res = await authFetch(`${API}/${id}/confirm`, { method: "DELETE" });
  return res.text();
};
