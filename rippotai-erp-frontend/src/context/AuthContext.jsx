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
} from "../api/auth/auth.api";
import { useUpdateUserMutation } from "../api/users/user.api";

import { useDispatch } from "react-redux";
import { baseApi } from "../store/baseApi";
import {
  getSessionToken,
  persistSession as saveSession,
  persistIdentity,
  clearStoredSession,
} from "../lib/session";
import { clearLocalDrafts } from "../lib/draft-storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const dispatch = useDispatch();

  const [ready, setReady] = useState(false);

  const [loginMutation] = useLoginMutation();
  const [signupMutation] = useSignupMutation();
  const [logoutMutation] = useLogoutMutation();
  const [triggerMe] = useLazyMeQuery();
  const [updateUserMutation] = useUpdateUserMutation();

  const persistSession = (token, userData) => {
    clearLocalDrafts();
    saveSession(token, userData);
  };

  const clearSession = useCallback(() => {
    clearStoredSession();
    dispatch(baseApi.util.resetApiState());
    setUser(null);
  }, [dispatch]);

  const refresh = useCallback(async ({ throwOnError = false } = {}) => {
    const token = getSessionToken();

    if (!token) {
      clearSession();
      setReady(true);
      if (throwOnError) throw new Error("Your session could not be established. Please sign in again.");
      return;
    }

    try {
      const response = await triggerMe().unwrap();
      if (getSessionToken() !== token) {
        if (throwOnError) throw new Error("Your session expired while signing in. Please try again.");
        return;
      }

      // Backend returns either { user } or user directly
      const userData = response.user ?? response;

      persistIdentity(userData);
      setUser(userData);
      return userData;
    } catch (err) {
      if (getSessionToken() !== token) {
        if (throwOnError) throw err;
        return;
      }
      console.error(err);
      clearSession();
      if (throwOnError) throw err;
    } finally {
      setReady(true);
    }
  }, [triggerMe, clearSession]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const ended = () => {
      setUser(null);
      dispatch(baseApi.util.resetApiState());
    };
    window.addEventListener("bc:session-ended", ended);
    return () => window.removeEventListener("bc:session-ended", ended);
  }, [dispatch]);

  useEffect(() => {
    if (!user?.id) return;
    const activity = () => {
      if (getSessionToken())
        sessionStorage.setItem("bc_activity", String(Date.now()));
    };
    const events = ["pointerdown", "keydown", "touchstart", "scroll"];
    events.forEach((event) =>
      window.addEventListener(event, activity, { passive: true }),
    );
    const timer = setInterval(() => getSessionToken(), 15_000);
    const visible = () => {
      if (!document.hidden) getSessionToken();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      events.forEach((event) => window.removeEventListener(event, activity));
      document.removeEventListener("visibilitychange", visible);
      clearInterval(timer);
    };
  }, [user?.id]);

  /**
   * Login
   */
  const login = async (email, password) => {
    const { token, user: userData } = await loginMutation({
      email,
      password,
    }).unwrap();

    persistSession(token, userData);
    return refresh({ throwOnError: true });
  };

  /**
   * Signup
   */
  const signup = async (payload) => {
    const { token, user: userData } = await signupMutation(payload).unwrap();

    persistSession(token, userData);
    return refresh({ throwOnError: true });
  };

  /**
   * Alias for signup
   */
  const register = signup;

  /**
   * Logout
   */
  const logout = async () => {
    const request = logoutMutation(getSessionToken());
    clearSession();
    try {
      await request.unwrap();
    } catch (err) {
      console.error(err);
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

      persistIdentity(mergedUser);

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
