// ============================================================
//  FitTrack — servidor principal
//  Express sirve la API (/api/...) y también el frontend (/public)
// ============================================================

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

require('./db/supabase'); // revisa que existan las llaves de Supabase en .env
const { requiereLogin, requiereAutorizacionSensibles } = require('./middleware/auth');
const { cabeceras, limiteAcceso, limiteGeneral, verificarOrigen } = require('./middleware/seguridad');

const app = express();
const PUERTO = process.env.PORT || 3000;

// Si la app está detrás de un proxy (Render, Railway, Nginx…) esto hace que
// el límite de intentos use la IP real del visitante.
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

// ---------- Middlewares generales ----------
app.use(cabeceras);                          // cabeceras de seguridad (CSP, etc.)
app.use(express.json({ limit: '100kb' }));   // leer JSON del body (tamaño máximo)
app.use(cookieParser());                     // leer cookies (ahí va el token)

// ---------- Rutas de la API ----------
app.use('/api', limiteGeneral, verificarOrigen);
app.use('/api/auth/login', limiteAcceso);
app.use('/api/auth/registro', limiteAcceso);
app.use('/api/auth/recuperar', limiteAcceso);
app.use('/api/auth/restablecer', limiteAcceso);

app.use('/api/auth', require('./rutas/auth'));                          // pública
app.use('/api/perfil', requiereLogin, require('./rutas/perfil'));
app.use('/api/cuenta', requiereLogin, require('./rutas/cuenta'));
app.use('/api/rutinas', requiereLogin, require('./rutas/rutinas'));
app.use('/api/sesiones', requiereLogin, require('./rutas/sesiones'));
app.use('/api/medidas', requiereLogin, requiereAutorizacionSensibles, require('./rutas/medidas'));
app.use('/api/fotos', requiereLogin, requiereAutorizacionSensibles, require('./rutas/fotos'));
app.use('/api/nutricion', requiereLogin, require('./rutas/nutricion'));
app.use('/api/resumen', requiereLogin, require('./rutas/resumen'));

// Cualquier otra ruta /api que no exista
app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// ---------- Frontend ----------
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.get('/app', (req, res) => res.sendFile(path.join(__dirname, 'public', 'app.html')));

// Página no encontrada
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'public', '404.html')));

// ---------- Errores inesperados ----------
// Nunca mostramos el detalle técnico al usuario (podría dar pistas a un atacante)
app.use((err, req, res, next) => {
  console.error(err);
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Datos demasiado grandes' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Datos mal formados' });
  // 42501 = la base de datos (RLS) bloqueó la operación
  if (err.codigoBD === '42501') return res.status(403).json({ error: 'No tienes permiso para esa acción. Si es peso, medidas o fotos, autorízalo en Perfil → Privacidad y datos.', codigo: 'SIN_AUTORIZACION' });
  if (String(err.message).includes('fetch failed')) return res.status(503).json({ error: 'No se pudo conectar con Supabase. Revisa tu internet y SUPABASE_URL.' });
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PUERTO, () => {
  console.log(`\n  FitTrack corriendo en → http://localhost:${PUERTO}\n`);
});
