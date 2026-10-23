// Nutrición: plan de comidas del día, recetas y consejos.
// Es orientativo: no reemplaza a un nutricionista.
// Las recetas y consejos vienen de Supabase y se guardan en memoria (cambian muy poco).

const express = require('express');
const { ok, cargarCatalogos } = require('../db/supabase');
const { hoy, fechaValida } = require('./utilidades');

const router = express.Router();
const TIPOS = ['desayuno', 'almuerzo', 'cena', 'snack'];

// Número "aleatorio" pero fijo para un mismo texto (así el plan no cambia en todo el día)
function numeroDesdeTexto(texto) {
  let n = 0;
  for (const letra of texto) n = (n * 31 + letra.charCodeAt(0)) % 100000;
  return n;
}

// Recetas de un tipo que sirven para el objetivo (si no hay, todas las de ese tipo)
function opcionesPara(recetas, tipo, objetivo, excluir = 0) {
  let lista = recetas.filter(r => r.tipo === tipo && r.id !== excluir && r.objetivos.split(',').includes(objetivo));
  if (!lista.length) lista = recetas.filter(r => r.tipo === tipo && r.id !== excluir);
  return lista;
}

async function objetivoDe(req) {
  return ok(await req.sb.from('perfiles').select('objetivo').eq('id', req.usuarioId).single()).objetivo;
}

// GET /api/nutricion/plan?fecha=YYYY-MM-DD
router.get('/plan', async (req, res) => {
  const { recetas } = await cargarCatalogos();
  const fecha = fechaValida(req.query.fecha) ? req.query.fecha : hoy();
  const objetivo = await objetivoDe(req);

  const comidas = TIPOS.map(tipo => {
    const opciones = opcionesPara(recetas, tipo, objetivo);
    const indice = numeroDesdeTexto(`${req.usuarioId}-${fecha}-${tipo}`) % opciones.length;
    return { tipo, receta: opciones[indice], opciones: opciones.length };
  });

  res.json({
    fecha, objetivo,
    kcal_total: comidas.reduce((s, c) => s + c.receta.kcal, 0),
    proteina_total: comidas.reduce((s, c) => s + c.receta.proteina, 0),
    comidas
  });
});

// GET /api/nutricion/alternativa?tipo=almuerzo&excluir=3
router.get('/alternativa', async (req, res) => {
  const { recetas } = await cargarCatalogos();
  const tipo = TIPOS.includes(req.query.tipo) ? req.query.tipo : 'almuerzo';
  const opciones = opcionesPara(recetas, tipo, await objetivoDe(req), Number(req.query.excluir) || 0);
  if (!opciones.length) return res.status(404).json({ error: 'No hay más opciones' });
  res.json(opciones[Math.floor(Math.random() * opciones.length)]);
});

// GET /api/nutricion/recetas?tipo=cena
router.get('/recetas', async (req, res) => {
  const { recetas } = await cargarCatalogos();
  const lista = TIPOS.includes(req.query.tipo) ? recetas.filter(r => r.tipo === req.query.tipo) : recetas;
  res.json([...lista].sort((a, b) => a.tipo.localeCompare(b.tipo) || a.kcal - b.kcal));
});

// GET /api/nutricion/recetas/:id
router.get('/recetas/:id', async (req, res) => {
  const { recetas } = await cargarCatalogos();
  const receta = recetas.find(r => r.id === Number(req.params.id));
  if (!receta) return res.status(404).json({ error: 'Receta no encontrada' });
  res.json(receta);
});

// GET /api/nutricion/consejos  → todos + el del día
router.get('/consejos', async (req, res) => {
  const { consejos } = await cargarCatalogos();
  res.json({ del_dia: consejos[numeroDesdeTexto(hoy()) % consejos.length], consejos });
});

module.exports = router;
