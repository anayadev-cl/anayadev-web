# Bitácora — anayadev-web

Registro append-only de cambios del sitio y su API.

## 2026-10-18 — Vitrina de planes: acceso a Personalizado + espaciado compacto

La vitrina de planes de la página de producto ahora ofrece **Personalizado** junto a Básico/Premium, y la página queda más compacta verticalmente. El checkout conserva el invariante y el cero cálculo de precios.

### Entregables
- `SeccionPlanes`: bloque sobrio “Personalizado” debajo de las dos tarjetas, con el texto “¿Necesitas algo a medida? Arma tu plan: el Básico + solo los add-ons que necesites.” y CTA **“Armar mi plan”** → `/comprar?plan=personalizado`.
- `PaginaProducto`: hero y sección de planes con menos padding/margen (`py-12/14/16`, `mt-10/5/6`) para acortar la separación entre bloques, manteniendo aire en móvil.
- `/comprar`: se confirmó que el handoff `?plan=personalizado` ya abre el paso “Tu plan” con Personalizado seleccionado y la sección de add-ons visible; `seleccion()` usa `plan_codigo=None` + addons (la misma tupla para `/simular` y el webhook).
- Sin cambios en Calenzia; sin cálculo de precios en el front.

### Gate
| Check | Resultado |
|---|---|
| `npm run build` (tsc + vite) | OK (`index-CmjNPdIQ.js`) |

### Decisiones tácticas
- Bloque full-width sobrio (no una tercera tarjeta) para no romper la simetría de las dos tarjetas.
- El CTA solo navega al checkout; el configurador (personas, add-ons, periodicidad y total) sigue viviendo en `/comprar`.

## 2026-10-18 — Páginas de producto + modal de portada (reestructura)

Los planes dejan de ser una sección suelta y viven dentro de la página propia de cada producto (`/:slug`, ej. `/calenzia`). La portada muestra el catálogo con “Ver más”; la página del producto explica el producto, muestra los planes solo si `muestra_planes`, y ofrece “Ver demo” (si `demo_url`) y un FAB “Comprar” solo para productos con planes y activos. Se retira la sección seedada `planes` y se agrega un modal de portada configurable desde Ajustes (apagado por defecto).

### Entregables
- `Producto` += `muestra_planes` (bool) y `demo_url` (nullable); migración SQLite idempotente en `seed.py` (ALTER si faltan) + backfill SOLO `muestra_planes=True` para `calenzia` (sin demo). CRUD/switch/input en `PanelProductos`; badges en la lista.
- `SLUGS_RESERVADOS` validado en backend y avisado en el admin; regex de slug.
- `PaginaProducto.tsx` (`/:slug`) con hero, características, “Ver demo”, planes (reusa `SeccionPlanes`), FAB “Comprar” abajo a la izquierda y Chatbot conservado abajo a la derecha; `PiePagina`.
- `SeccionProductos`: “Ver más” primario a `/:slug`; “Abrir app ↗” terciario solo para activos con `url`. Sin “Comprar” en la tarjeta.
- `App.tsx`: ruta `/:slug` antes del catch-all; las rutas fijas siguen ganando.
- Modal `ModalPromo` en la portada; Ajustes: `modal_activo`, `modal_producto_slug`, `modal_titulo`, `modal_texto`, `modal_cta_texto`, `modal_cta_url`, `modal_version`; edición en `PanelAjustes` (switch/select/textos); localStorage `anayadev:modal:<slug>:<version>`; CTA/overlay/Escape/“Ahora no” descartan.
- Se retira `planes` del seed/renderer/admin/nav; `_retirar_seccion_planes` borra la fila y compacta órdenes. Se conserva `SeccionPlanes.tsx`.
- Hardening: `publico/contenido` filtra `ajustes` a una allowlist (email, whatsapp, instagram, footer, modal_*); deja de exponer `webhook_onboarding_secreto` y las URLs de Calenzia.
- Sin cambios en Calenzia.

### Gate (local)
| Check | Resultado |
|---|---|
| `npm run build` (tsc + vite) | OK (`index-CsalHeTV.js`) |
| `api ruff check .` | All checks passed |
| `api mypy app` | 0 issues (17 archivos) |
| `api pytest` | 5 passed |
| seed/migración SQLite nueva | 3 productos (Calenzia planes=True, demo=None), 5 secciones sin planes, modal off; idempotente |
| seed/migración SQLite vieja sin columnas | ALTER + backfill Calenzia=True/demo=None; planes borrada y órdenes compactados; segundo seed no pisa un `muestra_planes=False` |
| Admin API | login 200; CRUD producto 201/200/204; flags visibles en público; slug reservado 422; modal 200 y reflejado en público; apagado final |
| Público | `ajustes` sin secretos; sin sección `planes` |

### Decisiones tácticas
- “Ver más” es el único CTA de la tarjeta; el comprar vive en la página del producto.
- FAB “Comprar” abajo a la izquierda (el Chatbot está abajo a la derecha); solo `muestra_planes && estado='activo'`.
- `demo_url` vacío por defecto: el botón “Ver demo” se oculta hasta que haya un demo real.
- El modal queda apagado; la versión permite re-mostrarlo.
- La sección `planes` seedada se borra y se compactan los órdenes; el componente se reusa en la página del producto.
- La allowlist pública de ajustes elimina secretos del payload del landing.

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
