import { Navigate, Route, Routes } from "react-router-dom";
import { getSubdomain } from "./lib/host";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";
import StorefrontPage from "./pages/StorefrontPage";

export default function App() {
  const subdomain = getSubdomain();

  if (subdomain) {
    return (
      <Routes>
        <Route path="/" element={<StorefrontPage slug={subdomain} />} />
        <Route path="/ingresar" element={<LoginPage />} />
        <Route path="/panel" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/ingresar" element={<LoginPage />} />
      <Route path="/panel" element={<DashboardPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
