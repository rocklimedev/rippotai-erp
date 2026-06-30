import {
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
  authApi, // ← Import the api instance
} from "../api/auth.api";

export const useAuth = () => {
  const { data, isLoading, isError, refetch, error } = useMeQuery();

  const [loginMutation] = useLoginMutation();
  const [logoutMutation] = useLogoutMutation();

  const user = data?.user ?? null;

  const login = async (email, password) => {
    const result = await loginMutation({ email, password }).unwrap();
    localStorage.setItem("token", result.token);
    await refetch();
    return result;
  };

  const logout = async (navigateToLogin = true) => {
    try {
      await logoutMutation().unwrap();
    } catch (err) {
      console.log("Backend logout failed:", err);
    }

    localStorage.removeItem("token");
    authApi.util.invalidateTags(["AuthUser"]);

    await new Promise((r) => setTimeout(r, 80));

    if (navigateToLogin && typeof window !== "undefined") {
      window.location.href = "/login"; // Hard redirect to avoid stale state
    }
  };

  return {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user && !isError,
    refetchUser: refetch,
    error,
  };
};
