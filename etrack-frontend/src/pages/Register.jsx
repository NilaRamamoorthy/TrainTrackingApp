import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../app/api";
import { saveAuth } from "../app/auth";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nic, setNic] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister() {
    setError("");
    setLoading(true);
    try {
      const data = await api.register({
        name,
        phone,
        nic_number: nic,
        email,
        password,
      });
      saveAuth(data);
      navigate("/after-login", { replace: true });
    } catch (e) {
      setError(e.message || "Register failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white">
      <div className="px-6 pt-8 flex-1">
        <button
          type="button"
          className="text-primary font-medium"
          onClick={() => navigate("/login")}
        >
          ← Register
        </button>

        <div className="flex flex-col items-center text-center mt-8">
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-6">
            <div className="w-14 h-14 rounded-full border-2 border-primary flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-primary" />
            </div>
          </div>

          <div className="w-full flex flex-col items-center gap-4">
            <input className="app-input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="app-input" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input className="app-input" placeholder="NIC Number" value={nic} onChange={(e) => setNic(e.target.value)} />
            <input className="app-input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="app-input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

            {error ? <div className="app-width text-left text-red-600 text-sm">{error}</div> : null}

            <button className="app-btn disabled:opacity-60 mt-2" onClick={handleRegister} disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>
        </div>
      </div>

      <div className="bottom-bar" />
    </div>
  );
}