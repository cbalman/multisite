# Multisite

Plataforma multi-tenant de vidrieras digitales.

Cada usuario obtiene un subdominio (`maria.tudominio.com`) para mostrar perfil, publicaciones, fotos/video y contacto por WhatsApp.

## Stack

| Capa | Tecnología |
|------|------------|
| API | Python 3.12 + FastAPI |
| Frontend | React 19 + Vite + TypeScript |
| DB | PostgreSQL 16 |
| Proxy | **Nginx** (no Apache) |
| Runtime | Docker Compose |
| Hosting objetivo | DigitalOcean (Droplet + Managed Postgres + Spaces) |

### ¿Por qué no Next.js (por ahora)?

Next.js es React con servidor integrado (SSR, rutas, etc.). Es excelente para SEO, pero mezcla front y “backend de presentación”.

Acá conviene **FastAPI + React** porque:

1. Aprendés **Python puro** en el API (tu objetivo).
2. Aprendés **React puro** en el front.
3. El multi-tenant y la lógica de negocio viven en un solo backend claro.
4. En DigitalOcean + Docker es un esquema simple: Nginx → web + api + db.

Si más adelante el SEO de las vidrieras lo pide, se puede agregar SSR o migrar el front a Next sin tirar el API.

### ¿Por qué Nginx y no Apache?

Para esta arquitectura (reverse proxy + estáticos + Docker) Nginx es el estándar: más liviano, config simple para `*.dominio`, WebSockets/HMR, y es lo que usa casi todo el ecosistema Docker/Vercel-like self-hosted. Apache sirve, pero no aporta ventaja acá.

## Estructura

```
multisite/
├── api/                 # FastAPI
├── web/                 # React (Vite)
├── nginx/               # Proxy de desarrollo / base prod
├── docker-compose.yml
└── .env.example
```

## Arranque local

```bash
cp .env.example .env
docker compose up --build
```

Abrí:

- Marketing / panel: http://localhost
- API docs: http://localhost/docs
- Vidriera de ejemplo (después de registrarte): http://maria.localhost  
  (Chrome/Firefox resuelven `*.localhost` a 127.0.0.1)

Registro de prueba: elegí un slug, creá el sitio, y abrí `{slug}.localhost`.

## Decisiones de producto (MVP)

- **Alta de clientes solo por Super Admin** (modelo de venta de vidrieras).
- El cliente **no se auto-registra**: recibe email/contraseña y administra su panel.
- **1 video por publicación** (gratis). Más videos = plan premium después.
- Fotos: varias por publicación (límites por tamaño en config).
- Tenant isolation: todo filtrado por `site_id` / ownership.
- Slugs reservados: `www`, `api`, `admin`, `app`, etc.
- Dominio comercial: configurable vía `APP_DOMAIN` (aún sin marca registrada).

## Accesos locales

| Rol | Email | Password | Va a |
|-----|-------|----------|------|
| Super Admin | `admin@multisite.com` | `admin123456` + **Google Authenticator** | `/admin` |
| Cliente (ej. María) | el que creés en admin | la que definas | `{slug}.localhost/panel` |

La primera vez que entra el Super Admin, debe escanear el QR con Google Authenticator.
Después siempre pide contraseña + código de 6 dígitos.

## Próximos pasos de desarrollo

1. CRUD de publicaciones (foto + 1 video)
2. Edición de perfil / WhatsApp / redes
3. Onboarding corto post-primer-ingreso del cliente
4. Suspender sitio + impersonation
5. Tracking visitas + clicks WhatsApp
6. Spaces (DO) para media en producción
