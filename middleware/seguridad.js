// ============================================================
//  Seguridad del servidor
//  - Cabeceras de seguridad (helmet): CSP, anti-clickjacking, etc.
//  - Límite de intentos en login/registro (contra fuerza bruta)
//  - Verificación de origen en peticiones que cambian datos (contra CSRF)
// ============================================================

const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');

// 1. Cabeceras de seguridad.
// La CSP (Content-Security-Policy) solo permite cargar scripts, estilos, fuentes
// e imágenes desde este mismo servidor. Si alguien lograra inyectar un <script>
// externo, el navegador lo bloquearía.
const cabeceras = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // estilos en línea (style="...") que usa el JS
      imgSrc: ["'self'", 'data:', 'blob:'],    // blob: para la vista previa de fotos
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],              // nadie puede meter la app en un iframe
      formAction: ["'self'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// 2. Los límites de autenticación tienen contadores independientes por ruta.
function crearLimitadorAcceso(limit) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Demasiados intentos. Espera 15 minutos y vuelve a probar.' }
  });
}

const limiteLogin = crearLimitadorAcceso(10);
const limiteRegistro = crearLimitadorAcceso(30);
const limiteRecuperar = crearLimitadorAcceso(10);
const limiteRestablecer = crearLimitadorAcceso(10);

// 3. Límite general de la API: 300 peticiones por minuto por IP
const limiteGeneral = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Vas muy rápido. Espera un momento.' }
});

// 4. Si la petición cambia datos (POST, PUT, DELETE) y viene de otro sitio web, se rechaza.
function verificarOrigen(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origen = req.get('origin');
  if (!origen) return next(); // apps como Postman o curl no envían Origin
  try {
    if (new URL(origen).host === req.get('host')) return next();
  } catch (e) { /* origen mal formado */ }
  return res.status(403).json({ error: 'Origen no permitido' });
}

module.exports = { cabeceras, limiteLogin, limiteRegistro, limiteRecuperar, limiteRestablecer, limiteGeneral, verificarOrigen };
