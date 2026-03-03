import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Emergency() {
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [incident, setIncident] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function callHelpline() {
    // works on mobile; on desktop it will just try to open dialer
    window.location.href = "tel:139";
  }

  function submitReport(e) {
    e.preventDefault();

    if (!incident.trim()) {
      alert("Please describe the incident.");
      return;
    }

    // ✅ Later you can POST to backend here
    // await fetchWithAuth("/api/emergency/report/", { method:"POST", body: JSON.stringify(...) })

    setSubmitted(true);
    setIncident("");
    setLocation("");
    setPhone("");

    // auto hide success after 3 sec (optional)
    setTimeout(() => setSubmitted(false), 3000);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="px-5 pt-6 pb-4">
        <button className="text-primary text-lg" onClick={() => navigate(-1)}>
          <i className="bi bi-chevron-left" /> Emergency
        </button>
      </div>

      <div className="px-5 mt-6 text-center">
        <div className="text-red-600 text-5xl">
          <i className="bi bi-exclamation-triangle-fill" />
        </div>

        <div className="mt-6 text-lg font-semibold text-gray-800">
          Railway Emergency Helpline
        </div>

        <div className="mt-3 text-gray-600 text-sm">
          If you are in danger or facing emergency inside train or station,
          please contact immediately.
        </div>

        <button
          className="mt-8 w-full bg-red-600 text-white py-3 rounded-lg font-semibold shadow"
          onClick={callHelpline}
        >
          Call 139
        </button>

        <button
          className="mt-4 w-full border border-gray-300 py-3 rounded-lg font-semibold"
          onClick={() => {
            setShowForm((s) => !s);
            setSubmitted(false);
          }}
        >
          {showForm ? "Close Report Form" : "Report Incident"}
        </button>

        {/* ✅ Success message */}
        {submitted ? (
          <div className="mt-4 text-sm text-green-600 font-medium">
            Report submitted successfully. Help team will review it.
          </div>
        ) : null}

        {/* ✅ Expandable form */}
        {showForm ? (
          <form
            onSubmit={submitReport}
            className="mt-6 text-left bg-gray-50 border border-gray-200 rounded-xl p-4"
          >
            <div className="text-sm font-semibold text-gray-800 mb-3">
              Incident Report
            </div>

            <label className="text-xs text-gray-500">Describe the incident *</label>
            <textarea
              className="mt-2 w-full bg-white border border-gray-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              rows={4}
              placeholder="Example: I lost my bag near platform 2, Chennai Central..."
              value={incident}
              onChange={(e) => setIncident(e.target.value)}
            />

            <div className="mt-4 grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs text-gray-500">Station / Train (optional)</label>
                <input
                  className="mt-2 w-full bg-white border border-gray-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Example: Chennai Central / Train 12627"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">Your phone number (optional)</label>
                <input
                  className="mt-2 w-full bg-white border border-gray-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Example: 9000000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-4 w-full bg-primary text-white py-3 rounded-lg font-semibold shadow"
            >
              Submit Report
            </button>

          
          </form>
        ) : null}
      </div>

      <div className="bottom-bar mt-auto" />
    </div>
  );
}