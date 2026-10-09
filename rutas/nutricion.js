// Nutrición: plan de comidas del día, recetas y consejos.
// Es orientativo: no reemplaza a un nutricionista.
// Las recetas y consejos vienen de Supabase y se guardan en memoria (cambian muy poco).

const express = require('express');
const { ok, cargarCatalogos } = require('../db/supabase');
const { hoy, fechaValida } = require('./utilidades');

const router = express.Router();
const TIPOS = ['desayuno', 'almuerzo', 'cena', 'snack'];
const OBJETIVOS = ['grasa', 'musculo', 'resistencia', 'movilidad'];

// Número "aleatorio" pero fijo para un mismo texto (así el plan no cambia en todo el día)
function numeroDesdeTexto(texto) {
  let n = 0;
  for (const letra of texto) n = (n * 31 + letra.charCodeAt(0)) % 100000;
  return n;
}

// Recetas de un tipo que sirven para el objetivo (si no hay, todas las de ese tipo)
function opcionesPara(recetas, tipo, objetivos, excluir = 0) {
  const elegidos = Array.isArray(objetivos) ? objetivos : [objetivos];
  let lista = recetas.filter(r => r.tipo === tipo && r.id !== excluir &&
    elegidos.some(objetivo => r.objetivos.split(',').includes(objetivo)));
  if (!lista.length) lista = recetas.filter(r => r.tipo === tipo && r.id !== excluir);
  return lista;
}

function objetivosDelPerfil(perfil) {
  const mapa = perfil.objetivos_dias;
  if (mapa && typeof mapa === 'object' && !Array.isArray(mapa)) {
    const objetivos = Object.keys(mapa).filter(objetivo => OBJETIVOS.includes(objetivo));
    if (objetivos.length) return objetivos;
  }
  return [OBJETIVOS.includes(perfil.objetivo) ? perfil.objetivo : 'grasa'];
}

function diaDeSemana(fecha) {
  return (new Date(`${fecha}T12:00:00Z`).getUTCDay() + 6) % 7;
}

function objetivosDelDia(perfil, fecha) {
  const objetivos = objetivosDelPerfil(perfil);
  const asignado = perfil.objetivos_dias && perfil.objetivos_dias[objetivos[0]] !== undefined
    ? Object.entries(perfil.objetivos_dias).find(([, dias]) => Array.isArray(dias) && dias.includes(diaDeSemana(fecha)))
    : null;
  const principal = asignado && objetivos.includes(asignado[0])
    ? asignado[0]
    : objetivos[diaDeSemana(fecha) % objetivos.length];
  const inicio = objetivos.indexOf(principal);
  return objetivos.map((_, i) => objetivos[(inicio + i) % objetivos.length]);
}

function objetivoComida(objetivos, tipo) {
  return objetivos[TIPOS.indexOf(tipo) % objetivos.length];
}

async function perfilNutricion(req) {
  return ok(await req.sb.from('perfiles').select('objetivo, objetivos_dias').eq('id', req.usuarioId).single());
}

// GET /api/nutricion/plan?fecha=YYYY-MM-DD
router.get('/plan', async (req, res) => {
  const { recetas } = await cargarCatalogos();
  const fecha = fechaValida(req.query.fecha) ? req.query.fecha : hoy();
  const perfil = await perfilNutricion(req);
  const objetivos = objetivosDelDia(perfil, fecha);

  const comidas = TIPOS.map(tipo => {
    const objetivo = objetivoComida(objetivos, tipo);
    const opciones = opcionesPara(recetas, tipo, objetivo);
    const indice = numeroDesdeTexto(`${req.usuarioId}-${fecha}-${tipo}`) % opciones.length;
    return { tipo, objetivo, receta: opciones[indice], opciones: opciones.length };
  });

  res.json({
    fecha, objetivo: objetivos[0], objetivos,
    kcal_total: comidas.reduce((s, c) => s + c.receta.kcal, 0),
    proteina_total: comidas.reduce((s, c) => s + c.receta.proteina, 0),
    comidas
  });
});

// GET /api/nutricion/alternativa?tipo=almuerzo&excluir=3
router.get('/alternativa', async (req, res) => {
  const { recetas } = await cargarCatalogos();
  const tipo = TIPOS.includes(req.query.tipo) ? req.query.tipo : 'almuerzo';
  const fecha = fechaValida(req.query.fecha) ? req.query.fecha : hoy();
  const perfil = await perfilNutricion(req);
  const objetivos = objetivosDelDia(perfil, fecha);
  const objetivoSolicitado = OBJETIVOS.includes(req.query.objetivo) && objetivos.includes(req.query.objetivo)
    ? req.query.objetivo
    : objetivoComida(objetivos, tipo);
  const opciones = opcionesPara(recetas, tipo, objetivoSolicitado, Number(req.query.excluir) || 0);
  if (!opciones.length) return res.status(404).json({ error: 'No hay más opciones' });
  res.json({ ...opciones[Math.floor(Math.random() * opciones.length)], objetivo: objetivoSolicitado });
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
module.exports.objetivosDelPerfil = objetivosDelPerfil;
module.exports.objetivosDelDia = objetivosDelDia;
module.exports.opcionesPara = opcionesPara;
