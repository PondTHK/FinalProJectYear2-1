export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;

  password: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface UserProfile {
  username: string;
  email?: string;
  userId?: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        const error: ApiError = {
          message: errorText || `HTTP error! status: ${response.status}`,
          status: response.status,
        };
        throw error;
      }

      // For login endpoints, the response might be plain text
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }

      // Return plain text response
      const text = await response.text();
      return { success: true, message: text } as T;
    } catch (error) {
      console.error("API Request Error:", error);
      throw error;
    }
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("/authentication/login", {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include", // Important for cookies
    });
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/user/register", {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include", // Important for cookies
    });
  }

  async refreshToken(): Promise<AuthResponse> {
    return this.request<AuthResponse>("/refresh-token", {
      method: "POST",
      credentials: "include", // Important for cookies
    });
  }

  async adminLogin(data: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("/admin/login", {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include",
    });
  }

  async getUserProfile(): Promise<UserProfile> {
    try {
      return await this.request<UserProfile>("/api/user/", {
        method: "GET",
        credentials: "include",
      });
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient;
