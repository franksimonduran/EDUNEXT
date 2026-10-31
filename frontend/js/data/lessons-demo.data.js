// Material original y breve para evaluar la interfaz. Requiere revisión
// pedagógica; no representa un currículo oficial ni una aprobación del MINEDU.
// Cada fila define una lección propia: título, explicación, ejemplo y ejercicio.
const packs = {
 'math-4': [
  ['¿Qué es una fracción?', 'Una fracción representa partes iguales de un todo. Primero dividimos el todo en partes del mismo tamaño y después contamos las que elegimos.', 'Una tira dividida en cuatro partes iguales tiene una parte coloreada. La parte coloreada representa un cuarto: 1/4.', 'Si coloreas una de cuatro partes iguales, ¿qué fracción coloreaste?', ['1/4','4/1','1/2'],0,['1 parte elegida','4 partes iguales','Un cuarto'],4,1],
  ['Numerador y denominador', 'El numerador indica cuántas partes elegimos. El denominador indica en cuántas partes iguales se dividió el todo.', 'En 2/4, el numerador es 2 y el denominador es 4. Hay dos de cuatro partes coloreadas.', 'En la fracción 2/4, ¿cuál es el denominador?', ['2','4','6'],1,['Numerador: 2','Denominador: 4','Dos cuartos'],4,2],
  ['Comparación de fracciones', 'Cuando dos fracciones tienen el mismo denominador, podemos comparar sus numeradores. Más partes iguales elegidas representan una cantidad mayor.', 'Tres cuartos es mayor que un cuarto, porque elegimos tres partes en lugar de una de la misma tira.', '¿Cuál es mayor: 1/4 o 3/4?', ['1/4','Son iguales','3/4'],2,['Mismo tamaño','3 partes de 4','Tres cuartos'],4,3],
  ['Fracciones en la vida cotidiana', 'Podemos usar fracciones para repartir materiales en partes iguales. Siempre debemos comprobar que las partes tengan el mismo tamaño.', 'Al repartir una tira en cuatro partes iguales para cuatro personas, cada persona recibe 1/4 de la tira.', 'Cuatro personas reparten una tira en partes iguales. ¿Qué recibe cada una?', ['La tira entera','1/4 de la tira','4 tiras'],1,['Una tira','Cuatro personas','Un cuarto cada una'],4,1],
 ],
 'math-5': [
  ['Comprende los decimales', 'Los números decimales permiten expresar partes de una unidad. En esta muestra usamos el punto como separador decimal.', 'Si dividimos una unidad en diez partes iguales y elegimos tres, tenemos tres décimas: 0.3.', 'Tres décimas se escriben como…', ['0.3','3.0','0.03'],0,['Una unidad','Tres décimas','0.3'],10,3],
  ['Décimas y centésimas', 'La primera posición después del punto decimal corresponde a las décimas. La segunda corresponde a las centésimas.', 'En 0.25 hay dos décimas y cinco centésimas. Veinticinco de cien partes equivalen a un cuarto de la unidad.', '¿Qué cifra ocupa el lugar de las centésimas en 0.25?', ['2','5','0'],1,['2 décimas','5 centésimas','0.25'],20,5],
  ['Relaciona fracciones y decimales', 'Las fracciones y los decimales pueden representar la misma cantidad. Cinco de diez partes es la mitad de una unidad.', 'La fracción 5/10 y el decimal 0.5 representan la misma cantidad: una mitad.', '¿Qué decimal representa cinco décimas?', ['0.05','5.0','0.5'],2,['5 de 10','Una mitad','0.5'],10,5],
  ['Decimales de la vida cotidiana', 'Los decimales ayudan a describir medidas. Debemos conservar la unidad de medida para comprender la cantidad.', 'Una cinta de 0.8 metros ocupa ocho de diez partes iguales de un metro.', 'Una cinta de 0.8 metros equivale a…', ['Ocho décimas de metro','Ocho metros','Una centésima de metro'],0,['Un metro','Ocho décimas','0.8 m'],10,8],
 ],
 'math-6': [
  ['¿Qué es un porcentaje?', 'Un porcentaje expresa una cantidad de cada cien partes iguales. El símbolo de porcentaje es %. Cincuenta por ciento es la mitad.', 'Si 50 de 100 casillas están coloreadas, está coloreado el 50 % del total.', 'El 50 % representa…', ['La mitad','El doble','Nada'],0,['50 de 100','Una mitad','50 %'],10,5],
  ['Porcentaje y fracción', 'Podemos relacionar porcentajes con fracciones conocidas. Veinticinco por ciento representa veinticinco de cien partes y equivale a un cuarto.', '25 % = 25/100 = 1/4. Las tres formas indican la misma parte de una unidad.', '¿Qué fracción equivale a 25 %?', ['1/2','1/4','3/4'],1,['25 de 100','Un cuarto','25 %'],20,5],
  ['Calcula porcentajes sencillos', 'Para encontrar el diez por ciento de una cantidad podemos dividirla entre diez. Comprobamos que el resultado sea menor que el total.', 'El 10 % de 40 es 4. Diez grupos de 4 forman 40.', '¿Cuánto es el 10 % de 40?', ['40','10','4'],2,['Total: 40','Dividir entre 10','Resultado: 4'],10,1],
  ['Interpreta un porcentaje', 'Un porcentaje necesita un total de referencia. Tres cuartos de un grupo equivalen al setenta y cinco por ciento de ese mismo grupo.', 'Si 15 de 20 libros son de cuentos, los cuentos representan el 75 % de esos 20 libros.', '15 de 20 libros equivalen al…', ['25 %','75 %','15 %'],1,['20 libros','15 de cuentos','75 %'],20,15],
 ],
 'reading-4': [
  ['Leemos para comprender', 'Leer es construir el significado de un texto. Podemos preguntarnos quién participa, qué sucede y dónde ocurre la historia.', 'Ana sembró una semilla en una maceta. Cada mañana la regó. Una semana después apareció una hoja.', '¿Qué sembró Ana?', ['Una semilla','Una hoja','Una maceta'],0,['Ana','Siembra','Una planta']],
  ['Encuentra información explícita', 'La información explícita aparece escrita en el texto. Para encontrarla, volvemos a leer la parte que responde nuestra pregunta.', 'Luis llevó dos libros a la biblioteca el lunes. El texto nos dice cuántos libros llevó y cuándo lo hizo.', '¿Cuántos libros llevó Luis?', ['Uno','Dos','Tres'],1,['Luis','Dos libros','Biblioteca']],
  ['Descubre una idea implícita', 'A veces un texto da pistas sin decir todo directamente. Inferir es relacionar esas pistas con lo que sabemos.', 'Marta tomó su paraguas al ver nubes oscuras. Podemos inferir que pensó que podía llover.', '¿Por qué Marta tomó su paraguas?', ['Porque hacía calor','Para leer','Porque podía llover'],2,['Nubes oscuras','Paraguas','Posible lluvia']],
  ['Cuenta lo más importante', 'Un resumen cuenta lo esencial con pocas palabras. No necesita repetir todos los detalles del texto.', 'En la historia de Ana, lo principal es que cuidó una semilla y observó su crecimiento.', '¿Qué cuenta mejor lo principal de la historia de Ana?', ['Cuidó una semilla que creció','Las macetas son redondas','Todos los días son iguales'],0,['Semilla','Cuidado','Crecimiento']],
 ],
 'reading-5': [
  ['¿Qué es un texto informativo?', 'Un texto informativo explica un tema y presenta datos. Su propósito principal es ayudarnos a conocer algo.', 'Un texto sobre las abejas puede explicar cómo transportan polen entre las flores.', 'Un texto informativo busca principalmente…', ['Informar sobre un tema','Inventar una aventura','Dar una orden sin explicar'],0,['Tema','Datos','Información']],
  ['Identifica la idea principal', 'La idea principal expresa lo más importante de un párrafo. Los detalles la explican o la amplían.', 'Las abejas ayudan a muchas plantas a reproducirse. Al visitar flores transportan polen de una a otra.', '¿Cuál es la idea principal del ejemplo?', ['Las flores tienen colores','Las abejas ayudan a reproducirse a las plantas','Las abejas solo vuelan de noche'],1,['Abejas','Transportan polen','Ayudan a plantas']],
  ['Organiza la información', 'Los títulos y subtítulos orientan la lectura. Podemos agrupar datos que explican el mismo aspecto de un tema.', 'En un texto sobre el agua podemos organizar secciones sobre sus usos, su cuidado y su ciclo.', '¿Qué ayuda a organizar las partes de un texto?', ['Una palabra aislada','Solo el color del papel','Los subtítulos'],2,['Usos del agua','Cuidado','Ciclo del agua']],
  ['Comprueba lo que lees', 'Antes de repetir un dato conviene revisar quién lo publica y qué explica. Podemos comparar fuentes confiables con ayuda del docente.', 'Si un texto afirma algo sorprendente sin explicar su origen, buscamos otra fuente antes de darlo por cierto.', '¿Qué conviene hacer ante un dato sin fuente?', ['Compararlo con una fuente confiable','Creerlo siempre','Cambiar su significado'],0,['Leer','Revisar fuente','Comparar']],
 ],
 'reading-6': [
  ['Relaciona ideas de un texto', 'Comprender un texto avanzado requiere conectar sus ideas. Los conectores ayudan a reconocer causas, consecuencias y contrastes.', 'El jardín recibió agua; por eso las plantas pudieron crecer. La expresión por eso presenta una consecuencia.', '¿Qué relación señala por eso?', ['Consecuencia','Oposición','Una lista de nombres'],0,['Recibió agua','Por eso','Pudo crecer']],
  ['Distingue hechos y opiniones', 'Un hecho puede comprobarse con información. Una opinión expresa una valoración o preferencia.', 'La biblioteca abre a las ocho es un dato comprobable. La biblioteca es el lugar más bonito expresa una opinión.', '¿Cuál es una opinión?', ['La puerta mide dos metros','Es el lugar más bonito','Abre a las ocho'],1,['Hecho','Comprobar','Opinión: valorar']],
  ['Reconoce la intención del autor', 'El autor puede informar, explicar, convencer o narrar. El vocabulario y los ejemplos ofrecen pistas sobre su intención.', 'Un afiche que invita a cuidar el agua y explica acciones busca animarnos a actuar.', 'Un afiche que invita a ahorrar agua intenta…', ['Dar una dirección postal','Narrar una leyenda','Convencernos de cuidarla'],2,['Mensaje','Razones','Invitación a actuar']],
  ['Sustenta tu interpretación', 'Una interpretación debe apoyarse en pistas del texto. Explicamos qué pensamos y qué parte de la lectura lo respalda.', 'Podemos decir que el personaje fue perseverante porque volvió a intentarlo después de equivocarse.', '¿Qué fortalece una interpretación?', ['Una evidencia del texto','Un dato inventado','Una respuesta sin explicación'],0,['Interpretación','Pista del texto','Explicación']],
 ],
 'science-4': [
  ['Conoce un ecosistema', 'Un ecosistema incluye seres vivos y elementos no vivos de un lugar. El agua, la luz y el suelo se relacionan con las plantas y los animales.', 'En un jardín, las plantas usan luz y agua. Algunos animales se alimentan de esas plantas.', '¿Cuál es un elemento no vivo del jardín?', ['El agua','Una mariposa','Una planta'],0,['Luz y agua','Plantas','Animales']],
  ['Relaciones de alimentación', 'Los seres vivos necesitan energía. Una cadena de alimentación muestra cómo pasa la energía de un organismo a otro.', 'El pasto recibe luz del sol. Un conejo come pasto. Así se relacionan sus fuentes de energía.', 'En este ejemplo, ¿qué come el conejo?', ['Piedras','Pasto','Luz directamente'],1,['Sol','Pasto','Conejo']],
  ['El hábitat de los seres vivos', 'Un hábitat es el lugar donde un ser vivo encuentra condiciones para vivir. Allí busca alimento, refugio y agua.', 'Una rana necesita un ambiente adecuado con humedad y lugares donde refugiarse.', '¿Qué necesita un hábitat adecuado?', ['Solo ruido','Solo piedras','Agua, alimento y refugio'],2,['Agua','Alimento','Refugio']],
  ['Cuidamos los ecosistemas', 'Nuestras acciones pueden cuidar o dañar un ecosistema. Evitar residuos y respetar a los seres vivos ayuda a conservarlo.', 'Durante una visita al parque recogemos nuestros residuos y observamos las plantas sin arrancarlas.', '¿Qué acción cuida el parque?', ['Llevarse los residuos','Arrancar plantas','Dejar envolturas'],0,['Observar','Respetar','Cuidar']],
 ],
 'science-5': [
  ['El cuerpo trabaja en equipo', 'Los órganos del cuerpo colaboran. Los sistemas reúnen órganos que cumplen funciones relacionadas.', 'El corazón y los vasos sanguíneos participan en el transporte de la sangre por el cuerpo.', '¿Qué órgano impulsa la sangre?', ['El corazón','El estómago','Un hueso'],0,['Corazón','Vasos','Transporte']],
  ['Respiramos para vivir', 'Al respirar incorporamos oxígeno del aire. Los pulmones participan en el intercambio de gases que necesita el cuerpo.', 'El aire entra por las vías respiratorias y llega a los pulmones.', '¿Qué órganos participan en el intercambio de gases?', ['Los huesos','Los pulmones','Los dientes'],1,['Aire','Vías respiratorias','Pulmones']],
  ['El recorrido de los alimentos', 'La digestión transforma los alimentos para aprovechar nutrientes. La boca, el estómago y el intestino participan en ese proceso.', 'Masticar inicia el proceso. Después los alimentos continúan su recorrido por el sistema digestivo.', '¿Dónde comienza la digestión?', ['En los pies','En los pulmones','En la boca'],2,['Boca','Estómago','Intestino']],
  ['Hábitos de cuidado', 'El descanso, la actividad física y una alimentación variada contribuyen al cuidado del cuerpo. Pedimos ayuda adulta cuando nos sentimos mal.', 'Dormir lo suficiente y lavarse las manos son acciones cotidianas de cuidado.', '¿Cuál es un hábito de cuidado?', ['Lavarse las manos','No descansar nunca','Evitar siempre el agua'],0,['Descanso','Higiene','Cuidado']],
 ],
 'science-6': [
  ['La energía produce cambios', 'La energía permite producir cambios, como movimiento, luz o calor. Podemos observar sus efectos en situaciones cotidianas.', 'Una lámpara transforma energía eléctrica en luz y también produce algo de calor.', 'Una lámpara encendida produce…', ['Luz y algo de calor','Solo agua','Solo sonido'],0,['Electricidad','Lámpara','Luz']],
  ['Formas de energía', 'La energía puede manifestarse como movimiento, calor, luz y otras formas. Una situación puede mostrar más de una forma.', 'Una pelota en movimiento tiene energía asociada a su movimiento.', '¿Qué ejemplo muestra movimiento?', ['Un cuaderno quieto','Una pelota rodando','Una pared inmóvil'],1,['Empujar','Pelota','Movimiento']],
  ['Fuentes renovables', 'Las fuentes renovables se reponen de manera natural. El sol y el viento pueden aprovecharse para producir electricidad.', 'Un panel solar puede transformar la energía de la luz del sol en energía eléctrica.', '¿Cuál es una fuente renovable?', ['El carbón','El petróleo','El sol'],2,['Sol','Panel solar','Electricidad']],
  ['Usamos la energía con cuidado', 'Evitar el desperdicio ayuda a usar responsablemente la energía. Podemos apagar aparatos que no necesitamos.', 'Al salir de una habitación vacía apagamos la luz si ya no es necesaria.', '¿Qué acción evita desperdiciar electricidad?', ['Apagar una luz innecesaria','Dejar todo encendido','Abrir el refrigerador sin motivo'],0,['Observar','Apagar','Ahorrar']],
 ],
 'social-4': [
  ['Somos parte de una comunidad', 'Una comunidad reúne personas que comparten un lugar o actividades. Sus integrantes colaboran y tienen distintas necesidades.', 'En un barrio hay familias, escuelas y espacios donde las personas se encuentran.', 'Una comunidad está formada principalmente por…', ['Personas que se relacionan','Solo edificios vacíos','Solo vehículos'],0,['Personas','Lugares','Colaboración']],
  ['Servicios de mi comunidad', 'Los servicios ayudan a atender necesidades. La escuela, el centro de salud y la biblioteca cumplen funciones diferentes.', 'La biblioteca permite consultar libros y participar en actividades de lectura.', '¿Dónde podemos consultar libros?', ['En un semáforo','En la biblioteca','En una tubería'],1,['Escuela','Biblioteca','Centro de salud']],
  ['Acuerdos para convivir', 'Los acuerdos organizan la convivencia. Escuchar y respetar los turnos permite que más personas participen.', 'En una reunión de aula levantamos la mano y esperamos nuestro turno para hablar.', '¿Qué ayuda a escuchar a todos?', ['Interrumpir siempre','Gritar más fuerte','Respetar los turnos'],2,['Escuchar','Esperar turno','Participar']],
  ['Cuidamos los espacios comunes', 'Los espacios comunes son compartidos. Cuidarlos permite que otras personas también los disfruten.', 'Después de usar materiales de la biblioteca los devolvemos al lugar indicado.', '¿Qué acción cuida un espacio común?', ['Devolver los materiales','Romper los libros','Dejar basura'],0,['Usar','Cuidar','Compartir']],
 ],
 'social-5': [
  ['Nos organizamos para colaborar', 'Las personas se organizan para cumplir tareas y atender necesidades comunes. La colaboración requiere acuerdos claros.', 'Un grupo de aula puede distribuir tareas para preparar una exposición.', 'Organizar tareas ayuda a…', ['Colaborar mejor','Evitar toda participación','Que nadie sepa qué hacer'],0,['Acuerdos','Tareas','Colaboración']],
  ['Instituciones y funciones', 'Las instituciones cumplen funciones para la sociedad. Conocerlas nos ayuda a comprender a quién acudir.', 'La municipalidad participa en la gestión de servicios y espacios de la localidad.', '¿Qué institución participa en la gestión local?', ['Un personaje de cuento','La municipalidad','Una nube'],1,['Comunidad','Municipalidad','Servicios locales']],
  ['Tomamos decisiones en grupo', 'Decidir en grupo requiere escuchar propuestas y explicar razones. Los acuerdos deben respetar a las personas.', 'Un aula compara dos propuestas para una actividad y escucha las razones antes de elegir.', 'Antes de elegir conviene…', ['Ignorar propuestas','Decidir sin escuchar','Comparar razones'],2,['Propuestas','Razones','Acuerdo']],
  ['Responsabilidades compartidas', 'Una responsabilidad es un compromiso que debemos cumplir. Repartir responsabilidades no elimina el respeto por los demás.', 'Si acordamos ordenar los materiales, cumplimos la tarea y pedimos ayuda cuando la necesitamos.', '¿Qué muestra responsabilidad?', ['Cumplir un acuerdo','Ocultar todos los materiales','Ignorar el compromiso'],0,['Compromiso','Acción','Cumplimiento']],
 ],
 'social-6': [
  ['Ciudadanía en la vida diaria', 'La ciudadanía incluye participar, respetar derechos y asumir responsabilidades. Podemos practicarla en la escuela y la comunidad.', 'Escuchar a los compañeros y cuidar los espacios compartidos son formas de participación responsable.', '¿Qué acción favorece la convivencia?', ['Escuchar con respeto','Excluir a otros','Dañar espacios'],0,['Derechos','Respeto','Participación']],
  ['Derechos y responsabilidades', 'Los derechos protegen a las personas. Las responsabilidades ayudan a respetar también los derechos de los demás.', 'Tenemos derecho a ser escuchados y la responsabilidad de escuchar sin humillar a otros.', '¿Qué acompaña al derecho a ser escuchado?', ['Interrumpir siempre','Escuchar a los demás','Burlarse de otros'],1,['Ser escuchado','Escuchar','Respetar']],
  ['Resolvemos desacuerdos', 'Un desacuerdo puede resolverse mediante diálogo. Describimos lo ocurrido, escuchamos y buscamos una solución sin violencia.', 'Dos grupos quieren el mismo material. Dialogan y acuerdan turnos para utilizarlo.', '¿Qué solución respeta a ambos grupos?', ['Quitar el material por fuerza','Insultarse','Acordar turnos'],2,['Desacuerdo','Diálogo','Solución']],
  ['Participamos con propuestas', 'Una propuesta explica una mejora y cómo realizarla. Puede partir de una necesidad observada en la comunidad.', 'Un aula propone colocar recordatorios para mantener limpio un espacio compartido.', 'Una propuesta útil debe…', ['Explicar una mejora posible','Dañar a otras personas','Ignorar la necesidad'],0,['Necesidad','Propuesta','Mejora']],
 ],
 'english-4': [
  ['Saludos en inglés', 'Hello es un saludo en inglés. Goodbye se usa para despedirse. Podemos practicar ambas expresiones en una conversación breve.', 'Al llegar decimos Hello. Al despedirnos podemos decir Goodbye.', '¿Qué palabra sirve para saludar?', ['Hello','Goodbye','Cat'],0,['Hello','Saludar','Goodbye']],
  ['Nombres de animales', 'Algunas palabras para animales son cat, gato; dog, perro; y bird, pájaro. Relacionar palabras con su significado ayuda a recordarlas.', 'The cat is small significa El gato es pequeño.', '¿Qué significa dog?', ['Gato','Perro','Pájaro'],1,['Cat: gato','Dog: perro','Bird: pájaro']],
  ['Colores que nos rodean', 'Blue significa azul, red significa rojo y green significa verde. Podemos buscar objetos para relacionarlos con cada color.', 'A blue pencil es un lápiz azul.', '¿Qué color expresa blue?', ['Rojo','Verde','Azul'],2,['Blue: azul','Red: rojo','Green: verde']],
  ['Presentamos nuestro nombre', 'My name is se utiliza para presentar nuestro nombre. En esta demostración usamos un personaje ficticio.', 'My name is Alex significa Mi nombre es Alex.', '¿Qué expresión presenta un nombre?', ['My name is Alex','Goodbye','A green book'],0,['My name is','Alex','Presentación']],
 ],
 'english-5': [
  ['Expresiones de cada día', 'Good morning significa buenos días. Thank you significa gracias. Son expresiones útiles en situaciones cotidianas.', 'Al recibir ayuda podemos decir Thank you.', '¿Qué expresión significa gracias?', ['Thank you','Good night','Hello'],0,['Good morning','Thank you','Goodbye']],
  ['Pedimos ayuda con amabilidad', 'Please significa por favor. La expresión Can you help me, please? sirve para pedir ayuda de forma amable.', 'Can you help me, please? significa ¿Puedes ayudarme, por favor?', '¿Qué palabra significa por favor?', ['Book','Please','Blue'],1,['Can you help me?','Please','Ayuda amable']],
  ['Hablamos de rutinas', 'Podemos describir acciones habituales con frases breves. I read significa Yo leo y I play significa Yo juego.', 'I read a book significa Yo leo un libro.', '¿Qué significa I read?', ['Yo salto','Yo duermo','Yo leo'],2,['I read','A book','Yo leo un libro']],
  ['Objetos del aula', 'Book significa libro, pencil significa lápiz y desk significa escritorio. Estas palabras nos ayudan a describir el aula.', 'This is a pencil significa Este es un lápiz.', '¿Qué palabra significa libro?', ['Book','Dog','Green'],0,['Book','Pencil','Desk']],
 ],
 'english-6': [
  ['Nos presentamos con claridad', 'Podemos saludar y presentarnos con frases breves. Hello, my name is Alex combina un saludo con una presentación.', 'Hello, my name is Alex significa Hola, mi nombre es Alex.', '¿Qué expresa My name is Alex?', ['Una presentación','Una despedida','Un color'],0,['Hello','My name is Alex','Presentación']],
  ['Expresamos preferencias', 'I like significa Me gusta. Podemos usar esta expresión para hablar de actividades y objetos.', 'I like reading significa Me gusta leer.', '¿Qué significa I like reading?', ['No puedo leer','Me gusta leer','Voy a dormir'],1,['I like','Reading','Me gusta leer']],
  ['Preguntas sencillas', 'What is your name? pregunta ¿Cómo te llamas? Escuchamos la respuesta y respetamos el turno de conversación.', 'A la pregunta What is your name? podemos responder My name is Alex.', '¿Qué pregunta pide un nombre?', ['What colour is it?','Where is the book?','What is your name?'],2,['Pregunta','Escuchar','Responder']],
  ['Una conversación breve', 'Una conversación combina saludos, preguntas y respuestas. Podemos terminar con una despedida amable.', 'Hello. What is your name? My name is Alex. Goodbye.', '¿Qué expresión puede cerrar la conversación?', ['Goodbye','My name is','What is your name?'],0,['Hello','Conversación','Goodbye']],
 ],
};

export const topicKeys = Object.freeze(Object.keys(packs));
const alternateExamples = {
 'math-4':'Una hoja tiene ocho partes iguales. Si marcas tres, representas 3/8: numerador 3 y denominador 8.',
 'math-5':'Medio litro puede escribirse como 0.5 litros. Es la misma cantidad que cinco décimas de litro.',
 'math-6':'De 100 semillas, 20 han germinado. El 20 % ha germinado y 80 semillas todavía no lo han hecho.',
 'reading-4':'Pedro vio hojas moviéndose y sostuvo su sombrero. El texto da pistas de que había viento.',
 'reading-5':'Un texto sobre el reciclaje puede agrupar información en Materiales, Separación y Reutilización. Cada subtítulo orienta la lectura.',
 'reading-6':'El personaje regresó a ayudar aunque estaba cansado. Esa acción es una pista para interpretar que fue solidario.',
 'science-4':'En una laguna conviven agua, plantas y animales. Si entran residuos, pueden cambiar las condiciones de ese ecosistema.',
 'science-5':'Cuando corremos, músculos, corazón y pulmones colaboran. No trabaja un solo órgano de manera aislada.',
 'science-6':'El viento mueve las aspas de un aerogenerador. Ese movimiento puede aprovecharse para producir electricidad.',
 'social-4':'Un grupo cuida las plantas de su patio por turnos. Colaborar y respetar el espacio ayuda a su comunidad.',
 'social-5':'Para organizar una feria, el aula acuerda quién prepara carteles, quién ordena materiales y cómo se ayudarán.',
 'social-6':'Dos compañeros quieren participar primero. Escuchan sus razones y acuerdan turnarse sin excluirse.',
 'english-4':'Hello, Alex! es un saludo. A red book significa un libro rojo. Puedes relacionar cada expresión con su significado.',
 'english-5':'Good morning. Can you help me, please? combina un saludo y una petición amable para una situación del aula.',
 'english-6':'Hello. My name is Sam. I like music. Goodbye. Esta conversación breve incluye presentación, preferencia y despedida.',
};
export function getLessonRows(courseId, grade) { return packs[`${courseId}-${grade}`] ?? null; }

export function buildLessons(course, unitId) {
 const rows = getLessonRows(course.id, course.grade);
 return rows.map((row,index) => {
  const [title,body,example,question,options,answer,labels,parts,filled] = row;
  const id = `${unitId}-l${index+1}`;
  const progress = Math.max(0,Math.min(100,course.progress*4-index*100));
  const narration = `${title}. ${body} Por ejemplo: ${example}`;
  return {
   id, unitId, courseId:course.id, grade:course.grade, number:index+1, title,
   objective:`Comprender y explicar con tus palabras: ${title.toLowerCase()}.`,
   duration:5+index, progress,
   blocks:[{type:'paragraph',text:body},{type:'callout',title:'Recuerda',text:course.id==='math'?'Comprueba siempre cuál es la unidad y explica cómo llegaste a tu respuesta.':'Lee el ejemplo con atención y relaciona la idea con una situación que conozcas.'}],
   examples:[example],
   images:[{kind:parts?'parts':'concepts',parts,filled,labels,caption:example}],
   audio:{src:`../assets/audio/lessons/${id}.wav`,transcript:narration,language:'es-MX'},
   exercise:{question,options,answer,correct:`¡Bien! ${example}`,incorrect:`Revisa el ejemplo: ${example}`},
   help:{easy:`En pocas palabras: ${body.split('. ')[0]}.`,steps:[`Observa: ${labels[0]}.`,`Relaciona: ${labels[1]}.`,`Explica con tus palabras: ${labels[2]}.`],example:alternateExamples[`${course.id}-${course.grade}`]},
   offline:{downloaded:false,verified:false},
  };
 });
}
