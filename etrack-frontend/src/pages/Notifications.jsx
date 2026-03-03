import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchNotifications, markNotificationRead, fetchNotificationBadge } from "../api/railway";

function iconFor(type) {
  // map backend icon to bootstrap icon
  switch (type) {
    case "ticket":
      return "bi-ticket-perforated";
    case "train":
      return "bi-train-front";
    case "alert":
      return "bi-megaphone";
    case "web":
      return "bi-globe";
    default:
      return "bi-megaphone";
  }
}

function formatRelative(dtStr) {
  const dt = new Date(dtStr);
  const now = new Date();
  const diffMs = now - dt;
  const diffMin = Math.floor(diffMs / (1000 * 60));
  if (diffMin <= 1) return "Now";
  if (diffMin < 60) return `${diffMin} min`;

  // same day? show time
  const sameDay =
    dt.getFullYear() === now.getFullYear() &&
    dt.getMonth() === now.getMonth() &&
    dt.getDate() === now.getDate();

  if (sameDay) {
    return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // otherwise show date like "20 May"
  return dt.toLocaleDateString([], { day: "2-digit", month: "short" });
}

function isToday(dtStr) {
  const dt = new Date(dtStr);
  const now = new Date();
  return (
    dt.getFullYear() === now.getFullYear() &&
    dt.getMonth() === now.getMonth() &&
    dt.getDate() === now.getDate()
  );
}

export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Failed to load notifications");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const groups = useMemo(() => {
    const today = [];
    const yesterday = [];

    for (const n of items) {
      if (isToday(n.created_at)) today.push(n);
      else yesterday.push(n);
    }
    return { today, yesterday };
  }, [items]);

  async function openNotification(n) {
    // mark as read (optional)
    try {
      if (!n.is_read) {
        await markNotificationRead(n.id);
        // update local state
        setItems((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
        );
        // refresh badge count if you show it on Home
        fetchNotificationBadge().catch(() => {});
      }
    } catch {
      // ignore
    }

    // Optional: if message contains a URL, you can open it
    const urlMatch = (n.message || "").match(/https?:\/\/\S+/);
    if (urlMatch) {
      window.open(urlMatch[0], "_blank");
    }
  }

  function Row({ n }) {
    return (
      <button
        onClick={() => openNotification(n)}
        className={`w-full flex items-center gap-4 px-5 py-4 text-left ${
          n.is_read ? "bg-white" : "bg-[#F3F6FF]"
        }`}
      >
        {/* Icon bubble */}
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <i className={`bi ${iconFor(n.icon)} text-primary text-xl`} />
        </div>

        {/* Message */}
        <div className="flex-1">
          <div className="text-sm text-gray-700 leading-snug line-clamp-2">
            <span className="font-semibold">{n.title}</span>
            <span className="text-gray-500"> — </span>
            <span>{n.message}</span>
          </div>
        </div>

        {/* Time */}
        <div className="text-xs text-gray-400 flex-shrink-0">
          {formatRelative(n.created_at)}
        </div>
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <div className="px-5 pt-6 pb-3 flex items-center gap-3">
        <button
          className="text-primary text-lg font-medium flex items-center gap-2"
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-chevron-left" />
          Notifications
        </button>
      </div>

      {loading ? (
        <div className="px-5 text-sm text-gray-500 mt-6">Loading...</div>
      ) : err ? (
        <div className="px-5 text-sm text-red-600 mt-6">{err}</div>
      ) : (
        <div className="mt-2">
          {/* Today */}
          <div className="px-5 text-sm font-semibold text-gray-700 mt-3 mb-2">
            Today
          </div>
          <div>
            {groups.today.length === 0 ? (
              <div className="px-5 text-sm text-gray-500 py-4">No notifications today.</div>
            ) : (
              groups.today.map((n) => <Row key={n.id} n={n} />)
            )}
          </div>

          {/* Yesterday */}
          <div className="px-5 text-sm font-semibold text-gray-700 mt-6 mb-2">
            Yesterday
          </div>
          <div>
            {groups.yesterday.length === 0 ? (
              <div className="px-5 text-sm text-gray-500 py-4">No older notifications.</div>
            ) : (
              groups.yesterday.map((n) => <Row key={n.id} n={n} />)
            )}
          </div>
        </div>
      )}

      <div className="bottom-bar mt-auto" />
    </div>
  );
}