# Bitácora — anayadev-web

Registro append-only de cambios del sitio y su API.

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
