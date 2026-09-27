// ============================================================
//  inicio.js — panel principal
//  Objetivo con progreso · Peso, meta, grasa, cintura · Plan de hoy
//  Semana · Minutos por semana
// ============================================================

async function cargarInicio() {
  const r = await api('/resumen');
  const hoy = hoyTexto();
  const d = new Date();
  document.getElementById('fecha-hoy').textContent = `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;
  const chip = document.getElementById('chip-racha');
  chip.hidden = r.racha < 2;
  chip.innerHTML = `${icono('fuego', 'ic-sm')}${r.racha} días seguidos`;

  // ---- Tarjeta de objetivo ----
  let progresoHTML;
  if (!r.usuario.sensibles_ok) {
    progresoHTML = `<p class="tenue" style="font-size:.9rem">Autoriza el seguimiento de peso y medidas para ver tu avance.</p>`;
  } else if (!r.usuario.meta_peso || !r.peso) {
    progresoHTML = `<p class="tenue" style="font-size:.9rem">${!r.peso ? 'Registra tu peso' : 'Define tu meta de peso'} para calcular tu avance.</p>`;
  } else {
    const p = r.peso.progreso ?? 0;
    progresoHTML = `
      <div class="fila"><span class="rotulo">Progreso actual</span><span class="cifra porc">${p}<small style="font-size:1rem">%</small></span></div>
      <div class="barra"><i style="width:${p}%"></i></div>`;
  }

  // ---- Plan de hoy (según el calendario) ----
  const act = actividadDelDia(hoy, r.usuario);
  const entrenoHoy = r.semana.find(x => x.esHoy).entreno;
  let tituloHoy = act.titulo, detalleHoy = act.detalle;
  if (entrenoHoy) { tituloHoy = 'Hoy ya cumpliste'; detalleHoy = 'Si quieres, una sesión extra suave.'; }

  // ---- Datos (peso, meta, grasa, cintura) ----
  const dato = (etiqueta, valor, unidad, detalle = '', extra = '') => `
    <div class="caja dato">
      <span class="rotulo">${etiqueta}</span>
      <span class="cifra">${valor != null ? `<span data-contar="${valor}">0</span><small>${unidad}</small>` : '—'}</span>
      ${detalle ? `<span class="detalle">${detalle}</span>` : ''}
      ${extra}
    </div>`;
  const pesoActual = r.peso ? r.peso.actual : null;
  const cambio = r.peso && r.peso.cambio !== 0 ? `${r.peso.cambio > 0 ? '+' : ''}${numero(r.peso.cambio, 1)} kg desde el inicio` : '';
  const imc = r.peso && r.peso.imc ? `IMC ${numero(r.peso.imc, 1)}` : '';

  // ---- Semana ----
  const letras = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const semanaHTML = r.semana.map((dia, i) => `
    <span class="${dia.entreno ? 'hecho' : ''} ${dia.esHoy ? 'hoy' : ''}">${letras[i]}<b>${dia.entreno ? icono('check', 'ic-sm') : ''}</b></span>`).join('');

  document.getElementById('inicio-contenido').innerHTML = `
    <a href="#progreso" class="caja t-objetivo s-7">
      <div class="fila">
        <div><span class="rotulo">Tu objetivo</span><h3>${NOMBRES_OBJETIVO[r.usuario.objetivo]}</h3></div>
        <span class="tile">${icono('objetivo')}</span>
      </div>
      ${progresoHTML}
    </a>

    <div class="t-hoy s-5">
      <div><span class="rotulo">Tu plan de hoy</span><h3>${tituloHoy}</h3></div>
      <span class="tile">${picto(act.picto)}</span>
      <p>${detalleHoy}</p>
      <div class="acciones">
        ${act.entrena || entrenoHoy
          ? `<a href="#rutinas" class="btn btn-lima" data-empezar-hoy>${icono('play')}Comenzar</a>`
          : `<a href="#rutinas" class="btn btn-lima">Entrenar igual</a>`}
        <a href="#calendario" class="btn btn-linea">Ver semana</a>
      </div>
    </div>

    <div class="datos s-12">
      ${dato('Peso actual', pesoActual, 'kg', cambio, r.peso ? miniLinea(r.peso.historial.map(p => p.peso)) : '')}
      ${dato('Meta', r.usuario.meta_peso || null, 'kg', imc)}
      ${dato('Grasa corporal', r.grasa, '%')}
      ${dato('Cintura', r.cintura, 'cm')}
    </div>

    <div class="caja s-5">
      <div class="caja-cabeza" style="margin-bottom:0"><h2 class="subtitulo">Esta semana</h2><span class="rotulo">${r.dias_esta_semana}/${r.usuario.meta_semanal} días</span></div>
      <div class="dias7">${semanaHTML}</div>
      <div class="linea-datos">
        <span><b>${r.racha}</b>${r.racha === 1 ? 'día' : 'días'} de racha</span>
        <span><b>${r.total_sesiones}</b>sesiones</span>
        <span><b>${r.minutos_totales >= 60 ? numero(r.minutos_totales / 60, 1) : r.minutos_totales}</b>${r.minutos_totales >= 60 ? 'horas' : 'min'}</span>
      </div>
    </div>

    <div class="caja s-7">
      <div class="caja-cabeza"><h2 class="subtitulo">Minutos por semana</h2><span class="rotulo">8 semanas</span></div>
      <div id="grafica-semanas"></div>
    </div>`;

  contarNumeros(document.getElementById('inicio-contenido'));
  graficaBarras('grafica-semanas', r.semanas.map(s => ({ etiqueta: diaMes(s.inicio), valor: s.minutos })));

  // "Comenzar" abre Rutinas con el objetivo del día (ej: movilidad si toca movilidad)
  const empezar = document.querySelector('[data-empezar-hoy]');
  if (empezar && act.objetivo) empezar.addEventListener('click', () => { objetivoSugerido = act.objetivo; });
}

// Mini gráfica de línea (sin ejes) para la tarjeta de peso
function miniLinea(valores) {
  if (valores.length < 2) return '';
  const min = Math.min(...valores), max = Math.max(...valores), rango = max - min || 1;
  const puntos = valores.map((v, i) => `${(i / (valores.length - 1)) * 100},${28 - ((v - min) / rango) * 24}`).join(' ');
  return `<svg class="mini-linea" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true"><polyline points="${puntos}"/></svg>`;
}

// Los números cuentan desde 0 hasta su valor (animación corta)
function contarNumeros(contenedor) {
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  contenedor.querySelectorAll('[data-contar]').forEach(el => {
    const final = Number(el.dataset.contar);
    const decimales = Number.isInteger(final) ? 0 : 1;
    if (reducido) { el.textContent = numero(final, decimales); return; }
    const inicio = performance.now(), duracion = 900;
    const paso = ahora => {
      const t = Math.min((ahora - inicio) / duracion, 1);
      const suave = 1 - Math.pow(1 - t, 3); // arranca rápido y frena al final
      el.textContent = numero(final * suave, decimales);
      if (t < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  });
}
