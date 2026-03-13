const BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  "http://localhost:8080";

type AuthData = {
  token: string;
};

export const authFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  // Build final URL
  const finalUrl = url.startsWith("http")
    ? url
    : `${BASE_URL}${url}`;

  // Read auth from localStorage
  let token: string | null = null;

  try {
    const raw = localStorage.getItem("courseflow_auth");
    if (raw) {
      const parsed: AuthData = JSON.parse(raw);
      token = parsed.token || null;
    }
  } catch {
    console.warn("Invalid auth data in localStorage");
  }

  // Build headers safely
  const isFormData = options.body instanceof FormData;

  const headers: HeadersInit = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as any) || {}),
  };

  // Debug (remove in production if you want)
  console.log("[authFetch]", finalUrl);

  // Make request
  const response = await fetch(finalUrl, {
    ...options,
    headers,
    credentials: "include",
  });

  // Handle common auth errors centrally
  if (response.status === 401) {
    console.warn("Unauthorized (401)");
    // optional: logout / redirect
  }

  if (response.status === 403) {
    console.warn("Forbidden (403)");
  }

  return response;
};

/**
 * Safely parses JSON from a Response, handling empty bodies or 204 No Content.
 */
export const safeJson = async (res: Response) => {
  if (res.status === 204) return null;
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch (e) {
    console.warn("[safeJson] Failed to parse response text as JSON:", e);
    return null;
  }
};
