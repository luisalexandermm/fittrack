// ============================================================
//  rutinas.js — generar, ver, ajustar y guardar rutinas
// ============================================================

let rutinaActual = null;      // la rutina que se está mostrando
let rutinaActualId = null;    // su id si ya está guardada
let configuradorListo = false;
let objetivoSugerido = null;  // lo pone Inicio cuando el calendario sugiere otro objetivo
let rutinasGuardadas = [];

const PICTO_GRUPO = { piernas: 'p-piernas', empuje: 'p-empuje', tiron: 'p-tiron', core: 'p-core', cardio: 'p-cardio', movilidad: 'p-movilidad' };

function prepararRutinas() {
  seleccionUnica('g-objetivo');
  seleccionUnica('g-nivel');
  const rango = document.getElementById('g-minutos');
  rango.addEventListener('input', () => { document.getElementById('g-minutos-valor').textContent = rango.value; });
  document.getElementById('btn-generar').addEventListener('click', generarRutina);

  // En celular, el panel de ajustes empieza cerrado para ver la rutina primero
  if (window.matchMedia('(max-width: 900px)').matches) document.getElementById('ajustes-rutina').open = false;

  // Clics dentro de la rutina
  document.getElementById('vista-rutina').addEventListener('click', e => {
    const fila = e.target.closest('.ej-boton');
    if (fila) return fila.parentElement.classList.toggle('abierto');
    const boton = e.target.closest('button');
    if (!boton) return;
    if (boton.dataset.cambiar !== undefined) cambiarEjercicio(Number(boton.dataset.cambiar));
    if (boton.id === 'btn-guardar-rutina') pedirNombreRutina();
    if (boton.id === 'btn-empezar') iniciarReproductor(rutinaActual, rutinaActualId);
  });

  // Rutinas guardadas
  document.getElementById('lista-guardadas').addEventListener('click', async e => {
    const boton = e.target.closest('button');
    if (!boton) return;
    const id = Number(boton.dataset.id);
    if (boton.dataset.accion === 'abrir') {
      rutinaActual = rutinasGuardadas.find(r => r.id === id).contenido;
      rutinaActualId = id;
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
  // La primera vez (o si Inicio sugiere otro objetivo) se usan los datos del perfil
  if (!configuradorListo || objetivoSugerido) {
    marcarOpcion('g-objetivo', objetivoSugerido || perfil.objetivo);
    marcarOpcion('g-nivel', perfil.nivel);
    const minutos = objetivoSugerido === 'movilidad' && objetivoSugerido !== perfil.objetivo ? 20 : perfil.minutos;
    document.getElementById('g-minutos').value = minutos;
    document.getElementById('g-minutos-valor').textContent = minutos;
    configuradorListo = true;
    objetivoSugerido = null;
    await generarRutina();
  }
  cargarGuardadas();
}

async function generarRutina() {
  const boton = document.getElementById('btn-generar');
  boton.disabled = true;
  try {
    rutinaActual = await api('/rutinas/generar', {
      method: 'POST',
      body: { objetivo: valorSeleccionado('g-objetivo'), nivel: valorSeleccionado('g-nivel'), minutos: document.getElementById('g-minutos').value }
    });
    rutinaActualId = null;
    pintarRutina();
    if (window.matchMedia('(max-width: 900px)').matches) document.getElementById('ajustes-rutina').open = false;
  } catch (err) {
    avisar(err.message, 'error');
  } finally {
    boton.disabled = false;
  }
}

function pintarRutina() {
  const r = rutinaActual;
  const principal = r.bloques.find(b => b.tipo === 'principal');
  const totalEjercicios = r.bloques.reduce((s, b) => s + b.ejercicios.length, 0);
  const titulo = r.nombre.split(' · ')[0];

  // Tres pictogramas de fondo con los grupos del circuito
  const grupos = [...new Set(principal.ejercicios.map(e => e.grupo))].slice(0, 3);
  const pictosFondo = grupos.map(g => `<svg aria-hidden="true"><use href="/img/iconos.svg#${PICTO_GRUPO[g]}"/></svg>`).join('');

  let n = 0;
  const bloques = r.bloques.map(b => {
    const esPrincipal = b.tipo === 'principal';
    const filas = b.ejercicios.map((ej, i) => {
      n++;
      const detalle = esPrincipal ? `${b.rondas} ${b.rondas === 1 ? 'ronda' : 'rondas'} · ${ej.segundos} s` : `${ej.segundos} s`;
      return `
        <div class="ej">
          <button class="ej-boton" type="button">
            <span class="tile">${picto(PICTO_GRUPO[ej.grupo] || 'p-movilidad')}</span>
            <div><strong>${n}. ${escapar(ej.nombre)}</strong><small>${detalle} · ${NOMBRES_GRUPO[ej.grupo] || ej.grupo}</small></div>
            ${icono('chevron', 'chev')}
          </button>
          <div class="ej-detalle">
            <p>${escapar(ej.descripcion)}</p>
            ${esPrincipal ? `<button class="btn btn-linea btn-sm" data-cambiar="${i}" type="button">${icono('cambiar', 'ic-sm')}Cambiar ejercicio</button>` : ''}
          </div>
        </div>`;
    }).join('');
    return `
      <div class="bloque">
        <div class="bloque-titulo rotulo">${b.titulo}${esPrincipal ? ` <b>× ${b.rondas}</b>` : ''}</div>
        ${filas}
      </div>`;
  }).join('');

  document.getElementById('vista-rutina').innerHTML = `
    <div class="rutina-banner">
      <div class="pictos-fondo">${pictosFondo}</div>
      <span class="badge">${icono('reloj', 'ic-sm')}≈ ${Math.round(r.duracion_seg / 60)} min</span>
      ${rutinaActualId ? `<span class="badge badge-izq">${icono('guardar', 'ic-sm')}Guardada</span>` : ''}
      <h2>${escapar(titulo)}</h2>
      <p>Sin equipo · Nivel: ${NOMBRES_NIVEL[r.nivel]}</p>
    </div>
    <div class="chips-info">
      <span>${NOMBRES_CORTOS[r.objetivo]}</span>
      <span>${r.trabajo} s trabajo</span>
      <span>${r.descanso} s descanso</span>
      <span>${r.rondas} rondas</span>
    </div>
    <h2 class="subtitulo">Ejercicios (${totalEjercicios})</h2>
    ${bloques}
    <div class="acciones-rutina">
      ${rutinaActualId ? '' : `<button class="btn btn-linea" id="btn-guardar-rutina" type="button">${icono('guardar')}<span class="solo-lector">Guardar rutina</span></button>`}
      <button class="btn btn-lima" id="btn-empezar" type="button">${icono('play')}Iniciar rutina</button>
    </div>`;
}

// Cambia un ejercicio del circuito por otro del mismo grupo
async function cambiarEjercicio(indice) {
  const principal = rutinaActual.bloques.find(b => b.tipo === 'principal');
  const actual = principal.ejercicios[indice];
  const usados = principal.ejercicios.map(e => e.id).join(',');
  try {
    const nuevo = await api(`/rutinas/alternativa?grupo=${actual.grupo}&objetivo=${rutinaActual.objetivo}&nivel=${rutinaActual.nivel}&excluir=${usados}`);
    principal.ejercicios[indice] = { id: nuevo.id, nombre: nuevo.nombre, grupo: nuevo.grupo, descripcion: nuevo.descripcion, segundos: actual.segundos };
    rutinaActualId = null;
    pintarRutina();
    avisar(`Cambiado por: ${nuevo.nombre}`);
  } catch (err) {
    avisar('No hay más opciones para ese ejercicio', 'error');
  }
}

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
    const { id } = await api('/rutinas', { method: 'POST', body: { ...rutinaActual, nombre_personal: nombre } });
    rutinaActual.nombre = nombre;
    rutinaActualId = id;
    cerrarModal();
    avisar('Rutina guardada');
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
      <span class="rotulo">${NOMBRES_CORTOS[r.objetivo]} · ${r.minutos} min</span>
      <h3>${escapar(r.nombre)}</h3>
      <div class="fila">
        <button class="btn btn-linea btn-sm" data-accion="abrir" data-id="${r.id}">Abrir</button>
        <button class="btn btn-sm btn-icono btn-peligro" data-accion="borrar" data-id="${r.id}" aria-label="Borrar rutina">${icono('basura', 'ic-sm')}</button>
      </div>
    </div>`).join('');
}
