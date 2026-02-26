import { useState } from "react";
import { useCurrentUser } from "../hooks/useCurrentUser";

export function AuthForm() {
  const { register, login } = useCurrentUser();
  const [mode, setMode] = useState("login"); // 'login' | 'register'

  // Shared fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Register-only fields
  const [username, setUsername] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await register(username.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next) {
    setMode(next);
    setError("");
    setEmail("");
    setPassword("");
    setUsername("");
  }

  return (
    <div style={s.page}>
      <h1 style={s.title}>💬 Communicator</h1>

      <div style={s.card}>
        {/* Tab switcher */}
        <div style={s.tabs}>
          <button
            style={{ ...s.tab, ...(mode === "login" ? s.tabActive : {}) }}
            onClick={() => switchMode("login")}
            type="button"
          >
            Sign in
          </button>
          <button
            style={{ ...s.tab, ...(mode === "register" ? s.tabActive : {}) }}
            onClick={() => switchMode("register")}
            type="button"
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          {/* Username — only shown on register */}
          {mode === "register" && (
            <div style={s.field}>
              <label style={s.label}>Username</label>
              <input
                style={s.input}
                type="text"
                placeholder="e.g. johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
          )}

          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus={mode === "login"}
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input
              style={s.input}
              type="password"
              placeholder={mode === "register" ? "At least 6 characters" : ""}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p style={s.error}>{error}</p>}

          <button style={s.btn} type="submit" disabled={loading}>
            {loading
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        {mode === "login" && (
          <p style={s.hint}>
            Demo accounts: alice@demo.com / bob@demo.com / charlie@demo.com
            <br />
            Password: <strong>password123</strong>
          </p>
        )}
      </div>
    </div>
  );
}

const s = {
  page: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    fontFamily: "sans-serif",
    background: "#f5f5f5",
  },
  title: { marginBottom: 24, fontSize: 28 },
  card: {
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
    width: 360,
    overflow: "hidden",
  },
  tabs: { display: "flex", borderBottom: "1px solid #eee" },
  tab: {
    flex: 1,
    padding: "12px 0",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    color: "#666",
  },
  tabActive: {
    color: "#0070f3",
    fontWeight: "bold",
    borderBottom: "2px solid #0070f3",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    padding: "24px 24px 16px",
  },
  field: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 13, color: "#555", fontWeight: "500" },
  input: {
    padding: "9px 11px",
    fontSize: 14,
    border: "1px solid #ddd",
    borderRadius: 4,
    outline: "none",
  },
  btn: {
    padding: "10px",
    fontSize: 14,
    fontWeight: "bold",
    background: "#0070f3",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    marginTop: 4,
  },
  error: { margin: 0, color: "#c0392b", fontSize: 13 },
  hint: {
    padding: "12px 24px 16px",
    fontSize: 12,
    color: "#888",
    lineHeight: 1.6,
  },
};
