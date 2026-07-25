import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  useLoginMutation,
  useSignupMutation,
  useLogoutMutation,
  useLazyMeQuery,
} from "../api/auth.api";
import { useUpdateUserMutation } from "../api/user.api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("bc_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [ready, setReady] = useState(false);

  const [loginMutation] = useLoginMutation();
  const [signupMutation] = useSignupMutation();
  const [logoutMutation] = useLogoutMutation();
  const [triggerMe] = useLazyMeQuery();
  const [updateUserMutation] = useUpdateUserMutation();

  const persistSession = (token, userData) => {
    localStorage.setItem("bc_token", token);
    localStorage.setItem("bc_user", JSON.stringify(userData));
    setUser(userData);
  };

  const clearSession = () => {
    localStorage.removeItem("bc_token");
    localStorage.removeItem("bc_user");
    setUser(null);
  };

  const refresh = useCallback(async () => {
    const token = localStorage.getItem("bc_token");

    if (!token) {
      setReady(true);
      return;
    }

    try {
      const response = await triggerMe().unwrap();

      // Backend returns either { user } or user directly
      const userData = response.user ?? response;

      localStorage.setItem("bc_user", JSON.stringify(userData));
      setUser(userData);
    } catch (err) {
      console.error(err);
      clearSession();
    } finally {
      setReady(true);
    }
  }, [triggerMe]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Login
   */
  const login = async (email, password) => {
    const { token, user: userData } = await loginMutation({
      email,
      password,
    }).unwrap();

    persistSession(token, userData);

    return userData;
  };

  /**
   * Signup
   */
  const signup = async (payload) => {
    const { token, user: userData } = await signupMutation(payload).unwrap();

    persistSession(token, userData);

    return userData;
  };

  /**
   * Alias for signup
   */
  const register = signup;

  /**
   * Logout
   */
  const logout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch (err) {
      console.error(err);
    } finally {
      clearSession();
    }
  };

  /**
   * Update current user profile
   */
  const updateUser = useCallback(
    async (payload) => {
      if (!user?.id) {
        throw new Error("No authenticated user.");
      }

      const result = await updateUserMutation({
        id: user.id,
        ...payload,
      }).unwrap();

      const updatedUser = result.user ?? result;

      const mergedUser = {
        ...user,
        ...updatedUser,
      };

      localStorage.setItem("bc_user", JSON.stringify(mergedUser));

      setUser(mergedUser);

      return mergedUser;
    },
    [user, updateUserMutation],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        login,
        signup,
        register,
        logout,
        refresh,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
