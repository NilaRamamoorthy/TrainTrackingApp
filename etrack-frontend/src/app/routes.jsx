import { Navigate, Route, Routes } from "react-router-dom";
import GetStarted from "../pages/GetStarted";
import LanguageSelect from "../pages/LanguageSelect";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import Intro from "../pages/Intro";
import Home from "../pages/Home";
import ProtectedRoute from "../components/ProtectedRoute";
import { isLoggedIn } from "./auth";
import { hasSeenOnboarding } from "./onboarding";
import Trains from "../pages/Trains";
import Stations from "../pages/Stations";
import StationDetails from "../pages/StationDetails";
import BookTicket from "../pages/BookTicket";
import Schedule from "../pages/Schedule";
import TicketDetails from "../pages/TicketDetails";
import Notifications from "../pages/Notifications";
import MyBookings from "../pages/MyBookings";
import ScheduleParcel from "../pages/ScheduleParcel";
import ParcelBook from "../pages/ParcelBook";
import Parcels from "../pages/Parcels";
import ParcelDetails from "../pages/ParcelDetails";
import Settings from "../pages/Settings";
import HelpSupport from "../pages/HelpSupport";
import Emergency from "../pages/Emergency";
import AboutUs from "../pages/AboutUs";
import PassengerDetails from "../pages/PassengerDetails";
import Payments from "../pages/Payments";


function AfterLoginRedirect() {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return hasSeenOnboarding() ? <Navigate to="/home" replace /> : <Navigate to="/intro" replace />;
}

export default function RoutesList() {
  return (
    <Routes>
      <Route path="/" element={<GetStarted />} />
      <Route path="/language" element={<LanguageSelect />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* decides intro or home */}
      <Route path="/after-login" element={<AfterLoginRedirect />} />

      {/* protected */}
      <Route
        path="/intro"
        element={
          <ProtectedRoute>
            <Intro />
          </ProtectedRoute>
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trains"
        element={
          <ProtectedRoute>
            <Trains />
          </ProtectedRoute>
        }
      />

      <Route
        path="/stations"
        element={
          <ProtectedRoute>
            <Stations />
          </ProtectedRoute>
        }
      />

      <Route
        path="/stations/:id"
        element={
          <ProtectedRoute>
            <StationDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/book/:trainId"
        element={
          <ProtectedRoute>
            <BookTicket />
          </ProtectedRoute>
        }
      />
      <Route
        path="/schedule"
        element={
          <ProtectedRoute>
            <Schedule />
          </ProtectedRoute>
        }
      />
      <Route path="/my-bookings" element={<MyBookings />} />
      <Route
  path="/ticket/:id"
  element={
    <ProtectedRoute>
      <TicketDetails />
    </ProtectedRoute>
  }
/>
<Route path="/passengers" element={<PassengerDetails />} />
<Route path="/notifications" element={<Notifications />} />

<Route path="/parcel/schedule" element={<ScheduleParcel />} />
<Route path="/parcel/book" element={<ParcelBook />} />
<Route path="/parcels" element={<Parcels />} />
<Route path="/parcels/:id" element={<ParcelDetails />} />


<Route path="/settings" element={<Settings />} />
<Route path="/help" element={<HelpSupport />} />
<Route path="/emergency" element={<Emergency />} />
<Route path="/about" element={<AboutUs />} />
<Route path="/payments" element={<Payments />} />


      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}