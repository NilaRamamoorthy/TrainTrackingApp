import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../app/api";
import { saveAuth } from "../app/auth";

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    if (e?.preventDefault) e.preventDefault();

    const cleanIdentifier = identifier.trim();

    if (!cleanIdentifier || !password) {
      setError("Please enter email/phone/NIC and password.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const data = await api.login({ identifier: cleanIdentifier, password });
      saveAuth(data);
      navigate("/after-login", { replace: true });
    } catch (e2) {
      setError(e2.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  const canLogin = identifier.trim().length > 0 && password.length > 0 && !loading;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white">
      <div className="flex flex-col items-center justify-center px-6 text-center flex-1">
        <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center mb-6">
          <img
            src="/logo.png"
            alt="E-Track Logo"
            className="w-full object-center rounded-full"
          />
        </div>

        {/* ✅ form prevents Enter-key weirdness + browser autofill issues */}
        <form
          onSubmit={handleLogin}
          className="w-full flex flex-col items-center gap-4 mt-2"
        >
          <input
            type="text"
            placeholder="Email / Phone / NIC"
            className="app-input"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
          />

          <input
            type="password"
            placeholder="Password"
            className="app-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <div className="app-width text-right">
            <button
              type="button"
              className="app-link"
              onClick={() => navigate("/forgot-password")}
            >
              forgot password ?
            </button>
          </div>

          {error ? (
            <div className="app-width text-left text-red-600 text-sm">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            className="app-btn disabled:opacity-60"
            disabled={!canLogin}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="text-sm mt-4">
            Don't have an account?{" "}
            <button
              type="button"
              className="text-primary"
              onClick={() => navigate("/register")}
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>

      <div className="bottom-bar" />
    </div>
  );
}