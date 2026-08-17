import { Navigate, Route, Routes } from "react-router-dom";
import { getSubdomain } from "./lib/host";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import StorefrontPage from "./pages/StorefrontPage";
import OnboardingPage from "./pages/OnboardingPage";
import PanelLayout from "./components/PanelLayout";
import DashboardHome from "./pages/DashboardHome";
import ProfilePage from "./pages/ProfilePage";
import ContactPage from "./pages/ContactPage";
import SocialsPage from "./pages/SocialsPage";
import PublicationsPage from "./pages/PublicationsPage";
import PublicationFormPage from "./pages/PublicationFormPage";

export default function App() {
  const subdomain = getSubdomain();

  const panel = (
    <Route path="/panel" element={<PanelLayout />}>
      <Route index element={<DashboardHome />} />
      <Route path="perfil" element={<ProfilePage />} />
      <Route path="contacto" element={<ContactPage />} />
      <Route path="redes" element={<SocialsPage />} />
      <Route path="publicaciones" element={<PublicationsPage />} />
      <Route path="publicaciones/nueva" element={<PublicationFormPage />} />
      <Route path="publicaciones/:id" element={<PublicationFormPage />} />
      <Route path="onboarding" element={<OnboardingPage />} />
    </Route>
  );

  if (subdomain) {
    return (
      <Routes>
        <Route path="/" element={<StorefrontPage slug={subdomain} />} />
        <Route path="/ingresar" element={<LoginPage />} />
        {panel}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/ingresar" element={<LoginPage />} />
      {panel}
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
