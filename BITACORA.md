# Bitácora — anayadev-web

Registro append-only de cambios del sitio y su API.

## 2026-10-18 — Portada: sección de planes (vitrina + CTA)

Nueva sección CMS `planes` para mostrar Básico/Premium en la portada sin entrar al checkout. Los precios, cupos y funciones salen del catálogo público de Calenzia (cero cálculo de precios en el front); el CTA lleva a `/comprar?plan=basico|premium`, donde vive el selector de personas/periodicidad/total. La sección se crea **oculta** por seed idempotente, después de Productos, para que Elie la active y ajuste título/subtítulo/orden desde `/admin`.

### Entregables
- `web/src/componentes/secciones/SeccionPlanes.tsx`: teaser de 2 tarjetas, “Desde $X/persona/mes”, incluye base/add-ons, cupos, nota “Hasta −15% según periodicidad”, skeleton y fallback con CTA.
- `web/src/componentes/secciones/RenderizadorSecciones.tsx`: caso `planes`.
- `web/src/paginas/admin/PanelSecciones.tsx`: `planes` en `TIPOS`, nota de que el contenido viene de Calenzia; oculta Texto/Imagen para este tipo.
- `web/src/componentes/Navegacion.tsx`: `planes` en la allowlist (aparece cuando la sección esté visible y tenga slug).
- `api/app/seed.py`: `_asegurar_seccion_planes` idempotente (slug `planes`, `visible=False`, orden después de Productos; corre el orden de Proceso/Contacto).
- Sin cambios en Calenzia: solo consume `GET /api/v1/publico/planes/catalogo` ya proxyado.

### Gate (local)
| Check | Resultado |
|---|---|
| `npm run build` (tsc + vite) | OK (`index-yQjqfDXh.js`) |
| `api ruff check .` | All checks passed |
| `api mypy app` | 0 issues (17 archivos) |
| `api pytest` | 5 passed |
| seed en SQLite temporal | 6 secciones, `planes` oculta orden 3; segunda corrida sin duplicar |

### Decisiones tácticas
- Teaser, no mini-selector: el checkout ya tiene personas/periodicidad/total.
- Básico = funciones `tipo='base'`; Premium = “Todo lo de Básico” + los 4 add-ons funcionales. `upgrade_cupo_premium` no va como bullet: se refleja en los cupos 800/250/40.
- CTA por tarjeta a `/comprar?plan=basico|premium` (el handoff ya preselecciona).
- Seed oculto: aparece en el deploy pero no se publica hasta activarlo desde `/admin`.
- “Desde” = menor `precio_persona` del catálogo (selección, no cálculo); nota de periodicidad desde `periodicidades`.
- Sin migración ni cambios de contrato.

## 2026-10-18 — Checkout /comprar: pago del período según periodicidad

El checkout ahora cobra el período completo por adelantado, alineado con la corrección de facturación de Calenzia (Apéndice E 2026-10-18). `total_clp` de la compra = `total_periodo` del motor; el display muestra “Pagas $Z por N meses (un solo pago)” y “$Y/mes” de referencia.

### Entregables
- `api/app/rutas/publico.py`: rama de planes usa `total_periodo` (fallback a `total`), guarda `meses`, `total_mensual_minor` y `total_mensual_monto`; `total_clp` = período.
- `api/app/correo.py`: correos interno y al cliente muestran “Pago del período (N meses)” + “Equivalente mensual” (legacy sigue “Total mensual”).
- `web/src/lib/tipos.ts`: `PlanSimular.meses/total_periodo` (opcionales en la transición) y `Compra.datos.meses/total_mensual_*`.
- `web/src/paginas/PaginaCompra.tsx`: tarjetas y resumen con “Pagas $Z por N meses”, “$Y/mes”, “un solo pago por adelantado”; confirmación con el pago del período.

### Gate
| Check | Resultado |
|---|---|
| `npm run build` (tsc + vite) | OK (`index-GUHfnCR7.js`) |
| `api ruff check .` | All checks passed |
| `api mypy app` | 0 issues (17 archivos) |
| `api pytest` | **5 passed** |

### Decisiones tácticas
- `total_clp` = período (monto real del primer cobro); `total_mensual_*` queda como referencia para “$Y/mes”.
- Fallback a `total` si Calenzia aún no expone `total_periodo`: permite el deploy en orden sin ventana rota.
- Sin migración.
- Nota: este repo no tiene `ARCHITECTURE.md`/Apéndice E; la decisión de contrato se registra en el Apéndice E de Calenzia (2026-10-18) y acá en la bitácora.
