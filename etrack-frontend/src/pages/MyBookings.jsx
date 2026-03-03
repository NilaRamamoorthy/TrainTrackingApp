import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMyBookings } from "../api/railway";

function StatusPill({ text }) {
  const t = String(text || "").toUpperCase();
  const cls =
    t.includes("CNF")
      ? "bg-green-100 text-green-700"
      : t.includes("RAC")
      ? "bg-yellow-100 text-yellow-700"
      : t.includes("WL")
      ? "bg-orange-100 text-orange-700"
      : t.includes("CANCEL")
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-700";

  return <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${cls}`}>{text || "-"}</span>;
}

export default function MyBookings() {
  const navigate = useNavigate();

  const [type, setType] = useState("upcoming"); // upcoming | history | cancelled
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setErr("");
      setLoading(true);
      try {
        const data = await fetchMyBookings(type);
        if (!mounted) return;
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!mounted) return;
        setErr(e.message || "Failed to load tickets");
        setItems([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [type]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top */}
      <div className="px-5 pt-6 pb-3 flex items-center gap-3">
        <button className="text-primary text-lg" onClick={() => navigate(-1)}>
          <i className="bi bi-chevron-left" /> My Tickets
        </button>
      </div>

      {/* Tabs */}
      <div className="px-5">
        <div className="flex gap-2">
          {[
            { key: "upcoming", label: "Upcoming" },
            { key: "history", label: "History" },
            { key: "cancelled", label: "Cancelled" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={`px-3 py-2 rounded-lg text-sm border ${
                type === t.key
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="px-5 text-sm text-gray-500 mt-6">Loading tickets...</div>
      ) : err ? (
        <div className="px-5 text-sm text-red-600 mt-6">{err}</div>
      ) : (
        <div className="px-5 mt-4 pb-24 space-y-3">
          {items.length === 0 ? (
            <div className="text-sm text-gray-500">No tickets found.</div>
          ) : (
            items.map((b) => (
              <button
                key={b.id}
                onClick={() => navigate(`/ticket/${b.id}`)} // ✅ opens TicketDetails
                className="w-full text-left rounded-2xl border border-gray-200 p-4 bg-white shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {b.train_no ? `${b.train_no} ` : ""}{" "}
                      <span className="text-gray-500 font-normal">{b.train_name || ""}</span>
                    </div>
                    <div className="text-sm text-gray-700 mt-1">
                      {(b.from_station_name || b.from_name || "From")} →{" "}
                      {(b.to_station_name || b.to_name || "To")}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Date: {b.run_date || b.date || "-"}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <StatusPill text={b.current_status || b.booking_status || b.status} />
                    <div className="text-[11px] text-gray-500">
                      PNR: <span className="font-semibold text-gray-800">{b.pnr || "-"}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      <div className="bottom-bar mt-auto" />
    </div>
  );
}