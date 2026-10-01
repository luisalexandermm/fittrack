// Catálogo de ejercicios: los de casa (sin equipo o con muebles) y, al final, los de gimnasio.
// Se inserta en la base de datos la primera vez que arranca el servidor.
//
// Campos:
//   nombre       → cómo se llama el ejercicio
//   grupo        → piernas | empuje | tiron | core | cardio | movilidad
//   nivel        → 1 principiante, 2 intermedio, 3 avanzado (nivel mínimo)
//   objetivos    → para qué objetivos sirve (separados por coma)
//   fase         → principal | calentamiento | enfriamiento
//   descripcion  → instrucción corta de cómo hacerlo
//   equipo       → ninguno (solo tu cuerpo) | casa (silla, mesa, pared, toalla) | gimnasio (máquinas, poleas, pesas)
//   musculos     → músculos que trabaja (se muestran en la ficha del ejercicio)
//
// IMPORTANTE: agrega ejercicios nuevos SIEMPRE AL FINAL de la lista.
// Así los ids de los que ya existen no cambian al volver a cargar datos.sql.

module.exports = [
  // ---------- CALENTAMIENTO ----------
  { nombre: 'Movilidad de hombros', grupo: 'movilidad', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'calentamiento', descripcion: 'Círculos amplios con los brazos, 10 hacia adelante y 10 hacia atrás.', equipo: 'ninguno', musculos: 'Hombros · Espalda alta' },
  { nombre: 'Rotación de cadera', grupo: 'movilidad', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'calentamiento', descripcion: 'Manos en la cintura, dibuja círculos grandes con la cadera.', equipo: 'ninguno', musculos: 'Cadera · Zona lumbar' },
  { nombre: 'Marcha en el sitio', grupo: 'cardio', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'calentamiento', descripcion: 'Eleva las rodillas a ritmo suave y mueve los brazos.', equipo: 'ninguno', musculos: 'Piernas · Corazón' },
  { nombre: 'Sentadilla con brazos arriba', grupo: 'movilidad', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'calentamiento', descripcion: 'Baja lento a media sentadilla estirando los brazos al techo.', equipo: 'ninguno', musculos: 'Piernas · Hombros · Core' },
  { nombre: 'Gato-camello', grupo: 'movilidad', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'calentamiento', descripcion: 'En cuatro apoyos, arquea y redondea la espalda despacio.', equipo: 'ninguno', musculos: 'Columna · Core' },

  // ---------- PIERNAS ----------
  { nombre: 'Sentadilla', grupo: 'piernas', nivel: 1, objetivos: 'grasa,musculo,resistencia', fase: 'principal', descripcion: 'Pies al ancho de hombros, baja como si te sentaras y sube empujando el suelo.', equipo: 'ninguno', musculos: 'Cuádriceps · Glúteos · Core' },
  { nombre: 'Zancada alterna', grupo: 'piernas', nivel: 1, objetivos: 'grasa,musculo,resistencia', fase: 'principal', descripcion: 'Da un paso largo al frente y baja la rodilla de atrás casi al suelo. Alterna.', equipo: 'ninguno', musculos: 'Cuádriceps · Glúteos · Equilibrio' },
  { nombre: 'Puente de glúteo', grupo: 'piernas', nivel: 1, objetivos: 'musculo,resistencia,movilidad', fase: 'principal', descripcion: 'Boca arriba, rodillas dobladas, eleva la cadera apretando glúteos.', equipo: 'ninguno', musculos: 'Glúteos · Isquiotibiales' },
  { nombre: 'Sentadilla sumo con pausa', grupo: 'piernas', nivel: 2, objetivos: 'musculo,resistencia', fase: 'principal', descripcion: 'Pies muy abiertos, baja y aguanta 2 segundos abajo.', equipo: 'ninguno', musculos: 'Aductores · Glúteos · Cuádriceps' },
  { nombre: 'Sentadilla con salto', grupo: 'piernas', nivel: 2, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Sentadilla normal y sube con un salto explosivo. Aterriza suave.', equipo: 'ninguno', musculos: 'Cuádriceps · Glúteos · Pantorrillas' },
  { nombre: 'Zancada búlgara (en silla)', grupo: 'piernas', nivel: 2, objetivos: 'musculo', fase: 'principal', descripcion: 'Pie de atrás apoyado en una silla, baja con la pierna de adelante.', equipo: 'casa', musculos: 'Cuádriceps · Glúteos' },
  { nombre: 'Sentadilla a una pierna (pistol asistida)', grupo: 'piernas', nivel: 3, objetivos: 'musculo', fase: 'principal', descripcion: 'Apóyate en una pared o marco de puerta y baja en una sola pierna.', equipo: 'casa', musculos: 'Cuádriceps · Glúteos · Equilibrio' },
  { nombre: 'Zancada con salto', grupo: 'piernas', nivel: 3, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Desde zancada, salta y cambia de pierna en el aire.', equipo: 'ninguno', musculos: 'Cuádriceps · Glúteos · Potencia' },
  { nombre: 'Sentadilla isométrica en pared', grupo: 'piernas', nivel: 1, objetivos: 'musculo,resistencia', fase: 'principal', descripcion: 'Espalda contra la pared, rodillas a 90°, aguanta.', equipo: 'casa', musculos: 'Cuádriceps · Glúteos' },

  // ---------- EMPUJE (pecho, hombro, tríceps) ----------
  { nombre: 'Flexiones con rodillas', grupo: 'empuje', nivel: 1, objetivos: 'grasa,musculo,resistencia', fase: 'principal', descripcion: 'Rodillas en el suelo, cuerpo recto, baja el pecho al piso.', equipo: 'ninguno', musculos: 'Pecho · Tríceps · Hombros' },
  { nombre: 'Flexiones inclinadas (en mesa)', grupo: 'empuje', nivel: 1, objetivos: 'musculo,resistencia', fase: 'principal', descripcion: 'Manos en una mesa firme, cuerpo recto, baja el pecho al borde.', equipo: 'casa', musculos: 'Pecho · Tríceps · Hombros' },
  { nombre: 'Flexiones', grupo: 'empuje', nivel: 2, objetivos: 'grasa,musculo,resistencia', fase: 'principal', descripcion: 'Manos bajo los hombros, cuerpo en tabla, pecho casi al suelo.', equipo: 'ninguno', musculos: 'Pecho · Tríceps · Hombros · Core' },
  { nombre: 'Fondos en silla', grupo: 'empuje', nivel: 2, objetivos: 'musculo', fase: 'principal', descripcion: 'Manos en el borde de una silla detrás de ti, dobla codos y sube.', equipo: 'casa', musculos: 'Tríceps · Hombros' },
  { nombre: 'Flexiones pica (hombro)', grupo: 'empuje', nivel: 2, objetivos: 'musculo', fase: 'principal', descripcion: 'Cadera arriba en forma de V invertida, baja la cabeza hacia el suelo.', equipo: 'ninguno', musculos: 'Hombros · Tríceps' },
  { nombre: 'Flexiones diamante', grupo: 'empuje', nivel: 3, objetivos: 'musculo', fase: 'principal', descripcion: 'Manos juntas formando un rombo bajo el pecho.', equipo: 'ninguno', musculos: 'Tríceps · Pecho' },
  { nombre: 'Flexiones explosivas', grupo: 'empuje', nivel: 3, objetivos: 'grasa,musculo', fase: 'principal', descripcion: 'Empuja fuerte para que las manos se despeguen del suelo.', equipo: 'ninguno', musculos: 'Pecho · Tríceps · Potencia' },

  // ---------- TIRÓN (espalda) ----------
  { nombre: 'Superman', grupo: 'tiron', nivel: 1, objetivos: 'musculo,resistencia,movilidad', fase: 'principal', descripcion: 'Boca abajo, eleva brazos y piernas a la vez y baja lento.', equipo: 'ninguno', musculos: 'Zona lumbar · Glúteos · Espalda' },
  { nombre: 'Remo con toalla en puerta', grupo: 'tiron', nivel: 1, objetivos: 'musculo', fase: 'principal', descripcion: 'Toalla atada a la manija de una puerta cerrada, inclínate atrás y tira.', equipo: 'casa', musculos: 'Espalda · Bíceps' },
  { nombre: 'Nadador (brazos Y-T-W)', grupo: 'tiron', nivel: 2, objetivos: 'musculo,movilidad', fase: 'principal', descripcion: 'Boca abajo, dibuja las letras Y, T y W con los brazos elevados.', equipo: 'ninguno', musculos: 'Espalda alta · Hombros' },
  { nombre: 'Remo invertido bajo mesa', grupo: 'tiron', nivel: 3, objetivos: 'musculo', fase: 'principal', descripcion: 'Acostado bajo una mesa firme, agarra el borde y sube el pecho.', equipo: 'casa', musculos: 'Espalda · Bíceps · Core' },

  // ---------- CORE ----------
  { nombre: 'Plancha', grupo: 'core', nivel: 1, objetivos: 'musculo,resistencia,movilidad', fase: 'principal', descripcion: 'Antebrazos en el suelo, cuerpo recto, abdomen apretado.', equipo: 'ninguno', musculos: 'Core · Hombros' },
  { nombre: 'Bicho muerto (dead bug)', grupo: 'core', nivel: 1, objetivos: 'musculo,movilidad', fase: 'principal', descripcion: 'Boca arriba, estira brazo y pierna contrarios sin despegar la espalda.', equipo: 'ninguno', musculos: 'Core profundo' },
  { nombre: 'Crunch abdominal', grupo: 'core', nivel: 1, objetivos: 'grasa,musculo', fase: 'principal', descripcion: 'Boca arriba, eleva los hombros contrayendo el abdomen.', equipo: 'ninguno', musculos: 'Abdomen' },
  { nombre: 'Escaladores', grupo: 'core', nivel: 2, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'En posición de flexión, lleva rodillas al pecho rápido y alterno.', equipo: 'ninguno', musculos: 'Core · Hombros · Cardio' },
  { nombre: 'Plancha lateral', grupo: 'core', nivel: 2, objetivos: 'musculo,resistencia', fase: 'principal', descripcion: 'De lado sobre un antebrazo, cadera alta. Cambia de lado a la mitad.', equipo: 'ninguno', musculos: 'Oblicuos · Core' },
  { nombre: 'Bicicleta abdominal', grupo: 'core', nivel: 2, objetivos: 'grasa,musculo', fase: 'principal', descripcion: 'Codo hacia rodilla contraria alternando, piernas en el aire.', equipo: 'ninguno', musculos: 'Abdomen · Oblicuos' },
  { nombre: 'Hollow hold', grupo: 'core', nivel: 3, objetivos: 'musculo,resistencia', fase: 'principal', descripcion: 'Boca arriba, brazos y piernas estirados y elevados, espalda pegada.', equipo: 'ninguno', musculos: 'Core profundo · Abdomen' },
  { nombre: 'Plancha con toque de hombro', grupo: 'core', nivel: 2, objetivos: 'musculo,resistencia', fase: 'principal', descripcion: 'En posición de flexión, toca el hombro contrario sin mover la cadera.', equipo: 'ninguno', musculos: 'Core · Hombros · Estabilidad' },

  // ---------- CARDIO ----------
  { nombre: 'Jumping jacks', grupo: 'cardio', nivel: 1, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Salta abriendo piernas y brazos, vuelve a cerrar.', equipo: 'ninguno', musculos: 'Cuerpo completo · Cardio' },
  { nombre: 'Rodillas arriba', grupo: 'cardio', nivel: 1, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Trota en el sitio subiendo las rodillas a la altura de la cadera.', equipo: 'ninguno', musculos: 'Piernas · Core · Cardio' },
  { nombre: 'Boxeo de sombra', grupo: 'cardio', nivel: 1, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Golpes rápidos al aire con guardia alta, mueve los pies.', equipo: 'ninguno', musculos: 'Hombros · Core · Cardio' },
  { nombre: 'Skater (patinador)', grupo: 'cardio', nivel: 2, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Salta de lado a lado cayendo en una pierna.', equipo: 'ninguno', musculos: 'Glúteos · Piernas · Cardio' },
  { nombre: 'Burpees', grupo: 'cardio', nivel: 2, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Agáchate, lleva los pies atrás, vuelve y salta con los brazos arriba.', equipo: 'ninguno', musculos: 'Cuerpo completo · Cardio' },
  { nombre: 'Burpee con flexión', grupo: 'cardio', nivel: 3, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Burpee completo añadiendo una flexión abajo.', equipo: 'ninguno', musculos: 'Cuerpo completo · Pecho · Cardio' },
  { nombre: 'Saltos de tijera rápidos', grupo: 'cardio', nivel: 3, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Alterna pierna adelante y atrás saltando lo más rápido posible.', equipo: 'ninguno', musculos: 'Piernas · Cardio' },

  // ---------- MOVILIDAD (bloque principal para objetivo movilidad) ----------
  { nombre: 'Saludo al sol', grupo: 'movilidad', nivel: 1, objetivos: 'movilidad', fase: 'principal', descripcion: 'Secuencia fluida: brazos arriba, flexión al frente, plancha, cobra y vuelta.', equipo: 'ninguno', musculos: 'Cuerpo completo · Columna' },
  { nombre: 'Estocada con rotación', grupo: 'movilidad', nivel: 1, objetivos: 'movilidad', fase: 'principal', descripcion: 'En zancada baja, gira el torso hacia la pierna de adelante.', equipo: 'ninguno', musculos: 'Cadera · Columna torácica' },
  { nombre: 'Perro boca abajo a cobra', grupo: 'movilidad', nivel: 1, objetivos: 'movilidad', fase: 'principal', descripcion: 'Pasa lento de V invertida a pecho abierto con cadera abajo.', equipo: 'ninguno', musculos: 'Columna · Isquiotibiales · Hombros' },
  { nombre: 'Sentadilla profunda sostenida', grupo: 'movilidad', nivel: 2, objetivos: 'movilidad', fase: 'principal', descripcion: 'Baja al fondo de la sentadilla, codos empujan las rodillas hacia afuera.', equipo: 'ninguno', musculos: 'Cadera · Tobillos' },
  { nombre: 'Rotación torácica en 4 apoyos', grupo: 'movilidad', nivel: 1, objetivos: 'movilidad', fase: 'principal', descripcion: 'Mano en la nuca, abre el codo hacia el techo siguiendo con la mirada.', equipo: 'ninguno', musculos: 'Columna torácica · Hombros' },
  { nombre: 'Puente con extensión de pierna', grupo: 'movilidad', nivel: 2, objetivos: 'movilidad,musculo', fase: 'principal', descripcion: 'En puente de glúteo, estira una pierna manteniendo la cadera alta.', equipo: 'ninguno', musculos: 'Glúteos · Core' },

  // ---------- ENFRIAMIENTO ----------
  { nombre: 'Estiramiento de cuádriceps', grupo: 'movilidad', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'enfriamiento', descripcion: 'De pie, lleva el talón al glúteo. Cambia de pierna a la mitad.', equipo: 'ninguno', musculos: 'Cuádriceps' },
  { nombre: 'Estiramiento de isquios', grupo: 'movilidad', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'enfriamiento', descripcion: 'Sentado, piernas estiradas, lleva el pecho hacia las rodillas.', equipo: 'ninguno', musculos: 'Isquiotibiales · Zona lumbar' },
  { nombre: 'Postura del niño', grupo: 'movilidad', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'enfriamiento', descripcion: 'De rodillas, siéntate en los talones y estira los brazos al frente.', equipo: 'ninguno', musculos: 'Espalda · Cadera' },
  { nombre: 'Estiramiento de pecho en pared', grupo: 'movilidad', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'enfriamiento', descripcion: 'Antebrazo en la pared y gira el cuerpo hacia el lado contrario.', equipo: 'casa', musculos: 'Pecho · Hombros' },
  { nombre: 'Respiración profunda', grupo: 'movilidad', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'enfriamiento', descripcion: 'Inhala 4 segundos, sostén 4, exhala 6. Relaja los hombros.', equipo: 'ninguno', musculos: 'Diafragma · Relajación' },
  // ---------- GIMNASIO (se usan si eliges "Gimnasio" o "Ambos") ----------
  { nombre: 'Prensa de piernas', grupo: 'piernas', nivel: 1, objetivos: 'grasa,musculo,resistencia', fase: 'principal', descripcion: 'Espalda pegada al respaldo, baja la plataforma hasta 90° y empuja con todo el pie.', equipo: 'gimnasio', musculos: 'Cuádriceps · Glúteos' },
  { nombre: 'Sentadilla goblet con mancuerna', grupo: 'piernas', nivel: 1, objetivos: 'grasa,musculo,resistencia', fase: 'principal', descripcion: 'Mancuerna pegada al pecho, codos adentro, baja profundo con la espalda recta.', equipo: 'gimnasio', musculos: 'Cuádriceps · Glúteos · Core' },
  { nombre: 'Peso muerto rumano con mancuernas', grupo: 'piernas', nivel: 2, objetivos: 'musculo,resistencia', fase: 'principal', descripcion: 'Rodillas suaves, lleva la cadera atrás bajando las mancuernas pegadas a las piernas.', equipo: 'gimnasio', musculos: 'Isquiotibiales · Glúteos · Zona lumbar' },
  { nombre: 'Extensión de cuádriceps en máquina', grupo: 'piernas', nivel: 1, objetivos: 'musculo', fase: 'principal', descripcion: 'Sentado, estira las rodillas hasta arriba y baja lento en 3 segundos.', equipo: 'gimnasio', musculos: 'Cuádriceps' },
  { nombre: 'Curl femoral en máquina', grupo: 'piernas', nivel: 1, objetivos: 'musculo', fase: 'principal', descripcion: 'Boca abajo, lleva los talones hacia los glúteos sin despegar la cadera.', equipo: 'gimnasio', musculos: 'Isquiotibiales' },
  { nombre: 'Press de banca con mancuernas', grupo: 'empuje', nivel: 1, objetivos: 'musculo,grasa', fase: 'principal', descripcion: 'Acostado en el banco, baja las mancuernas al pecho y empuja hacia arriba.', equipo: 'gimnasio', musculos: 'Pecho · Tríceps · Hombros' },
  { nombre: 'Press militar con mancuernas', grupo: 'empuje', nivel: 2, objetivos: 'musculo', fase: 'principal', descripcion: 'De pie, abdomen firme, empuja las mancuernas desde los hombros hasta arriba.', equipo: 'gimnasio', musculos: 'Hombros · Tríceps' },
  { nombre: 'Jalón al pecho en polea', grupo: 'tiron', nivel: 1, objetivos: 'musculo,resistencia', fase: 'principal', descripcion: 'Sentado, baja la barra hacia el pecho llevando los codos hacia las costillas.', equipo: 'gimnasio', musculos: 'Dorsales · Bíceps' },
  { nombre: 'Remo sentado en polea', grupo: 'tiron', nivel: 1, objetivos: 'musculo,resistencia', fase: 'principal', descripcion: 'Espalda recta, tira del agarre hacia el ombligo y junta las escápulas.', equipo: 'gimnasio', musculos: 'Espalda media · Bíceps' },
  { nombre: 'Face pull en polea', grupo: 'tiron', nivel: 2, objetivos: 'musculo,movilidad', fase: 'principal', descripcion: 'Polea a la altura de la cara, tira de la cuerda abriendo los codos hacia atrás.', equipo: 'gimnasio', musculos: 'Hombro posterior · Espalda alta' },
  { nombre: 'Crunch en polea alta', grupo: 'core', nivel: 2, objetivos: 'musculo', fase: 'principal', descripcion: 'De rodillas frente a la polea, flexiona el tronco llevando los codos a los muslos.', equipo: 'gimnasio', musculos: 'Abdomen' },
  { nombre: 'Pallof press en polea', grupo: 'core', nivel: 1, objetivos: 'musculo,resistencia,movilidad', fase: 'principal', descripcion: 'De lado a la polea, estira los brazos al frente sin dejar que el cuerpo gire.', equipo: 'gimnasio', musculos: 'Core · Oblicuos' },
  { nombre: 'Swing con kettlebell', grupo: 'cardio', nivel: 2, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Bisagra de cadera y empuja fuerte para que la pesa suba hasta el pecho.', equipo: 'gimnasio', musculos: 'Glúteos · Isquiotibiales · Cardio' },
  { nombre: 'Sprints en bicicleta estática', grupo: 'cardio', nivel: 1, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Pedalea a máxima velocidad con resistencia media durante todo el intervalo.', equipo: 'gimnasio', musculos: 'Piernas · Cardio' },
  { nombre: 'Remo en máquina', grupo: 'cardio', nivel: 1, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Empuja con las piernas, luego inclina el tronco y tira del mango al pecho.', equipo: 'gimnasio', musculos: 'Cuerpo completo · Cardio' },
  { nombre: 'Caminata inclinada en cinta', grupo: 'cardio', nivel: 1, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Cinta con inclinación alta, paso firme y sin agarrarte de las barras.', equipo: 'gimnasio', musculos: 'Glúteos · Pantorrillas · Cardio' },
  // ---------- MÁS EJERCICIOS (v6: más variedad semana a semana) ----------
  // Calentamiento
  { nombre: 'Jumping jacks suaves', grupo: 'cardio', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'calentamiento', descripcion: 'Saltos abriendo y cerrando piernas a ritmo cómodo, sin forzar.', equipo: 'ninguno', musculos: 'Cuerpo completo · Corazón' },
  { nombre: 'Balanceo de piernas', grupo: 'movilidad', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'calentamiento', descripcion: 'Apoyado en una pared, balancea una pierna adelante y atrás. Cambia a la mitad.', equipo: 'casa', musculos: 'Cadera · Isquiotibiales' },
  { nombre: 'Rotación de tronco de pie', grupo: 'movilidad', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'calentamiento', descripcion: 'Pies firmes, gira el tronco a un lado y al otro dejando que los brazos sigan.', equipo: 'ninguno', musculos: 'Columna · Oblicuos' },

  // Piernas
  { nombre: 'Zancada inversa', grupo: 'piernas', nivel: 1, objetivos: 'grasa,musculo,resistencia', fase: 'principal', descripcion: 'Da un paso largo hacia atrás y baja la rodilla casi al suelo. Alterna.', equipo: 'ninguno', musculos: 'Glúteos · Cuádriceps' },
  { nombre: 'Elevación de talones', grupo: 'piernas', nivel: 1, objetivos: 'musculo,resistencia', fase: 'principal', descripcion: 'De pie, sube en puntas de pie lo más alto que puedas y baja lento.', equipo: 'ninguno', musculos: 'Pantorrillas' },
  { nombre: 'Sentadilla con pulso', grupo: 'piernas', nivel: 2, objetivos: 'grasa,musculo,resistencia', fase: 'principal', descripcion: 'Baja a sentadilla y haz pequeños rebotes abajo sin subir del todo.', equipo: 'ninguno', musculos: 'Cuádriceps · Glúteos' },
  { nombre: 'Subida a escalón (step-up)', grupo: 'piernas', nivel: 1, objetivos: 'grasa,musculo,resistencia', fase: 'principal', descripcion: 'Sube a un escalón o silla firme con una pierna y baja controlado. Alterna.', equipo: 'casa', musculos: 'Cuádriceps · Glúteos' },
  { nombre: 'Patada de glúteo en 4 apoyos', grupo: 'piernas', nivel: 1, objetivos: 'musculo,resistencia,movilidad', fase: 'principal', descripcion: 'En cuatro apoyos, lleva una pierna doblada hacia el techo apretando el glúteo.', equipo: 'ninguno', musculos: 'Glúteos' },
  { nombre: 'Sentadilla cosaca', grupo: 'piernas', nivel: 3, objetivos: 'musculo,movilidad', fase: 'principal', descripcion: 'Piernas muy abiertas, baja hacia un lado con la otra pierna estirada. Alterna.', equipo: 'ninguno', musculos: 'Aductores · Glúteos · Cuádriceps' },
  { nombre: 'Puente de glúteo a una pierna', grupo: 'piernas', nivel: 2, objetivos: 'grasa,musculo,resistencia', fase: 'principal', descripcion: 'En puente, levanta una pierna estirada y sube la cadera con la otra.', equipo: 'ninguno', musculos: 'Glúteos · Isquiotibiales' },

  // Empuje
  { nombre: 'Flexiones abiertas', grupo: 'empuje', nivel: 2, objetivos: 'grasa,musculo,resistencia', fase: 'principal', descripcion: 'Manos más separadas que los hombros, baja el pecho al suelo.', equipo: 'ninguno', musculos: 'Pecho · Hombros' },
  { nombre: 'Flexiones declinadas (pies en silla)', grupo: 'empuje', nivel: 3, objetivos: 'musculo', fase: 'principal', descripcion: 'Pies sobre una silla firme, manos en el suelo y baja el pecho.', equipo: 'casa', musculos: 'Pecho alto · Hombros · Tríceps' },
  { nombre: 'Plancha a flexión', grupo: 'empuje', nivel: 2, objetivos: 'grasa,musculo,resistencia', fase: 'principal', descripcion: 'Pasa de plancha en antebrazos a manos, y vuelve. Alterna el brazo que empieza.', equipo: 'ninguno', musculos: 'Tríceps · Hombros · Core' },
  { nombre: 'Flexión hindú', grupo: 'empuje', nivel: 3, objetivos: 'musculo,movilidad', fase: 'principal', descripcion: 'Desde V invertida, baja el pecho rozando el suelo y termina en cobra.', equipo: 'ninguno', musculos: 'Hombros · Pecho · Tríceps' },

  // Tirón
  { nombre: 'Remo con mochila', grupo: 'tiron', nivel: 1, objetivos: 'grasa,musculo,resistencia', fase: 'principal', descripcion: 'Inclinado con la espalda recta, tira de una mochila con peso hacia el ombligo.', equipo: 'casa', musculos: 'Espalda · Bíceps' },
  { nombre: 'Ángeles en el suelo', grupo: 'tiron', nivel: 1, objetivos: 'musculo,movilidad', fase: 'principal', descripcion: 'Boca abajo, desliza los brazos de arriba hacia la cadera con los pulgares arriba.', equipo: 'ninguno', musculos: 'Espalda alta · Hombros' },
  { nombre: 'Superman con brazos alternos', grupo: 'tiron', nivel: 2, objetivos: 'grasa,musculo,resistencia', fase: 'principal', descripcion: 'Boca abajo, eleva brazo y pierna contrarios y alterna sin parar.', equipo: 'ninguno', musculos: 'Zona lumbar · Espalda · Glúteos' },

  // Core
  { nombre: 'Elevación de piernas', grupo: 'core', nivel: 2, objetivos: 'grasa,musculo,resistencia', fase: 'principal', descripcion: 'Boca arriba, sube las piernas estiradas hasta 90° y baja lento sin tocar el suelo.', equipo: 'ninguno', musculos: 'Abdomen bajo' },
  { nombre: 'Giro ruso', grupo: 'core', nivel: 2, objetivos: 'grasa,musculo', fase: 'principal', descripcion: 'Sentado e inclinado atrás, gira el tronco tocando el suelo a cada lado.', equipo: 'ninguno', musculos: 'Oblicuos · Abdomen' },
  { nombre: 'Tijeras abdominales', grupo: 'core', nivel: 2, objetivos: 'grasa,musculo,resistencia', fase: 'principal', descripcion: 'Boca arriba con las piernas en el aire, cruza una sobre otra sin parar.', equipo: 'ninguno', musculos: 'Abdomen · Flexores de cadera' },
  { nombre: 'Toques de talón', grupo: 'core', nivel: 1, objetivos: 'grasa,musculo', fase: 'principal', descripcion: 'Boca arriba, hombros despegados, lleva la mano a cada talón de lado a lado.', equipo: 'ninguno', musculos: 'Oblicuos' },
  { nombre: 'Escaladores cruzados', grupo: 'core', nivel: 2, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'En posición de flexión, lleva cada rodilla hacia el codo contrario.', equipo: 'ninguno', musculos: 'Oblicuos · Core · Cardio' },

  // Cardio
  { nombre: 'Saltar la cuerda (sin cuerda)', grupo: 'cardio', nivel: 1, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Saltitos rápidos en puntas de pie girando las muñecas como con una cuerda.', equipo: 'ninguno', musculos: 'Pantorrillas · Cardio' },
  { nombre: 'Talones al glúteo', grupo: 'cardio', nivel: 1, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Trota en el sitio llevando los talones hacia los glúteos.', equipo: 'ninguno', musculos: 'Isquiotibiales · Cardio' },
  { nombre: 'Sprint en el sitio', grupo: 'cardio', nivel: 2, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Corre en el sitio lo más rápido posible moviendo fuerte los brazos.', equipo: 'ninguno', musculos: 'Piernas · Cardio' },
  { nombre: 'Jumping jack con sentadilla', grupo: 'cardio', nivel: 2, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Salta abriendo las piernas y baja a sentadilla sumo; salta y cierra.', equipo: 'ninguno', musculos: 'Piernas · Glúteos · Cardio' },
  { nombre: 'Saltos de estrella', grupo: 'cardio', nivel: 3, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Desde media sentadilla, salta abriendo brazos y piernas en forma de estrella.', equipo: 'ninguno', musculos: 'Cuerpo completo · Potencia' },

  // Movilidad (bloque principal del objetivo movilidad)
  { nombre: 'El estiramiento más grande del mundo', grupo: 'movilidad', nivel: 1, objetivos: 'movilidad', fase: 'principal', descripcion: 'En zancada baja, apoya la mano, gira el torso y abre el brazo al techo.', equipo: 'ninguno', musculos: 'Cadera · Columna · Hombros' },
  { nombre: 'Círculos de cadera en 4 apoyos', grupo: 'movilidad', nivel: 1, objetivos: 'movilidad', fase: 'principal', descripcion: 'En cuatro apoyos, dibuja círculos grandes con la rodilla hacia afuera.', equipo: 'ninguno', musculos: 'Cadera · Glúteos' },
  { nombre: 'Bisagra de cadera', grupo: 'movilidad', nivel: 1, objetivos: 'movilidad,musculo', fase: 'principal', descripcion: 'Rodillas suaves, lleva la cadera atrás con la espalda recta y vuelve a subir.', equipo: 'ninguno', musculos: 'Isquiotibiales · Glúteos · Zona lumbar' },
  { nombre: 'Rotación de hombros en el suelo', grupo: 'movilidad', nivel: 1, objetivos: 'movilidad', fase: 'principal', descripcion: 'De lado, rodillas dobladas, abre el brazo de arriba como un libro.', equipo: 'ninguno', musculos: 'Columna torácica · Pecho' },

  // Enfriamiento
  { nombre: 'Estiramiento de glúteo (figura 4)', grupo: 'movilidad', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'enfriamiento', descripcion: 'Boca arriba, cruza un tobillo sobre la rodilla contraria y acerca las piernas.', equipo: 'ninguno', musculos: 'Glúteos · Cadera' },
  { nombre: 'Cobra suave', grupo: 'movilidad', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'enfriamiento', descripcion: 'Boca abajo, apoya las manos y eleva el pecho despacio sin forzar la espalda.', equipo: 'ninguno', musculos: 'Abdomen · Columna' },
  { nombre: 'Estiramiento de tríceps', grupo: 'movilidad', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'enfriamiento', descripcion: 'Lleva una mano a la espalda por detrás de la cabeza y empuja el codo suave.', equipo: 'ninguno', musculos: 'Tríceps · Hombros' },

  // Gimnasio
  { nombre: 'Hip thrust con barra', grupo: 'piernas', nivel: 2, objetivos: 'musculo,grasa', fase: 'principal', descripcion: 'Espalda alta en un banco, barra sobre la cadera, sube apretando glúteos.', equipo: 'gimnasio', musculos: 'Glúteos · Isquiotibiales' },
  { nombre: 'Zancadas con mancuernas', grupo: 'piernas', nivel: 2, objetivos: 'musculo,grasa,resistencia', fase: 'principal', descripcion: 'Con una mancuerna en cada mano, da un paso al frente y baja. Alterna.', equipo: 'gimnasio', musculos: 'Cuádriceps · Glúteos' },
  { nombre: 'Curl de bíceps con mancuernas', grupo: 'tiron', nivel: 1, objetivos: 'musculo', fase: 'principal', descripcion: 'Codos pegados al cuerpo, sube las mancuernas hasta los hombros y baja lento.', equipo: 'gimnasio', musculos: 'Bíceps · Antebrazos' },
  { nombre: 'Extensión de tríceps en polea', grupo: 'empuje', nivel: 1, objetivos: 'musculo', fase: 'principal', descripcion: 'Codos pegados, empuja la barra de la polea hacia abajo hasta estirar los brazos.', equipo: 'gimnasio', musculos: 'Tríceps' },
  { nombre: 'Aperturas con mancuernas', grupo: 'empuje', nivel: 2, objetivos: 'musculo', fase: 'principal', descripcion: 'Acostado en el banco, abre los brazos con codos suaves y júntalos arriba.', equipo: 'gimnasio', musculos: 'Pecho · Hombros' },
  { nombre: 'Elíptica a intervalos', grupo: 'cardio', nivel: 1, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Pedalea en la elíptica a ritmo fuerte usando también los brazos.', equipo: 'gimnasio', musculos: 'Cuerpo completo · Cardio' },
  { nombre: 'Farmer walk (caminata con pesas)', grupo: 'core', nivel: 2, objetivos: 'grasa,musculo,resistencia', fase: 'principal', descripcion: 'Camina erguido con una pesa pesada en cada mano y el abdomen firme.', equipo: 'gimnasio', musculos: 'Core · Agarre · Hombros' }
];
