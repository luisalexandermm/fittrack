// ============================================================
//  reproductor.js — entrenador en pantalla completa con temporizador
// ============================================================
//  La rutina se convierte en una lista plana de "pasos":
//  [preparación, ejercicio, descanso, ejercicio, ... enfriamiento]
//  y un intervalo de 1 segundo va descontando el tiempo de cada paso.

const CIRCUNFERENCIA = 2 * Math.PI * 88; // radio del anillo en el SVG
const $ = id => document.getElementById(id);

const rep = {
  pasos: [], indice: 0, restante: 0, pausado: false, intervalo: null,
  segundosHechos: 0, sonido: true, rutina: null, rutinaId: null, bloqueoPantalla: null
};

// ---------- Construir la lista de pasos ----------
function construirPasos(rutina) {
  const pasos = [{ tipo: 'preparacion', fase: 'Prepárate', nombre: 'Prepárate', descripcion: 'Busca espacio, agua a la mano y respira.', segundos: 5 }];

  for (const bloque of rutina.bloques) {
    for (let ronda = 1; ronda <= bloque.rondas; ronda++) {
      bloque.ejercicios.forEach((ej, i) => {
        pasos.push({ tipo: 'trabajo', fase: bloque.titulo, ronda: bloque.rondas > 1 ? `Ronda ${ronda} de ${bloque.rondas}` : '', ...ej });

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
  rep.segundosHechos = 0;
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
  if (rep.restante > 0 && rep.restante <= 3) pitar(660);
  if (rep.restante <= 0) return irAPasoRep(rep.indice + 1);
  pintarTiempo();
}

function pintarPaso() {
  const paso = rep.pasos[rep.indice];
  const esDescanso = paso.tipo === 'descanso';
  $('reproductor').classList.toggle('descanso', esDescanso);

  // En el descanso mostramos qué viene, para que te prepares
  const siguiente = rep.pasos.slice(rep.indice + 1).find(p => p.tipo === 'trabajo');
  const pictoId = esDescanso ? 'p-descanso' : (PICTO_GRUPO[paso.grupo] || 'p-movilidad');

  $('rep-fase').textContent = paso.fase;
  $('rep-ronda').textContent = paso.ronda || '';
  $('rep-picto').innerHTML = picto(pictoId);
  $('rep-grupo').textContent = paso.grupo ? NOMBRES_GRUPO[paso.grupo] : '';
  $('rep-nombre').textContent = paso.nombre;
  $('rep-desc').textContent = esDescanso && siguiente ? `Sigue: ${siguiente.nombre}. ${siguiente.descripcion}` : paso.descripcion;
  $('rep-sigue').textContent = siguiente ? siguiente.nombre : 'Última';
  $('rep-estado').textContent = esDescanso ? 'descanso' : 'segundos';
  $('rep-barra').style.width = (rep.indice / rep.pasos.length) * 100 + '%';

  // Reiniciar el anillo sin animación y luego animar
  const trazo = $('rep-trazo');
  trazo.style.transition = 'none';
  trazo.style.strokeDasharray = CIRCUNFERENCIA;
  trazo.style.strokeDashoffset = 0;
  trazo.getBoundingClientRect(); // obliga al navegador a aplicar el cambio
  trazo.style.transition = '';
  pintarTiempo();
}

function pintarTiempo() {
  const paso = rep.pasos[rep.indice];
  $('rep-cuenta').textContent = rep.restante;
  const avance = 1 - (rep.restante - 1) / paso.segundos;
  $('rep-trazo').style.strokeDashoffset = CIRCUNFERENCIA * Math.min(avance, 1);
}

function actualizarBotonPausa() {
  $('rep-pausa').querySelector('use').setAttribute('href', `/img/iconos.svg#i-${rep.pausado ? 'play' : 'pausa'}`);
  $('rep-pausa').setAttribute('aria-label', rep.pausado ? 'Continuar' : 'Pausa');
}

function alternarPausa() {
  rep.pausado = !rep.pausado;
  actualizarBotonPausa();
  $('rep-estado').textContent = rep.pausado ? 'en pausa' : (rep.pasos[rep.indice].tipo === 'descanso' ? 'descanso' : 'segundos');
}

function terminarRutina() {
  clearInterval(rep.intervalo);
  pitar(990, 0.5);
  $('reproductor').classList.remove('descanso');
  $('rep-centro').hidden = true;
  $('rep-controles').hidden = true;
  $('rep-final').hidden = false;
  $('rep-barra').style.width = '100%';
  $('rep-fase').textContent = 'Final';
  $('rep-ronda').textContent = '';
  const minutos = Math.max(1, Math.round(rep.segundosHechos / 60));
  $('rep-final-texto').textContent = `${minutos} ${minutos === 1 ? 'minuto' : 'minutos'} de ${NOMBRES_CORTOS[rep.rutina.objetivo].toLowerCase()}. Cada sesión suma.`;
}

async function guardarSesion() {
  try {
    await api('/sesiones', {
      method: 'POST',
      body: {
        rutina_id: rep.rutinaId,
        nombre: rep.rutina.nombre,
        objetivo: rep.rutina.objetivo,
        minutos: Math.max(1, Math.round(rep.segundosHechos / 60)),
        sensacion: valorSeleccionado('rep-sensacion'),
        notas: $('rep-notas').value,
        fecha: hoyTexto()
      }
    });
    $('rep-notas').value = '';
    cerrarReproductor();
    avisar('Sesión guardada');
    if (location.hash === '#inicio') cargarInicio();
    else location.hash = '#inicio';
  } catch (err) {
    avisar(err.message, 'error');
  }
}

// ---------- Botones ----------
$('rep-pausa').addEventListener('click', alternarPausa);
$('rep-siguiente-btn').addEventListener('click', () => irAPasoRep(rep.indice + 1));
$('rep-anterior').addEventListener('click', () => irAPasoRep(rep.indice - 1));
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
