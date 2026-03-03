import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

export default function BookTicket() {
  const navigate = useNavigate();
  const { trainId } = useParams(); // serviceId
  const location = useLocation();

  const state = location.state || {};
  const {
    fromId,
    toId,
    date,
    fares,
    depart_time,
    arrive_time,
    train_no,
    train_name,
    route_name,
  } = state;

  const [seatCount, setSeatCount] = useState(1);
  const [cls, setCls] = useState("third"); // first | second | third

  const farePerSeat = Number(fares?.[cls] || 0);
  const total = farePerSeat * seatCount;

  function dec() {
    setSeatCount((c) => Math.max(1, c - 1));
  }
  function inc() {
    setSeatCount((c) => Math.min(10, c + 1));
  }

  function continueToPassengers() {
    // ✅ validate minimal data
    if (!fromId || !toId || !date) {
      alert("Missing booking details. Please go back and try again.");
      return;
    }
    if (!fares || !fares[cls]) {
      alert("Fare not available for selected class.");
      return;
    }

    navigate("/passengers", {
      state: {
        serviceId: Number(trainId),
        fromId,
        toId,
        date,
        travel_class: cls,
        seats: seatCount,
        fares,
        depart_time,
        arrive_time,
        train_no,
        train_name,
        route_name,
        total,
      },
    });
  }

  // If user refreshes this page, router state is lost
  if (!fromId || !toId || !date) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-600 gap-3 px-6 text-center">
        <div>Missing booking details (page refreshed or opened directly).</div>
        <button
          className="text-primary font-medium"
          onClick={() => navigate("/trains")}
        >
          Go back to Trains
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div className="px-5 pt-6 pb-4">
        <button className="text-primary text-lg" onClick={() => navigate(-1)}>
          <i className="bi bi-chevron-left" /> {train_no || `Service ${trainId}`}
        </button>

        <div className="text-gray-500 text-sm mt-1">
          {train_name || ""} {route_name ? `• ${route_name}` : ""}
        </div>

        {/* Times */}
        <div className="mt-6 flex items-start justify-between">
          <div className="text-center">
            <div className="text-xl font-semibold">{depart_time || "--:--"}</div>
          </div>

          <div className="flex-1 px-3 mt-3">
            <div className="flex items-center justify-between text-primary">
              <i className="bi bi-geo-alt-fill text-xl" />
              <i className="bi bi-train-front text-xl" />
              <i className="bi bi-geo-alt-fill text-xl" />
            </div>
            <div className="h-[3px] bg-gray-300 rounded-full mt-2" />
          </div>

          <div className="text-center">
            <div className="text-xl font-semibold">{arrive_time || "--:--"}</div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Date: <span className="font-medium text-gray-800">{date}</span>
        </div>

        {/* Class cards */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { key: "first", label: "1st" },
            { key: "second", label: "2nd" },
            { key: "third", label: "3rd" },
          ].map((x) => (
            <button
              key={x.key}
              onClick={() => setCls(x.key)}
              className={`rounded-xl p-4 border text-center ${
                cls === x.key
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-400 border-gray-200"
              }`}
            >
              <div className="text-sm font-semibold">{x.label}</div>
              <div className="text-sm">Class</div>
              <div className="text-xs mt-2">
                {fares?.[x.key] ? `Rs. ${fares[x.key]}` : "N/A"}
              </div>
            </button>
          ))}
        </div>

        {/* Seat counter */}
        <div className="mt-8 flex justify-center">
          <div className="flex items-center rounded-lg overflow-hidden shadow">
            <button
              className="w-12 h-12 bg-primary text-white text-xl"
              onClick={dec}
            >
              −
            </button>
            <div className="w-14 h-12 bg-white flex items-center justify-center text-primary font-semibold">
              {seatCount}
            </div>
            <button
              className="w-12 h-12 bg-primary text-white text-xl"
              onClick={inc}
            >
              +
            </button>
          </div>
        </div>

        {/* Total */}
        <div className="mt-6 text-center text-xl font-semibold">
          Rs. {total.toFixed(2)}
        </div>
      </div>

      <div className="px-5 pb-20">
        <button
          className="w-full bg-primary text-white py-3 rounded-lg font-semibold shadow disabled:opacity-60"
          onClick={continueToPassengers}
          disabled={!fares || !fares[cls]}
        >
          Continue
        </button>
      </div>

      <div className="bottom-bar" />
    </div>
  );
}