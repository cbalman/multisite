import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="shell">
      <header className="nav">
        <div className="brand">Multisite</div>
        <div className="nav-actions">
          <Link className="btn btn-primary" to="/ingresar">
            Ingresar
          </Link>
        </div>
      </header>

      <section className="hero">
        <h1>Tu propia vidriera online</h1>
        <p>
          Mostrá lo que hacés. Compartí tu página. Recibí consultas por WhatsApp.
          Cada comercio, profesional o emprendimiento tiene su dirección propia.
        </p>
        <Link className="btn btn-primary" to="/ingresar">
          Ingresar a mi panel
        </Link>
        <p className="hint" style={{ marginTop: "1.25rem" }}>
          ¿Todavía no tenés tu vidriera? Consultanos y te la activamos.
        </p>
      </section>

      <section className="steps" aria-label="Cómo funciona">
        <div className="step">
          <strong>① Te activamos el sitio</strong>
          <span>Recibís tu dirección y acceso al panel.</span>
        </div>
        <div className="step">
          <strong>② Publicá</strong>
          <span>Productos, servicios o trabajos con foto o video.</span>
        </div>
        <div className="step">
          <strong>③ Compartí</strong>
          <span>Link, redes o QR cuando lo tengamos.</span>
        </div>
        <div className="step">
          <strong>④ Recibí consultas</strong>
          <span>WhatsApp con mensaje listo.</span>
        </div>
      </section>
    </div>
  );
}
