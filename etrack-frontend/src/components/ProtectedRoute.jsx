import { Navigate } from "react-router-dom";
import { isLoggedIn } from "../app/auth";

export default function ProtectedRoute({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return children;
}