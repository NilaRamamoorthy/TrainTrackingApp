import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../app/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSend() {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const data = await api.forgotPassword({ email });
      setMessage(data.message || "If this email exists, reset instructions were sent.");
    } catch (e) {
      setError(e.message || "Failed to send");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white">
      <div className="px-6 pt-8 flex-1">
        <button type="button" className="text-primary font-medium" onClick={() => navigate("/login")}>
          ← Reset password
        </button>

        <div className="flex flex-col items-center text-center mt-20">
          <p className="text-gray-700 max-w-xs mb-10">
            Enter the email associated with your account
          </p>

          <div className="w-full flex flex-col items-center">
            <div className="app-width text-left">
              <label className="text-sm font-semibold text-gray-800">Email address</label>
            </div>

            <input
              type="email"
              placeholder="abcde@gmail.com"
              className="app-input mt-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {message ? <div className="app-width text-left text-green-700 text-sm mt-4">{message}</div> : null}
            {error ? <div className="app-width text-left text-red-600 text-sm mt-4">{error}</div> : null}

            <button className="app-btn disabled:opacity-60 mt-10" onClick={handleSend} disabled={loading}>
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>

      <div className="bottom-bar" />
    </div>
  );
}