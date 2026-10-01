// ============================================================
//  reproductor.js — entrenador en pantalla completa con temporizador
// ============================================================
//  La rutina se convierte en una lista plana de "pasos":
//  [preparación, ejercicio, descanso, ejercicio, ... enfriamiento]
//  y un intervalo de 1 segundo va descontando el tiempo de cada paso.
//  Cada ejercicio se muestra con su figura animada (js/animaciones.js).

const $ = id => document.getElementById(id);

const rep = {
  pasos: [], indice: 0, restante: 0, pausado: false, intervalo: null,
  segundosHechos: 0, sonido: true, rutina: null, rutinaId: null, bloqueoPantalla: null,
  figura: null, totalEjercicios: 0,
  segundosPorTipo: {}   // { calentamiento, descanso, enfriamiento, piernas, cardio… } para las calorías
};

// ---------- Construir la lista de pasos ----------
function construirPasos(rutina) {
  const pasos = [{ tipo: 'preparacion', fase: 'Prepárate', nombre: 'Prepárate', descripcion: 'Busca espacio, agua a la mano y respira.', segundos: 5 }];

  for (const bloque of rutina.bloques) {
    for (let ronda = 1; ronda <= bloque.rondas; ronda++) {
      bloque.ejercicios.forEach((ej, i) => {
        pasos.push({ tipo: 'trabajo', fase: bloque.titulo, ronda: bloque.rondas > 1 ? `Ronda ${ronda} de ${bloque.rondas}` : '', ...ej, tipo: 'trabajo', bloque: bloque.tipo });

        // Descansos solo en el circuito principal
        if (bloque.tipo !== 'principal') return;
        const ultimoDeRonda = i === bloque.ejercicios.length - 1;
        if (ultimoDeRonda && ronda === bloque.rondas) return;
        pasos.push({
          tipo: 'descanso',
          fase: ultimoDeRonda ? 'Descanso entre rondas' : 'Descanso',
          ronda: `Ronda ${ronda} de ${bloque.rondas}`,
          nombre: 'Descansa',
          descripcion: 'Respira profundo por la nariz y suelta por la boca.',
          segundos: ultimoDeRonda ? rutina.descanso_ronda : rutina.descanso
        });
      });
    }
  }
  // Número de cada ejercicio ("Ejercicio 3 de 18")
  let n = 0;
  pasos.forEach(p => { if (p.tipo === 'trabajo') p.numero = ++n; });
  return pasos;
}

// ---------- Sonido (pitidos con Web Audio, sin archivos) ----------
let audio = null;
function pitar(frecuencia = 660, duracion = 0.12) {
  if (!rep.sonido) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audio.createOscillator();
    const volumen = audio.createGain();
    osc.frequency.value = frecuencia;
    volumen.gain.setValueAtTime(0.25, audio.currentTime);
    volumen.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duracion);
    osc.connect(volumen).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + duracion);
  } catch (e) { /* sin sonido, no pasa nada */ }
}

// ---------- Abrir / cerrar ----------
async function iniciarReproductor(rutina, rutinaId) {
  rep.rutina = rutina;
  rep.rutinaId = rutinaId;
  rep.pasos = construirPasos(rutina);
  rep.totalEjercicios = rep.pasos.filter(p => p.tipo === 'trabajo').length;
  rep.segundosHechos = 0;
  rep.segundosPorTipo = {};
  rep.pausado = false;
  actualizarBotonPausa();

  $('reproductor').hidden = false;
  $('rep-final').hidden = true;
  $('rep-centro').hidden = false;
  $('rep-controles').hidden = false;
  document.body.style.overflow = 'hidden';

  // Evita que la pantalla del celular se apague mientras entrenas
  try { rep.bloqueoPantalla = await navigator.wakeLock?.request('screen'); } catch (e) {}

  irAPasoRep(0);
  clearInterval(rep.intervalo);
  rep.intervalo = setInterval(tic, 1000);
}

function cerrarReproductor() {
  clearInterval(rep.intervalo);
  if (rep.figura) rep.figura.pausar(true);
  $('rep-figura').dataset.nombre = '';
  rep.bloqueoPantalla?.release?.();
  $('reproductor').hidden = true;
  $('reproductor').classList.remove('descanso');
  document.body.style.overflow = '';
}

// ---------- Temporizador ----------
function irAPasoRep(indice) {
  if (indice >= rep.pasos.length) return terminarRutina();
  rep.indice = Math.max(0, indice);
  rep.restante = rep.pasos[rep.indice].segundos;
  pintarPaso();
  pitar(rep.pasos[rep.indice].tipo === 'descanso' ? 440 : 880, 0.25);
}

function tic() {
  if (rep.pausado) return;
  rep.restante--;
  rep.segundosHechos++;
  contarSegundo(rep.pasos[rep.indice]);
  if (rep.restante > 0 && rep.restante <= 3) pitar(660);
  if (rep.restante <= 0) return irAPasoRep(rep.indice + 1);
  pintarTiempo();
}

// Suma un segundo al tipo de esfuerzo que se está haciendo (lo usa el servidor para las calorías)
function contarSegundo(paso) {
  let tipo = null;
  if (paso.tipo === 'descanso') tipo = 'descanso';
  if (paso.tipo === 'trabajo') tipo = paso.bloque === 'principal' ? paso.grupo : paso.bloque;
  if (tipo) rep.segundosPorTipo[tipo] = (rep.segundosPorTipo[tipo] || 0) + 1;
}

// Calorías aproximadas de lo hecho hasta ahora (la cifra final la calcula el servidor)
function kcalHastaAhora() {
  const total = kcalRutina(rep.rutina);
  if (!total) return null;
  return Math.round(total * Math.min(rep.segundosHechos / rep.rutina.duracion_seg, 1));
}

function pintarPaso() {
  const paso = rep.pasos[rep.indice];
  const esDescanso = paso.tipo === 'descanso';
  const esPreparacion = paso.tipo === 'preparacion';
  const reproductor = $('reproductor');
  reproductor.classList.toggle('descanso', esDescanso || esPreparacion);

  // En el descanso (y al prepararse) se ve la figura de lo que viene
  const siguiente = rep.pasos.slice(rep.indice + 1).find(p => p.tipo === 'trabajo');
  const mostrar = esDescanso || esPreparacion ? siguiente : paso;

  $('rep-fase').textContent = paso.fase;
  $('rep-ronda').textContent = paso.ronda || '';
  $('rep-contador').textContent = paso.numero ? `Ejercicio ${paso.numero} de ${rep.totalEjercicios}` : (siguiente ? `Sigue el ${siguiente.numero} de ${rep.totalEjercicios}` : '');
  $('rep-grupo').textContent = esDescanso || esPreparacion ? (esDescanso ? 'Descansa · sigue' : 'Empieza con') : (NOMBRES_GRUPO[paso.grupo] || '');
  $('rep-nombre').textContent = esDescanso || esPreparacion ? (mostrar ? mostrar.nombre : paso.nombre) : paso.nombre;
  $('rep-musculos').textContent = mostrar && mostrar.musculos ? mostrar.musculos : '';
  $('rep-desc').textContent = mostrar ? mostrar.descripcion : paso.descripcion;
  const despues = esDescanso || esPreparacion ? rep.pasos.slice(rep.indice + 1).filter(p => p.tipo === 'trabajo')[1] : siguiente;
  $('rep-sigue').textContent = despues ? despues.nombre : 'Última';
  $('rep-estado').textContent = esDescanso ? 'descanso' : (esPreparacion ? 'prepárate' : 'trabajo');
  $('rep-barra').style.width = (rep.indice / rep.pasos.length) * 100 + '%';

  // Figura animada (se cambia solo si el ejercicio es otro)
  const figura = $('rep-figura');
  if (mostrar && figura.dataset.nombre !== mostrar.nombre) {
    figura.dataset.nombre = mostrar.nombre;
    figura.classList.remove('entra'); figura.getBoundingClientRect(); figura.classList.add('entra');
    rep.figura = montarAnimacion(figura, mostrar.nombre, mostrar.grupo);
  }
  if (rep.figura) rep.figura.pausar(rep.pausado || esDescanso);

  // Reiniciar la barra del tiempo sin animación y luego animar
  const trazo = $('rep-trazo');
  trazo.style.transition = 'none';
  trazo.style.width = '0%';
  trazo.getBoundingClientRect(); // obliga al navegador a aplicar el cambio
  trazo.style.transition = '';
  pintarTiempo();
}

function pintarTiempo() {
  const paso = rep.pasos[rep.indice];
  $('rep-cuenta').textContent = mmss(Math.max(rep.restante, 0));
  const avance = 1 - (rep.restante - 1) / paso.segundos;
  $('rep-trazo').style.width = Math.min(avance, 1) * 100 + '%';
}

function actualizarBotonPausa() {
  $('rep-pausa').querySelector('use').setAttribute('href', `/img/iconos.svg#i-${rep.pausado ? 'play' : 'pausa'}`);
  $('rep-pausa').setAttribute('aria-label', rep.pausado ? 'Continuar' : 'Pausa');
}

function alternarPausa() {
  rep.pausado = !rep.pausado;
  actualizarBotonPausa();
  const tipo = rep.pasos[rep.indice].tipo;
  $('reproductor').classList.toggle('pausado', rep.pausado);
  $('rep-estado').textContent = rep.pausado ? 'en pausa' : ({ descanso: 'descanso', preparacion: 'prepárate' }[tipo] || 'trabajo');
  if (rep.figura) rep.figura.pausar(rep.pausado || tipo === 'descanso');
}

function terminarRutina() {
  clearInterval(rep.intervalo);
  if (rep.figura) rep.figura.pausar(true);
  pitar(990, 0.5);
  $('reproductor').classList.remove('descanso');
  $('rep-centro').hidden = true;
  $('rep-controles').hidden = true;
  $('rep-final').hidden = false;
  $('rep-barra').style.width = '100%';
  $('rep-fase').textContent = 'Final';
  $('rep-ronda').textContent = '';
  const minutos = Math.max(1, Math.round(rep.segundosHechos / 60));
  const hechos = rep.pasos.slice(0, rep.indice + 1).filter(p => p.tipo === 'trabajo').length;
  const completa = rep.indice >= rep.pasos.length - 1;
  $('rep-final-texto').textContent = completa
    ? `${minutos} ${minutos === 1 ? 'minuto' : 'minutos'} de ${NOMBRES_CORTOS[rep.rutina.objetivo].toLowerCase()}. Cada sesión suma.`
    : `Terminaste antes: ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'} y ${hechos} de ${rep.totalEjercicios} ejercicios. También cuenta.`;
  const kcal = kcalHastaAhora();
  $('rep-final-kcal').innerHTML = kcal ? `${icono('fuego', 'ic-sm')}≈ <b>${numero(kcal)} kcal</b> · ${numero(kcal / 7.7)} g de grasa` : '';
}

async function guardarSesion() {
  try {
    const respuesta = await api('/sesiones', {
      method: 'POST',
      body: {
        rutina_id: rep.rutinaId,
        nombre: rep.rutina.nombre,
        objetivo: rep.rutina.objetivo,
        minutos: Math.max(1, Math.round(rep.segundosHechos / 60)),
        sensacion: valorSeleccionado('rep-sensacion'),
        notas: $('rep-notas').value,
        fecha: hoyTexto(),
        segundos: rep.segundosPorTipo
      }
    });
    $('rep-notas').value = '';
    cerrarReproductor();
    avisar(respuesta.kcal ? `Sesión guardada · ≈ ${numero(respuesta.kcal)} kcal` : 'Sesión guardada');
    // El calendario y la semana se actualizan con la sesión nueva
    if (location.hash === '#inicio' || location.hash === '') cargarInicio();
    else location.hash = '#inicio';
  } catch (err) {
    avisar(err.message, 'error');
  }
}

// ---------- Botones ----------
$('rep-pausa').addEventListener('click', alternarPausa);
$('rep-siguiente-btn').addEventListener('click', () => irAPasoRep(rep.indice + 1));
$('rep-anterior').addEventListener('click', () => irAPasoRep(rep.indice - 1));
$('rep-terminar').addEventListener('click', () => {
  if (rep.segundosHechos < 30) {
    if (confirm('¿Salir del entrenamiento? Aún no llevas ni un minuto, así que no se guardará.')) cerrarReproductor();
    return;
  }
  if (confirm('¿Terminar ahora? Se guarda lo que llevas.')) terminarRutina();
});
$('rep-guardar').addEventListener('click', guardarSesion);
$('rep-descartar').addEventListener('click', cerrarReproductor);
$('rep-sonido').addEventListener('click', () => {
  rep.sonido = !rep.sonido;
  $('rep-sonido').querySelector('use').setAttribute('href', `/img/iconos.svg#i-${rep.sonido ? 'sonido' : 'silencio'}`);
});
$('rep-cerrar').addEventListener('click', () => {
  const terminado = !$('rep-final').hidden;
  if (terminado || confirm('¿Salir del entrenamiento? Esta sesión no se guardará.')) cerrarReproductor();
});
$('rep-sensacion').addEventListener('click', e => {
  const opcion = e.target.closest('[data-valor]');
  if (opcion) marcarOpcion('rep-sensacion', opcion.dataset.valor);
});

// Teclado: espacio = pausa, flechas = anterior/siguiente
document.addEventListener('keydown', e => {
  if ($('reproductor').hidden || !$('rep-final').hidden) return;
  if (e.code === 'Space') { e.preventDefault(); alternarPausa(); }
  if (e.code === 'ArrowRight') irAPasoRep(rep.indice + 1);
  if (e.code === 'ArrowLeft') irAPasoRep(rep.indice - 1);
});
