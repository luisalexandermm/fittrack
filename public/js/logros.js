// ============================================================
//  logros.js — pestaña Logros (en Progreso)
//  Los calcula el servidor con tus sesiones reales (rutas/logros.js).
// ============================================================

async function cargarLogros() {
  const panel = document.getElementById('panel-logros');
  panel.innerHTML = '<p class="cargando-modal"><span class="punto-carga"></span>Cargando tus logros…</p>';
  try {
    const { logros, conseguidos, total } = await api('/logros');
    panel.innerHTML = `
      <div class="caja-cabeza"><h2 class="subtitulo">Tus logros</h2><span class="rotulo">${conseguidos} de ${total}</span></div>
      ${conseguidos === 0 ? '<p class="tenue">Todavía no tienes logros. Completa tu primer entrenamiento y aparece el primero.</p>' : ''}
      <div class="rejilla-logros">
        ${logros.map(l => `
          <div class="logro ${l.logrado ? 'logrado' : ''}">
            <span class="tile">${icono(l.icono)}</span>
            <strong>${escapar(l.titulo)}</strong>
            <small>${escapar(l.descripcion)}</small>
            ${l.logrado
              ? `<span class="logro-estado">${icono('check', 'ic-sm')}Conseguido</span>`
              : `<div class="barra" role="progressbar" aria-label="${l.actual} de ${l.meta}" aria-valuenow="${l.actual}" aria-valuemin="0" aria-valuemax="${l.meta}"><i style="width:${Math.round((l.actual / l.meta) * 100)}%"></i></div><span class="logro-estado tenue">${l.actual} de ${l.meta}</span>`}
          </div>`).join('')}
      </div>
      <p class="tenue nota-logros">Los logros premian la constancia, no entrenar todos los días: descansar también es parte del plan.</p>`;
  } catch (err) {
    panel.innerHTML = `<p class="error-form" role="alert">${escapar(err.message)}</p>`;
  }
}
