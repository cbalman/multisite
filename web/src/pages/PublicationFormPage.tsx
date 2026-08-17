import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { usePanel } from "../lib/panel-context";
import type { Publication } from "../lib/types";

type Upload = { url: string };

export default function PublicationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshSite } = usePanel();
  const editing = Boolean(id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [priceVisible, setPriceVisible] = useState(true);
  const [priceOnRequest, setPriceOnRequest] = useState(false);
  const [status, setStatus] = useState("published");
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<Publication>(`/me/publications/${id}`)
      .then((p) => {
        setTitle(p.title);
        setDescription(p.description ?? "");
        setPrice(p.price != null ? String(p.price) : "");
        setPriceVisible(p.price_visible);
        setPriceOnRequest(p.price_on_request);
        setStatus(p.status);
        setImages(p.images ?? []);
        setVideoUrl(p.video_url);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar"));
  }, [id]);

  async function uploadImage(file: File) {
    if (images.length >= 8) {
      setError("Máximo 8 fotos por publicación");
      return;
    }
    const data = await api.upload<Upload>("/me/upload?kind=image", file);
    setImages((prev) => [...prev, data.url]);
  }

  async function uploadVideo(file: File) {
    const data = await api.upload<Upload>("/me/upload?kind=video", file);
    setVideoUrl(data.url);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const body = {
      title,
      description: description || null,
      price: price ? Number(price) : null,
      price_visible: priceVisible,
      price_on_request: priceOnRequest,
      status,
      images,
      video_url: videoUrl,
    };
    try {
      if (editing && id) {
        await api.patch(`/me/publications/${id}`, body);
      } else {
        await api.post("/me/publications", body);
      }
      await refreshSite();
      navigate("/panel/publicaciones");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel-card">
      <h1>{editing ? "Editar publicación" : "Nueva publicación"}</h1>
      <p className="hint">
        Foto, título, precio opcional y un video corto. El botón de WhatsApp usa: “vi tu publicación
        «{title || "…"}»”.
      </p>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="title">Título</label>
          <input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="description">Descripción</label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="price">Precio</label>
          <input
            id="price"
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={priceVisible}
            onChange={(e) => setPriceVisible(e.target.checked)}
          />
          Mostrar precio
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={priceOnRequest}
            onChange={(e) => setPriceOnRequest(e.target.checked)}
          />
          Precio a consultar
        </label>
        <div className="field">
          <label htmlFor="status">Estado</label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="published">Publicada</option>
            <option value="hidden">Oculta</option>
            <option value="draft">Borrador</option>
          </select>
        </div>

        <div className="field">
          <label>Fotos (máx. 8)</label>
          <div className="thumb-row">
            {images.map((url) => (
              <div className="thumb" key={url}>
                <img src={url} alt="" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
          {images.length < 8 && (
            <label className="btn btn-ghost">
              Subir foto
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadImage(file);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>

        <div className="field">
          <label>Video (1 por publicación)</label>
          {videoUrl ? (
            <div>
              <video src={videoUrl} controls style={{ maxWidth: "100%", borderRadius: 12 }} />
              <button type="button" className="btn btn-ghost" onClick={() => setVideoUrl(null)}>
                Quitar video
              </button>
            </div>
          ) : (
            <label className="btn btn-ghost">
              Subir video
              <input
                type="file"
                accept="video/mp4,video/webm"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadVideo(file);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>

        {error && <p className="error">{error}</p>}
        <div className="row-actions">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Guardando…" : "Guardar"}
          </button>
          <Link to="/panel/publicaciones">Cancelar</Link>
        </div>
      </form>
    </section>
  );
}
