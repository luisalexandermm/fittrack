// ============================================================
//  adaptar.js — FitTrack Adaptive en la app
//   - "Tengo poco tiempo": versión corta de la rutina de hoy
//   - "Hoy no puedo": pasar la rutina a la mañana siguiente
//  Siempre se muestra la propuesta con su explicación y el usuario decide.
//  Las reglas viven en el servidor (rutas/adaptar.js).
// ============================================================

const NOMBRES_DIA_MIN = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

// Lista de motivos que explican la propuesta
function listaExplicacion(explicacion) {
  return `<ul class="explicacion">${explicacion.map(t => `<li>${icono('check', 'ic-sm')}<span>${escapar(t)}</span></li>`).join('')}</ul>`;
}

function cargandoModal(texto) {
  return `<div class="form-modal"><p class="cargando-modal"><span class="punto-carga"></span>${texto}</p></div>`;
}

function errorModal(titulo, mensaje) {
  return `
    <div class="form-modal">
      <span class="rotulo">FitTrack Adaptive</span>
      <h2>${titulo}</h2>
      <p class="suave">${escapar(mensaje)}</p>
      <div class="fila-botones"><button type="button" class="btn btn-lima" data-cerrar-modal>Entendido</button></div>
    </div>`;
}

// ---------- 1. "Tengo poco tiempo" ----------
function abrirVersionCorta(dia) {
  const actual = minutosActividad(dia.rutina);
  const opciones = [10, 15, 20, 25, 30, 40].filter(m => m < actual).slice(-4);
  if (!opciones.length) return avisar('Tu rutina de hoy ya es corta.', 'error');
  abrirModal(`
    <div class="form-modal">
      <span class="rotulo">FitTrack Adaptive</span>
      <h2>¿Cuánto tiempo tienes hoy?</h2>
      <p class="suave">Tu rutina de hoy dura ${actual} min de actividad. Te armamos una versión más corta que conserva el enfoque del día.</p>
      <div class="opciones" id="opciones-corta">
        ${opciones.map(m => `<button type="button" class="opcion" data-minutos="${m}">${m} min</button>`).join('')}
      </div>
      <div id="propuesta-corta"></div>
    </div>`);

  document.getElementById('opciones-corta').addEventListener('click', async e => {
    const boton = e.target.closest('[data-minutos]');
    if (!boton) return;
    document.querySelectorAll('#opciones-corta .opcion').forEach(b => b.classList.toggle('activo', b === boton));
    const caja = document.getElementById('propuesta-corta');
    caja.innerHTML = '<p class="cargando-modal"><span class="punto-carga"></span>Armando tu versión corta…</p>';
    try {
      const { rutina, explicacion } = await api('/plan/corta', { method: 'POST', body: { dia: dia.dia, minutos: Number(boton.dataset.minutos) } });
      const principal = rutina.bloques.find(b => b.tipo === 'principal');
      caja.innerHTML = `
        <div class="propuesta">
          <strong>${escapar(rutina.nombre.split(' · ')[0])} · ${minutosActividad(rutina)} min de actividad</strong>
          <ul class="t-hoy-lista claro">${principal.ejercicios.map(x => `<li>${escapar(x.nombre)}</li>`).join('')}</ul>
          ${listaExplicacion(explicacion)}
        </div>
        <div class="fila-botones">
          <button type="button" class="btn btn-linea" data-cerrar-modal>Cancelar</button>
          <button type="button" class="btn btn-lima" id="btn-entrenar-corta">${icono('play')}Entrenar esta versión</button>
        </div>`;
      document.getElementById('btn-entrenar-corta').addEventListener('click', () => {
        cerrarModal();
        iniciarReproductor(rutina, null);
      });
    } catch (err) {
      caja.innerHTML = `<p class="error-form" role="alert">${escapar(err.message)}</p>`;
    }
  });
}

// ---------- 2. "Hoy no puedo": pasar a la mañana siguiente ----------
async function abrirMoverRutina(diaIndice) {
  abrirModal(cargandoModal('Buscando cómo acomodar tu semana…'));
  let propuesta;
  try {
    ({ propuesta } = await api('/plan/mover', { method: 'POST', body: { dia: diaIndice, confirmar: false } }));
  } catch (err) {
    document.getElementById('modal-contenido').innerHTML = errorModal('Mejor déjala pasar', err.message);
    return;
  }
  const esHoy = propuesta.destino === indiceDia(hoyTexto());
  const destino = esHoy ? 'hoy' : `el ${NOMBRES_DIA_MIN[propuesta.destino]}`;
  const aDestino = esHoy ? 'a hoy' : `al ${NOMBRES_DIA_MIN[propuesta.destino]}`;
  document.getElementById('modal-contenido').innerHTML = `
    <div class="form-modal">
      <span class="rotulo">FitTrack Adaptive</span>
      <h2>¿La pasamos ${aDestino} en la mañana?</h2>
      ${listaExplicacion(propuesta.explicacion)}
      <p class="tenue nota-salud">Descansar no te hace perder lo que ya avanzaste. Si tienes dolor o una lesión, no la recuperes: descansa y consulta a un profesional.</p>
      <div class="fila-botones">
        <button type="button" class="btn btn-linea" data-cerrar-modal>No, la dejo pasar</button>
        <button type="button" class="btn btn-lima" id="btn-confirmar-mover">Sí, pasarla</button>
      </div>
    </div>`;
  document.getElementById('btn-confirmar-mover').addEventListener('click', async e => {
    e.target.disabled = true;
    try {
      planSemana = await api('/plan/mover', { method: 'POST', body: { dia: diaIndice, confirmar: true } });
      cerrarModal();
      avisar(`Listo: la tienes ${destino} en la mañana`);
      refrescarVistaActual();
    } catch (err) {
      e.target.disabled = false;
      avisar(err.message, 'error');
    }
  });
}

async function deshacerMover(diaIndice) {
  try {
    planSemana = await api('/plan/mover/deshacer', { method: 'POST', body: { dia: diaIndice } });
    avisar('La rutina volvió a su día');
    refrescarVistaActual();
  } catch (err) {
    avisar(err.message, 'error');
  }
}

// Vuelve a pintar la pestaña abierta con la semana nueva
function refrescarVistaActual() {
  const pestana = (location.hash || '#inicio').slice(1);
  if (pestana === 'inicio') cargarInicio();
  else if (pestana === 'rutinas') cargarRutinas();
  else if (pestana === 'calendario') cargarCalendario();
}

// ---------- Aviso "ayer no entrenaste" ----------
// Si ayer era día de entreno y no se hizo ni se pasó, ofrecer pasarla a hoy.
// "No, gracias" se recuerda solo en este navegador (es una comodidad, no un dato).
function avisoAyer(semana) {
  const hoy = indiceDia(hoyTexto());
  const ayer = semana[hoy - 1];
  if (!ayer || ayer.estado !== 'perdido' || ayer.dia.movido_a != null) return '';
  if (semana[hoy].extra) return '';
  try { if (localStorage.getItem('fittrack-sin-mover-' + ayer.fecha)) return ''; } catch (e) {}
  return `
    <section class="caja s-12 aviso-ayer" id="aviso-ayer">
      <span class="tile">${icono('calendario')}</span>
      <div><strong>Ayer no hiciste ${escapar(ayer.dia.titulo)}.</strong><p class="tenue">¿La pasamos a hoy en la mañana? Te mostramos cómo queda antes de cambiar nada.</p></div>
      <div class="acciones">
        <button type="button" class="btn btn-lima btn-sm" data-mover="${hoy - 1}">Ver propuesta</button>
        <button type="button" class="btn btn-texto btn-sm" data-ignorar-ayer="${ayer.fecha}">No, gracias</button>
      </div>
    </section>`;
}

// Botones de adaptación (sirven en Inicio y en Rutinas)
document.addEventListener('click', e => {
  const corta = e.target.closest('[data-corta]');
  if (corta) return abrirVersionCorta(planSemana.dias[Number(corta.dataset.corta)]);
  const mover = e.target.closest('[data-mover]');
  if (mover) return abrirMoverRutina(Number(mover.dataset.mover));
  const deshacer = e.target.closest('[data-deshacer-mover]');
  if (deshacer) return deshacerMover(Number(deshacer.dataset.deshacerMover));
  const extra = e.target.closest('[data-empezar-extra]');
  if (extra) return iniciarReproductor(planSemana.dias[Number(extra.dataset.empezarExtra)].extra.rutina, null);
  const ignorar = e.target.closest('[data-ignorar-ayer]');
  if (ignorar) {
    try { localStorage.setItem('fittrack-sin-mover-' + ignorar.dataset.ignorarAyer, '1'); } catch (err) {}
    document.getElementById('aviso-ayer')?.remove();
  }
});
