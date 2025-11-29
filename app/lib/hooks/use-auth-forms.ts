import { useState } from "react";

export interface LoginFormData {
  username: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
}

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export const useAuthForms = () => {
  const [loginForm, setLoginForm] = useState<LoginFormData>({
    username: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState<RegisterFormData>({
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [loginErrors, setLoginErrors] = useState<FormErrors<LoginFormData>>({});
  const [registerErrors, setRegisterErrors] = useState<
    FormErrors<RegisterFormData>
  >({});

  const validateLoginForm = (): boolean => {
    const errors: FormErrors<LoginFormData> = {};

    if (!loginForm.username.trim()) {
      errors.username = "Username is required";
    } else if (loginForm.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }

    if (!loginForm.password.trim()) {
      errors.password = "Password is required";
    } else if (loginForm.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegisterForm = (): boolean => {
    const errors: FormErrors<RegisterFormData> = {};

    if (!registerForm.username.trim()) {
      errors.username = "Username is required";
    } else if (registerForm.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }

    if (!registerForm.password.trim()) {
      errors.password = "Password is required";
    } else if (registerForm.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!registerForm.confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your password";
    } else if (registerForm.password !== registerForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginChange = (field: keyof LoginFormData, value: string) => {
    setLoginForm((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (loginErrors[field]) {
      setLoginErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleRegisterChange = (
    field: keyof RegisterFormData,
    value: string,
  ) => {
    setRegisterForm((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (registerErrors[field]) {
      setRegisterErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const resetForms = () => {
    setLoginForm({ username: "", password: "" });
    setRegisterForm({
      username: "",
      password: "",
      confirmPassword: "",
    });
    setLoginErrors({});
    setRegisterErrors({});
  };

  return {
    loginForm,
    registerForm,
    loginErrors,
    registerErrors,
    handleLoginChange,
    handleRegisterChange,
    validateLoginForm,
    validateRegisterForm,
    resetForms,
  };
};
