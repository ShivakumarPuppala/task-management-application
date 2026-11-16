import { useState } from "react";
import { useAuth } from "../AuthContext.jsx";

export default function AuthScreen() {
  const { authenticate } = useAuth();
  const [mode, setMode] = useState("login");
  const [fields, setFields] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const updateField = (event) => {
    setFields((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await authenticate(mode, fields);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="brand-mark">✓</div>
        <p className="eyebrow">YOUR DAY, IN FOCUS</p>
        <h1>{mode === "login" ? "Welcome back" : "Make room for what matters."}</h1>
        <p className="auth-copy">
          {mode === "login"
            ? "Sign in to pick up right where you left off."
            : "Create an account and get your tasks in order."}
        </p>
        <form className="auth-form" onSubmit={submit}>
          {mode === "register" && (
            <label>
              Your name
              <input autoComplete="name" name="name" onChange={updateField} required value={fields.name} />
            </label>
          )}
          <label>
            Email address
            <input autoComplete="email" name="email" onChange={updateField} required type="email" value={fields.email} />
          </label>
          <label>
            Password
            <input
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength="6"
              name="password"
              onChange={updateField}
              required
              type="password"
              value={fields.password}
            />
          </label>
          {error && <p className="notice error" role="alert">{error}</p>}
          <button className="button primary full-width" disabled={busy} type="submit">
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            {!busy && <span aria-hidden="true">→</span>}
          </button>
        </form>
        <p className="auth-switch">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setError("");
              setMode(mode === "login" ? "register" : "login");
            }}
          >
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>
        <p className="secure-note">
          <span>◆</span> Your tasks are private and secure.
        </p>
      </section>
      <aside className="auth-aside">
        <div className="aside-orb orb-one" />
        <div className="aside-orb orb-two" />
        <div className="aside-content">
          <span className="aside-kicker">A LITTLE MORE CLARITY</span>
          <h2>Small steps.<br />Big momentum.</h2>
          <p>Keep the important things close, and make progress one task at a time.</p>
          <div className="aside-card">
            <span className="mock-check">✓</span>
            <div>
              <strong>Make time for deep work</strong>
              <small>Today · Personal</small>
            </div>
            <span className="mock-star">✳</span>
          </div>
          <div className="aside-card muted">
            <span className="mock-check">✓</span>
            <div>
              <strong>Take the next right step</strong>
              <small>One thing at a time</small>
            </div>
          </div>
        </div>
        <span className="aside-footer">A calmer way to get things done.</span>
      </aside>
    </main>
  );
}

