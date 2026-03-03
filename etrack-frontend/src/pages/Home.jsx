
import SideDrawer from "../components/SideDrawer";
import { logout, getUser } from "../app/auth";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { fetchNotificationBadge } from "../api/railway";

function IconCircle({ label, icon, onClick, badge }) {
    return (
        <div onClick={onClick} className="flex flex-col items-center gap-2 cursor-pointer">
            <div className="relative w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                <i className={`bi ${icon} text-primary text-2xl`} />
                {badge > 0 ? (
                    <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
                        {badge > 99 ? "99+" : badge}
                    </div>
                ) : null}
            </div>
            <div className="text-sm text-gray-700">{label}</div>
        </div>
    );
}

export default function Home() {
    const navigate = useNavigate();
    const user = getUser();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const items = useMemo(
        () => [
            { label: "Trains", icon: "bi-train-front", to: "/trains" },
            { label: "Stations", icon: "bi-geo-alt", to: "/stations?mode=browse" },
            { label: "Tickets", icon: "bi-ticket-perforated", to: "/my-bookings" },
            { label: "Schedule", icon: "bi-calendar-event", to: "/parcel/schedule" },
            { label: "Parcels", icon: "bi-box-seam", to: "/parcels" },
            { label: "Notifications", icon: "bi-bell", to: "/notifications" }
        ],
        []
    );

    const [badge, setBadge] = useState(0);

    useEffect(() => {
        let mounted = true;
        fetchNotificationBadge()
            .then((d) => mounted && setBadge(d.unread || 0))
            .catch(() => mounted && setBadge(0));
        return () => (mounted = false);
    }, []);

    return (
        <div className="min-h-screen bg-white flex flex-col justify-between">

            {/* Top bar */}
            <div className="px-5 pt-6 pb-3 flex items-center justify-between">
                <button onClick={() => setDrawerOpen(true)} className="text-2xl">
                    <i className="bi bi-list text-primary" />
                </button>

                <div className="text-sm font-semibold text-gray-800">
                    Welcome, {user?.name || "User"}
                </div>

                <button className="text-xl leading-none">
                    <i className="bi bi-search text-primary" />
                </button>
            </div>

            {/* Hero image */}
            <div className="px-5">
                <div className="w-full h-48 overflow-hidden bg-gray-100 rounded-md">
                    <img
                        src="/home-hero.webp"
                        alt="Train"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.currentTarget.style.display = "none";
                        }}
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="px-5 mt-8">
                <div className="grid grid-cols-4 gap-y-8 gap-x-3">
                    {items.map((x) => (
                        <IconCircle
                            key={x.label}
                            label={x.label}
                            icon={x.icon}
                            badge={x.label === "Notifications" ? badge : 0}
                            onClick={() => x.to && navigate(x.to)}
                        />
                    ))}
                </div>


            </div>
            <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
            {/* Bottom bar */}
            <div className="bottom-bar" />
        </div>
    );
}