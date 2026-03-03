import { useNavigate } from "react-router-dom";

export default function GetStarted() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      
      {/* Logo */}
      <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center mb-6">
        <img
          src="/logo.png"
          alt="E-Track Logo"
          className="w-full object-center rounded-full"
        />
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold tracking-wide mb-2">
        E - Track
      </h1>

      {/* Subtitle */}
      <p className="text-gray-500 mb-8 text-sm">
        Find your trains easily and buy tickets online.
      </p>

      {/* Button */}
      <button
        onClick={() => navigate("/language")}
        className="w-[280px] max-w-sm bg-primary text-white py-3 rounded-lg font-semibold shadow-md active:scale-95 transition"
      >
        Get Start
      </button>
    </div>
  );
}