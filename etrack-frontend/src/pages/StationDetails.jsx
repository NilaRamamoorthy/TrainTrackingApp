// StationDetails.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { fetchStations } from "../api/railway";

export default function StationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const mode = params.get("mode") || "browse"; // browse | select
  const field = params.get("field") || "from"; // from | to

  const [station, setStation] = useState(location.state?.station || null);
  const [loading, setLoading] = useState(!location.state?.station);

  useEffect(() => {
    // If station was passed from Stations list, no need to fetch
    if (location.state?.station) return;

    let mounted = true;
    setLoading(true);

    fetchStations()
      .then((data) => {
        if (!mounted) return;
        const found = data.find((s) => String(s.id) === String(id));
        setStation(found || null);
      })
      .catch((e) => {
        console.error(e);
        if (!mounted) return;
        setStation(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]); // ✅ only depends on id

function selectStation() {
  if (!station) return;

  const prevFrom = String(location.state?.fromId || "");
  const prevTo = String(location.state?.toId || "");
  const prevDate = location.state?.date || "";

  const selectedId = String(station.id);

  const nextFrom = field === "from" ? selectedId : prevFrom;
  const nextTo = field === "to" ? selectedId : prevTo;

  navigate("/trains", {
    replace: true,
    state: {
      field,
      selectedStationId: selectedId,
      fromId: nextFrom,
      toId: nextTo,
      date: prevDate,
    },
  });
}

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading station...
      </div>
    );
  }

  if (!station) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-500 gap-3">
        <div>Station not found</div>
        <button className="text-primary" onClick={() => navigate(-1)}>
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top */}
      <div className="px-5 pt-6 pb-3 flex items-center gap-3">
        <button className="text-primary text-lg" onClick={() => navigate(-1)}>
          <i className="bi bi-chevron-left" />{" "}
          {mode === "select" ? "Select Station" : "Stations"}
        </button>
      </div>

      {/* Image */}
      <div className="px-5">
        <div className="w-full h-52 rounded-xl overflow-hidden bg-gray-100">
          <img
            src={station.image_url || "/station.jpg"}
            alt={station.name}
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-5 mt-5 pb-12">
        <h1 className="text-xl font-semibold">{station.name}</h1>
        <p className="text-gray-600 text-sm mt-3 leading-relaxed">
          {station.description || "No description available."}
        </p>

        <div className="mt-6 space-y-2 text-sm">
          <div>
            <span className="font-semibold">Address:</span>{" "}
            <span className="text-gray-700">
              {station.address || station.city || "-"}
            </span>
          </div>
          <div>
            <span className="font-semibold">Hours:</span>{" "}
            <span className="text-green-600">{station.hours || "-"}</span>
          </div>
          <div>
            <span className="font-semibold">Phone:</span>{" "}
            {station.phone ? (
              <a className="text-primary" href={`tel:${station.phone}`}>
                {station.phone}
              </a>
            ) : (
              <span className="text-gray-700">-</span>
            )}
          </div>
          <div>
            <span className="font-semibold">Head of the Organization:</span>{" "}
            <span className="text-gray-700">{station.head_of_org || "-"}</span>
          </div>
        </div>

        <h2 className="font-semibold mt-8">General Information</h2>
        <div className="mt-3 space-y-2 text-sm text-gray-700">
          <div>
            Email :{" "}
            {station.email ? (
              <a className="text-primary" href={`mailto:${station.email}`}>
                {station.email}
              </a>
            ) : (
              "-"
            )}
          </div>
        </div>
      </div>

      {/* Select button only in select mode */}
      {mode === "select" ? (
        <div className="flex justify-center left-0 right-0 bottom-14 px-5 mb-3">
          <button
            className="w-[300px] bg-primary text-white py-3 rounded-lg font-semibold shadow"
            onClick={selectStation}
          >
            Select as {field === "from" ? "From" : "To"}
          </button>
        </div>
      ) : null}

      <div className="bottom-bar mt-auto" />
    </div>
  );
}