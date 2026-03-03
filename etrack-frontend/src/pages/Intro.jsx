import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setSeenOnboarding } from "../app/onboarding";

export default function Intro() {
  const navigate = useNavigate();
  const slides = useMemo(
    () => [
      {
        img: "/intro1.jpg",
        title: "Sri Lankas’ first train app.",
        desc: "The Sri Lanka Railway Department is Sri Lanka's railway owner and primary operator."
      },
      {
        img: "/intro2.webp",
        title: "Find your train easily",
        desc: "Find your trains easily and buy tickets online."
      }
    ],
    []
  );

  const [index, setIndex] = useState(0);

  function goHome() {
    setSeenOnboarding();
    navigate("/home", { replace: true });
  }

  function next() {
    if (index >= slides.length - 1) return goHome();
    setIndex((v) => v + 1);
  }

  const active = slides[index];

  return (
    <div className="min-h-screen bg-black relative">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: `url(${active.img})` }}
      />
      {/* dark overlay for readability */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Skip */}
      <button
        type="button"
        onClick={goHome}
        className="absolute top-10 right-6 text-white/90 text-sm font-medium"
      >
        Skip &gt;
      </button>

      {/* Bottom sheet */}
      <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-3xl px-6 pt-6 pb-24">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-4">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full ${i === index ? "bg-primary" : "bg-gray-300"}`}
            />
          ))}
        </div>

        <h2 className="text-xl font-semibold text-center">{active.title}</h2>
        <p className="text-gray-500 text-sm text-center mt-3">{active.desc}</p>

        <div className="flex justify-center mt-6">
          <button type="button" onClick={next} className="app-btn">
            Next
          </button>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bottom-bar absolute left-0 right-0 bottom-0" />
    </div>
  );
}