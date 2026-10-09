# PlatoScan — Fase 2 (cobro real y escala)

> Documento de diseño. No es código todavía.

## 1. Cobro real en COP (Wompi / Mercado Pago)
- Integrar un checkout en la pantalla de paywall.
- Flujo:
  1. Usuario toca "Probar 7 días gratis" o "Suscribirme".
  2. Checkout (tarjeta, PSE, Nequi, según el proveedor).
  3. Al confirmarse el pago, el proveedor llama a un **webhook**.
  4. El webhook escribe `pro:<device>` = `"1"` en el KV `SCANS`.
  5. La app detecta `pro` y desbloquea escaneos ilimitados.
- Precios de la UI actual: $19.900 COP/mes o $119.900 COP/año.
- Recomendación: **Wompi** (simple en Colombia, Nequi/PSE/tarjetas) o **Mercado Pago** (checkout embebido).

## 2. Caché de resultados (KV) — de ~34s a <1s
- Hoy cada escaneo llama a Gemini (lento y con costo).
- Idea: guardar en KV un `hash` de la imagen → resultado.
  - Clave `cache:<hash>`, valor = JSON del resultado, TTL 7 días.
  - Si el usuario escanea un plato ya visto (o muy parecido), se devuelve el caché al instante.
- Límite: el hash exacto no coincide entre fotos distintas del mismo plato. Para "parecidos" haría falta un embedding de imagen (dejarlo para Fase 3).

## 3. Cadena multi-proveedor (Gemini + OpenAI)
- Hoy: solo Gemini (2 modelos). Si Google se satura, falla.
- Fase 2: añadir OpenAI (modelo de visión, p.ej. `gpt-4o-mini`) como respaldo.
  - Orden: `gemini-flash-latest` → `gemini-2.0-flash` → OpenAI.
  - Cada proveedor con su propia clave (secrets separados).
- Beneficio: disponibilidad ~99.9%.

## 4. Login real (Firebase Auth) — evita el bypass del límite
- Hoy el límite de 3 escaneos se guarda en `localStorage` (se evade borrando datos del navegador).
- Fase 2: login con Google/Firebase Auth. El límite se vincula a la cuenta, no al navegador.
- `device` pasa a ser el `uid` de Firebase.

## 5. Costos (por usuario/mes, aproximado — verificar precios actuales)
- La llamada de visión de un modelo flash cuesta una **fracción de centavo** por imagen.
- Con ~30 escaneos/mes, el costo de IA es **despreciable** (centavos de dólar).
- Infraestructura (Worker, KV, GitHub Pages): **$0** en plan gratis.
- La comisión del pasarela (~3.5% + IVA) se aplica sobre la suscripción de $19.900 COP.
- **Conclusión:** margen bruto ≈ **95%+** — el costo de IA no muerde la suscripción.

## 6. Orden de trabajo sugerido
1. Wompi/Mercado Pago + webhook → Pro real.
2. Caché en KV → latencia y costo.
3. Multi-proveedor → disponibilidad.
4. Firebase Auth → seguridad del límite.
