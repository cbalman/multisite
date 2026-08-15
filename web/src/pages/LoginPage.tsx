import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { getSubdomain, platformOrigin, sitePanelUrl } from "../lib/host";

type LoginResponse = {
  status: "ok" | "need_2fa" | "setup_2fa";
  access_token?: string;
  temp_token?: string;
  role?: string;
  name?: string;
  message?: string;
};

type TotpSetup = {
  secret: string;
  qr_data_url: string;
  message: string;
};

type Site = { slug: string };

type Step = "password" | "need_2fa" | "setup_2fa";

export default function LoginPage() {
  const navigate = useNavigate();
  const subdomain = getSubdomain();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("password");
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [setup, setSetup] = useState<TotpSetup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function finishLogin(data: LoginResponse) {
    if (!data.access_token || !data.role) return;
    localStorage.setItem("access_token", data.access_token);

    if (data.role === "superadmin") {
      // Admin always on platform host
      if (subdomain) {
        window.location.href = `${platformOrigin()}/admin`;
        return;
      }
      navigate("/admin");
      return;
    }

    // Client → their storefront panel
    if (subdomain) {
      navigate("/panel");
      return;
    }

    const site = await api.get<Site>("/me/site");
    window.location.href = sitePanelUrl(site.slug);
  }

  async function onPasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api.post<LoginResponse>("/auth/login", { email, password });
      if (data.status === "ok") {
        await finishLogin(data);
        return;
      }
      if (!data.temp_token) throw new Error("Respuesta de login incompleta");
      setTempToken(data.temp_token);
      localStorage.setItem("access_token", data.temp_token);

      if (data.status === "need_2fa") {
        setStep("need_2fa");
        return;
      }

      // setup_2fa: fetch QR
      const totp = await api.get<TotpSetup>("/auth/2fa/setup");
      setSetup(totp);
      setStep("setup_2fa");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo ingresar");
    } finally {
      setLoading(false);
    }
  }

  async function onTotpSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (tempToken) localStorage.setItem("access_token", tempToken);
      const path = step === "setup_2fa" ? "/auth/2fa/confirm" : "/auth/2fa/verify";
      const data = await api.post<LoginResponse>(path, { code });
      if (data.status !== "ok") throw new Error(data.message || "No se pudo verificar");
      await finishLogin(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código inválido");
    } finally {
      setLoading(false);
    }
  }

  const brandTo = subdomain ? "/" : "/";

  return (
    <div className="shell">
      <header className="nav">
        <Link className="brand" to={brandTo}>
          Multisite
        </Link>
      </header>

      {step === "password" && (
        <form className="auth-card" onSubmit={onPasswordSubmit}>
          <h1>Ingresar</h1>
          <p className="hint">
            {subdomain
              ? "Entrá para administrar esta vidriera."
              : "Clientes: panel de su sitio. Super Admin: acceso con Google Authenticator."}
          </p>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="error">{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Ingresando…" : "Continuar"}
          </button>
        </form>
      )}

      {step === "need_2fa" && (
        <form className="auth-card" onSubmit={onTotpSubmit}>
          <h1>Google Authenticator</h1>
          <p className="hint">Ingresá el código de 6 dígitos de tu app.</p>
          <div className="field">
            <label htmlFor="code">Código</label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              pattern="[0-9]{6}"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Verificando…" : "Verificar"}
          </button>
        </form>
      )}

      {step === "setup_2fa" && setup && (
        <form className="auth-card" onSubmit={onTotpSubmit}>
          <h1>Activar 2FA</h1>
          <p className="hint">{setup.message}</p>
          <img
            src={setup.qr_data_url}
            alt="QR Google Authenticator"
            style={{ width: 220, height: 220, display: "block", margin: "0 auto 1rem" }}
          />
          <p className="hint" style={{ wordBreak: "break-all", fontSize: "0.85rem" }}>
            Código manual: <strong>{setup.secret}</strong>
          </p>
          <div className="field">
            <label htmlFor="setup-code">Código de 6 dígitos</label>
            <input
              id="setup-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              pattern="[0-9]{6}"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Activando…" : "Activar y entrar"}
          </button>
        </form>
      )}
    </div>
  );
}
