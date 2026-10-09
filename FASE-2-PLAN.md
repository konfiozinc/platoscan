# PlatoScan — Fase 2 (Roadmap de negocio y monetización)

> Documento de plan. No es código todavía.

## 1. Cobro real (Wompi / Mercado Pago)
- Integrar checkout en el paywall ($19.900 COP/mes · $119.900 COP/año).
- Flujo: pago → webhook → escribe `pro:<device>` en el KV `SCANS` → la app desbloquea Pro.
- Recomendación: **Wompi** (Nequi/PSE/tarjetas) o **Mercado Pago** (checkout embebido).

## 2. Caché en KV (latencia 5s → <1s)
- Guardar `cache:<hash-imagen>` → resultado (TTL 7 días).
- Platos comunes (arepa, bandeja paisa, salchipapa) se devuelven al instante.
- Límite: fotos distintas del mismo plato no coinciden por hash. Embeddings = Fase 3.

## 3. Login con Firebase (blindar el freemium)
- Hoy el límite de 3 escaneos vive en `localStorage` (se evade borrando datos del navegador).
- Con Firebase Auth, el límite se ata a la cuenta (Google/email), no al navegador.
- `device` pasa a ser el `uid` de Firebase.

## 4. Multi-proveedor (99.9% uptime)
- Cadena: Gemini (3.8-flash) → OpenAI (visión) → Anthropic (Claude).
- Cada proveedor con su propia clave en secrets.
- Hoy ya hay fallback de modelos Gemini; Fase 2 añade proveedores.

## 5. Analítica
- Platos más escaneados (para afinar el prompt y el marketing).
- Tasa de conversión: cuántos llegan al paywall vs cuántos pagan.
- Retención: cuántos vuelven a escanear a los 7/30 días.
- Herramientas: Cloudflare Analytics (gratis) + eventos en el Worker.

## 6. Proyección de ingresos
> Supuesto: ~5% de los usuarios gratis convierten a Pro.

| Usuarios totales | Pagos (5%) | Ingreso mensual (COP) | Aprox (USD)* |
|---|---|---|---|
| 100 | 5 | $99.500 | ~$25 |
| 1.000 | 50 | $995.000 | ~$250 |
| 10.000 | 500 | $9.950.000 | ~$2.500 |
| 100.000 | 5.000 | $99.500.000 | ~$25.000 |

*Cambio de referencia ~4.000 COP/USD (verificar).

- Costo de infraestructura: **$0** (planes gratis de Cloudflare + GitHub Pages) hasta miles de usuarios.
- Costo de IA por escaneo: fracción de centavo de dólar (despreciable).
- **Margen bruto: >95%.**

## 7. Marketing (TikTok + Instagram)
- TikTok: videos de 15-30s escaneando platos típicos. Gancho: revelar calorías en vivo ("¿Cuántas calorías tiene una salchipapa? Miren...").
- Instagram Reels: el mismo contenido recortado.
- Meta: 3 TikToks/semana + 1 reel diario.
- Llamado a la acción: "Descarga gratis, 3 escaneos al día".
