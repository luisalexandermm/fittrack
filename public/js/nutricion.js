// ============================================================
//  nutricion.js — plan de comidas, recetas y consejos
// ============================================================

let planHoy = null;
let recetasCargadas = false;

function prepararNutricion() {
  prepararPestanas('pestanas-nutricion', panel => {
    if (panel === 'recetas' && !recetasCargadas) cargarRecetas('');
    if (panel === 'consejos') cargarConsejos();
  });
  seleccionUnica('filtro-recetas', tipo => cargarRecetas(tipo));

  document.getElementById('panel-plan').addEventListener('click', async e => {
    const cambiar = e.target.closest('[data-cambiar-comida]');
    if (cambiar) return cambiarComida(Number(cambiar.dataset.cambiarComida));
    const ver = e.target.closest('[data-ver-receta]');
    if (ver) verReceta(Number(ver.dataset.verReceta));
  });
  document.getElementById('lista-recetas').addEventListener('click', e => {
    const ver = e.target.closest('[data-ver-receta]');
    if (ver) verReceta(Number(ver.dataset.verReceta));
  });
}

async function cargarNutricion() {
  const [plan, consejos] = await Promise.all([api('/nutricion/plan?fecha=' + hoyTexto()), api('/nutricion/consejos')]);
  planHoy = plan;
  pintarPlan(consejos.del_dia);
}

function pintarPlan(tipDelDia) {
  const kcal = planHoy.comidas.reduce((s, c) => s + c.receta.kcal, 0);
  const proteina = planHoy.comidas.reduce((s, c) => s + c.receta.proteina, 0);

  const filas = planHoy.comidas.map((c, i) => `
    <div class="comida">
      <span class="tile tile-lg">${picto('c-' + c.tipo)}</span>
      <button class="comida-texto" type="button" data-ver-receta="${c.receta.id}">
        <span class="rotulo">${NOMBRES_COMIDA[c.tipo]}</span>
        <strong>${escapar(c.receta.nombre)}</strong>
        <small>${c.receta.kcal} kcal · ${c.receta.proteina} g proteína · ${c.receta.minutos} min</small>
      </button>
      <button class="btn btn-icono" type="button" data-cambiar-comida="${i}" aria-label="Otra opción de ${NOMBRES_COMIDA[c.tipo].toLowerCase()}">${icono('cambiar')}</button>
    </div>`).join('');

  document.getElementById('panel-plan').innerHTML = `
    <div class="rejilla-plan">
      <div>
        <div class="plan-cabeza">
          <div><h2 class="subtitulo" style="margin:0">Plan de hoy</h2><span class="tenue" style="font-size:.9rem">Pensado para: ${NOMBRES_CORTOS[planHoy.objetivo].toLowerCase()}</span></div>
          <div style="text-align:right"><span class="cifra kcal">≈ ${numero(kcal)}</span> <span class="tenue">kcal</span><br><span class="tenue" style="font-size:.85rem">${proteina} g de proteína</span></div>
        </div>
        ${filas}
      </div>
      <aside class="tip">
        ${icono('bombillo', 'ic-lg')}
        <span class="rotulo">Tip del día</span>
        <p>${escapar(tipDelDia.texto)}</p>
      </aside>
    </div>`;
}

async function cambiarComida(indice) {
  const comida = planHoy.comidas[indice];
  try {
    comida.receta = await api(`/nutricion/alternativa?tipo=${comida.tipo}&excluir=${comida.receta.id}`);
    const consejos = await api('/nutricion/consejos');
    pintarPlan(consejos.del_dia);
  } catch (err) {
    avisar(err.message, 'error');
  }
}

async function cargarRecetas(tipo) {
  const recetas = await api('/nutricion/recetas' + (tipo ? '?tipo=' + tipo : ''));
  recetasCargadas = true;
  document.getElementById('lista-recetas').innerHTML = recetas.map(r => `
    <button class="caja receta" type="button" data-ver-receta="${r.id}">
      <span class="tile">${picto('c-' + r.tipo)}</span>
      <span><strong>${escapar(r.nombre)}</strong><small>${NOMBRES_COMIDA[r.tipo]} · ${r.kcal} kcal · ${r.minutos} min</small></span>
    </button>`).join('');
}

async function cargarConsejos() {
  const { consejos } = await api('/nutricion/consejos');
  document.getElementById('panel-consejos').innerHTML = `
    <ol class="lista-consejos">
      ${consejos.map((c, i) => `<li><span class="cifra">${String(i + 1).padStart(2, '0')}</span><span>${escapar(c.texto)}</span></li>`).join('')}
    </ol>`;
}

async function verReceta(id) {
  const r = await api('/nutricion/recetas/' + id);
  abrirModal(`
    <article class="receta-detalle">
      <span class="tile tile-lg" style="margin-bottom:14px">${picto('c-' + r.tipo)}</span>
      <span class="rotulo">${NOMBRES_COMIDA[r.tipo]}</span>
      <h2>${escapar(r.nombre)}</h2>
      <p>${escapar(r.descripcion)}</p>
      <div class="chips-info" style="margin:16px 0 0">
        <span>≈ ${r.kcal} kcal</span><span>${r.proteina} g proteína</span><span>${r.minutos} min</span>
      </div>
      <h3>Ingredientes</h3>
      <ul>${r.ingredientes.map(i => `<li>${escapar(i)}</li>`).join('')}</ul>
      <h3>Preparación</h3>
      <ol>${r.pasos.map(p => `<li><span>${escapar(p)}</span></li>`).join('')}</ol>
    </article>`);
}
