// Catálogo inicial de ejercicios (todos se hacen en casa, sin equipo).
// Se inserta en la base de datos la primera vez que arranca el servidor.
//
// Campos:
//   nombre       → cómo se llama el ejercicio
//   grupo        → piernas | empuje | tiron | core | cardio | movilidad
//   nivel        → 1 principiante, 2 intermedio, 3 avanzado (nivel mínimo)
//   objetivos    → para qué objetivos sirve (separados por coma)
//   fase         → principal | calentamiento | enfriamiento
//   descripcion  → instrucción corta de cómo hacerlo

module.exports = [
  // ---------- CALENTAMIENTO ----------
  { nombre: 'Movilidad de hombros', grupo: 'movilidad', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'calentamiento', descripcion: 'Círculos amplios con los brazos, 10 hacia adelante y 10 hacia atrás.' },
  { nombre: 'Rotación de cadera', grupo: 'movilidad', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'calentamiento', descripcion: 'Manos en la cintura, dibuja círculos grandes con la cadera.' },
  { nombre: 'Marcha en el sitio', grupo: 'cardio', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'calentamiento', descripcion: 'Eleva las rodillas a ritmo suave y mueve los brazos.' },
  { nombre: 'Sentadilla con brazos arriba', grupo: 'movilidad', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'calentamiento', descripcion: 'Baja lento a media sentadilla estirando los brazos al techo.' },
  { nombre: 'Gato-camello', grupo: 'movilidad', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'calentamiento', descripcion: 'En cuatro apoyos, arquea y redondea la espalda despacio.' },

  // ---------- PIERNAS ----------
  { nombre: 'Sentadilla', grupo: 'piernas', nivel: 1, objetivos: 'grasa,musculo,resistencia', fase: 'principal', descripcion: 'Pies al ancho de hombros, baja como si te sentaras y sube empujando el suelo.' },
  { nombre: 'Zancada alterna', grupo: 'piernas', nivel: 1, objetivos: 'grasa,musculo,resistencia', fase: 'principal', descripcion: 'Da un paso largo al frente y baja la rodilla de atrás casi al suelo. Alterna.' },
  { nombre: 'Puente de glúteo', grupo: 'piernas', nivel: 1, objetivos: 'musculo,resistencia,movilidad', fase: 'principal', descripcion: 'Boca arriba, rodillas dobladas, eleva la cadera apretando glúteos.' },
  { nombre: 'Sentadilla sumo con pausa', grupo: 'piernas', nivel: 2, objetivos: 'musculo,resistencia', fase: 'principal', descripcion: 'Pies muy abiertos, baja y aguanta 2 segundos abajo.' },
  { nombre: 'Sentadilla con salto', grupo: 'piernas', nivel: 2, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Sentadilla normal y sube con un salto explosivo. Aterriza suave.' },
  { nombre: 'Zancada búlgara (en silla)', grupo: 'piernas', nivel: 2, objetivos: 'musculo', fase: 'principal', descripcion: 'Pie de atrás apoyado en una silla, baja con la pierna de adelante.' },
  { nombre: 'Sentadilla a una pierna (pistol asistida)', grupo: 'piernas', nivel: 3, objetivos: 'musculo', fase: 'principal', descripcion: 'Apóyate en una pared o marco de puerta y baja en una sola pierna.' },
  { nombre: 'Zancada con salto', grupo: 'piernas', nivel: 3, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Desde zancada, salta y cambia de pierna en el aire.' },
  { nombre: 'Sentadilla isométrica en pared', grupo: 'piernas', nivel: 1, objetivos: 'musculo,resistencia', fase: 'principal', descripcion: 'Espalda contra la pared, rodillas a 90°, aguanta.' },

  // ---------- EMPUJE (pecho, hombro, tríceps) ----------
  { nombre: 'Flexiones con rodillas', grupo: 'empuje', nivel: 1, objetivos: 'grasa,musculo,resistencia', fase: 'principal', descripcion: 'Rodillas en el suelo, cuerpo recto, baja el pecho al piso.' },
  { nombre: 'Flexiones inclinadas (en mesa)', grupo: 'empuje', nivel: 1, objetivos: 'musculo,resistencia', fase: 'principal', descripcion: 'Manos en una mesa firme, cuerpo recto, baja el pecho al borde.' },
  { nombre: 'Flexiones', grupo: 'empuje', nivel: 2, objetivos: 'grasa,musculo,resistencia', fase: 'principal', descripcion: 'Manos bajo los hombros, cuerpo en tabla, pecho casi al suelo.' },
  { nombre: 'Fondos en silla', grupo: 'empuje', nivel: 2, objetivos: 'musculo', fase: 'principal', descripcion: 'Manos en el borde de una silla detrás de ti, dobla codos y sube.' },
  { nombre: 'Flexiones pica (hombro)', grupo: 'empuje', nivel: 2, objetivos: 'musculo', fase: 'principal', descripcion: 'Cadera arriba en forma de V invertida, baja la cabeza hacia el suelo.' },
  { nombre: 'Flexiones diamante', grupo: 'empuje', nivel: 3, objetivos: 'musculo', fase: 'principal', descripcion: 'Manos juntas formando un rombo bajo el pecho.' },
  { nombre: 'Flexiones explosivas', grupo: 'empuje', nivel: 3, objetivos: 'grasa,musculo', fase: 'principal', descripcion: 'Empuja fuerte para que las manos se despeguen del suelo.' },

  // ---------- TIRÓN (espalda) ----------
  { nombre: 'Superman', grupo: 'tiron', nivel: 1, objetivos: 'musculo,resistencia,movilidad', fase: 'principal', descripcion: 'Boca abajo, eleva brazos y piernas a la vez y baja lento.' },
  { nombre: 'Remo con toalla en puerta', grupo: 'tiron', nivel: 1, objetivos: 'musculo', fase: 'principal', descripcion: 'Toalla atada a la manija de una puerta cerrada, inclínate atrás y tira.' },
  { nombre: 'Nadador (brazos Y-T-W)', grupo: 'tiron', nivel: 2, objetivos: 'musculo,movilidad', fase: 'principal', descripcion: 'Boca abajo, dibuja las letras Y, T y W con los brazos elevados.' },
  { nombre: 'Remo invertido bajo mesa', grupo: 'tiron', nivel: 3, objetivos: 'musculo', fase: 'principal', descripcion: 'Acostado bajo una mesa firme, agarra el borde y sube el pecho.' },

  // ---------- CORE ----------
  { nombre: 'Plancha', grupo: 'core', nivel: 1, objetivos: 'musculo,resistencia,movilidad', fase: 'principal', descripcion: 'Antebrazos en el suelo, cuerpo recto, abdomen apretado.' },
  { nombre: 'Bicho muerto (dead bug)', grupo: 'core', nivel: 1, objetivos: 'musculo,movilidad', fase: 'principal', descripcion: 'Boca arriba, estira brazo y pierna contrarios sin despegar la espalda.' },
  { nombre: 'Crunch abdominal', grupo: 'core', nivel: 1, objetivos: 'grasa,musculo', fase: 'principal', descripcion: 'Boca arriba, eleva los hombros contrayendo el abdomen.' },
  { nombre: 'Escaladores', grupo: 'core', nivel: 2, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'En posición de flexión, lleva rodillas al pecho rápido y alterno.' },
  { nombre: 'Plancha lateral', grupo: 'core', nivel: 2, objetivos: 'musculo,resistencia', fase: 'principal', descripcion: 'De lado sobre un antebrazo, cadera alta. Cambia de lado a la mitad.' },
  { nombre: 'Bicicleta abdominal', grupo: 'core', nivel: 2, objetivos: 'grasa,musculo', fase: 'principal', descripcion: 'Codo hacia rodilla contraria alternando, piernas en el aire.' },
  { nombre: 'Hollow hold', grupo: 'core', nivel: 3, objetivos: 'musculo,resistencia', fase: 'principal', descripcion: 'Boca arriba, brazos y piernas estirados y elevados, espalda pegada.' },
  { nombre: 'Plancha con toque de hombro', grupo: 'core', nivel: 2, objetivos: 'musculo,resistencia', fase: 'principal', descripcion: 'En posición de flexión, toca el hombro contrario sin mover la cadera.' },

  // ---------- CARDIO ----------
  { nombre: 'Jumping jacks', grupo: 'cardio', nivel: 1, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Salta abriendo piernas y brazos, vuelve a cerrar.' },
  { nombre: 'Rodillas arriba', grupo: 'cardio', nivel: 1, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Trota en el sitio subiendo las rodillas a la altura de la cadera.' },
  { nombre: 'Boxeo de sombra', grupo: 'cardio', nivel: 1, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Golpes rápidos al aire con guardia alta, mueve los pies.' },
  { nombre: 'Skater (patinador)', grupo: 'cardio', nivel: 2, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Salta de lado a lado cayendo en una pierna.' },
  { nombre: 'Burpees', grupo: 'cardio', nivel: 2, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Agáchate, lleva los pies atrás, vuelve y salta con los brazos arriba.' },
  { nombre: 'Burpee con flexión', grupo: 'cardio', nivel: 3, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Burpee completo añadiendo una flexión abajo.' },
  { nombre: 'Saltos de tijera rápidos', grupo: 'cardio', nivel: 3, objetivos: 'grasa,resistencia', fase: 'principal', descripcion: 'Alterna pierna adelante y atrás saltando lo más rápido posible.' },

  // ---------- MOVILIDAD (bloque principal para objetivo movilidad) ----------
  { nombre: 'Saludo al sol', grupo: 'movilidad', nivel: 1, objetivos: 'movilidad', fase: 'principal', descripcion: 'Secuencia fluida: brazos arriba, flexión al frente, plancha, cobra y vuelta.' },
  { nombre: 'Estocada con rotación', grupo: 'movilidad', nivel: 1, objetivos: 'movilidad', fase: 'principal', descripcion: 'En zancada baja, gira el torso hacia la pierna de adelante.' },
  { nombre: 'Perro boca abajo a cobra', grupo: 'movilidad', nivel: 1, objetivos: 'movilidad', fase: 'principal', descripcion: 'Pasa lento de V invertida a pecho abierto con cadera abajo.' },
  { nombre: 'Sentadilla profunda sostenida', grupo: 'movilidad', nivel: 2, objetivos: 'movilidad', fase: 'principal', descripcion: 'Baja al fondo de la sentadilla, codos empujan las rodillas hacia afuera.' },
  { nombre: 'Rotación torácica en 4 apoyos', grupo: 'movilidad', nivel: 1, objetivos: 'movilidad', fase: 'principal', descripcion: 'Mano en la nuca, abre el codo hacia el techo siguiendo con la mirada.' },
  { nombre: 'Puente con extensión de pierna', grupo: 'movilidad', nivel: 2, objetivos: 'movilidad,musculo', fase: 'principal', descripcion: 'En puente de glúteo, estira una pierna manteniendo la cadera alta.' },

  // ---------- ENFRIAMIENTO ----------
  { nombre: 'Estiramiento de cuádriceps', grupo: 'movilidad', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'enfriamiento', descripcion: 'De pie, lleva el talón al glúteo. Cambia de pierna a la mitad.' },
  { nombre: 'Estiramiento de isquios', grupo: 'movilidad', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'enfriamiento', descripcion: 'Sentado, piernas estiradas, lleva el pecho hacia las rodillas.' },
  { nombre: 'Postura del niño', grupo: 'movilidad', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'enfriamiento', descripcion: 'De rodillas, siéntate en los talones y estira los brazos al frente.' },
  { nombre: 'Estiramiento de pecho en pared', grupo: 'movilidad', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'enfriamiento', descripcion: 'Antebrazo en la pared y gira el cuerpo hacia el lado contrario.' },
  { nombre: 'Respiración profunda', grupo: 'movilidad', nivel: 1, objetivos: 'grasa,musculo,resistencia,movilidad', fase: 'enfriamiento', descripcion: 'Inhala 4 segundos, sostén 4, exhala 6. Relaja los hombros.' }
];
