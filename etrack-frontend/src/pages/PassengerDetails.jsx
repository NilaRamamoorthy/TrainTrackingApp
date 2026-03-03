import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createBooking } from "../api/railway";

const genderOptions = [
  { key: "M", label: "Male" },
  { key: "F", label: "Female" },
  { key: "O", label: "Other" },
];

function emptyPassenger() {
  return { name: "", age: "", gender: "M" };
}

export default function PassengerDetails() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // if refresh happens, state is lost
  if (!state?.serviceId || !state?.fromId || !state?.toId || !state?.date) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-600 gap-3 px-6 text-center">
        <div>Missing booking info. Please go back and select train again.</div>
        <button className="text-primary font-medium" onClick={() => navigate("/trains")}>
          Go to Trains
        </button>
      </div>
    );
  }

  const {
    serviceId,
    fromId,
    toId,
    date,
    travel_class,
    seats,
    train_no,
    train_name,
    route_name,
    depart_time,
    arrive_time,
    total,
  } = state;

  const [passengers, setPassengers] = useState(() =>
    Array.from({ length: seats }, () => emptyPassenger())
  );
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return passengers.every((p) => p.name.trim() && String(p.age).trim());
  }, [passengers]);

  function updatePassenger(i, key, val) {
    setPassengers((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [key]: val };
      return copy;
    });
  }

  async function confirmBooking() {
    if (!canSubmit) {
      alert("Please fill all passenger details.");
      return;
    }

    const payload = {
      service_id: Number(serviceId),
      date,
      from_station_id: Number(fromId),
      to_station_id: Number(toId),
      travel_class,
      seats: Number(seats),
      passengers: passengers.map((p) => ({
        name: p.name.trim(),
        age: Number(p.age),
        gender: p.gender,
      })),
    };

    setLoading(true);
    try {
      const booking = await createBooking(payload);
      navigate(`/ticket/${booking.id}`, { replace: true });
    } catch (e) {
      alert(e.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <button className="text-primary text-lg" onClick={() => navigate(-1)}>
          <i className="bi bi-chevron-left" /> Passenger Details
        </button>
        <div className="text-xs text-gray-500 mt-1">
          {train_no} {train_name ? `• ${train_name}` : ""} {route_name ? `• ${route_name}` : ""}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {depart_time} → {arrive_time} • {date}
        </div>
      </div>

      {/* Passenger forms */}
      <div className="px-5 pb-24 space-y-4">
        {passengers.map((p, idx) => (
          <div key={idx} className="border border-gray-200 rounded-xl p-4">
            <div className="text-sm font-semibold text-gray-800 mb-3">
              Passenger {idx + 1}
            </div>

            <label className="text-xs text-gray-500">Name</label>
            <input
              className="mt-2 w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none"
              placeholder="Full name"
              value={p.name}
              onChange={(e) => updatePassenger(idx, "name", e.target.value)}
            />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Age</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  className="mt-2 w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none"
                  placeholder="Age"
                  value={p.age}
                  onChange={(e) => updatePassenger(idx, "age", e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">Gender</label>
                <select
                  className="mt-2 w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none"
                  value={p.gender}
                  onChange={(e) => updatePassenger(idx, "gender", e.target.value)}
                >
                  {genderOptions.map((g) => (
                    <option key={g.key} value={g.key}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}

        {/* Fare summary */}
        <div className="bg-gray-100 rounded-xl p-4">
          <div className="text-sm text-gray-700 flex justify-between">
            <span>Class</span>
            <span className="font-semibold">{travel_class}</span>
          </div>
          <div className="text-sm text-gray-700 flex justify-between mt-2">
            <span>Seats</span>
            <span className="font-semibold">{seats}</span>
          </div>
          <div className="text-sm text-gray-700 flex justify-between mt-2">
            <span>Total</span>
            <span className="font-semibold">Rs. {Number(total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Confirm */}
      <div className="fixed left-0 right-0 bottom-0 bg-white px-5 pb-20 pt-3 border-t">
        <button
          className="w-full bg-primary text-white py-3 rounded-lg font-semibold shadow disabled:opacity-60"
          onClick={confirmBooking}
          disabled={!canSubmit || loading}
        >
          {loading ? "Booking..." : "Confirm Booking"}
        </button>
      </div>

      <div className="bottom-bar mt-auto" />
    </div>
  );
}