// ============================================================
//  servicios/ia.js — conexión con el modelo de IA (Claude, de Anthropic)
//
//  Es la ÚNICA parte de la app que habla con la IA. Si algún día quieres
//  usar otro proveedor, solo cambias este archivo: rutas/asistente.js
//  llama a preguntarIA() y no sabe qué modelo hay detrás.
//
//  Variables de entorno:
//    ANTHROPIC_API_KEY → la clave (solo en el servidor, nunca en el navegador)
//    IA_MODELO         → opcional, por defecto claude-haiku-4-5-20251001
//    IA_URL            → opcional, solo para pruebas locales
// ============================================================

const URL_API = process.env.IA_URL || 'https://api.anthropic.com/v1/messages';
const MODELO = process.env.IA_MODELO || 'claude-haiku-4-5-20251001';
const TIEMPO_MAXIMO = 15000; // ms: si tarda más, se usa la respuesta de respaldo

class ErrorIA extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.estado = estado;
  }
}

const iaConfigurada = () => Boolean(process.env.ANTHROPIC_API_KEY);

// sistema: instrucciones · mensajes: [{ role: 'user' | 'assistant', content: 'texto' }]
async function preguntarIA({ sistema, mensajes, maxTokens = 600 }) {
  if (!iaConfigurada()) throw new ErrorIA('La IA no está configurada', 503);

  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), TIEMPO_MAXIMO);
  let respuesta;
  try {
    respuesta = await fetch(URL_API, {
      method: 'POST',
      signal: control.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({ model: MODELO, max_tokens: maxTokens, system: sistema, messages: mensajes })
    });
  } catch (error) {
    throw new ErrorIA(error.name === 'AbortError' ? 'La IA tardó demasiado' : 'No se pudo conectar con la IA', 504);
  } finally {
    clearTimeout(reloj);
  }

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    // 401: clave mala · 429: límite del proveedor · 529/5xx: servicio saturado o caído
    const detalle = datos.error && datos.error.type ? datos.error.type : respuesta.status;
    throw new ErrorIA(`La IA respondió con error (${detalle})`, respuesta.status);
  }
  const texto = (datos.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
  if (!texto) throw new ErrorIA('La IA no devolvió texto', 502);
  return texto;
}

module.exports = { preguntarIA, iaConfigurada, ErrorIA, MODELO };
