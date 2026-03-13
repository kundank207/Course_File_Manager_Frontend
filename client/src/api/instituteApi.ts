import { authFetch } from "@/utils/authFetch";

const BASE_URL = "http://localhost:8080/api/admin/institutes";

export const getInstitutes = async () => {
  const res = await authFetch(BASE_URL);
  return await res.json();
};

export const createInstitute = async (data: any) => {
  const { id, ...payload } = data; 

  const res = await authFetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Create institute failed");
  }

  return await res.json();
};

export const updateInstitute = async (id: number, data: any) => {
  const res = await authFetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return await res.json();
};

export const deleteInstitute = async (id: number) => {
  await authFetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
};
