
import { useEffect, useState } from "react";
import { fetchMyBookings, cancelBooking } from "../api/railway";
import { useNavigate } from "react-router-dom";

export default function Schedule() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  async function load() {
    setLoading(true);
    setErrMsg("");
    try {
      const data = await fetchMyBookings("upcoming");
      setItems(data);
    } catch (e) {
      setErrMsg(e.message || "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCancel(id) {
    try {
      await cancelBooking(id);
      await load();
    } catch (e) {
      alert(e.message || "Cancel failed");
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="px-5 pt-6 pb-3 flex items-center gap-3">
        <button className="text-primary text-lg" onClick={() => navigate(-1)}>
          <i className="bi bi-chevron-left" /> Schedule
        </button>
      </div>

      <div className="px-5 pb-24">
        {loading ? <div className="text-sm text-gray-500 mt-4">Loading...</div> : null}
        {errMsg ? <div className="text-sm text-red-600 mt-4">{errMsg}</div> : null}

        {!loading && !errMsg && items.length === 0 ? (
          <div className="text-sm text-gray-500 mt-4">No upcoming trips.</div>
        ) : null}

        {items.map((b) => (
          <div key={b.id} className="mt-3 rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-gray-800">
                  {b.train_no} - {b.train_name}
                </div>
                <div className="text-xs text-gray-500 mt-1">{b.route_name}</div>
              </div>
              <div className="text-xs px-2 py-1 rounded bg-blue-50 text-primary">
                {b.status}
              </div>
            </div>

            <div className="mt-3 text-sm text-gray-700">
              {b.from_station_name} → {b.to_station_name}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Departure: {new Date(b.depart_datetime).toLocaleString()}
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <div>
                Class: <span className="font-medium">{b.travel_class}</span> • Seats:{" "}
                <span className="font-medium">{b.seats}</span>
              </div>
              <div className="font-semibold">Rs. {b.total_amount}</div>
            </div>

            {b.can_cancel ? (
              <button
                onClick={() => handleCancel(b.id)}
                className="mt-3 w-full border border-red-500 text-red-600 py-2 rounded-lg font-medium"
              >
                Cancel Ticket
              </button>
            ) : (
              <div className="mt-3 text-xs text-gray-500">
                Cancellation allowed only 2 days before journey.
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bottom-bar mt-auto" />
    </div>
  );
}