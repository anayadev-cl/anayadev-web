# anayadev-web

Sitio principal de **anayadev** — *Inteligencia que conecta* — con CMS propio.

Monorepo: `api/` (FastAPI) + `web/` (React + Vite + Tailwind). La landing es 100%
responsiva y todo su contenido (secciones, productos, ajustes e imágenes) se
administra desde el panel **`/admin`** sin tocar código.

## Requisitos (WSL)

- [`uv`](https://docs.astral.sh/uv/) (Python 3.12+)
- Node 22 + npm

## Arranque rápido

```bash
# 1) backend (puerto 8100)
cd api
cp .env.example .env     # opcional: define tu usuario/clave admin
uv sync
uv run uvicorn app.main:app --reload --port 8100

# 2) frontend (puerto 5173, en otra terminal)
cd web
npm install
npm run dev
```

Abre http://localhost:5173 — la página carga el contenido desde la API (el
proxy de Vite reenvía `/api` y `/media` al 8100).

## Panel de contenido (CMS)

- URL: http://localhost:5173/admin
- Usuario por defecto: `admin`
- Clave por defecto: `anayadev2026` (cámbiala en `api/.env` con
  `ANAYADEV_ADMIN_CLAVE` **antes del primer arranque**; la clave queda guardada
  en la base de datos, cambiarla después no la rota)

Desde el panel puedes:

- **Secciones**: crear/editar/ocultar/reordenar los bloques de la página
  (hero, circuito, productos, proceso, contacto y texto libre), con títulos,
  subtítulos, imágenes, botones e ítems.
- **Productos**: administrar la familia ZIA (nombre, eslogan, descripción,
  estado —producción/desarrollo/próximamente—, características, imagen y
  enlace). El sufijo `-zia` se pinta automáticamente con el degradado de
  marca en cualquier producto nuevo.
- **Mensajes**: todo lo que llega por el formulario de contacto, con
  contador de no leídos, marcar leído/eliminar y responder por correo.
- **Compras**: solicitudes del checkout de Calenzia, reenvío manual al
  webhook de onboarding, y catálogos del checkout (módulos con precio y
  límite, rubros) totalmente editables.
- **Chatbot**: reglas de palabras clave → respuesta y botones de sugerencia
  del asistente virtual.
- **Ajustes**: correo de contacto, WhatsApp, redes, respuesta de respaldo
  del chatbot y webhook de onboarding (URL + secreto).
- **Medios**: subir imágenes y copiar su URL para usarlas en secciones y
  productos.

## Chatbot

El asistente flotante responde por reglas editables desde el panel
(palabras clave → respuesta + sugerencias) y cae a la respuesta de respaldo
cuando no entiende. Diseñado para reemplazar el motor por IA generativa más
adelante sin tocar la interfaz.

## Comprar Calenzia (checkout)

`/comprar` es el ciclo completo: datos del negocio (slug, rubro, entidad) →
administrador → selección de módulos → pago. Al pagar, el pedido queda
registrado en Compras y se envía al webhook de Calenzia
(`POST /api/v1/publico/onboarding/comprar` con header `X-Webhook-Secret`,
mismo contrato del schema `OnboardingCompraRequest` de agenda-api), que
crea el tenant y devuelve el magic link. La URL y el secreto se configuran
en Ajustes; sin ellos, la compra queda marcada para activación manual.
Cuando integres la pasarela real (Webpay), el botón de pago ya cierra en
este flujo.

## Formulario de contacto

El formulario de la sección "Conversemos" guarda cada mensaje en la base de
datos (visibles en el panel admin) y lo reenvía por correo a
`ANAYADEV_EMAIL_DESTINO` (por defecto `hola@anayadev.cl`). En desarrollo, sin
`ANAYADEV_SMTP_HOST`, el correo se registra en el log del API; en producción
configura las variables `ANAYADEV_SMTP_*` del `.env`.

## API

- `GET /api/v1/publico/contenido` — secciones, productos y ajustes visibles.
- `POST /api/v1/publico/contacto` — recibe mensajes del formulario.
- `POST /api/v1/publico/chatbot` — responde según las reglas del panel.
- `GET /api/v1/publico/checkout` — catálogo público del checkout (módulos y rubros).
- `POST /api/v1/publico/compras` y `POST /api/v1/publico/compras/{id}/pagar` — ciclo de compra.
- `POST /api/v1/admin/login` — obtiene el token JWT del panel.
- CRUD bajo `/api/v1/admin/*` (secciones, productos, mensajes, compras,
  chatbot, checkout/modulos, checkout/rubros, ajustes, medios).
- `GET /salud` — health check.
- Documentación interactiva: http://localhost:8100/docs

## Estructura

```
anayadev-web/
├── api/
│   ├── app/
│   │   ├── main.py        # app FastAPI, CORS, estáticos /media
│   │   ├── bd.py          # SQLAlchemy (SQLite local)
│   │   ├── modelos.py     # Seccion, Producto, Ajuste, Usuario
│   │   ├── esquemas.py    # schemas Pydantic
│   │   ├── seguridad.py   # hash de clave + JWT
│   │   ├── seed.py        # contenido inicial del sitio
│   │   └── rutas/         # publico.py y admin.py
│   ├── uploads/           # imágenes subidas desde el CMS
│   └── data/              # base SQLite (generada, gitignored)
└── web/
    ├── public/            # logos de anayadev
    └── src/
        ├── componentes/   # landing pública (secciones por tipo)
        ├── paginas/       # Publica.tsx y admin/ (panel CMS)
        └── lib/           # cliente API y tipos
```

## Producción

- El frontend se compila con `npm run build` (salida en `web/dist/`).
- En producción sirve `dist/` detrás de Caddy/Nginx en el mismo dominio que la
  API, o define `VITE_API_URL` apuntando al backend y ajusta
  `ANAYADEV_CORS_ORIGENES`.
- La base de datos es SQLite en `api/data/anayadev.db`; para producción con
  más tráfico migra a PostgreSQL cambiando `ANAYADEV_BASE_DATOS_URL`.
