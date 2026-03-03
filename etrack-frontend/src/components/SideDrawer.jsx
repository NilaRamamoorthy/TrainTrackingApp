import { logout, getUser } from "../app/auth";
import { useNavigate } from "react-router-dom";

export default function SideDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const user = getUser();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

const menuItems = [
  { label: "Payment", icon: "bi-wallet2", to: "/payments" },
  { label: "For a Friend", icon: "bi-people", to: "/trains"  },
  { label: "Help and Support", icon: "bi-headset", to: "/help" },
  { label: "Emergency", icon: "bi-bell", to: "/emergency" },
  { label: "Settings", icon: "bi-gear", to: "/settings" },
  { label: "About Us", icon: "bi-info-circle", to: "/about" },
];

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white z-50 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        } flex flex-col`}
      >
        {/* Header */}
        <div className="bg-primary text-white p-6 rounded-br-2xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
              <i className="bi bi-person-fill text-primary text-3xl" />
            </div>
            <div>
              <div className="font-semibold text-lg">
                {user?.name || "User"}
              </div>
              <div className="text-sm mt-1">
                3.9 <i className="bi bi-star-fill text-yellow-300 ml-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 px-6 py-6 space-y-6">
        {menuItems.map((item) => (
  <div
    key={item.label}
    className="flex items-center gap-4 text-gray-700 cursor-pointer"
    onClick={() => {
      if (item.to) navigate(item.to);
      onClose();
    }}
  >
    <i className={`bi ${item.icon} text-primary text-xl`} />
    <span className="text-sm">{item.label}</span>
  </div>
))}
        </div>

        {/* Logout at Bottom */}
        <div className="px-6 pb-6">
          <div
            className="flex items-center gap-4 text-red-600 cursor-pointer border-t pt-4"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right text-xl" />
            <span className="text-sm font-medium">Logout</span>
          </div>

          <div className="text-center text-xs text-gray-400 mt-6">
            App version 1.0.0
          </div>
        </div>
      </div>
    </>
  );
}