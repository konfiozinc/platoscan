// PlatoScan API – Cloudflare Worker (Gemini)
// Secretos: GEMINI_API_KEY  |  KV: SCANS  |  Variables opcionales: MODELS, ALLOWED_ORIGIN
const FREE = 3;
const SYS = `Eres un nutricionista experto en comida colombiana y latinoamericana (bandeja paisa, arepas, sancocho, ajiaco, empanadas, tamales, lechona, mondongo, fritanga, etc.).
Analiza la foto y estima el contenido nutricional del plato COMPLETO visible, considerando el tamaño de la porción.
Responde SOLO con un objeto JSON válido, sin texto adicional ni markdown, con esta forma exacta:
{"es_comida":true,"plato":"nombre en español","porcion":"descripción breve de la porción y gramos aproximados","calorias":0,"proteina_g":0,"carbs_g":0,"grasa_g":0,"puntaje_salud":1-10,"ingredientes":["..."],"consejo":"una recomendación práctica de máximo 20 palabras","confianza":"alta|media|baja"}
Si la imagen no contiene comida responde {"es_comida":false}. Los números son estimaciones: nunca des consejo médico.
IMPORTANTE: Devuelve ÚNICAMENTE el objeto JSON crudo, sin bloques de código, sin markdown, sin texto adicional.`;

export default {
  async fetch(req, env) {
    const origin = env.ALLOWED_ORIGIN || "*";
    const H = { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "POST,OPTIONS", "content-type": "application/json" };
    const j = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: H });
    if (req.method === "OPTIONS") return new Response(null, { headers: H });
    if (req.method !== "POST") return j({ error: "método no permitido" }, 405);

    let b; try { b = await req.json(); } catch { return j({ error: "json inválido" }, 400); }
    const { image, device } = b;
    if (!image || !device || typeof image !== "string" || image.length > 1500000) return j({ error: "datos inválidos" }, 400);

    const day = new Date().toISOString().slice(0, 10);
    const key = `n:${device}:${day}`;
    const pro = await env.SCANS.get(`pro:${device}`);
    const used = parseInt((await env.SCANS.get(key)) || "0", 10);
    if (!pro && used >= FREE) return j({ error: "limite", used }, 402);

    console.log("PlatoScan: imagen recibida chars=" + image.length + " device=" + device);
    const MODELS = (env.MODELS || "gemini-2.0-flash,gemini-1.5-flash,gemini-flash-latest,gemini-3.6-flash,gemini-3.7-flash").split(",").map(s => s.trim()).filter(Boolean);
    let r = null, lastErr = "";
    for (const MODEL of MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
      let rr;
      try {
        rr = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYS }] },
            contents: [{ role: "user", parts: [
              { inline_data: { mime_type: "image/jpeg", data: image } },
              { text: "Analiza este plato." }
            ] }],
            generationConfig: { responseMimeType: "application/json", maxOutputTokens: 1000, temperature: 0.2 }
          })
        });
      } catch (err) {
        lastErr = `${MODEL} -> fetch error: ${(err && err.message) || err}`;
        continue;
      }
      if (rr.ok) { r = rr; break; }
      let det = ""; try { const ej = await rr.json(); det = (ej && ej.error && (ej.error.message || ej.error.status)) || JSON.stringify(ej); } catch { try { det = await rr.text(); } catch {} }
      lastErr = `${MODEL} -> HTTP ${rr.status}: ${String(det).slice(0, 140)}`;
    }
    if (!r) {
      const saturado = /503|high demand|overloaded|RESOURCE_EXHAUSTED|unavailable/i.test(lastErr);
      const detalle = saturado ? "La IA está saturada. Intenta de nuevo en 10 segundos." : lastErr.slice(0, 300);
      return j({ error: "ia_no_disponible", detalle, probados: MODELS.join(",") }, 502);
    }
    const data = await r.json();
    const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    let txt = parts.map(p => p.text || "").join("");
    txt = txt.replace(/```json/gi, '').replace(/```/g, '').trim();
    console.log('RESPUESTA GEMINI (completa):', txt);
    const m = txt.match(/\{[\s\S]*\}/);
    if (m) txt = m[0];
    let out = null;
    try { out = JSON.parse(txt); } catch {}
    if (!out) { try { out = JSON.parse(txt.replace(/,\s*([}\]])/g, '$1')); } catch {} }
    if (!out && !m) { try { out = JSON.parse(txt.replace(/,\s*$/, '') + '"}'); } catch {} }
    if (!out) return j({ error: "respuesta_invalida", detalle: txt.slice(0, 400) }, 502);
    if (out.es_comida === false) return j({ es_comida: false });

    const n = (v) => Math.max(0, Number(v) || 0);
    const clean = { es_comida: true, plato: String(out.plato || "Plato").slice(0, 80), porcion: String(out.porcion || "").slice(0, 120),
      calorias: n(out.calorias), proteina_g: n(out.proteina_g), carbs_g: n(out.carbs_g), grasa_g: n(out.grasa_g),
      puntaje_salud: Math.min(10, Math.max(1, Math.round(n(out.puntaje_salud) || 5))),
      ingredientes: (Array.isArray(out.ingredientes) ? out.ingredientes : []).slice(0, 10).map(String),
      consejo: String(out.consejo || "").slice(0, 160), confianza: String(out.confianza || "media") };
    await env.SCANS.put(key, String(used + 1), { expirationTtl: 172800 });
    return j(clean);
  }
};
