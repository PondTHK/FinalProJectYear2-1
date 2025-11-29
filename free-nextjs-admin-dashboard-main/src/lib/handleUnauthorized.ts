const LOGIN_ROUTE = "/signin";

export const redirectToLoginIfUnauthorized = (status: number) => {
  if (status !== 401) {
    return false;
  }

  if (typeof window !== "undefined") {
    // Redirect to the admin login page to obtain fresh cookies
    window.location.href = LOGIN_ROUTE;
  }

  return true;
};

