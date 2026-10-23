// ============================================================
//  asistente.js — chat con Zurick, el asistente de FitTrack
//  La conversación vive solo en esta pestaña (no se guarda en ningún lado).
//  El servidor decide si responde la IA o el respaldo (rutas/asistente.js).
// ============================================================

(function () {
  const panel = document.getElementById('asistente');
  const abrirBoton = document.getElementById('btn-asistente');
  const lista = document.getElementById('asistente-mensajes');
  const form = document.getElementById('asistente-form');
  const campo = document.getElementById('asistente-texto');
  const sugerencias = document.getElementById('asistente-sugerencias');
  const historial = []; // [{ rol: 'usuario' | 'asistente', texto }]
  let esperando = false;

  function abrir() {
    panel.hidden = false;
    abrirBoton.setAttribute('aria-expanded', 'true');
    if (!lista.children.length) {
      agregar('asistente', '¡Hola! Soy Zurick, tu asistente de FitTrack. Pregúntame por tu plan de la semana, alternativas de ejercicios o cómo usar la app.', null);
    }
    campo.focus();
  }
  function cerrar() {
    panel.hidden = true;
    abrirBoton.setAttribute('aria-expanded', 'false');
    abrirBoton.focus();
  }

  // Agrega un mensaje. nota: texto pequeño debajo (ej. "respuesta automática")
  function agregar(rol, texto, nota) {
    const burbuja = document.createElement('div');
    burbuja.className = `burbuja de-${rol}`; // "de-" evita chocar con la clase .asistente del panel
    burbuja.innerHTML = `<p>${escapar(texto)}</p>${nota ? `<small>${escapar(nota)}</small>` : ''}`;
    lista.appendChild(burbuja);
    lista.scrollTop = lista.scrollHeight;
    return burbuja;
  }

  async function preguntar(texto) {
    texto = texto.trim();
    if (!texto || esperando) return;
    esperando = true;
    sugerencias.hidden = true;
    campo.value = '';
    agregar('usuario', texto);
    const escribiendo = agregar('asistente pensando', 'Zurick está pensando…');
    try {
      const r = await api('/asistente', { method: 'POST', body: { pregunta: texto, historial: historial.slice(-6) } });
      escribiendo.remove();
      const notas = [];
      if (r.fuente === 'respaldo') notas.push('Respuesta automática: la IA no está disponible en este momento.');
      if (r.restantes === 0) notas.push('Esta fue tu última pregunta de hoy.');
      else if (r.restantes <= 3) notas.push(r.restantes === 1 ? 'Te queda 1 pregunta hoy.' : `Te quedan ${r.restantes} preguntas hoy.`);
      agregar('asistente', r.respuesta, notas.join(' '));
      historial.push({ rol: 'usuario', texto }, { rol: 'asistente', texto: r.respuesta });
    } catch (err) {
      escribiendo.remove();
      agregar('asistente error', err.message);
    } finally {
      esperando = false;
      campo.focus();
    }
  }

  abrirBoton.addEventListener('click', () => (panel.hidden ? abrir() : cerrar()));
  document.getElementById('asistente-cerrar').addEventListener('click', cerrar);
  form.addEventListener('submit', e => { e.preventDefault(); preguntar(campo.value); });
  sugerencias.addEventListener('click', e => {
    const boton = e.target.closest('button');
    if (boton) preguntar(boton.textContent);
  });
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') cerrar(); });
})();
