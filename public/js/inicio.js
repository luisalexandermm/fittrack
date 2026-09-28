// ============================================================
//  inicio.js — panel principal
//   1. Tu entrenamiento de hoy (con la figura del primer ejercicio)
//   2. Tu semana (✓ hecho · → próximo · ○ programado · — descanso)
//   3. Tu progreso: peso, cintura, entrenamientos y racha
//   4. Lo que está cambiando: peso y minutos por semana
// ============================================================

async function cargarInicio() {
  const hoy = hoyTexto();
  const lunes = lunesDe(hoy);
  const [r, , sesionesSemana] = await Promise.all([
    api('/resumen'),
    cargarPlan(),
    api(`/sesiones?desde=${lunes}&hasta=${sumarDias(lunes, 6)}`)
  ]);

  const d = new Date();
  document.getElementById('fecha-hoy').textContent = `${DIAS_LARGOS[indiceDia(hoy)]} ${d.getDate()} de ${MESES_LARGO[d.getMonth()].toLowerCase()}`;
  const chip = document.getElementById('chip-racha');
  chip.hidden = r.racha < 2;
  chip.innerHTML = `${icono('fuego', 'ic-sm')}${r.racha} días seguidos`;

  pintarAvisoPreferencias();

  const conSesion = new Set(sesionesSemana.map(s => s.fecha));
  const semana = estadosSemana(lunes, conSesion);
  const deHoy = semana[indiceDia(hoy)];

  document.getElementById('inicio-contenido').innerHTML = `
    ${tarjetaHoy(deHoy, semana, sesionesSemana.filter(s => s.fecha === hoy))}

    <section class="caja s-12 t-semana" aria-labelledby="t-semana">
      <div class="caja-cabeza">
        <h2 class="subtitulo" id="t-semana">Tu semana</h2>
        <span class="rotulo">${semana.filter(x => x.estado === 'hecho').length} de ${planSemana.dias.filter(x => x.entrena).length} entrenamientos</span>
      </div>
      <div class="semana-tira">
        ${semana.map((x, i) => `
          <a href="#rutinas" class="dia-tira e-${x.estado} ${x.esHoy ? 'es-hoy' : ''}" data-dia="${i}" style="animation-delay:${i * 40}ms">
            <span class="rotulo">${DIAS_CORTOS[i]}</span>
            <b class="simbolo" aria-hidden="true">${SIMBOLO_ESTADO[x.estado]}</b>
            <strong>${x.dia.titulo}</strong>
            <small>${x.dia.entrena ? x.dia.minutos + ' min' : (x.dia.tipo === 'activo' ? 'Caminata suave' : 'Recuperación')}</small>
            <span class="solo-lector">${TEXTO_ESTADO[x.estado]}</span>
          </a>`).join('')}
      </div>
    </section>

    <h2 class="subtitulo s-12 titulo-seccion">Tu progreso</h2>
    <div class="datos s-12">
      ${dato('Peso', r.peso ? r.peso.actual : null, 'kg', r.peso && r.peso.cambio !== 0 ? `${r.peso.cambio > 0 ? '+' : ''}${numero(r.peso.cambio, 1)} kg desde el inicio` : (r.usuario.meta_peso ? `Meta: ${numero(r.usuario.meta_peso, 1)} kg` : ''), 'progreso')}
      ${dato('Cintura', r.cintura, 'cm', '', 'progreso')}
      ${dato('Entrenamientos', r.total_sesiones, '', `${r.minutos_totales >= 60 ? numero(r.minutos_totales / 60, 1) + ' h' : r.minutos_totales + ' min'} en total`, 'calendario')}
      ${dato('Racha', r.racha, r.racha === 1 ? 'día' : 'días', r.racha ? 'Seguidos, contando hoy o ayer' : 'Entrena hoy para empezarla', 'calendario')}
    </div>

    <h2 class="subtitulo s-12 titulo-seccion">Lo que está cambiando</h2>
    <div class="caja s-7">
      <div class="caja-cabeza"><h3 class="subtitulo">Peso</h3><a href="#progreso" class="btn btn-texto btn-sm">Ver progreso ${icono('flecha', 'ic-sm')}</a></div>
      <div id="grafica-peso-inicio"></div>
    </div>
    <div class="caja s-5">
      <div class="caja-cabeza"><h3 class="subtitulo">Minutos por semana</h3><span class="rotulo">Constancia: ${r.dias_esta_semana}/${r.usuario.meta_semanal} días</span></div>
      <div id="grafica-semanas"></div>
    </div>`;

  // Figura animada del primer ejercicio de hoy
  const figura = document.getElementById('hoy-figura');
  if (figura) montarAnimacion(figura, figura.dataset.ejercicio, figura.dataset.grupo);

  contarNumeros(document.getElementById('inicio-contenido'));
  graficaBarras('grafica-semanas', r.semanas.map(s => ({ etiqueta: diaMes(s.inicio), valor: s.minutos })));
  pintarPesoInicio(r);

  // Botones de la tarjeta de hoy y de la semana
  const contenido = document.getElementById('inicio-contenido');
  contenido.querySelectorAll('[data-dia]').forEach(a => a.addEventListener('click', () => { diaSugerido = Number(a.dataset.dia); }));
  const empezar = document.getElementById('btn-empezar-hoy');
  if (empezar) empezar.addEventListener('click', () => iniciarReproductor(deHoy.dia.rutina, null));
}

// ---------- Tarjeta "Tu entrenamiento de hoy" ----------
function tarjetaHoy(deHoy, semana, sesionesHoy) {
  const dia = deHoy.dia;
  const lugar = NOMBRES_LUGAR[planSemana.preferencias.lugar] || 'En casa';

  // Ya entrenó hoy
  if (sesionesHoy.length) {
    const minutos = sesionesHoy.reduce((s, x) => s + x.minutos, 0);
    return `
      <section class="t-hoy s-12 hecho">
        <div class="t-hoy-texto">
          <span class="rotulo">Tu entrenamiento de hoy</span>
          <h2>Hoy ya cumpliste ${icono('check')}</h2>
          <p>${escapar(sesionesHoy[0].nombre.split(' · ')[0])} · ${minutos} min. Próximo: ${escapar(siguienteEntreno(semana))}.</p>
          <div class="acciones"><a href="#calendario" class="btn btn-linea">Ver mi semana</a></div>
        </div>
      </section>`;
  }

  // Día de descanso
  if (!dia.entrena) {
    return `
      <section class="t-hoy s-12 descanso">
        <div class="t-hoy-texto">
          <span class="rotulo">Hoy · ${DIAS_LARGOS[dia.dia]}</span>
          <h2>${dia.titulo}</h2>
          <p>${dia.tipo === 'activo' ? 'Camina 20 minutos a ritmo suave y estira un poco.' : 'Tu cuerpo también progresa cuando descansa.'} Próximo entreno: ${escapar(siguienteEntreno(semana))}.</p>
          <div class="acciones"><a href="#rutinas" class="btn btn-linea" data-dia="${dia.dia}">Entrenar igual</a></div>
        </div>
        <div class="t-hoy-figura">${picto(dia.picto)}</div>
      </section>`;
  }

  // Toca entrenar
  const principal = dia.rutina.bloques.find(b => b.tipo === 'principal');
  const primero = principal.ejercicios[0];
  return `
    <section class="t-hoy s-12">
      <div class="t-hoy-texto">
        <span class="rotulo">Tu entrenamiento de hoy · ${DIAS_LARGOS[dia.dia]}</span>
        <h2>${dia.titulo}</h2>
        <p class="t-hoy-meta">${icono('reloj', 'ic-sm')}${Math.round(dia.rutina.duracion_seg / 60)} min <span>·</span> ${principal.ejercicios.length} ejercicios × ${principal.rondas} rondas <span>·</span> ${lugar}</p>
        <ul class="t-hoy-lista">${principal.ejercicios.map(e => `<li>${escapar(e.nombre)}</li>`).join('')}</ul>
        <div class="acciones">
          <button type="button" class="btn btn-lima" id="btn-empezar-hoy">${icono('play')}Empezar</button>
          <a href="#rutinas" class="btn btn-linea" data-dia="${dia.dia}">Ver rutina</a>
        </div>
      </div>
      <div class="t-hoy-figura figura-oscura" id="hoy-figura" data-ejercicio="${escapar(primero.nombre)}" data-grupo="${primero.grupo}"></div>
    </section>`;
}

// "Viernes · Full Body" del siguiente día con entreno
function siguienteEntreno(semana) {
  const hoy = indiceDia(hoyTexto());
  for (let i = 1; i <= 7; i++) {
    const dia = planSemana.dias[(hoy + i) % 7];
    if (dia.entrena) return `${DIAS_LARGOS[dia.dia].toLowerCase()}, ${dia.titulo}`;
  }
  return 'cuando quieras';
}

// ---------- Tarjeta de un dato (peso, cintura…) ----------
function dato(etiqueta, valor, unidad, detalle, enlace) {
  return `
    <a href="#${enlace}" class="caja dato">
      <span class="rotulo">${etiqueta}</span>
      <span class="cifra">${valor != null ? `<span data-contar="${valor}">0</span><small>${unidad}</small>` : '—'}</span>
      <span class="detalle">${detalle || (valor == null ? 'Sin registros todavía' : '')}</span>
    </a>`;
}

// ---------- Gráfica de peso (o una invitación a registrarlo) ----------
function pintarPesoInicio(r) {
  const caja = document.getElementById('grafica-peso-inicio');
  if (!r.usuario.sensibles_ok) {
    caja.innerHTML = `<div class="vacio">${icono('candado')}Autoriza el seguimiento de peso y medidas para ver cómo cambias.<br><a href="#progreso" class="btn btn-linea btn-sm">Ir a progreso</a></div>`;
    return;
  }
  if (!r.peso || r.peso.historial.length < 2) {
    caja.innerHTML = `<div class="vacio">${icono('bascula')}${r.peso ? 'Registra tu peso otra vez en unos días para ver la tendencia.' : 'Registra tu peso para empezar a ver la tendencia.'}<br><a href="#progreso" class="btn btn-linea btn-sm">Registrar</a></div>`;
    return;
  }
  graficaLinea('grafica-peso-inicio', r.peso.historial.map(p => ({ etiqueta: diaMes(p.fecha), valor: p.peso })), 'kg', r.usuario.meta_peso);
}

// ---------- Aviso para usuarios antiguos o sin migración ----------
function pintarAvisoPreferencias() {
  const caja = document.getElementById('aviso-preferencias');
  if (planSemana.pendientes) {
    caja.innerHTML = `
      <div class="aviso-caja">
        ${icono('calendario')}
        <div>
          <strong>Nuevo: tu semana, día por día</strong>
          <p>Dinos dónde entrenas y qué días puedes, y FitTrack arma una rutina distinta para cada día.</p>
          <button type="button" class="btn btn-lima btn-sm" id="btn-completar-preferencias">Completar mis preferencias</button>
        </div>
      </div>`;
    document.getElementById('btn-completar-preferencias').addEventListener('click', abrirPreferencias);
  } else {
    caja.innerHTML = '';
  }
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
