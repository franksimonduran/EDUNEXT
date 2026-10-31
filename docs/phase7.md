# Fase 7 — AITHRON TUTOR IA

## Abrir localmente

Desde la raíz del repositorio:

```powershell
python -m http.server 8080 --bind 127.0.0.1 --directory frontend
```

Abrir **http://127.0.0.1:8080/student/tutor.html?grade=5**. También se puede abrir desde el Sidebar ("Tutor IA"), desde la navegación inferior del Dashboard, desde "Mis cursos" en el Topbar, o desde la pestaña "Practicar" de cualquier lección usando el botón "No entendí".

No necesita compilación ni dependencias de ejecución. Servir por HTTP es necesario para los módulos y recursos; no utilizar `file://`.

## Referencia visual

Se consultó nuevamente el ZIP disponible (`D:\Programing\ATHRON EDU.zip`): no se encontraron imágenes del Tutor IA. Se informó antes de implementar. La interfaz reutiliza la identidad, variables, componentes y estilos de Dashboard, Aprende y Practica. La comparación exacta con el mockup queda pendiente de recibir esas imágenes.

## Interfaz entregada

### Pantalla principal `tutor.html`

- Encabezado con avatar, título "AITHRON TUTOR", subtítulo, descripción y badge de modo (Demo/Offline/No disponible).
- Layout de tres paneles en escritorio: conversaciones (izquierda), chat (centro), contexto (derecha).
- En tablet: conversaciones contraíble, chat principal, contexto desplegable.
- En móvil: chat principal, conversaciones y contexto como `details` desplegables.

### Chat educativo

- Mensaje de bienvenida con 4 tarjetas sugeridas: "Explícame un tema", "Dame un ejemplo", "Ayúdame con una pregunta", "Quiero repasar".
- Burbujas diferenciadas: usuario (derecha, azul corporativo) y Tutor (izquierda, blanco/azul claro, avatar morado).
- Burbujas del Tutor soportan: párrafo, pasos numerados, ejemplo, pista, pregunta orientadora, diagrama SVG, representación matemática (fracción/decimal/porcentaje), enlace de repaso a lección.
- Acciones rápidas bajo cada respuesta: "Explícamelo fácil", "Paso a paso", "Otro ejemplo", "Muéstramelo visualmente", "Dame una pista", "Quiero practicar", "Volver al tema".
- Caja de escritura autoajustable (máx. 128 px), placeholder, atajo Enter para enviar, Shift+Enter para salto de línea, contador de caracteres, validación de longitud y mensajes vacíos.
- Indicador de carga, bloqueo de envíos duplicados, restauración tras error.
- Mensajes anunciados vía `aria-live="polite"`; foco gestionado al enviar/recibir.

### 15 ejemplos predefinidos

Tres grados (4.º, 5.º, 6.º) × cinco asignaturas: Matemática, Comunicación, Ciencia y Tecnología, Personal Social, Inglés. Cada ejemplo incluye:

- Explicación, ejemplo cotidiano, pasos, pista, pregunta orientadora, diagrama SVG (partes, conceptos, flujo), representación matemática (fracción/decimal/porcentaje según grado), repaso a lección.
- Contenido en español, controles en español/inglés.

### Estrategias "No entendí"

Botón 🧠 en la lección y en el chat. Diálogo con opciones: explicación sencilla, paso a paso, otro ejemplo, dibujo (diagrama de la lección), pista, abrir Aithron Tutor. Al abrir Tutor desde "No entendí", se transmiten IDs reales (grado, curso, unidad, lección) y se filtra el ejemplo correspondiente.

### Conversaciones temporales

- Hasta 10 conversaciones en memoria, máx. 80 mensajes por conversación.
- Cada conversación conserva: mensajes, borrador, ejemplo asociado, contexto académico, posición de scroll, mensajes no leídos.
- "Nueva conversación" crea intento limpio; "Limpiar conversación" pide confirmación y preserva la conversación vacía con su contexto.
- Borrador se conserva al cambiar de conversación.
- Al recargar: estado se reinicia (conversaciones en memoria no persisten). No hay LocalStorage/SessionStorage/IndexedDB.

### Panel de contexto

Muestra grado, curso, unidad, lección y tema. Si no hay lección seleccionada: mensaje general y grado de muestra. Enlace "Volver a mi lección" hacia la URL exacta. Lista de ejemplos disponibles del grado actual. En móvil: `details` desplegable.

### Estados de disponibilidad

Badge en encabezado: "Demostración" (azul morado), "Sin conexión" (naranja), "No disponible" (rojo). Preparado para "Conectado" (verde) cuando exista backend. Indicador offline en chat y aviso de limitaciones. Nunca simula IA conectada.

### Privacidad y seguridad

- Mensaje fijo: "Recuerda: no compartas tus datos personales".
- No se guardan credenciales, alias, roles, datos institucionales ni información personal en almacenamiento.
- No se persisten conversaciones en LocalStorage/SessionStorage/IndexedDB.
- No hay claves API en el navegador.
- Entrada del usuario escapada y renderizada como texto; no se evalúa HTML/JS.
- No se envían datos por URL ni a servicios externos.
- SessionStorage solo para actividades (fase 6), no para Tutor.

### Respuestas matemáticas

Fracciones (4.º), decimales (5.º), porcentajes (6.º). Renderizado con HTML/CSS accesible (fraction con role="img", aria-label).

### Accesibilidad

- HTML semántico, landmarks, headings jerárquicos.
- Navegación por teclado completa: Tab, Shift+Tab, Enter, Shift+Enter, Escape, Flechas.
- Foco visible, `aria-live` en log y mensajes nuevos, `aria-pressed` en conversaciones y acciones.
- Contraste verificado (Axe WCAG A/AA).
- Movimiento reducido: transiciones desactivadas, sugerencias de bienvenida ocultas.
- Scroll sin forzar: mensajes nuevos no desplazan si el usuario está leyendo arriba.

## Integración con fases anteriores

- Sidebar: "Tutor IA" resaltado como `active`.
- Topbar: navegación inferior móvil incluye Tutor.
- Dashboard: sección "A tu alcance" → "Aithron Tutor" abre `tutor.html`.
- Aprende (lección): pestaña Practicar → "No entendí" → opciones → "Aithron Tutor" → pasa `grade,course,unit,lesson`.
- Dashboard → Accesos rápidos → "Aithron Tutor" abre sin contexto académico.
- Sidebar móvil ("Más"): Tutor IA abre `tutor.html`.

## Archivos

```
frontend/student/tutor.html
frontend/css/student/tutor.css
frontend/css/student/tutor-chat.css
frontend/css/student/tutor-responsive.css
frontend/js/student/tutor.js
frontend/js/student/tutor-i18n.js
frontend/js/data/tutor-demo.data.js
frontend/js/services/tutor.service.js
frontend/js/services/tutor-api.service.js
frontend/js/utils/tutor-format.js
frontend/js/utils/tutor-validation.js
frontend/js/components/tutor-message.js
frontend/js/components/tutor-suggestions.js
frontend/js/components/tutor-context.js
frontend/js/components/tutor-conversations.js
frontend/js/components/tutor-input.js
frontend/js/components/tutor-learning-actions.js
```

## Pruebas ejecutadas

Microsoft Edge headless con Playwright y Axe:

1. Validación: vacía, exceso de longitud, Enter/Shift+Enter, inyección HTML (escapa correctamente, no ejecuta).
2. 15 ejemplos por grado/asignatura: envío, respuesta predefinida, fracciones/decimales/porcentajes según grado, revisión a lección.
3. Sugerencias de bienvenida: 4 tarjetas, envío y respuesta.
4. Estrategias "No entendí" + acciones rápidas: 7 opciones, explicación, pasos (3 ítems), ejemplo, dibujo (SVG), pista, práctica (navega a práctica con IDs), tutor (abre diálogo).
5. Conversaciones: nueva, cambio, borrado con confirmación, borrador conservado, límite 10/80.
4. Contexto: desde lección (IDs reales), sin contexto (general + grado), enlace a lección exacta.
5. Offline: aviso, badge offline, explicaciones predefinidas accesibles.
6. Privacidad: sin LocalStorage/SessionStorage/IndexedDB para Tutor; solo `aithron.demo.activities.v1` para actividades (fase 6).
5. Respuestas diferidas y error controlado vía adaptadores de prueba (duplicados, conversación incorrecta, estado).
6. Axe: sin infracciones WCAG A/AA en bienvenida, conversación, diálogo de estrategias, escritorio y móvil.
7. Responsive: 320, 375, 768, 1024, 1440, 1920 px sin desbordamiento; paneles colapsables y `details` en móvil.
8. EN/ES: cambio de idioma conserva conversación, actualiza textos y placeholders.
6. Regresión: fases 1–6 ejecutadas y superadas.

No se ha certificado con lector de pantalla físico ni otros motores. No se ha probado integración real con IA.

## Capturas

- [Bienvenida escritorio](previews/tutor-welcome-desktop.png)
- [Bienvenida móvil](previews/tutor-welcome-mobile.png)
- [Conversación escritorio](previews/tutor-conversation-desktop.png)
- [Conversación móvil](previews/tutor-conversation-mobile.png)

## Pendiente de integración

- Contrato FastAPI para `/api/tutor`: autenticación, rol, límites, validación de contenido, filtro de evaluación formal, adaptación a grado/contexto, proveedor de IA.
- Persistencia de conversaciones con autenticación, políticas de retención y privacidad (COPPA/GDPR).
- Historial sincronizado entre dispositivos, búsqueda semántica, exportación.
- Streaming de respuestas, cancelación, citas y fuentes.
- Métricas de uso pedagógico, alertas de mal uso, auditoría.
- Text-to-speech y speech-to-text para accesibilidad completa.