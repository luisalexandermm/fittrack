// Recetas saludables con ingredientes de Colombia y del Pacífico.
// Las calorías (kcal) y proteínas son aproximadas por porción.
//
// tipo      → desayuno | almuerzo | cena | snack
// objetivos → para qué objetivos encaja mejor (separados por coma)

module.exports = [
  // ---------- DESAYUNOS ----------
  {
    nombre: 'Arepa de maíz con huevos pericos', tipo: 'desayuno', objetivos: 'grasa,musculo,resistencia,movilidad',
    kcal: 380, proteina: 18, minutos: 15,
    descripcion: 'El clásico de la casa, con más huevo y menos aceite.',
    ingredientes: ['1 arepa de maíz mediana', '2 huevos', '1/2 tomate picado', '2 cucharadas de cebolla larga', '1 cucharadita de aceite'],
    pasos: ['Asa la arepa en un sartén sin grasa.', 'Sofríe tomate y cebolla con la cucharadita de aceite.', 'Agrega los huevos batidos y revuelve hasta que cuajen.', 'Sirve los pericos sobre la arepa.']
  },
  {
    nombre: 'Avena con banano y canela', tipo: 'desayuno', objetivos: 'grasa,resistencia,movilidad',
    kcal: 330, proteina: 11, minutos: 10,
    descripcion: 'Energía que dura toda la mañana.',
    ingredientes: ['1/2 taza de avena en hojuelas', '1 taza de leche o bebida vegetal', '1 banano', 'Canela al gusto'],
    pasos: ['Cocina la avena con la leche a fuego medio 5 minutos.', 'Agrega el banano en rodajas.', 'Termina con canela.']
  },
  {
    nombre: 'Batido de borojó con avena', tipo: 'desayuno', objetivos: 'musculo,resistencia',
    kcal: 360, proteina: 14, minutos: 5,
    descripcion: 'La fruta insignia del Chocó en versión desayuno.',
    ingredientes: ['1/2 taza de pulpa de borojó', '1 taza de leche', '3 cucharadas de avena', '1 cucharadita de miel (opcional)'],
    pasos: ['Licúa todo con hielo.', 'Tómalo recién hecho.']
  },
  {
    nombre: 'Yogur con papaya y granola', tipo: 'desayuno', objetivos: 'grasa,movilidad',
    kcal: 300, proteina: 13, minutos: 5,
    descripcion: 'Fresco, rápido y suave para el estómago.',
    ingredientes: ['1 taza de yogur natural sin azúcar', '1 taza de papaya picada', '2 cucharadas de granola'],
    pasos: ['Sirve el yogur en un bowl.', 'Agrega la papaya y la granola encima.']
  },
  {
    nombre: 'Huevos revueltos con plátano cocido', tipo: 'desayuno', objetivos: 'musculo,resistencia',
    kcal: 420, proteina: 16, minutos: 20,
    descripcion: 'Plátano verde cocido en vez de frito: misma energía, menos grasa.',
    ingredientes: ['1/2 plátano verde', '2 huevos', '1 tajada de queso campesino', 'Sal y cebolla al gusto'],
    pasos: ['Cocina el plátano en agua con sal 15 minutos.', 'Haz los huevos revueltos con cebolla.', 'Sirve con el plátano y el queso.']
  },

  // ---------- ALMUERZOS ----------
  {
    nombre: 'Pescado sudado con arroz y ensalada', tipo: 'almuerzo', objetivos: 'grasa,musculo,resistencia,movilidad',
    kcal: 540, proteina: 38, minutos: 30,
    descripcion: 'Sabor del Pacífico, alto en proteína.',
    ingredientes: ['1 filete de pescado blanco (150 g)', '1 tomate', '1/2 cebolla', 'Cilantro y ajo', '3/4 taza de arroz cocido', 'Ensalada de lechuga y pepino'],
    pasos: ['Haz un hogao con tomate, cebolla y ajo.', 'Pon el pescado encima, tapa y cocina 12 minutos a fuego bajo.', 'Termina con cilantro.', 'Sirve con el arroz y la ensalada.']
  },
  {
    nombre: 'Pollo a la plancha con patacón al horno', tipo: 'almuerzo', objetivos: 'musculo,resistencia',
    kcal: 580, proteina: 42, minutos: 35,
    descripcion: 'Patacón crocante sin freír.',
    ingredientes: ['1 pechuga de pollo (150 g)', '1/2 plátano verde', 'Limón, ajo y sal', 'Ensalada de tomate y cebolla'],
    pasos: ['Adoba el pollo con limón, ajo y sal.', 'Aplana el plátano cocido y hornéalo 20 minutos a 200 °C.', 'Cocina el pollo a la plancha 5 minutos por lado.', 'Sirve con la ensalada.']
  },
  {
    nombre: 'Lentejas con arroz integral y aguacate', tipo: 'almuerzo', objetivos: 'grasa,resistencia,movilidad',
    kcal: 520, proteina: 22, minutos: 40,
    descripcion: 'Fibra y proteína vegetal que llenan de verdad.',
    ingredientes: ['1 taza de lentejas cocidas', '1/2 taza de arroz integral', '1/4 de aguacate', 'Hogao casero'],
    pasos: ['Calienta las lentejas con el hogao.', 'Sirve con el arroz integral.', 'Agrega el aguacate en tajadas.']
  },
  {
    nombre: 'Encocado ligero de pescado', tipo: 'almuerzo', objetivos: 'musculo,resistencia',
    kcal: 610, proteina: 36, minutos: 35,
    descripcion: 'El encocado de siempre con leche de coco rebajada.',
    ingredientes: ['1 filete de pescado (150 g)', '1/2 taza de leche de coco + 1/2 taza de agua', 'Pimentón, cebolla y ajo', '3/4 taza de arroz'],
    pasos: ['Sofríe pimentón, cebolla y ajo.', 'Agrega la leche de coco rebajada y deja espesar 5 minutos.', 'Cocina el pescado en la salsa 10 minutos.', 'Sirve con arroz.']
  },
  {
    nombre: 'Bowl de atún, arroz y verduras', tipo: 'almuerzo', objetivos: 'grasa,musculo',
    kcal: 480, proteina: 34, minutos: 15,
    descripcion: 'Para los días sin tiempo.',
    ingredientes: ['1 lata de atún en agua', '3/4 taza de arroz', 'Zanahoria rallada', 'Pepino y tomate', 'Limón'],
    pasos: ['Pon el arroz de base.', 'Agrega el atún escurrido y las verduras.', 'Aliña con limón y sal.']
  },

  // ---------- CENAS ----------
  {
    nombre: 'Tortilla de huevo con verduras', tipo: 'cena', objetivos: 'grasa,musculo,resistencia,movilidad',
    kcal: 390, proteina: 22, minutos: 15,
    descripcion: 'Liviana y rápida.',
    ingredientes: ['3 huevos', 'Espinaca', 'Tomate', 'Cebolla', '1 arepa pequeña'],
    pasos: ['Saltea las verduras 2 minutos.', 'Agrega los huevos batidos y cocina tapado.', 'Sirve con la arepa.']
  },
  {
    nombre: 'Sopa de verduras con pollo desmechado', tipo: 'cena', objetivos: 'grasa,movilidad',
    kcal: 360, proteina: 28, minutos: 35,
    descripcion: 'Reconfortante sin ser pesada.',
    ingredientes: ['100 g de pollo desmechado', 'Ahuyama, zanahoria, habichuela', '1/2 papa', 'Cilantro'],
    pasos: ['Cocina las verduras en agua con sal 20 minutos.', 'Agrega el pollo y deja 5 minutos más.', 'Termina con cilantro.']
  },
  {
    nombre: 'Wrap de pollo y aguacate', tipo: 'cena', objetivos: 'musculo,resistencia',
    kcal: 440, proteina: 32, minutos: 10,
    descripcion: 'Se arma en minutos con el pollo del almuerzo.',
    ingredientes: ['1 tortilla integral', '100 g de pollo', '1/4 de aguacate', 'Lechuga y tomate'],
    pasos: ['Calienta la tortilla.', 'Rellena con pollo, aguacate y verduras.', 'Enrolla y corta a la mitad.']
  },
  {
    nombre: 'Pescado a la plancha con yuca cocida', tipo: 'cena', objetivos: 'musculo,resistencia,grasa',
    kcal: 450, proteina: 34, minutos: 30,
    descripcion: 'Proteína limpia y un carbohidrato de la región.',
    ingredientes: ['1 filete de pescado (130 g)', '1 trozo de yuca (100 g)', 'Limón', 'Ensalada verde'],
    pasos: ['Cocina la yuca en agua con sal hasta que ablande.', 'Haz el pescado a la plancha con limón.', 'Sirve con la ensalada.']
  },
  {
    nombre: 'Ensalada de garbanzos', tipo: 'cena', objetivos: 'grasa,movilidad',
    kcal: 400, proteina: 17, minutos: 10,
    descripcion: 'Fría, fresca y con mucha fibra.',
    ingredientes: ['1 taza de garbanzos cocidos', 'Tomate, pepino y cebolla morada', 'Perejil', 'Limón y aceite de oliva'],
    pasos: ['Pica las verduras.', 'Mezcla con los garbanzos.', 'Aliña con limón, una cucharadita de aceite y sal.']
  },

  // ---------- SNACKS ----------
  {
    nombre: 'Fruta picada con limón', tipo: 'snack', objetivos: 'grasa,resistencia,movilidad',
    kcal: 140, proteina: 2, minutos: 5,
    descripcion: 'Mango, piña o papaya de temporada.',
    ingredientes: ['1 taza de fruta picada', 'Zumo de limón'],
    pasos: ['Pica la fruta y agrega el limón.']
  },
  {
    nombre: 'Yogur natural con frutos secos', tipo: 'snack', objetivos: 'musculo,resistencia,grasa',
    kcal: 250, proteina: 12, minutos: 2,
    descripcion: 'Proteína y grasas buenas entre comidas.',
    ingredientes: ['1 vaso de yogur natural', '1 puñado pequeño de maní o almendras'],
    pasos: ['Sirve el yogur y agrega los frutos secos.']
  },
  {
    nombre: 'Chontaduro con sal', tipo: 'snack', objetivos: 'musculo,resistencia',
    kcal: 210, proteina: 3, minutos: 2,
    descripcion: 'Energía del Pacífico, mejor sin miel.',
    ingredientes: ['3 chontaduros cocidos', 'Sal al gusto'],
    pasos: ['Pela y sirve con una pizca de sal.']
  },
  {
    nombre: 'Huevo cocido y mandarina', tipo: 'snack', objetivos: 'grasa,musculo,movilidad',
    kcal: 150, proteina: 7, minutos: 10,
    descripcion: 'Pequeño y fácil de llevar.',
    ingredientes: ['1 huevo cocido', '1 mandarina'],
    pasos: ['Cocina el huevo 10 minutos.', 'Acompaña con la mandarina.']
  },
  {
    nombre: 'Batido de borojó (porción pequeña)', tipo: 'snack', objetivos: 'musculo,resistencia',
    kcal: 200, proteina: 8, minutos: 5,
    descripcion: 'Ideal después de entrenar.',
    ingredientes: ['1/4 taza de pulpa de borojó', '1 vaso de leche', 'Hielo'],
    pasos: ['Licúa y toma después de la sesión.']
  }
];
