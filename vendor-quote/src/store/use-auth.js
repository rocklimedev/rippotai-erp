import {
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
} from "../api/auth.api";

export const useAuth = () => {
  const { data, isLoading, isError, refetch, error } = useMeQuery();

  const user = data?.user ?? null; // Simplified

  const [loginMutation] = useLoginMutation();
  const [logoutMutation] = useLogoutMutation();

  const login = async (email, password) => {
    const result = await loginMutation({ email, password }).unwrap();

    localStorage.setItem("token", result.token);
    await refetch(); // Important: Refresh me query

    return result;
  };

  const logout = async () => {
    localStorage.removeItem("token");

    try {
      await logoutMutation().unwrap();
    } catch (err) {
      console.log(err);
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
