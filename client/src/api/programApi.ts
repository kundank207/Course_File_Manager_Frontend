import { authFetch } from "@/utils/authFetch";

const API = "http://localhost:8080/api/program";


export const getPrograms = async () => {
  const res = await authFetch(API);

  if (!res.ok) return [];

  const data = await res.json();
  return Array.isArray(data) ? data : [];
};


export const createProgram = async (data: any) => {
  return authFetch(API, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateProgram = async (id: number, data: any) => {
  return authFetch(`${API}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteProgram = async (id: number) => {
  return authFetch(`${API}/${id}`, {
    method: "DELETE",
  });
};
