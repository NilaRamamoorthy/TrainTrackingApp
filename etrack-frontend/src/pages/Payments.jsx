import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMyPayments } from "../api/railway";

function statusBadge(status) {
  const s = String(status || "").toLowerCase();
  if (s === "success") return "bg-green-100 text-green-700";
  if (s === "failed") return "bg-red-100 text-red-700";
  if (s === "refunded") return "bg-yellow-100 text-yellow-700";
  return "bg-gray-100 text-gray-700";
}

export default function Payments() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("all"); // all | success | failed | refunded

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr("");

    fetchMyPayments()
      .then((data) => mounted && setItems(Array.isArray(data) ? data : []))
      .catch((e) => mounted && setErr(e.message || "Failed to load payments"))
      .finally(() => mounted && setLoading(false));

    return () => (mounted = false);
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((x) => String(x.status || "").toLowerCase() === filter);
  }, [items, filter]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button className="text-primary text-lg" onClick={() => navigate(-1)}>
          <i className="bi bi-chevron-left" /> Payments
        </button>
      </div>

      {/* Filters */}
      <div className="px-5 flex gap-2">
        {[
          { key: "all", label: "All" },
          { key: "success", label: "Success" },
          { key: "failed", label: "Failed" },
          { key: "refunded", label: "Refunded" },
        ].map((x) => (
          <button
            key={x.key}
            onClick={() => setFilter(x.key)}
            className={`px-3 py-2 rounded-full text-xs border ${
              filter === x.key ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="px-5 mt-4 pb-24">
        {loading ? <div className="text-sm text-gray-500 mt-6">Loading payments...</div> : null}
        {err ? <div className="text-sm text-red-600 mt-6">{err}</div> : null}

        {!loading && !err && filtered.length === 0 ? (
          <div className="text-sm text-gray-500 mt-6">No payments found.</div>
        ) : null}

        {filtered.map((p) => (
          <div key={p.id} className="border border-gray-200 rounded-xl p-4 mb-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-800">
                {p.provider?.toUpperCase?.() || "PAYMENT"} • {p.txn_ref || `#${p.id}`}
              </div>
              <div className={`text-xs px-2 py-1 rounded-full ${statusBadge(p.status)}`}>
                {String(p.status || "unknown").toUpperCase()}
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-500">
              {p.created_at ? new Date(p.created_at).toLocaleString() : ""}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Amount: <span className="font-semibold">Rs. {p.total_amount ?? "-"}</span>
              </div>

              {/* Optional: open ticket */}
              {p.booking_id ? (
                <button
                  className="text-primary text-sm font-medium"
                  onClick={() => navigate(`/ticket/${p.booking_id}`)}
                >
                  View Ticket
                </button>
              ) : null}
            </div>

            {p.pnr ? (
              <div className="mt-2 text-xs text-gray-600">
                PNR: <span className="font-semibold">{p.pnr}</span>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="bottom-bar mt-auto" />
    </div>
  );
}