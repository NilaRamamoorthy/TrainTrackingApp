import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createParcelBooking } from "../api/railway";

export default function ParcelBook() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { fromId, toId, date, option } = state || {};

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  if (!fromId || !toId || !date || !option) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 px-5 text-center">
        Missing parcel info. Go back to Schedule.
      </div>
    );
  }

  async function book() {
    setErr("");
    setLoading(true);
    try {
      const payload = {
        service_id: Number(option.service_id),
        date,
        from_station_id: Number(fromId),
        to_station_id: Number(toId),
      };
      const created = await createParcelBooking(payload);
      navigate(`/parcels/${created.id}`, { replace: true });
    } catch (e) {
      setErr(e.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="px-5 pt-6 pb-3 flex items-center gap-3">
        <button className="text-primary text-lg" onClick={() => navigate(-1)}>
          <i className="bi bi-chevron-left" /> Parcels
        </button>
      </div>

      <div className="px-5 mt-4 text-center">
        <div className="text-gray-600 text-sm">
          Your Distance {option.distance_km} is kilometers and parcel transport cost is
        </div>

        <div className="text-green-600 font-semibold text-xl mt-4">
          Rs.{option.base} + VAT
        </div>
        <div className="text-gray-700 text-sm mt-1">
          Total: <span className="font-semibold">Rs.{option.total}</span>
        </div>

        <div className="mt-10 flex justify-center">
          <div className="w-32 h-32 bg-gray-50 rounded-xl flex items-center justify-center">
            <i className="bi bi-box-seam text-6xl text-primary/30" />
          </div>
        </div>

        {err ? <div className="text-sm text-red-600 mt-6">{err}</div> : null}

        <button
          className="mt-10 w-40 bg-primary text-white py-3 rounded-lg font-semibold shadow disabled:opacity-60"
          onClick={book}
          disabled={loading}
        >
          {loading ? "Booking..." : "Ok"}
        </button>
      </div>

      <div className="bottom-bar mt-auto" />
    </div>
  );
}