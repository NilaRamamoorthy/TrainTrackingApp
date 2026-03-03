import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchBookingDetail } from "../api/railway";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { QRCodeCanvas } from "qrcode.react";

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cardRef = useRef(null);

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErrMsg("");

    fetchBookingDetail(id)
      .then((data) => mounted && setTicket(data))
      .catch((e) => mounted && setErrMsg(e.message || "Failed to load ticket"))
      .finally(() => mounted && setLoading(false));

    return () => (mounted = false);
  }, [id]);

  async function downloadPDF() {
    if (!cardRef.current) return;

    const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();

    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pageWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 10, pageWidth, pdfHeight);
    pdf.save(`E-Track-Ticket-${ticket?.id}.pdf`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading ticket...
      </div>
    );
  }

  if (errMsg || !ticket) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-600 gap-3">
        <div>{errMsg || "Ticket not found"}</div>
        <button className="text-primary" onClick={() => navigate("/my-bookings")}>
          Go to Tickets
        </button>
      </div>
    );
  }

  // ✅ safe time/date fallbacks
  const depart =
    ticket.depart_time ||
    (ticket.depart_datetime
      ? new Date(ticket.depart_datetime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "--:--");

  const arrive =
    ticket.arrive_time ||
    (ticket.arrive_datetime
      ? new Date(ticket.arrive_datetime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "--:--");

  const date =
    ticket.run_date ||
    (ticket.depart_datetime ? new Date(ticket.depart_datetime).toLocaleDateString() : "-");

  const passengerName =
    ticket.passenger_name || ticket.passengers?.[0]?.name || "Passenger";

  // ✅ QR value (barcode)
  const qrValue = `ETRACK|PNR:${ticket.pnr || ticket.id}|BOOKING:${ticket.id}`;

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div className="px-5 pt-6">
        <button className="text-primary text-lg" onClick={() => navigate(-1)}>
          <i className="bi bi-chevron-left" />
        </button>
      </div>

      {/* Ticket card */}
      <div className="px-5 mt-3 flex-1">
        <div ref={cardRef} className="rounded-2xl border border-gray-200 overflow-hidden shadow bg-white">
          {/* top blue strip */}
          <div className="bg-primary text-white text-center py-4 font-semibold">
            Ticket #{ticket.id}
          </div>

          <div className="p-5">
            <div className="flex justify-between items-center">
              <div className="text-xl font-semibold">{depart}</div>
              <div className="text-xl font-semibold">{arrive}</div>
            </div>

            <div className="mt-2 h-1 bg-gray-200 rounded-full relative">
              <div className="w-3 h-3 bg-primary rounded-full absolute -top-1 left-0" />
              <div className="w-3 h-3 bg-primary rounded-full absolute -top-1 right-0" />
            </div>

            <div className="mt-3 flex justify-between text-gray-800">
              <div className="font-medium">{ticket.from_station_name || "From"}</div>
              <div className="font-medium">{ticket.to_station_name || "To"}</div>
            </div>

            <div className="mt-6 text-sm text-gray-700 space-y-2">
              <div>
                <div className="text-gray-500">Date:</div>
                <div className="font-semibold">{date}</div>
              </div>

              <div>
                <div className="text-gray-500">Passenger:</div>
                <div className="font-semibold">{passengerName}</div>
              </div>

              <div>
                <div className="text-gray-500">Class / Seats:</div>
                <div className="font-semibold">
                  {ticket.travel_class} / {ticket.seats}
                </div>
              </div>

              <div>
                <div className="text-gray-500">Amount:</div>
                <div className="font-semibold">Rs. {ticket.total_amount}</div>
              </div>

              <div>
                <div className="text-gray-500">PNR:</div>
                <div className="font-semibold">{ticket.pnr || "-"}</div>
              </div>
            </div>

            <div className="my-6 border-t border-dashed" />

            {/* ✅ QR barcode */}
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-2">Barcode (QR)</div>
              <div className="inline-block bg-white p-2 rounded border border-gray-200">
                <QRCodeCanvas value={qrValue} size={160} includeMargin />
              </div>
              <div className="text-[11px] text-gray-400 mt-2">
                Scan to verify ticket
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="px-5 pb-20">
        <button
          className="w-full bg-primary text-white py-3 rounded-lg font-semibold shadow"
          onClick={downloadPDF}
        >
          Download Invoice
        </button>

        <button
          className="w-full mt-3 border border-gray-300 py-3 rounded-lg font-semibold"
          onClick={() => navigate("/my-bookings")}
        >
          Back to Tickets
        </button>
      </div>

      <div className="bottom-bar" />
    </div>
  );
}