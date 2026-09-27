// Fotos de progreso en Supabase Storage (bucket PRIVADO "fotos").
// Cada usuario guarda en su carpeta: fotos/<id del usuario>/<archivo>.
// El navegador nunca ve la dirección de Storage: las fotos pasan por este servidor,
// que solo se las entrega a su dueño.

const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const { ok } = require('../db/supabase');
const { hoy, fechaValida } = require('./utilidades');

const router = express.Router();
const BUCKET = 'fotos';

// La foto llega a la memoria del servidor (máx. 4 MB) y de ahí sube a Supabase
const subir = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'));
  }
});

// Revisa los primeros bytes para confirmar que de verdad es una imagen
// (el tipo que manda el navegador se puede falsificar; el contenido no).
function tipoReal(buffer) {
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { tipo: 'image/jpeg', ext: 'jpg' };
  if (buffer.toString('hex', 0, 4) === '89504e47') return { tipo: 'image/png', ext: 'png' };
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return { tipo: 'image/webp', ext: 'webp' };
  return null;
}

// GET /api/fotos
router.get('/', async (req, res) => {
  res.json(ok(await req.sb.from('fotos').select('id, fecha, angulo, nota').order('fecha', { ascending: false }).order('id', { ascending: false })));
});

// GET /api/fotos/:id/imagen  → descarga la foto de Storage y se la entrega solo al dueño
router.get('/:id/imagen', async (req, res) => {
  const foto = ok(await req.sb.from('fotos').select('archivo').eq('id', Number(req.params.id)).maybeSingle());
  if (!foto) return res.status(404).json({ error: 'Foto no encontrada' });

  const { data, error } = await req.sb.storage.from(BUCKET).download(foto.archivo);
  if (error) return res.status(404).json({ error: 'Foto no encontrada' });

  res.set('Content-Type', data.type || 'image/jpeg');
  res.set('Cache-Control', 'private, max-age=86400');
  res.send(Buffer.from(await data.arrayBuffer()));
});

// POST /api/fotos  (formulario con el campo "foto")
router.post('/', (req, res, next) => {
  subir.single('foto')(req, res, async err => {
    try {
      if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'La foto pesa más de 8 MB' : err.message });
      if (!req.file) return res.status(400).json({ error: 'Selecciona una foto' });
      const real = tipoReal(req.file.buffer);
      if (!real) return res.status(400).json({ error: 'El archivo no es una imagen válida' });

      // 1. Subir a Storage (nombre aleatorio; nunca usamos el nombre que manda el usuario)
      const ruta = `${req.usuarioId}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${real.ext}`;
      const subida = await req.sb.storage.from(BUCKET).upload(ruta, req.file.buffer, { contentType: real.tipo, upsert: false });
      if (subida.error) return res.status(400).json({ error: 'No se pudo subir la foto. Intenta de nuevo.' });

      // 2. Guardar el registro. Si falla, se borra el archivo para no dejar basura.
      const { data, error } = await req.sb.from('fotos').insert({
        archivo: ruta,
        fecha: fechaValida(req.body.fecha) ? req.body.fecha : hoy(),
        angulo: ['frente', 'lado', 'espalda'].includes(req.body.angulo) ? req.body.angulo : 'frente',
        nota: req.body.nota ? String(req.body.nota).slice(0, 200) : null
      }).select('id').single();

      if (error) {
        await req.sb.storage.from(BUCKET).remove([ruta]);
        return res.status(400).json({ error: 'No se pudo guardar la foto' });
      }
      res.status(201).json({ id: data.id });
    } catch (e) {
      next(e);
    }
  });
});

// DELETE /api/fotos/:id  → borra el registro y el archivo de Storage
router.delete('/:id', async (req, res) => {
  const foto = ok(await req.sb.from('fotos').select('archivo').eq('id', Number(req.params.id)).maybeSingle());
  if (!foto) return res.status(404).json({ error: 'Foto no encontrada' });

  await req.sb.storage.from(BUCKET).remove([foto.archivo]);
  ok(await req.sb.from('fotos').delete().eq('id', Number(req.params.id)));
  res.json({ ok: true });
});

module.exports = router;
