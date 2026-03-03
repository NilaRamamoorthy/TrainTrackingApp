import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMyParcels } from "../api/railway";

function statusPill(status) {
  const base = "px-2 py-1 rounded-full text-xs font-semibold";
  if (status === "DELIVERED") return `${base} bg-green-100 text-green-700`;
  if (status === "DEPARTED") return `${base} bg-blue-100 text-blue-700`;
  if (status === "CANCELLED") return `${base} bg-red-100 text-red-700`;
  return `${base} bg-yellow-100 text-yellow-700`; // BOOKED
}

export default function Parcels() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr("");
    fetchMyParcels("all")
      .then((d) => mounted && setItems(Array.isArray(d) ? d : []))
      .catch((e) => mounted && setErr(e.message || "Failed to load parcels"))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="px-5 pt-6 pb-3 flex items-center justify-between">
        <button className="text-primary text-lg" onClick={() => navigate(-1)}>
          <i className="bi bi-chevron-left" /> Parcels
        </button>
        <button className="text-primary" onClick={() => navigate("/parcel/schedule")}>
          + New
        </button>
      </div>

      <div className="px-5 pb-24">
        {loading ? <div className="text-sm text-gray-500 mt-6">Loading...</div> : null}
        {err ? <div className="text-sm text-red-600 mt-6">{err}</div> : null}

        {!loading && !err && items.length === 0 ? (
          <div className="text-sm text-gray-500 mt-6">No parcels yet.</div>
        ) : null}

        {items.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate(`/parcels/${p.id}`)}
            className="w-full text-left border border-gray-200 rounded-xl p-4 mt-3"
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold text-sm">{p.tracking_id}</div>
              <span className={statusPill(p.status)}>{p.status}</span>
            </div>

            <div className="text-xs text-gray-600 mt-1">
              {p.from_station_name} → {p.to_station_name}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Train {p.train_no} • Rs.{p.total_amount} • {p.distance_km} km
            </div>
          </button>
        ))}
      </div>

      <div className="bottom-bar mt-auto" />
    </div>
  );
}