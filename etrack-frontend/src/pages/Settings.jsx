import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Settings() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="px-5 pt-6 pb-4">
        <button
          className="text-primary text-lg"
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-chevron-left" /> Settings
        </button>
      </div>

      <div className="px-5 space-y-6 mt-4">
        {/* Notifications */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Push Notifications
          </span>
          <input
            type="checkbox"
            checked={notifications}
            onChange={() => setNotifications(!notifications)}
            className="w-5 h-5 accent-primary"
          />
        </div>

        {/* Dark mode */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Dark Mode
          </span>
          <input
            type="checkbox"
            checked={darkMode}
            onChange={() => setDarkMode(!darkMode)}
            className="w-5 h-5 accent-primary"
          />
        </div>

        {/* Change password */}
        <button className="w-full bg-gray-100 rounded-lg py-3 text-sm font-medium">
          Change Password
        </button>

        {/* Language */}
        <button className="w-full bg-gray-100 rounded-lg py-3 text-sm font-medium">
          Language
        </button>
      </div>

      <div className="bottom-bar mt-auto" />
    </div>
  );
}