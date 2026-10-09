# PlatoScan 🍽️ — escanea tu plato y conoce sus calorías

Micro-app PWA que estima calorías y macronutrientes de comida colombiana/latina con una sola foto, usando IA (Gemini).

## 🔗 Producción
- **App (frontend):** https://konfiozinc.github.io/platoscan/
- **Backend (API):** https://platoscan-api.konfiozinc.workers.dev
- **Versión Worker (Version ID):** `76bcbabe-dd26-46a6-b9fc-ebbd55d03079`

## 🏗️ Arquitectura
```
Celular (PWA)
   │  foto (base64, comprimida a ≤768px)
   ▼
Cloudflare Worker (platoscan-api)
   │  imagen + prompt + responseSchema (JSON garantizado)
   ▼
Gemini (gemini-3.8-flash → gemini-flash-latest → gemini-3.7/3.6-flash, con fallback)
   │  JSON estructurado
   ▼
Worker → limpia/valida JSON → KV SCANS (límite 3 escaneos/día)
   │
   ▼
App muestra: calorías, macros, puntaje de salud y consejo
```

## 📁 Estructura
| Archivo | Rol |
|---|---|
| `index.html` | PWA completa: cámara (getUserMedia) + galería, paywall demo, historial, instalable |
| `sw.js` | Service worker: cachea estáticos, **no** cachea la API |
| `manifest.webmanifest` + `icons/` | Instalación como app nativa |
| `worker/worker.js` | Backend Cloudflare: Gemini + KV + CORS + límite 3 escaneos/día |
| `worker/wrangler.toml` | Config del Worker (KV `SCANS`, `MODELS`, `ALLOWED_ORIGIN`) |

## 🔐 Secretos (en Cloudflare, NUNCA en código)
- `GEMINI_API_KEY` — clave de Google AI Studio.
- KV namespace `SCANS` (el `id` real está en `wrangler.toml`).

## 🧠 Modelos Gemini (actualizados)
Cadena actual (variable `MODELS` en `wrangler.toml`):
```
gemini-3.8-flash, gemini-flash-latest, gemini-3.7-flash, gemini-3.6-flash
```
- Google depreca modelos seguido: la línea 2.x (`gemini-2.0-flash`, `gemini-2.5-flash`) ya devuelve **404**.
- El error de Google indica el modelo recomendado (p.ej. *"use models/gemini-3.8-flash"*); actualiza `MODELS` con ese nombre.

## 🚀 Desplegar el backend
```bash
cd worker
wrangler login
wrangler secret put GEMINI_API_KEY
wrangler deploy
```

## 🌐 Desplegar el frontend
GitHub Pages: repo `konfiozinc/platoscan`, rama `main`, carpeta `/ (root)`.
```bash
git add index.html sw.js manifest.webmanifest icons/
git commit -m "feat: ..." && git push origin main
```

## 🧪 Probar
1. Abre https://konfiozinc.github.io/platoscan/
2. "Escanear mi plato" → 📷 Tomar foto (o 🖼️ Subir de galería).
3. Los primeros **3 escaneos/día** son gratis; luego aparece el paywall.
4. Para forzar que los usuarios reciban una versión nueva: cambia `const V='platoscan-vX'` en `sw.js`.

## ✅ Fase 1 (MVP) — estado: **v1.0.0-mvp ESTABLE, en producción**
- [x] PWA instalable con cámara + galería
- [x] Worker + Gemini (`responseSchema`) + KV (límite 3/día)
- [x] CORS, errores visibles, cadena de modelos con fallback, mensaje amigable ante saturación
- [x] Paywall de demostración (cobro real → Fase 2)

## 🧭 Fase 2
Ver `FASE-2-PLAN.md` (roadmap: cobro, caché, login, multi-proveedor, analítica, marketing).
