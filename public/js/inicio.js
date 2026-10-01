// ============================================================
//  inicio.js — panel principal
//   1. Tu entrenamiento de hoy (con la figura del primer ejercicio)
//   2. Tu semana (✓ hecho · → próximo · ○ programado · — descanso)
//   3. Calorías de la semana y avance hacia tu meta (estimado por tus entrenamientos)
//   4. Tu progreso: peso, cintura, entrenamientos y racha
//   5. Lo que está cambiando: peso (báscula + estimado) y calorías por semana
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

    ${tarjetaCaloriasSemana(r)}
    ${tarjetaMeta(r)}

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
      <div class="caja-cabeza"><h3 class="subtitulo">Calorías por semana</h3><span class="rotulo">Constancia: ${r.dias_esta_semana}/${r.usuario.meta_semanal} días</span></div>
      <div id="grafica-semanas"></div>
    </div>`;

  // Figura animada del primer ejercicio de hoy
  const figura = document.getElementById('hoy-figura');
  if (figura) montarAnimacion(figura, figura.dataset.ejercicio, figura.dataset.grupo);

  contarNumeros(document.getElementById('inicio-contenido'));
  graficaBarras('grafica-semanas', r.semanas.map(s => ({ etiqueta: diaMes(s.inicio), valor: s.kcal })), 'kcal');
  animarBarrasMeta();
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
        <p class="t-hoy-meta">${icono('reloj', 'ic-sm')}${minutosActividad(dia.rutina)} min de actividad <span>·</span> ${principal.ejercicios.length} ejercicios × ${principal.rondas} rondas <span>·</span> ${icono('fuego', 'ic-sm')}≈ ${numero(kcalRutina(dia.rutina) || 0)} kcal <span>·</span> ${lugar}</p>
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
  if (!r.peso || (r.peso.historial.length < 2 && r.peso.historial_estimado.length < 2)) {
    caja.innerHTML = `<div class="vacio">${icono('bascula')}${r.peso ? 'Registra tu peso otra vez en unos días para ver la tendencia.' : 'Registra tu peso para empezar a ver la tendencia.'}<br><a href="#progreso" class="btn btn-linea btn-sm">Registrar</a></div>`;
    return;
  }
  graficaLinea('grafica-peso-inicio', r.peso.historial.map(p => ({ fecha: p.fecha, valor: p.peso })), 'kg', r.usuario.meta_peso,
    r.peso.historial_estimado.map(p => ({ fecha: p.fecha, valor: p.peso })));
}

// ---------- Calorías de esta semana ----------
// Lo quemado con las sesiones de esta semana frente a lo que tiene planeado la semana.
function tarjetaCaloriasSemana(r) {
  const c = r.calorias;
  const plan = c.semana_plan || planSemana.dias.reduce((suma, d) => suma + (d.entrena ? kcalRutina(d.rutina) || 0 : 0), 0);
  const porcentaje = plan ? Math.min(100, Math.round((c.semana / plan) * 100)) : 0;
  return `
    <section class="caja s-5 t-kcal" aria-labelledby="t-kcal">
      <div class="caja-cabeza"><h2 class="subtitulo" id="t-kcal">Esta semana</h2><span class="rotulo">${icono('fuego', 'ic-sm')}Calorías</span></div>
      <div class="kcal-grande"><span class="cifra"><span data-contar="${c.semana}">0</span></span><small>kcal quemadas</small></div>
      <div class="barra barra-meta" role="progressbar" aria-valuenow="${porcentaje}" aria-valuemin="0" aria-valuemax="100"><i data-ancho="${porcentaje}"></i></div>
      <p class="kcal-detalle"><b>≈ ${numero(c.kg_semana * 1000)} g</b> de grasa ${plan ? `· ${porcentaje}% de las ~${numero(plan)} kcal de tu semana` : ''}</p>
      ${c.peso_es_referencia ? `<p class="kcal-nota">Calculado con un peso de referencia (${c.peso_usado} kg). <a href="#progreso">Registra tu peso</a> para que sea tuyo.</p>` : ''}
    </section>`;
}

// ---------- Hacia tu meta de peso ----------
// La barra se llena con dos capas: lo ESTIMADO por tus entrenamientos y lo MEDIDO en la báscula.
function tarjetaMeta(r) {
  const meta = r.usuario.meta_peso;
  const p = r.peso;
  if (!r.usuario.sensibles_ok || !p || !meta) {
    const texto = !r.usuario.sensibles_ok ? 'Autoriza el seguimiento de peso para ver cuánto te acercas a tu meta.'
      : !p ? 'Registra tu peso para que FitTrack calcule cuánto te acercas a tu meta con cada entrenamiento.'
      : 'Define tu meta de peso y la barra empezará a llenarse con tus entrenamientos.';
    return `
      <section class="caja s-7 t-meta" aria-labelledby="t-meta">
        <div class="caja-cabeza"><h2 class="subtitulo" id="t-meta">Hacia tu meta</h2></div>
        <p class="tenue">${texto}</p>
        <a href="#progreso" class="btn btn-linea btn-sm">Ir a progreso</a>
      </section>`;
  }
  const bajar = meta < p.inicial;
  const estimadoKg = r.calorias.kg_total;
  const medidoKg = p.inicial - p.actual;
  return `
    <section class="caja s-7 t-meta" aria-labelledby="t-meta">
      <div class="caja-cabeza">
        <h2 class="subtitulo" id="t-meta">Hacia tu meta</h2>
        <span class="rotulo">${numero(p.inicial, 1)} → ${numero(meta, 1)} kg</span>
      </div>
      ${bajar ? `
        <div class="barra-doble" role="img" aria-label="Estimado ${p.progreso_estimado}%, medido ${p.progreso ?? 0}%">
          <span class="barra-pista"><i class="b-estimado" data-ancho="${p.progreso_estimado || 0}"></i></span>
          <span class="barra-pista"><i class="b-medido" data-ancho="${p.progreso || 0}"></i></span>
        </div>
        <div class="meta-cifras">
          <div><span class="punto-l estimado"></span><b>${p.progreso_estimado || 0}%</b><small>Estimado por tus entrenamientos · −${numero(estimadoKg, 2)} kg</small></div>
          <div><span class="punto-l medido"></span><b>${p.progreso ?? 0}%</b><small>Báscula · ${medidoKg >= 0 ? '−' : '+'}${numero(Math.abs(medidoKg), 1)} kg</small></div>
        </div>
        <p class="kcal-nota">Desde ${diaMes(r.calorias.desde)} has quemado ≈ ${numero(r.calorias.total)} kcal entrenando (7.700 kcal ≈ 1 kg). Lo que comes también cuenta: la báscula manda.</p>`
      : `
        <div class="barra barra-meta"><i data-ancho="${p.progreso || 0}"></i></div>
        <p class="kcal-detalle"><b>${p.progreso ?? 0}%</b> de tu meta según la báscula.</p>
        <p class="kcal-nota">Tu meta es subir de peso: aquí cuenta lo que marca la báscula. Entrenando has gastado ≈ ${numero(r.calorias.total)} kcal; súmalas a lo que comes.</p>`}
    </section>`;
}

// Las barras arrancan vacías y se llenan con una animación
function animarBarrasMeta() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll('#inicio-contenido [data-ancho]').forEach(el => { el.style.width = el.dataset.ancho + '%'; });
  }));
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
