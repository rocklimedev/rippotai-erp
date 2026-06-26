import {
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
} from "../api/auth.api";

export const useAuth = () => {
  // Fetch current user - will return 401 when not authenticated (expected)
  const {
    data: user,
    isLoading,
    isError,
    refetch,
    error,
  } = useMeQuery(undefined, {
    // Optional: you can skip the query in certain cases, but usually we want it to run
    // to know the current auth state
  });

  const [loginMutation] = useLoginMutation();
  const [logoutMutation] = useLogoutMutation();

  const login = async (email, password) => {
    try {
      const result = await loginMutation({ email, password }).unwrap();

      console.log(result);

      // Save JWT
      localStorage.setItem("token", result.token);

      // Refetch user
      await refetch();

      return result;
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation().unwrap();
      await refetch(); // Clear user data after logout
    } catch (err) {
      console.error("Logout failed:", err);
      // Still try to clear local state
      await refetch();
    }
  };

  // Improved isAuthenticated logic
  const isAuthenticated = !!user && !isError;

  return {
    user: user ?? null,
    login,
    logout,
    isLoading,
    isAuthenticated,
    refetchUser: refetch,
    error, // expose error if needed for debugging
  };
};
