// ============================================================
//  rutinas.js — la rutina de cada día, la ficha de cada ejercicio,
//  la rutina libre (configurador) y las rutinas guardadas
// ============================================================

let rutinaActual = null;      // la rutina que se está mostrando
let rutinaActualId = null;    // su id si ya está guardada
let diaActual = null;         // 0–6 si es la rutina de un día de la semana; null si es rutina libre
let diaSugerido = null;       // lo ponen Inicio y Calendario al tocar un día
let objetivoSugerido = null;  // compatibilidad: el calendario puede sugerir un objetivo
let configuradorListo = false;
let objetivosRutina = [];
let rutinasGuardadas = [];

const PICTO_GRUPO = { piernas: 'p-piernas', empuje: 'p-empuje', tiron: 'p-tiron', core: 'p-core', cardio: 'p-cardio', movilidad: 'p-movilidad' };

function prepararRutinas() {
  document.getElementById('g-objetivo').addEventListener('click', e => {
    const boton = e.target.closest('[data-objetivo]');
    if (!boton) return;
    const objetivo = boton.dataset.objetivo;
    if (objetivosRutina.includes(objetivo)) {
      if (objetivosRutina.length === 1) return avisar('Elige al menos un objetivo', 'error');
      objetivosRutina = objetivosRutina.filter(o => o !== objetivo);
    } else {
      if (objetivosRutina.length === 4) return avisar('Puedes elegir hasta 4 objetivos', 'error');
      objetivosRutina.push(objetivo);
    }
    pintarObjetivosRutina();
  });
  seleccionUnica('g-nivel');
  seleccionUnica('g-lugar');
  const rango = document.getElementById('g-minutos');
  rango.addEventListener('input', () => { document.getElementById('g-minutos-valor').textContent = rango.value; });
  document.getElementById('btn-generar').addEventListener('click', generarRutina);

  // En celular, el panel de rutina libre empieza cerrado
  if (window.matchMedia('(max-width: 900px)').matches) document.getElementById('ajustes-rutina').open = false;

  // Selector de días de la semana
  document.getElementById('semana-selector').addEventListener('click', e => {
    const boton = e.target.closest('[data-dia]');
    if (boton) mostrarDia(Number(boton.dataset.dia));
  });

  // Clics dentro de la rutina
  document.getElementById('vista-rutina').addEventListener('click', e => {
    const fila = e.target.closest('[data-ficha]');
    if (fila) return abrirFicha(fila.dataset.ficha);
    const boton = e.target.closest('button');
    if (!boton) return;
    if (boton.id === 'btn-guardar-rutina') pedirNombreRutina();
    if (boton.id === 'btn-empezar') iniciarReproductor(rutinaActual, rutinaActualId);
    if (boton.id === 'btn-otra-version') otraVersionDelDia();
    if (boton.id === 'btn-rutina-libre') abrirRutinaLibre();
  });

  // Rutinas guardadas
  document.getElementById('lista-guardadas').addEventListener('click', async e => {
    const boton = e.target.closest('button');
    if (!boton) return;
    const id = Number(boton.dataset.id);
    if (boton.dataset.accion === 'abrir') {
      rutinaActual = rutinasGuardadas.find(r => r.id === id).contenido;
      rutinaActualId = id;
      diaActual = null;
      pintarSelectorSemana();
      pintarRutina();
      document.getElementById('vista-rutina').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (boton.dataset.accion === 'borrar' && confirm('¿Borrar esta rutina guardada?')) {
      await api('/rutinas/' + id, { method: 'DELETE' });
      if (rutinaActualId === id) { rutinaActualId = null; pintarRutina(); }
      cargarGuardadas();
    }
  });
}

async function cargarRutinas() {
  await cargarPlan();
  // Valores del perfil en el configurador de rutina libre (solo la primera vez)
  if (!configuradorListo) {
    const objetivosPerfil = perfil.objetivos_dias && typeof perfil.objetivos_dias === 'object'
      ? Object.keys(perfil.objetivos_dias).filter(o => ['grasa', 'musculo', 'resistencia', 'movilidad'].includes(o))
      : [];
    objetivosRutina = objetivosPerfil.length ? objetivosPerfil : [perfil.objetivo || 'grasa'];
    pintarObjetivosRutina();
    marcarOpcion('g-nivel', perfil.nivel);
    marcarOpcion('g-lugar', perfil.lugar || planSemana.preferencias.lugar || 'casa');
    document.getElementById('g-minutos').value = perfil.minutos;
    document.getElementById('g-minutos-valor').textContent = perfil.minutos;
    configuradorListo = true;
  }
  // Si llega desde Inicio o Calendario con un día elegido, se muestra ese día; si no, hoy
  if (diaSugerido !== null || diaActual !== null || !rutinaActual) {
    mostrarDia(diaSugerido !== null ? diaSugerido : (diaActual ?? indiceDia(hoyTexto())));
    diaSugerido = null;
  } else {
    pintarSelectorSemana();
  }
  cargarGuardadas();
}

function pintarObjetivosRutina() {
  document.querySelectorAll('#g-objetivo [data-objetivo]').forEach(boton => {
    const activo = objetivosRutina.includes(boton.dataset.objetivo);
    boton.classList.toggle('activo', activo);
    boton.setAttribute('aria-pressed', String(activo));
  });
}

// ---------- Semana ----------
function pintarSelectorSemana() {
  const hoy = indiceDia(hoyTexto());
  document.getElementById('semana-selector').innerHTML = planSemana.dias.map((d, i) => `
    <button type="button" role="tab" class="dia-selector ${i === diaActual ? 'activo' : ''} ${d.entrena ? '' : 'libre'} ${i === hoy ? 'es-hoy' : ''}"
            data-dia="${i}" aria-selected="${i === diaActual}">
      <span class="rotulo">${i === hoy ? 'Hoy' : DIAS_CORTOS[i]}</span>
      <strong>${d.entrena ? d.titulo : 'Descanso'}</strong>
      <small>${d.entrena ? d.minutos + ' min' : (d.tipo === 'activo' ? 'Activo' : 'Libre')}</small>
    </button>`).join('');
}

function mostrarDia(i) {
  diaActual = i;
  const dia = planSemana.dias[i];
  pintarSelectorSemana();
  if (dia.entrena) {
    rutinaActual = dia.rutina;
    rutinaActualId = null;
    pintarRutina();
  } else {
    rutinaActual = null;
    pintarDescanso(dia);
  }
}

function pintarDescanso(dia) {
  document.getElementById('vista-rutina').innerHTML = `
    <div class="rutina-banner descanso">
      <div class="banner-texto">
        <span class="rotulo">${DIAS_LARGOS[dia.dia]}</span>
        <h2>${dia.titulo}</h2>
        <p>${dia.tipo === 'activo' ? 'Camina 20 minutos a ritmo suave y estira caderas, espalda y piernas.' : 'Descansar también es entrenar: así se recupera el músculo.'}</p>
      </div>
      <div class="banner-figura">${picto(dia.picto)}</div>
    </div>
    <div class="acciones-rutina">
      <button class="btn btn-linea" id="btn-rutina-libre" type="button">${icono('ajustes')}Quiero entrenar igual</button>
    </div>`;
}

function abrirRutinaLibre() {
  const panel = document.getElementById('ajustes-rutina');
  panel.open = true;
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Cambia los ejercicios del día (la estructura de la semana no cambia)
async function otraVersionDelDia() {
  const boton = document.getElementById('btn-otra-version');
  boton.disabled = true;
  try {
    await regenerarPlan(diaActual);
    mostrarDia(diaActual);
    avisar(planSemana.guardado ? 'Nueva versión de este día' : 'Nueva versión (no se guardó: falta la migración de la base de datos)');
  } catch (err) {
    avisar(err.message, 'error');
    boton.disabled = false;
  }
}

// ---------- Rutina libre (configurador) ----------
async function generarRutina() {
  const boton = document.getElementById('btn-generar');
  boton.disabled = true;
  try {
    rutinaActual = await api('/rutinas/generar', {
      method: 'POST',
      body: {
        objetivos: objetivosRutina,
        nivel: valorSeleccionado('g-nivel'),
        lugar: valorSeleccionado('g-lugar'),
        minutos: document.getElementById('g-minutos').value
      }
    });
    rutinaActualId = null;
    diaActual = null;
    pintarSelectorSemana();
    pintarRutina();
    if (window.matchMedia('(max-width: 900px)').matches) {
      document.getElementById('ajustes-rutina').open = false;
      document.getElementById('vista-rutina').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (err) {
    avisar(err.message, 'error');
  } finally {
    boton.disabled = false;
  }
}

// ---------- Pintar la rutina ----------
function pintarRutina() {
  const r = rutinaActual;
  const principal = r.bloques.find(b => b.tipo === 'principal');
  const totalEjercicios = r.bloques.reduce((s, b) => s + b.ejercicios.length, 0);
  const titulo = r.nombre.split(' · ')[0];
  const esDelPlan = diaActual !== null;

  const bloques = r.bloques.map((b, nb) => {
    const esPrincipal = b.tipo === 'principal';
    const filas = b.ejercicios.map((ej, i) => `
      <button class="ej" type="button" data-ficha="${nb}-${i}">
        <span class="ej-mini" data-mini="${escapar(ej.nombre)}" data-grupo="${ej.grupo}"></span>
        <span class="ej-texto">
          <strong>${escapar(ej.nombre)}</strong>
          <small>${esPrincipal ? `${b.rondas} ${b.rondas === 1 ? 'ronda' : 'rondas'} · ` : ''}${ej.segundos} s · ${NOMBRES_GRUPO[ej.grupo] || ej.grupo}</small>
        </span>
        ${ej.equipo === 'gimnasio' ? '<span class="ej-etiqueta">Gym</span>' : ''}
        ${icono('chevron', 'chev')}
      </button>`).join('');
    return `
      <div class="bloque">
        <div class="bloque-titulo rotulo">${b.titulo}${esPrincipal ? ` <b>× ${b.rondas}</b>` : ''}</div>
        ${filas}
      </div>`;
  }).join('');

  const lugar = NOMBRES_LUGAR[r.lugar || 'casa'];
  document.getElementById('vista-rutina').innerHTML = `
    <div class="rutina-banner">
      <div class="banner-texto">
        <span class="rotulo">${esDelPlan ? DIAS_LARGOS[diaActual] : (rutinaActualId ? 'Rutina guardada' : 'Rutina libre')}</span>
        <h2>${escapar(titulo)}</h2>
        <p>${icono('reloj', 'ic-sm')}${minutosActividad(r)} min de actividad${minutosSuaves(r) ? ` + ${minutosSuaves(r)} de calentamiento y enfriamiento` : ''} · ${lugar} · ${NOMBRES_NIVEL[r.nivel]}</p>
        ${kcalRutina(r) ? `<p class="banner-kcal">${icono('fuego', 'ic-sm')}≈ ${numero(kcalRutina(r))} kcal · ${numero(kcalRutina(r) / 7.7)} g de grasa</p>` : ''}
      </div>
      <div class="banner-figura" id="banner-figura"></div>
    </div>
    <div class="chips-info">
      <span>${(r.objetivos || [r.objetivo]).map(o => NOMBRES_CORTOS[o]).join(' · ')}</span>
      <span>${r.trabajo} s trabajo</span>
      <span>${r.descanso} s descanso</span>
      <span>${r.rondas} rondas</span>
      ${rutinaActualId ? `<span class="chip-guardada">${icono('guardar', 'ic-sm')}Guardada</span>` : ''}
    </div>
    <div class="caja-cabeza">
      <h2 class="subtitulo">Ejercicios (${totalEjercicios})</h2>
      ${esDelPlan ? `<button class="btn btn-texto btn-sm" id="btn-otra-version" type="button">${icono('cambiar', 'ic-sm')}Otra versión de este día</button>` : ''}
    </div>
    <p class="tenue ayuda-ficha">Toca un ejercicio para ver cómo se hace.</p>
    ${bloques}
    <div class="acciones-rutina">
      ${rutinaActualId ? '' : `<button class="btn btn-linea btn-icono" id="btn-guardar-rutina" type="button" aria-label="Guardar rutina">${icono('guardar')}</button>`}
      <button class="btn btn-lima" id="btn-empezar" type="button">${icono('play')}Empezar entrenamiento</button>
    </div>`;

  // Figura grande del primer ejercicio y miniaturas quietas de cada fila
  montarAnimacion(document.getElementById('banner-figura'), principal.ejercicios[0].nombre, principal.ejercicios[0].grupo);
  document.querySelectorAll('#vista-rutina [data-mini]').forEach(el => dibujarPose(el, el.dataset.mini, el.dataset.grupo));
}

// ---------- Ficha de un ejercicio (con animación) ----------
function abrirFicha(clave) {
  const [nb, i] = clave.split('-').map(Number);
  const bloque = rutinaActual.bloques[nb];
  const ej = bloque.ejercicios[i];
  const esPrincipal = bloque.tipo === 'principal';
  const descanso = esPrincipal ? `${rutinaActual.descanso} s` : 'Sin descanso';
  const duracion = esPrincipal ? `${ej.segundos} s × ${bloque.rondas} ${bloque.rondas === 1 ? 'ronda' : 'rondas'}` : `${ej.segundos} s`;

  abrirModal(`
    <article class="ficha">
      <div class="ficha-figura" id="ficha-figura"></div>
      <span class="rotulo">${bloque.titulo} · ${NOMBRES_GRUPO[ej.grupo] || ej.grupo}</span>
      <h2>${escapar(ej.nombre)}</h2>
      ${ej.musculos ? `<p class="ficha-musculos">${escapar(ej.musculos)}</p>` : ''}
      <dl class="ficha-datos">
        <div><dt>Duración</dt><dd>${duracion}</dd></div>
        <div><dt>Descanso</dt><dd>${descanso}</dd></div>
        <div><dt>Nivel</dt><dd>${NOMBRES_NIVEL[ej.nivel] || 'Principiante'}</dd></div>
        <div><dt>Equipo</dt><dd>${escapar(equipoDe(ej))}</dd></div>
      </dl>
      <h3>Cómo se hace</h3>
      <p class="ficha-instrucciones">${escapar(ej.descripcion)}</p>
      <div class="fila-botones">
        ${esPrincipal ? `<button type="button" class="btn btn-linea" id="ficha-cambiar">${icono('cambiar', 'ic-sm')}Cambiar ejercicio</button>` : ''}
        <button type="button" class="btn btn-tinta" data-cerrar-modal>Listo</button>
      </div>
    </article>`);
  montarAnimacion(document.getElementById('ficha-figura'), ej.nombre, ej.grupo);
  const cambiar = document.getElementById('ficha-cambiar');
  if (cambiar) cambiar.addEventListener('click', async () => { cerrarModal(); await cambiarEjercicio(i); });
}

// Cambia un ejercicio del circuito por otro del mismo grupo
async function cambiarEjercicio(indice) {
  const principal = rutinaActual.bloques.find(b => b.tipo === 'principal');
  const actual = principal.ejercicios[indice];
  const usados = principal.ejercicios.map(e => e.id).join(',');
  try {
    const objetivos = rutinaActual.objetivos || [rutinaActual.objetivo];
    const nuevo = await api(`/rutinas/alternativa?grupo=${actual.grupo}&objetivos=${objetivos.join(',')}&nivel=${rutinaActual.nivel}&lugar=${rutinaActual.lugar || 'casa'}&excluir=${usados}`);
    principal.ejercicios[indice] = {
      id: nuevo.id, nombre: nuevo.nombre, grupo: nuevo.grupo, nivel: nuevo.nivel, descripcion: nuevo.descripcion,
      equipo: nuevo.equipo || 'ninguno', musculos: nuevo.musculos || '', segundos: actual.segundos
    };
    rutinaActualId = null;
    pintarRutina();
    avisar(`Cambiado por: ${nuevo.nombre}`);
  } catch (err) {
    avisar('No hay más opciones para ese ejercicio', 'error');
  }
}

// ---------- Guardar rutinas ----------
function pedirNombreRutina() {
  abrirModal(`
    <form class="form-modal" id="form-nombre-rutina">
      <span class="rotulo">Guardar rutina</span>
      <h2>Ponle un nombre</h2>
      <div class="campo"><label for="nombre-rutina">Nombre</label><input id="nombre-rutina" type="text" maxlength="60" value="${escapar(rutinaActual.nombre)}"></div>
      <div class="fila-botones">
        <button type="button" class="btn btn-linea" data-cerrar-modal>Cancelar</button>
        <button type="submit" class="btn btn-tinta">Guardar</button>
      </div>
    </form>`);
  document.getElementById('form-nombre-rutina').addEventListener('submit', async e => {
    e.preventDefault();
    const nombre = document.getElementById('nombre-rutina').value.trim() || rutinaActual.nombre;
    // Se guarda una copia: si luego cambias tu semana, la rutina guardada no cambia
    const copia = JSON.parse(JSON.stringify(rutinaActual));
    const { id } = await api('/rutinas', { method: 'POST', body: { ...copia, nombre_personal: nombre } });
    copia.nombre = nombre;
    rutinaActual = copia;
    rutinaActualId = id;
    diaActual = null;
    cerrarModal();
    avisar('Rutina guardada');
    pintarSelectorSemana();
    pintarRutina();
    cargarGuardadas();
  });
}

async function cargarGuardadas() {
  rutinasGuardadas = await api('/rutinas');
  const lista = document.getElementById('lista-guardadas');
  if (rutinasGuardadas.length === 0) {
    lista.innerHTML = `<p class="tenue">Guarda las rutinas que más te gusten para repetirlas.</p>`;
    return;
  }
  lista.innerHTML = rutinasGuardadas.map(r => `
    <div class="caja guardada">
      <span class="rotulo">${(r.contenido.objetivos || [r.objetivo]).map(o => NOMBRES_CORTOS[o] || o).join(' · ')} · ${r.minutos} min</span>
      <h3>${escapar(r.nombre)}</h3>
      <div class="fila">
        <button class="btn btn-linea btn-sm" data-accion="abrir" data-id="${r.id}">Abrir</button>
        <button class="btn btn-sm btn-icono btn-peligro" data-accion="borrar" data-id="${r.id}" aria-label="Borrar rutina">${icono('basura', 'ic-sm')}</button>
      </div>
    </div>`).join('');
}
