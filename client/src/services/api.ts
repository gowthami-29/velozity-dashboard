
const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

interface LoginResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER";
  };
}

export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  if (data.accessToken) {
    localStorage.setItem("accessToken", data.accessToken);
  }

  if (data.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
  }

  return data;
};

export const logout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
};

export const getStoredUser = () => {
  const user = localStorage.getItem("user");

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

export interface DashboardData {
  role: "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER";
  totalProjects: number;
  totalTasks: number;
  tasksByStatus: {
    TODO: number;
    IN_PROGRESS: number;
    IN_REVIEW: number;
    DONE: number;
  };
  overdueTasks: number;
}


export interface DashboardFilters {
  status?: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export const getDashboard = async (
  filters: DashboardFilters = {}
): Promise<DashboardData> => {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.priority) {
    params.set("priority", filters.priority);
  }

  const queryString = params.toString();

  const endpoint = queryString
    ? `/dashboard?${queryString}`
    : "/dashboard";

  const response = await apiFetch(endpoint, {
    method: "GET",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error?.message ||
        "Failed to load dashboard"
    );
  }

  return data.dashboard;
};




const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok || !data.accessToken) {
      return null;
    }

    localStorage.setItem("accessToken", data.accessToken);

    return data.accessToken;
  } catch (error) {
    console.error("Refresh token error:", error);
    return null;
  }
};

export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<Response> => {
  const token = localStorage.getItem("accessToken");

  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && retry) {
    const newToken = await refreshAccessToken();

    if (!newToken) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

      return response;
    }

    const retryHeaders = new Headers(options.headers);

    retryHeaders.set("Authorization", `Bearer ${newToken}`);

    if (options.body) {
      retryHeaders.set("Content-Type", "application/json");
    }

    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: retryHeaders,
      credentials: "include",
    });
  }

  return response;
};

export { API_URL };