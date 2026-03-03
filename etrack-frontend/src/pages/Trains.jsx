// Trains.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchStations, searchTrains } from "../api/railway";

// Leaflet
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";

/* ---------------- Helpers ---------------- */

function stationName(stations, id) {
  return stations.find((s) => String(s.id) === String(id))?.name || "Select";
}

function pickDifferentStationId(stations, avoidId) {
  return (
    stations.find((s) => String(s.id) !== String(avoidId))?.id ??
    stations[0]?.id ??
    null
  );
}

function getStationById(stations, id) {
  return stations.find((s) => String(s.id) === String(id)) || null;
}

function toLatLng(station) {
  if (!station) return null;
  const lat = Number(station.lat);
  const lng = Number(station.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
}

// Fix leaflet rendering when container is overlapped / resized
function FixMapResize() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

// Fit to markers/line
function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (!points || points.length === 0) return;

    if (points.length === 1) {
      map.setView(points[0], 11);
      return;
    }

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [map, points]);

  return null;
}

/* -------- Train Marker Animation -------- */

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Train icon as Leaflet divIcon (uses bootstrap icon class)
function makeTrainIcon() {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:34px;height:34px;border-radius:999px;
        background:white;display:flex;align-items:center;justify-content:center;
        box-shadow:0 6px 18px rgba(0,0,0,.25);
        border:1px solid rgba(0,0,0,.08);
      ">
        <i class="bi bi-train-front" style="font-size:18px;color:#1877F2;"></i>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function TrainMarker({ fromPoint, toPoint }) {
  const [t, setT] = useState(0.15); // 0..1 along the line
  const icon = useMemo(() => makeTrainIcon(), []);

  useEffect(() => {
    if (!fromPoint || !toPoint) return;

    let dir = 1;
    const id = setInterval(() => {
      setT((prev) => {
        let next = prev + dir * 0.01;
        if (next >= 0.9) {
          next = 0.9;
          dir = -1;
        } else if (next <= 0.1) {
          next = 0.1;
          dir = 1;
        }
        return next;
      });
    }, 120);

    return () => clearInterval(id);
  }, [fromPoint, toPoint]);

  const pos = useMemo(() => {
    if (!fromPoint || !toPoint) return null;
    return [
      lerp(fromPoint[0], toPoint[0], t),
      lerp(fromPoint[1], toPoint[1], t),
    ];
  }, [fromPoint, toPoint, t]);

  if (!pos) return null;

  return <Marker position={pos} icon={icon} />;
}

/* ---------------- Component ---------------- */

export default function Trains() {
  const navigate = useNavigate();
  const location = useLocation();

  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(true);

  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");

  const [date, setDate] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  // Load stations
  useEffect(() => {
    let mounted = true;
    setStationsLoading(true);

    fetchStations()
      .then((data) => {
        if (!mounted) return;
        setStations(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error(e);
        if (!mounted) return;
        setStations([]);
      })
      .finally(() => {
        if (!mounted) return;
        setStationsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Defaults once
  useEffect(() => {
    if (!stations.length) return;

    setFromId((prev) => (prev ? prev : String(stations[0]?.id ?? "")));

    setToId((prev) => {
      if (prev) return prev;
      const baseFrom = fromId || String(stations[0]?.id ?? "");
      return String(pickDifferentStationId(stations, baseFrom) ?? "");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stations]);

  // Receive selection state back
  useEffect(() => {
    const state = location.state;
    if (!state) return;

    if (state.fromId) setFromId(String(state.fromId));
    if (state.toId) setToId(String(state.toId));
    if (state.date) setDate(state.date);

    navigate(location.pathname + location.search, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Search trains
  useEffect(() => {
    let mounted = true;

    async function run() {
      setErrMsg("");
      setTrains([]);

      if (!fromId || !toId || !date) return;

      if (String(fromId) === String(toId)) {
        setErrMsg("From and To cannot be same.");
        return;
      }

      setLoading(true);
      try {
        const data = await searchTrains({ fromId, toId, date });
        if (!mounted) return;
        setTrains(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        if (!mounted) return;
        setErrMsg(e.message || "Failed to search trains");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [fromId, toId, date]);

  function openStationSelect(field) {
    navigate(`/stations?mode=select&field=${field}`, {
      state: { fromId, toId, date },
    });
  }

  function openBook(serviceId, trainItem) {
    navigate(`/book/${serviceId}`, {
      state: {
        fromId,
        toId,
        date,
        fares: trainItem?.fares || {},
        depart_time: trainItem?.depart_time,
        arrive_time: trainItem?.arrive_time,
        train_no: trainItem?.train_no,
        train_name: trainItem?.train_name,
        route_name: trainItem?.route_name,
      },
    });
  }

  const fromName = useMemo(() => stationName(stations, fromId), [stations, fromId]);
  const toName = useMemo(() => stationName(stations, toId), [stations, toId]);

  const fromStation = useMemo(() => getStationById(stations, fromId), [stations, fromId]);
  const toStation = useMemo(() => getStationById(stations, toId), [stations, toId]);

  const fromPoint = useMemo(() => toLatLng(fromStation), [fromStation]);
  const toPoint = useMemo(() => toLatLng(toStation), [toStation]);

  const linePoints = useMemo(() => {
    const pts = [];
    if (fromPoint) pts.push(fromPoint);
    if (toPoint) pts.push(toPoint);
    return pts;
  }, [fromPoint, toPoint]);

  const defaultCenter = [20.5937, 78.9629];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Top Home button */}
      <div className="absolute top-6 left-5 z-30">
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 text-primary font-medium bg-white/90 px-3 py-2 rounded-lg shadow"
        >
          <i className="bi bi-chevron-left" />
          Home
        </button>
      </div>

      {/* MAP AREA */}
      <div className="h-[60vh] bg-gray-200">
        <div className="h-full w-full overflow-hidden">
          <MapContainer
            center={fromPoint || toPoint || defaultCenter}
            zoom={6}
            scrollWheelZoom={true}
            className="h-full w-full"
          >
            {/* ✅ Reliable tile provider */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; OpenStreetMap contributors &copy; CARTO"
            />

            <FixMapResize />
            <FitBounds points={linePoints} />

            {fromPoint ? (
              <Marker position={fromPoint}>
                <Popup>
                  <div className="text-sm font-semibold">From</div>
                  <div className="text-sm">{fromStation?.name}</div>
                </Popup>
              </Marker>
            ) : null}

            {toPoint ? (
              <Marker position={toPoint}>
                <Popup>
                  <div className="text-sm font-semibold">To</div>
                  <div className="text-sm">{toStation?.name}</div>
                </Popup>
              </Marker>
            ) : null}

            {linePoints.length === 2 ? (
              <Polyline positions={linePoints} pathOptions={{ weight: 5 }} />
            ) : null}

            {/* ✅ Moving train marker */}
            {fromPoint && toPoint ? <TrainMarker fromPoint={fromPoint} toPoint={toPoint} /> : null}
          </MapContainer>
        </div>
      </div>

      {/* Bottom sheet */}
      <div className="absolute left-0 right-0 bottom-0 z-40 bg-white rounded-t-3xl shadow-2xl">
        <div className="flex justify-center pt-3">
          <div className="h-1 w-12 bg-gray-300 rounded-full" />
        </div>

        <div className="px-5 pt-4 pb-24 max-h-[45vh] overflow-y-auto">
          <div className="bg-gray-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="pt-1">
                <div className="w-1 h-4 bg-primary rounded" />
                <div className="w-1 h-4 bg-primary rounded my-2" />
                <div className="w-1 h-4 bg-primary rounded" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">From</div>
                  <button
                    className="text-gray-600 text-sm"
                    onClick={() => openStationSelect("from")}
                    disabled={stationsLoading}
                  >
                    {stationsLoading ? "Loading..." : fromName}
                  </button>
                </div>

                <div className="h-px bg-gray-300 my-3" />

                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">To</div>
                  <button
                    className="text-gray-600 text-sm"
                    onClick={() => openStationSelect("to")}
                    disabled={stationsLoading}
                  >
                    {stationsLoading ? "Loading..." : toName}
                  </button>
                </div>

                <div className="h-px bg-gray-300 my-3" />

                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Date</div>
                  <input
                    type="date"
                    className="text-sm bg-transparent outline-none text-gray-600"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                {(!fromPoint || !toPoint) && !stationsLoading ? (
                  <div className="text-xs text-gray-500 mt-2">
                    Map needs valid lat/lng for stations.
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {errMsg ? <div className="text-sm text-red-600 mt-3">{errMsg}</div> : null}
          {loading ? <div className="text-sm text-gray-500 mt-3">Searching trains...</div> : null}

          <div className="mt-3">
            {!loading && !errMsg && trains.length === 0 && fromId && toId ? (
              <div className="text-sm text-gray-500 mt-2">No trains found.</div>
            ) : null}

            {trains.map((t) => (
              <button
                key={t.service_id}
                onClick={() => openBook(t.service_id, t)}
                className="w-full flex items-center justify-between bg-[#EAF4FF] rounded-xl px-4 py-4 mt-3"
              >
                <div className="flex items-center gap-3 text-left">
                  <i className="bi bi-train-front text-primary text-2xl" />
                  <div>
                    <div className="text-sm font-semibold">
                      {t.train_no}{" "}
                      <span className="text-gray-500 font-normal">{t.train_name}</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      <span className="text-green-600 font-medium">
                        <i className="bi bi-wifi mr-1" />
                        {t.eta_text || "On time"}
                      </span>
                      <span className="ml-3">
                        {t.depart_time} → {t.arrive_time}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{t.route_name}</div>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <i className="bi bi-chevron-right text-primary" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bottom-bar absolute left-0 right-0 bottom-0 z-50" />
    </div>
  );
}