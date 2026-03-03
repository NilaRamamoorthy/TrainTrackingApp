import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function LanguageSelect() {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();

  function choose(lang) {
    localStorage.setItem("lang", lang);
    i18n.changeLanguage(lang);
    navigate("/login");
  }

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

      <p className="text-gray-600 mb-6">
        {t("select_language")}
      </p>

      <div className="w-full max-w-sm space-y-4 mt-3">
        <button
          onClick={() => choose("ta")}
          className="app-btn"
        >
          தமிழ்
        </button>

        <button
          onClick={() => choose("te")}
          className="app-btn"
        >
          తెలుగు
        </button>

        <button
          onClick={() => choose("en")}
          className="app-btn"
        >
          ENGLISH
        </button>
      </div>
    </div>
  );
}