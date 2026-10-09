# PlatoScan – guía de puesta en marcha

## 1. Backend (Cloudflare Workers, plan gratis)
1. `npm i -g wrangler` y `wrangler login`
2. `cd worker && wrangler kv namespace create SCANS` → copia el `id` en `wrangler.toml`
3. `wrangler secret put GEMINI_API_KEY` (pega tu clave; NUNCA va en index.html)
4. `wrangler deploy` → te da una URL `https://platoscan-api.TU-USUARIO.workers.dev`

## 2. Frontend (GitHub Pages)
1. En `index.html`, pega esa URL en `const API_URL=''`
2. Sube index.html, sw.js, manifest.webmanifest e icons/ a un repo de `konfiozinc` (ej. `platoscan`)
3. Settings → Pages → main / root
4. Abre https://konfiozinc.github.io/platoscan/ e instálala desde el menú del navegador

Sin `API_URL` la app corre en MODO DEMO (resultados de ejemplo) para ver el diseño.

## 3. Pendiente para cobrar de verdad
- Wompi / Mercado Pago: tras el pago, el webhook escribe `pro:<device>` en el KV `SCANS`.
- Login real (Firebase Auth) para que el límite no se evada borrando datos del navegador.
- Actualizar versión: cambia `platoscan-v1` en sw.js.
- Modelo por defecto: `gemini-2.5-flash` (variable `MODEL` en wrangler.toml). Si Google lo depreca, cámbialo.
