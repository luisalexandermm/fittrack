// Genera supabase/datos.sql a partir de los catálogos de /db
// (ejercicios, recetas y consejos). Úsalo si cambias esos archivos:
//     npm run sql
const fs = require('fs');
const path = require('path');
const ejercicios = require('../db/ejercicios');
const recetas = require('../db/recetas');
const consejos = require('../db/consejos');

// Convierte un texto a literal SQL seguro: O'Neil → 'O''Neil'
const t = v => `'${String(v).replace(/'/g, "''")}'`;
const j = v => `${t(JSON.stringify(v))}::jsonb`;

let sql = `-- ============================================================
--  FitTrack — datos iniciales (catálogos)
--  Generado con: npm run sql   (no lo edites a mano)
--  Ejecútalo DESPUÉS de esquema.sql (o de migracion-onboarding.sql si tu base ya existía).
--  Borra y vuelve a cargar los catálogos (los datos de los usuarios no se tocan).
-- ============================================================

truncate public.ejercicios, public.recetas, public.consejos restart identity;

insert into public.ejercicios (nombre, grupo, nivel, objetivos, fase, descripcion, equipo, musculos) values
`;
sql += ejercicios.map(e => `  (${t(e.nombre)}, ${t(e.grupo)}, ${e.nivel}, ${t(e.objetivos)}, ${t(e.fase)}, ${t(e.descripcion)}, ${t(e.equipo || 'ninguno')}, ${t(e.musculos || '')})`).join(',\n') + ';\n\n';

sql += 'insert into public.recetas (nombre, tipo, objetivos, kcal, proteina, minutos, descripcion, ingredientes, pasos) values\n';
sql += recetas.map(r => `  (${t(r.nombre)}, ${t(r.tipo)}, ${t(r.objetivos)}, ${r.kcal}, ${r.proteina}, ${r.minutos}, ${t(r.descripcion)}, ${j(r.ingredientes)}, ${j(r.pasos)})`).join(',\n') + ';\n\n';

sql += 'insert into public.consejos (categoria, texto) values\n';
sql += consejos.map(c => `  (${t(c.categoria)}, ${t(c.texto)})`).join(',\n') + ';\n';

fs.writeFileSync(path.join(__dirname, 'datos.sql'), sql);
console.log(`✔ supabase/datos.sql: ${ejercicios.length} ejercicios, ${recetas.length} recetas, ${consejos.length} consejos`);
