// Fechas en texto "YYYY-MM-DD" (sin horas, para no tener líos de zona horaria)

// Suma (o resta) días a una fecha
function sumarDias(fecha, dias) {
  const d = new Date(fecha + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

// Lunes de la semana de una fecha
function lunesDe(fecha) {
  const d = new Date(fecha + 'T12:00:00Z');
  return sumarDias(fecha, -((d.getUTCDay() + 6) % 7));
}

module.exports = { sumarDias, lunesDe };
