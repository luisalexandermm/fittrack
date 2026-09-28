// ============================================================
//  calendario.js — semana planeada (con estados) + historial del mes
//  ✓ completado · → próximo · ○ programado · — descanso
// ============================================================

let lunesVisible = null;   // lunes de la semana que se está viendo
let diaSeleccionado = null;
let sesionesSemana = [];

function prepararCalendario() {
  document.getElementById('semana-anterior').addEventListener('click', () => moverSemana(-7));
  document.getElementById('semana-siguiente').addEventListener('click', () => moverSemana(7));

  document.getElementById('semana-dias').addEventListener('click', e => {
    const chip = e.target.closest('[data-fecha]');
    if (!chip) return;
    diaSeleccionado = chip.dataset.fecha;
    pintarSemana();
    document.querySelector(`.dia-fila[data-fecha="${diaSeleccionado}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  // Tocar un día con entreno abre su rutina
  document.getElementById('lista-dias').addEventListener('click', e => {
    const fila = e.target.closest('[data-ver-dia]');
    if (!fila) return;
    diaSugerido = Number(fila.dataset.verDia);
    location.hash = '#rutinas';
  });

  document.getElementById('historial').addEventListener('click', async e => {
    const boton = e.target.closest('[data-borrar]');
    if (!boton || !confirm('¿Borrar esta sesión del historial?')) return;
    await api('/sesiones/' + boton.dataset.borrar, { method: 'DELETE' });
    cargarCalendario();
  });
}

async function cargarCalendario() {
  await cargarPlan();
  if (!lunesVisible) {
    lunesVisible = lunesDe(hoyTexto());
    diaSeleccionado = hoyTexto();
  }
  await cargarSemana();
  cargarHistorialMes();
}

async function moverSemana(dias) {
  lunesVisible = sumarDias(lunesVisible, dias);
  diaSeleccionado = lunesVisible;
  await cargarSemana();
}

async function cargarSemana() {
  sesionesSemana = await api(`/sesiones?desde=${lunesVisible}&hasta=${sumarDias(lunesVisible, 6)}`);
  pintarSemana();
}

function pintarSemana() {
  const fechas = [...Array(7)].map((_, i) => sumarDias(lunesVisible, i));
  const conSesion = fecha => sesionesSemana.filter(s => s.fecha === fecha);
  const estados = estadosSemana(lunesVisible, new Set(sesionesSemana.map(s => s.fecha)));

  // Título: mes (y año) de la semana
  const d = new Date(fechas[3] + 'T12:00:00');
  document.getElementById('mes-titulo').textContent = `${MESES_LARGO[d.getMonth()]} ${d.getFullYear()}`;

  // Fila de 7 días con su símbolo
  document.getElementById('semana-dias').innerHTML = estados.map(x => {
    const dia = new Date(x.fecha + 'T12:00:00');
    const clases = [x.esHoy ? 'hoy' : '', x.fecha === diaSeleccionado ? 'sel' : '', 'e-' + x.estado].join(' ');
    return `<button class="dia-chip ${clases}" data-fecha="${x.fecha}" type="button" aria-label="${DIAS[dia.getDay()]} ${dia.getDate()}: ${TEXTO_ESTADO[x.estado]}">
      <span class="rotulo">${DIAS[dia.getDay()].charAt(0)}</span><span class="cifra">${dia.getDate()}</span><b class="simbolo" aria-hidden="true">${SIMBOLO_ESTADO[x.estado]}</b></button>`;
  }).join('');

  // Lista con lo que toca cada día
  document.getElementById('lista-dias').innerHTML = estados.map(x => {
    const dia = new Date(x.fecha + 'T12:00:00');
    const act = x.dia;
    const hechas = conSesion(x.fecha);
    const minutos = hechas.reduce((s, h) => s + h.minutos, 0);

    let titulo = act.titulo;
    let detalle = act.entrena ? `${act.minutos} min · ${resumenRutina(act.rutina).split(' · ')[1]}` : act.detalle;
    if (hechas.length) {
      titulo = hechas[0].nombre.split(' · ')[0];
      detalle = `${minutos} min${hechas.length > 1 ? ` · ${hechas.length} sesiones` : ''}`;
    }
    const estado = `<span class="estado e-${x.estado}"><b aria-hidden="true">${SIMBOLO_ESTADO[x.estado]}</b>${TEXTO_ESTADO[x.estado]}</span>`;
    const clicable = act.entrena && !hechas.length;
    return `
      <${clicable ? 'button type="button"' : 'div'} class="dia-fila e-${x.estado} ${x.fecha === diaSeleccionado ? 'sel' : ''}" data-fecha="${x.fecha}" ${clicable ? `data-ver-dia="${act.dia}"` : ''}>
        <span class="fecha"><span class="rotulo">${DIAS[dia.getDay()]}</span><span class="cifra">${dia.getDate()}</span></span>
        <span class="tile">${picto(act.picto)}</span>
        <span><strong>${escapar(titulo)}</strong><small>${detalle}</small></span>
        ${estado}
      </${clicable ? 'button' : 'div'}>`;
  }).join('');
}

async function cargarHistorialMes() {
  const hoy = hoyTexto();
  const inicioMes = hoy.slice(0, 8) + '01';
  const sesiones = await api(`/sesiones?desde=${inicioMes}&hasta=${hoy}`);
  const caja = document.getElementById('historial');

  if (sesiones.length === 0) {
    caja.innerHTML = `<div class="vacio">${icono('calendario')}Aún no hay sesiones este mes.<br><a href="#rutinas" class="btn btn-tinta btn-sm">Hacer la primera</a></div>`;
    return;
  }
  const total = sesiones.reduce((s, x) => s + x.minutos, 0);
  const SENSACION = { 1: 'Muy duro', 2: 'Duro', 3: 'Bien', 4: 'Muy bien', 5: 'Excelente' };
  caja.innerHTML = `
    <p class="tenue" style="padding:12px 0;border-bottom:1px solid var(--linea);font-size:.88rem">${sesiones.length} sesiones · ${total} minutos</p>
    ${sesiones.map(s => `
      <div class="sesion">
        <span class="cifra">${Number(s.fecha.slice(8))}</span>
        <span><strong>${escapar(s.nombre)}</strong><small>${s.minutos} min${s.sensacion ? ' · ' + SENSACION[s.sensacion] : ''}</small></span>
        <button class="btn btn-icono btn-sm btn-peligro" data-borrar="${s.id}" aria-label="Borrar sesión">${icono('basura', 'ic-sm')}</button>
      </div>`).join('')}`;
}
