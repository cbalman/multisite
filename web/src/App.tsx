import { Navigate, Route, Routes } from "react-router-dom";
import { getSubdomain } from "./lib/host";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import StorefrontPage from "./pages/StorefrontPage";

export default function App() {
  const subdomain = getSubdomain();

  if (subdomain) {
    return <StorefrontPage slug={subdomain} />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/ingresar" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/panel" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
