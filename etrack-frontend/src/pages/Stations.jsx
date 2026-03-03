// Stations.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { fetchStations } from "../api/railway";

export default function Stations() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const mode = params.get("mode") || "browse"; // browse | select
  const field = params.get("field") || "from"; // from | to

  const [q, setQ] = useState("");
  const [stationsData, setStationsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetchStations()
      .then((data) => {
        if (mounted) setStationsData(data);
      })
      .catch((err) => {
        console.error(err);
        if (mounted) setStationsData([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return stationsData
      .filter((s) => s.name?.toLowerCase().includes(term))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [q, stationsData]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const s of filtered) {
      const letter = ((s.name || "#")[0] || "#").toUpperCase();
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter).push(s);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  function openDetails(station) {
    navigate(`/stations/${station.id}?mode=${mode}&field=${field}`, {
      state: {
        station,
        fromId: location.state?.fromId || "",
        toId: location.state?.toId || "",
        date: location.state?.date || "",
      },
    });
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top */}
      <div className="px-5 pt-6 pb-3 flex items-center gap-3">
        <button className="text-primary text-lg" onClick={() => navigate(-1)}>
          <i className="bi bi-chevron-left" /> Stations
        </button>
      </div>

      {/* Search */}
      <div className="px-5">
        <div className="bg-gray-100 rounded-xl px-4 py-3 flex items-center justify-between">
          <input
            className="bg-transparent outline-none text-sm w-full"
            placeholder="Search..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <i className="bi bi-search text-primary text-lg" />
        </div>
      </div>

      {/* List */}
      <div className="px-5 mt-4 pb-24">
        {loading ? (
          <div className="text-sm text-gray-500 mt-6">Loading stations...</div>
        ) : null}

        {!loading &&
          grouped.map(([letter, list]) => (
            <div key={letter} className="mb-4">
              <div className="text-sm font-semibold text-gray-700 mb-2">
                {letter}
              </div>
              <div className="bg-[#FFF7F7] rounded-xl p-3">
                {list.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => openDetails(s)}
                    className="w-full text-left py-2 text-gray-700"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          ))}

        {!loading && filtered.length === 0 ? (
          <div className="text-sm text-gray-500 mt-6">No stations found.</div>
        ) : null}
      </div>

      <div className="bottom-bar mt-auto" />
    </div>
  );
}