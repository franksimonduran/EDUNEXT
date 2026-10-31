# Rediseño compartido premium y legibilidad — 2026-10-27

## Resultado

Aplicada una dirección visual sobria de azul profundo, superficies neutras, bordes
finos y espaciado consistente en los componentes compartidos de los tres perfiles.
Prioridad: lectura, jerarquía, composición, separación entre controles y adaptación
a texto grande. Se conservan HTML/CSS/ES6, servicios y comportamiento académico.

No se incorporaron logos o iconos definitivos: se reservan para el final según la
indicación del usuario. Tampoco se añadieron fuentes remotas, frameworks o librerías
de interfaz.

## Cambios

### Tipografía y composición

- Tokens en `frontend/css/variables.css`: cuerpo 16 px, lectura educativa 18 px,
  controles 15 px, texto secundario 14 px y títulos principales 28–36 px al 100 %.
- `frontend/css/experience.css` reorganizado por escala tipográfica, superficies,
  controles, navegación, páginas, autenticación, temas y responsive. La capa común
  toma precedencia explícita sobre reglas antiguas de página; no depende de un
  script que cambie tamaños después de renderizar.
- Interlineado 1,65 para cuerpo y 1,8 para lectura de lecciones, con ancho de lectura
  acotado. Se mantienen tamaños relativos y preferencias de accesibilidad.
- Correcciones de textos de 10–13 px detectados en Tutor, calendario, progreso,
  metadatos de cursos, formularios y estados administrativos.
- Escala común de títulos y metadatos, cifras tabulares en indicadores y separación
  entre etiquetas, valores, descripciones y botones.

### Diseño compartido

- Navegación lateral más espaciosa, etiquetas legibles y grupos definidos.
- Cabeceras flexibles, alineación de identidad/acciones y contadores de avisos
  posicionados como badges, separados del icono de la campana.
- Tarjetas con bordes, radios, sombras y rellenos consistentes; controles con altura
  cómoda y campos con tamaños legibles.
- Formularios con etiquetas y campos separados; selección de tipo de cuenta en una
  columna en móvil para evitar recortes.
- Tablas con alineación izquierda, mejor relleno y etiquetas de estado legibles.
- Botones de acción y estado administrativo separados en dos líneas; se añadió
  también el espacio real en el marcado para que el texto no se concatene al copiarlo.
- Ajustes de login, catálogo, lecciones, prácticas, Tutor y dashboards docentes y
  administrativos a la misma dirección visual.
- Tratamiento de superficies del Tutor en modo oscuro, manteniendo visibles los
  estados reales de demostración y disponibilidad de servicios.

### Reflow y lectura ampliada

- Tarjetas móviles con relleno que no consume todo el ancho al aumentar la letra.
- Accesos rápidos docentes en una columna en pantallas pequeñas.
- Progreso general apilado en móvil para evitar que la cifra invada la barra.
- Calendario con columnas contenidas y desplazamiento interno cuando requiere más
  ancho; conserva el tamaño de las fechas en vez de reducirlas.
- Navegación inferior con separación entre opciones y desplazamiento interno si el
  texto ampliado supera el espacio. No se ocultan etiquetas para aparentar ajuste.
- Lecciones con pestañas en dos columnas a anchuras pequeñas.

## Verificación final

Namespace posterior a la última corrección:
`docs/final/evidence/premium-readability-20261027-final-2/`.

Resultado de `FRONTEND_REFRESH_BROWSER.json`: **169 comprobaciones, ninguna fallida**.

| Grupo | Evidencia y límite |
|---|---|
| 44 pantallas × 320/768/1440 px | 132 comprobaciones de carga, desbordamiento y texto renderizado; sin excepciones JS |
| Tamaño mínimo de texto | En esas 132 vistas no se detectó texto HTML renderizado inferior a 0,875 rem (14 px con raíz estándar); se excluyen SVG, scripts, contenido oculto y texto solo accesible |
| 14 destinos del estudiante | Destino único, contexto y sección activa |
| Filtros/teclado/foco/tema | 2 grupos de interacción existentes conservados |
| Tres perfiles × claro/oscuro | 6 comprobaciones de composición y botones sin recorte; no auditoría completa de contraste |
| Seis vistas × 375/1440 px con raíz al 200 % | 12 comprobaciones sin desbordamiento del documento o recorte horizontal de botones |
| Recorridos protegidos del estudiante | 3 grupos: reanudación/cuota/reintento, entrega incierta y limpieza por logout/403 con HTTP sintético |

Las seis vistas ampliadas son login, los tres dashboards, una lección de Matemática
y Agenda. Esto es ampliación CSS del texto raíz, no prueba de todos los ajustes de
zoom de todos los navegadores.

Se comprobó explícitamente lectura de lección a 18 px, separación geométrica entre
etiqueta y estado y espacios conservados al copiar las acciones docentes/admin.

`FRONTEND_REFRESH_SOURCE.json`: compilación de 436 módulos públicos, importaciones
locales existentes y suites reutilizadas de navegación docente y fronteras privadas
aprobadas. La regresión API/sesión/resiliencia/SW también pasó en
`premium-readability-20261027-verified/NODE_REGRESSION.json`; esos contratos son
limitados a fixtures/VM/HTTP local, no prueban el backend real.

La iteración `verified` conserva el último defecto detectado al ampliar una acción
docente; el resultado vigente es `final-2`. Las iteraciones anteriores se mantienen,
sin reescribir sus resultados ni las actas históricas.

### Capturas

En el namespace final:

- `student-320.png`, `student-1440.png`.
- `premium-student-light.png`, `premium-student-dark.png`.
- `premium-monitor-light.png`, `premium-monitor-dark.png`.
- `premium-admin-light.png`, `premium-admin-dark.png`.
- `premium-login-desktop.png`, `premium-courses-desktop.png`.
- `premium-lesson-desktop.png`.
- `student-task-mobile.png`, `student-practice-resumed.png`.

Todos los datos de las capturas son sintéticos. La petición implícita del navegador
a `/favicon.ico` sigue registrada como 404; se conserva la identidad gráfica existente.

## Reproducir

Elegir un namespace nuevo por ejecución para preservar las evidencias anteriores:

```powershell
$env:AITHRON_FINAL_VALIDATION='1'
$env:AITHRON_PREMIUM_READABILITY='1'
$env:AITHRON_PREMIUM_FOCUS='0'
$env:AITHRON_STUDENT_JOURNEY='1'
$env:AITHRON_FINAL_EVIDENCE_DIR='docs/final/evidence/premium-lectura-nueva-ejecucion'
node tests/frontend-refresh.browser.cjs
node --experimental-vm-modules tests/frontend-refresh-source.cjs
$env:AITHRON_FRONTEND_HASH_NAMESPACE=$env:AITHRON_FINAL_EVIDENCE_DIR
node tests/frontend-refresh-hashes.cjs
```

La herramienta crea un servidor loopback y un perfil Edge desechable en el temporal
autorizado. Las fixtures API se habilitan solo dentro del test mediante su flag;
no se incorporan a la aplicación. Los hashes finales se comparan con los archivos
públicos probados sin regenerar el manifiesto del candidato histórico.

## Límites

La base visual es transversal, pero no se declara auditada cada pantalla y cada
estado dinámico de la aplicación. Quedan la revisión manual exhaustiva del catálogo
completo, contrastes completos, lectores de pantalla, Safari/Firefox y móviles físicos.
Las integraciones autenticadas con PostgreSQL y la revisión pedagógica profesional
siguen pendientes. No se cambian permisos, notas ni datos reales, no se activa AI,
micrófono o sincronización y no hay publicación. Producción/piloto siguen NO-GO.
