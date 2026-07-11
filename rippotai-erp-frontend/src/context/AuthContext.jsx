import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  useLoginMutation,
  useLogoutMutation,
  useLazyMeQuery,
} from "../api/auth.api";

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
  const [logoutMutation] = useLogoutMutation();
  const [triggerMe] = useLazyMeQuery();

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
      // /auth/me returns the user object directly (see getCurrentUserFromPayload)
      const userData = await triggerMe().unwrap();
      localStorage.setItem("bc_user", JSON.stringify(userData));
      setUser(userData);
    } catch {
      clearSession();
    } finally {
      setReady(true);
    }
  }, [triggerMe]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    // backend returns { token, user }, NOT access_token
    const { token, user: userData } = await loginMutation({
      email,
      password,
    }).unwrap();
    persistSession(token, userData);
    return userData;
  };

  // NOTE: no /auth/register or /auth/signup endpoint exists in the AuthController
  // shown — these assume you'll add matching routes on the Nest side that return
  // the same { token, user } shape as login. Wire up authApi.register/signup
  // mutations there before relying on these.
  const register = async (payload) => {
    const { token, user: userData } = await loginMutation(payload).unwrap(); // placeholder — swap for a real registerMutation once it exists
    persistSession(token, userData);
    return userData;
  };

  const signup = register; // alias until backend distinguishes the two flows

  const logout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // proceed with local cleanup even if the server call fails
    } finally {
      clearSession();
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, ready, login, register, signup, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
