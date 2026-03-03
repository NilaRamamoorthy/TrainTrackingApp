import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchParcelDetail } from "../api/railway";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function ParcelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cardRef = useRef(null);

  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchParcelDetail(id)
      .then((d) => mounted && setParcel(d))
      .catch((e) => mounted && setErr(e.message || "Failed to load parcel"))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, [id]);

  async function downloadPDF() {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pageWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 10, pageWidth, pdfHeight);
    pdf.save(`E-Track-Parcel-${parcel?.tracking_id || id}.pdf`);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;

  if (err || !parcel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-600 gap-3 px-5">
        <div>{err || "Parcel not found"}</div>
        <button className="text-primary" onClick={() => navigate("/parcels")}>Go to Parcels</button>
      </div>
    );
  }

  const depart = new Date(parcel.depart_datetime);
  const arrive = new Date(parcel.arrive_datetime);

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div className="px-5 pt-6">
        <button className="text-primary text-lg" onClick={() => navigate(-1)}>
          <i className="bi bi-chevron-left" />
        </button>
      </div>

      <div className="px-5 mt-3 flex-1">
        <div ref={cardRef} className="rounded-2xl border border-gray-200 overflow-hidden shadow">
          <div className="bg-primary text-white text-center py-4 font-semibold">
            Parcel {parcel.tracking_id}
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{parcel.from_station_name}</div>
              <div className="text-xs text-gray-500">{parcel.status}</div>
              <div className="text-sm font-semibold">{parcel.to_station_name}</div>
            </div>

            <div className="mt-3 text-xs text-gray-600">
              Train {parcel.train_no} {parcel.train_name ? `• ${parcel.train_name}` : ""}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-500">Depart</div>
                <div className="font-semibold">{depart.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-500">Arrive</div>
                <div className="font-semibold">{arrive.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-500">Distance</div>
                <div className="font-semibold">{parcel.distance_km} km</div>
              </div>
              <div>
                <div className="text-gray-500">Amount</div>
                <div className="font-semibold">Rs. {parcel.total_amount}</div>
              </div>
            </div>

            <div className="my-6 border-t border-dashed" />

            <div className="flex flex-col items-center gap-2">
              <div className="text-xs text-gray-500">Scan QR</div>
              <div className="bg-white p-2 rounded">
                <QRCode value={`PARCEL:${parcel.tracking_id}`} size={96} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-20">
        <button className="w-full bg-primary text-white py-3 rounded-lg font-semibold shadow" onClick={downloadPDF}>
          Download Invoice
        </button>

        <button className="w-full mt-3 border border-gray-300 py-3 rounded-lg font-semibold" onClick={() => navigate("/parcels")}>
          Go to Parcels
        </button>
      </div>

      <div className="bottom-bar" />
    </div>
  );
}