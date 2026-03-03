import { useNavigate } from "react-router-dom";

export default function AboutUs() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="px-5 pt-6 pb-4">
        <button
          className="text-primary text-lg"
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-chevron-left" /> About Us
        </button>
      </div>

      <div className="px-5 mt-6 space-y-4 text-sm text-gray-700">
        <div>
          <span className="font-semibold">E-Track Railway App</span> is a smart
          train and parcel tracking system designed to provide real-time
          updates, booking convenience and parcel management.
        </div>

        <div>
          Our mission is to improve railway passenger experience through
          technology-driven solutions.
        </div>

        <div>
          Version: 1.0.0 <br />
          Developed for Internship Project
        </div>
      </div>

      <div className="bottom-bar mt-auto" />
    </div>
  );
}