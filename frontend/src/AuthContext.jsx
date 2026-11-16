import { createContext, useContext, useMemo, useState } from "react";
import { graphqlRequest } from "./api.js";

const AuthContext = createContext(null);
const storedSession = () => {
  try {
    return JSON.parse(localStorage.getItem("task-session") || "null");
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(storedSession);

  const authenticate = async (mode, fields) => {
    const operation = mode === "register"
      ? "mutation Register($name: String!, $email: String!, $password: String!) { register(name: $name, email: $email, password: $password) { token user { id name email } } }"
      : "mutation Login($email: String!, $password: String!) { login(email: $email, password: $password) { token user { id name email } } }";
    const data = await graphqlRequest(operation, fields);
    const nextSession = data[mode];
    localStorage.setItem("task-session", JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const signOut = () => {
    localStorage.removeItem("task-session");
    setSession(null);
  };

  const value = useMemo(() => ({
    session,
    authenticate,
    signOut
  }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
