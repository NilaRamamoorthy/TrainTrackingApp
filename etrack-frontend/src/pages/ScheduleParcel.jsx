import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStations, parcelSearch } from "../api/railway";

function toHHMM(d) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function ScheduleParcel() {
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(true);

  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");

  const [date, setDate] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoadingStations(true);
    fetchStations()
      .then((d) => mounted && setStations(Array.isArray(d) ? d : []))
      .catch(() => mounted && setStations([]))
      .finally(() => mounted && setLoadingStations(false));
    return () => (mounted = false);
  }, []);

  useEffect(() => {
    if (!stations.length) return;
    setFromId((p) => p || String(stations[0]?.id || ""));
    setToId((p) => p || String(stations[1]?.id || stations[0]?.id || ""));
  }, [stations]);

  const fromName = useMemo(
    () => stations.find((s) => String(s.id) === String(fromId))?.name || "-SELECT-",
    [stations, fromId]
  );
  const toName = useMemo(
    () => stations.find((s) => String(s.id) === String(toId))?.name || "-SELECT-",
    [stations, toId]
  );

  async function onSearch() {
    setErr("");
    setResults([]);
    if (!fromId || !toId || !date) return;
    if (String(fromId) === String(toId)) {
      setErr("Start and End station cannot be same");
      return;
    }

    setSearching(true);
    try {
      const data = await parcelSearch({ fromId, toId, date, startTime, endTime });
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Failed to search");
    } finally {
      setSearching(false);
    }
  }

  function pickTrain(option) {
    navigate("/parcel/book", {
      state: {
        fromId,
        toId,
        date,
        option, // contains service + cost + distance + times
      },
    });
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* header */}
      <div className="px-5 pt-6 pb-3 flex items-center justify-between">
        <button className="text-primary text-lg" onClick={() => navigate(-1)}>
          <i className="bi bi-chevron-left" /> Schedule
        </button>
        <button className="text-primary text-lg" onClick={() => window.location.reload()}>
          <i className="bi bi-arrow-clockwise" />
        </button>
      </div>

      <div className="px-5 mt-2 space-y-6">
        {/* Start station */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Start Station:</div>
          <select
            className="bg-gray-100 rounded-lg px-3 py-2 text-sm"
            disabled={loadingStations}
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
          >
            {stations.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Start time */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Start Time:</div>
          <input
            type="time"
            className="bg-gray-100 rounded-lg px-3 py-2 text-sm"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        {/* End station */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">End Station:</div>
          <select
            className="bg-gray-100 rounded-lg px-3 py-2 text-sm"
            disabled={loadingStations}
            value={toId}
            onChange={(e) => setToId(e.target.value)}
          >
            {stations.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* End time */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">End Time:</div>
          <input
            type="time"
            className="bg-gray-100 rounded-lg px-3 py-2 text-sm"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        {/* Date */}
        <div>
          <div className="text-sm font-semibold mb-2">Date:</div>
          <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-3">
            <i className="bi bi-calendar3 text-primary" />
            <input
              type="date"
              className="bg-transparent outline-none text-sm w-full"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {err ? <div className="text-sm text-red-600">{err}</div> : null}

        <button
          className="w-full bg-primary text-white py-3 rounded-lg font-semibold shadow"
          onClick={onSearch}
          disabled={searching}
        >
          {searching ? "Searching..." : "Search Train"}
        </button>
      </div>

      {/* results */}
      <div className="px-5 mt-6 pb-24">
        {results.map((r) => (
          <button
            key={r.service_id}
            onClick={() => pickTrain(r)}
            className="w-full rounded-xl border border-gray-200 p-4 mb-3 text-left"
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold text-sm">
                {r.train_no} <span className="text-gray-500 font-normal">{r.train_name}</span>
              </div>
              <div className="text-primary font-semibold text-sm">Rs.{r.total}</div>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {fromName} ({r.depart_time}) → {toName} ({r.arrive_time})
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Distance: {r.distance_km} km • Base: {r.base} • VAT: {r.vat}
            </div>
          </button>
        ))}
      </div>

      <div className="bottom-bar mt-auto" />
    </div>
  );
}