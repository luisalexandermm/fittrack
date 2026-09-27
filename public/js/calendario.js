// ============================================================
//  calendario.js — semana planeada + historial del mes
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

  document.getElementById('lista-dias').addEventListener('click', e => {
    const fila = e.target.closest('[data-empezar]');
    if (!fila) return;
    objetivoSugerido = fila.dataset.empezar;
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
  const hoy = hoyTexto();
  const fechas = [...Array(7)].map((_, i) => sumarDias(lunesVisible, i));
  const conSesion = fecha => sesionesSemana.filter(s => s.fecha === fecha);

  // Título: mes (y año) de la semana
  const d = new Date(fechas[3] + 'T12:00:00');
  document.getElementById('mes-titulo').textContent = `${MESES_LARGO[d.getMonth()]} ${d.getFullYear()}`;

  // Fila de 7 días
  document.getElementById('semana-dias').innerHTML = fechas.map(f => {
    const dia = new Date(f + 'T12:00:00');
    const clases = [f === hoy ? 'hoy' : '', f === diaSeleccionado ? 'sel' : '', conSesion(f).length ? 'hecho' : ''].join(' ');
    return `<button class="dia-chip ${clases}" data-fecha="${f}" type="button" aria-label="${DIAS[dia.getDay()]} ${dia.getDate()}">
      <span class="rotulo">${DIAS[dia.getDay()].charAt(0)}</span><span class="cifra">${dia.getDate()}</span></button>`;
  }).join('');

  // Lista con lo que toca cada día
  document.getElementById('lista-dias').innerHTML = fechas.map(f => {
    const dia = new Date(f + 'T12:00:00');
    const act = actividadDelDia(f, perfil);
    const hechas = conSesion(f);
    const minutos = hechas.reduce((s, x) => s + x.minutos, 0);

    let estado = '';
    let titulo = act.titulo, detalle = act.detalle;
    if (hechas.length) {
      estado = `<span class="estado hecho">${icono('check', 'ic-sm')}Hecho</span>`;
      titulo = hechas[0].nombre.split(' · ')[0];
      detalle = `${minutos} min${hechas.length > 1 ? ` · ${hechas.length} sesiones` : ''}`;
    } else if (f === hoy && act.entrena) {
      estado = `<span class="estado hoy">Hoy</span>`;
    } else if (f < hoy && act.entrena) {
      estado = `<span class="estado pendiente">Pendiente</span>`;
    }

    const puedeEmpezar = f === hoy && act.entrena && !hechas.length;
    return `
      <${puedeEmpezar ? 'button type="button"' : 'div'} class="dia-fila ${f === diaSeleccionado ? 'sel' : ''}" data-fecha="${f}" ${puedeEmpezar ? `data-empezar="${act.objetivo}"` : ''}>
        <span class="fecha"><span class="rotulo">${DIAS[dia.getDay()]}</span><span class="cifra">${dia.getDate()}</span></span>
        <span class="tile">${picto(act.picto)}</span>
        <span><strong>${escapar(titulo)}</strong><small>${detalle}</small></span>
        ${estado}
      </${puedeEmpezar ? 'button' : 'div'}>`;
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
