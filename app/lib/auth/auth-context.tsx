"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiClient, UserProfile } from "@/app/lib/client";
import { authAPI, userAPI } from "@/app/lib/api";

type UserRole = "PersonaUser" | "CompanyUser" | "Admin" | null;

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  userRole: UserRole;
  login: (
    username: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    username: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>; // Expose function to refresh auth status
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated on mount
    checkAuthStatus();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const userInfoResponse = await userAPI.getUserInfo();
      if (userInfoResponse.ok && userInfoResponse.data) {
        const role = userInfoResponse.data.role as UserRole;
        setUserRole(role);
        
        // Set user_role cookie for middleware to read
        if (role) {
          document.cookie = `user_role=${role}; path=/; max-age=2592000; SameSite=Lax`;
        }
        
        return role;
      }
    } catch (error) {
      console.error("Failed to fetch user info:", error);
    }
    return null;
  };

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Since cookies are httpOnly, we can't check them via document.cookie
      // Instead, try to fetch user info - if successful, user is authenticated
      const userInfoResponse = await userAPI.getUserInfo();

      if (userInfoResponse.ok && userInfoResponse.data) {
        // User is authenticated
        setIsAuthenticated(true);
        const role = userInfoResponse.data.role as UserRole;
        setUserRole(role);
        
        // Set user_role cookie for middleware to read
        if (role) {
          document.cookie = `user_role=${role}; path=/; max-age=2592000; SameSite=Lax`;
        }
        
        // Try to get username from localStorage or use from API
        const savedUsername = localStorage.getItem("username");
        if (savedUsername) {
          setUser({ username: savedUsername });
        } else if (userInfoResponse.data.username) {
          setUser({ username: userInfoResponse.data.username });
          localStorage.setItem("username", userInfoResponse.data.username);
        }
      } else {
        // User is not authenticated - just set state, don't redirect
        // Middleware will handle redirecting protected routes
        setIsAuthenticated(false);
        setUser(null);
        setUserRole(null);
        
        // Clear localStorage if 401 (token expired)
        if (userInfoResponse.status === 401) {
          localStorage.removeItem("username");
          localStorage.removeItem("profile_image_url");
          localStorage.removeItem("cover_image_url");
          localStorage.removeItem("user_about_me");
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      // On error, assume not authenticated
      setIsAuthenticated(false);
      setUser(null);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    username: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const response = await apiClient.login({ username, password });

      if (response.success) {
        setIsAuthenticated(true);
        setUser({ username });
        localStorage.setItem("username", username);
        // Clear old profile images when logging in as a new user
        localStorage.removeItem("profile_image_url");
        localStorage.removeItem("cover_image_url");
        localStorage.removeItem("user_about_me");
        
        // Fetch user role
        await fetchUserInfo();
        
        // Note: Redirect will be handled by the calling component based on role
        return { success: true };
      }

      return { success: false, error: response.message };
    } catch (error) {
      console.error("Login failed:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Login failed. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    username: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      // Step 1: Register the user
      const registerResponse = await apiClient.register({ username, password });

      if (!registerResponse.success) {
        return { success: false, error: registerResponse.message };
      }

      // Step 2: Auto-login after successful registration
      const loginResponse = await apiClient.login({ username, password });

      if (loginResponse.success) {
        setIsAuthenticated(true);
        setUser({ username });
        localStorage.setItem("username", username);
        // Clear old profile images when registering a new user
        localStorage.removeItem("profile_image_url");
        localStorage.removeItem("cover_image_url");
        localStorage.removeItem("user_about_me");
        
        // Fetch user role
        await fetchUserInfo();
        
        router.push("/onboarding");
        return { success: true };
      }

      return {
        success: false,
        error:
          "Registration successful but login failed. Please login manually.",
      };
    } catch (error) {
      console.error("Registration failed:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Registration failed. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    // Save current role before clearing state
    const currentRole = userRole;
    
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout request failed:", error);
    }

    // Clear localStorage
    localStorage.removeItem("username");
    localStorage.removeItem("profile_image_url");
    localStorage.removeItem("cover_image_url");
    localStorage.removeItem("user_about_me");
    
    // Clear user_role cookie
    document.cookie = "user_role=; path=/; max-age=0; SameSite=Lax";

    setIsAuthenticated(false);
    setUser(null);
    setUserRole(null);
    
    // Redirect based on role
    if (currentRole === "CompanyUser") {
      router.push("/company-login");
    } else {
      router.push("/auth");
    }
  };

  const refreshAuth = async () => {
    await checkAuthStatus();
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    userRole,
    login,
    register,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
