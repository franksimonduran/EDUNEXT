# EDUNEXT Translate — inglés ↔ español con modelos Argos

Estado: traducción CPU local comprobada con textos sintéticos en ambos sentidos.
Integración en el gateway y la pantalla existentes. **No es aprobación de producción,
piloto, calidad pedagógica ni autenticación PostgreSQL de extremo a extremo.**

## Usarlo ahora en esta computadora

Desde la raíz del proyecto, en PowerShell:

```powershell
.\tools\translate-local.ps1 -From es -To en
.\tools\translate-local.ps1 -From en -To es
```

Ejecuta uno de los comandos y escribe un texto educativo cuando se solicite. No
introduzcas nombres, teléfonos, correos ni otros datos personales. El lanzador usa
el intérprete registrado localmente en `backend/.local/argos-runtime.json`, sin
servidor HTTP, cuentas universales, cambios de sesión o acceso a la base de datos.
Ese intérprete es el entorno temporal propio de verificación; si se elimina, sigue
la instalación permanente inferior y especifica `-Python` con su ruta.
No se cambia automáticamente la política de ejecución de PowerShell.

También puedes ejecutar Python directamente con entrada por terminal:

```powershell
& '<ruta-al-python-del-entorno>' -X utf8 backend/scripts/translate_local.py --packages-dir '<ruta-absoluta>/backend/.local/argos-en-es' --from es --to en
```

Resultados reales de la verificación:

- `Hello world!` → `¡Hola mundo!`
- `El agua es importante.` → `Water is important.`

No se almacenan los textos. El traductor puede equivocarse y no garantiza «todas
las palabras», traducción profesional, detección automática o evaluación académica.

## Instalación permanente en un entorno propio

Python 3.11 de 64 bits en un equipo compatible; internet solo para la instalación:

```powershell
py -3.11 -m venv backend/.local/venv
& ./backend/.local/venv/Scripts/python.exe -m pip install -e './backend[argos]'
```

Los pesos ya instalados se conservan. Si instalas desde cero, elige un directorio
**nuevo** y autoriza explícitamente las descargas:

```powershell
& ./backend/.local/venv/Scripts/python.exe backend/scripts/install_argos_models.py --destination '<ruta-absoluta>/backend/.local/argos-en-es' --download-models
```

El instalador rechaza destinos existentes; no borra ni sustituye modelos. Descarga
solo los dos pares del índice oficial por HTTPS, con límites de tamaño y extracción,
y registra SHA-256 de los archivos de inferencia. Los hashes detectan cambios locales;
no son firmas del editor ni aprobación de licencia. No hay descargas durante la
traducción ni fallback a nube. Para usar el nuevo entorno:

```powershell
.\tools\translate-local.ps1 -Python '.\backend\.local\venv\Scripts\python.exe' -From es -To en
```

Paquetes `.argosmodel`, pesos y runtime en `backend/.local/` están excluidos de Git
y del inventario de fuente. No subas estos pesos a GitHub. El entorno de prueba
instala las dependencias oficiales completas; no se ha optimizado su tamaño para
teléfonos ni se certifica consumo de RAM en dispositivos de 6 GB.

## Conexión con la pantalla web existente

`student/traductor.html?modo=api&grade=4` utiliza las rutas existentes:

- `GET /api/v1/ai/capabilities`
- `POST /api/v1/ai/translate`

Desde la demostración hay un enlace «Usar traductor del servidor · Requiere sesión».
No se cambia silenciosamente de demo a traducción real. El diccionario limitado
sigue separado de la traducción automática. El frontend limita los idiomas a es/en
en modo API, evita doble envío y descarta resultados tardíos al limpiar, editar,
cambiar idiomas, salir de la vista o limpiar la autenticación.

Para una futura habilitación **autorizada**, el operador debe configurar el backend
sin publicar valores privados:

```text
AI_PROVIDER_CODE=argos_local
AI_ARGOS_PACKAGES_DIR=<ruta absoluta del conjunto instalado>
AI_TIMEOUT_SECONDS=60
AI_LOCAL_ONLY_ATTESTED=true
AITHRON_AI_ENABLED=true
```

Además requiere la política institucional de traducción habilitada y proveedor
aprobado, sesión activa, permisos de traducción y cuotas. **No se modificó ningún
`.env` privado ni se habilitó la institución.** Los defaults siguen desactivados.
Argos tiene capacidad de traducción, no de tutor conversacional: el gateway no
anuncia ni acepta tutor con este proveedor. No se ejecutan herramientas del modelo.

En laptop, servidor y navegador puede operar sin internet una vez instalado. Los
celulares/tablets necesitan conexión al servidor (por ejemplo, wifi local). Esto
no instala un motor offline dentro de cada dispositivo ni certifica acceso LAN/HTTPS.

## Implementación y seguridad

`ArgosProvider` ejecuta un proceso aislado y acotado por llamada. Usa los tokenizadores
de Argos y pesos Argos con CTranslate2 en CPU, sin el pipeline de alto nivel que
puede descargar segmentadores o conservar cachés de párrafos. Segmentación simple
de textos breves; no equivalente a toda la calidad del pipeline completo.

El worker niega las operaciones de red de sockets Python antes de importar el motor;
no es una prueba de firewall a nivel del sistema operativo. No recibe claves de
sesión, prompts ni configuraciones cloud. Revalida hashes, limita entrada/salida,
rechaza truncados, falla si está ocupado y termina su proceso al expirar o cancelarse.
Los textos desaparecen con el proceso; no se crean cachés de conversaciones.

Se usa **float32**, no int8: una prueba real del modelo es→en produjo repeticiones
incorrectas con int8 en este runtime/CPU. La salida fue rechazada y se corrigió la
configuración; no se relajó el límite para aceptar ese resultado.

El gateway conserva identidad institucional, RBAC, bloqueo por evaluación registrada,
reserva previa de cuota/idempotencia, política bloqueada, validación de texto/salida,
sin reintentos automáticos y respuesta privada/no-store. Las traducciones no alteran
notas, AD/A/B/C, tareas ni registros locales.

## Modelos y atribución

Índice: https://github.com/argosopentech/argospm-index
Biblioteca: https://github.com/argosopentech/argos-translate

- Inglés→español 1.0: README del paquete cita OpenSubtitles, ParaCrawl y UNPC/OPUS,
  además de Stanza. Ese README no acredita por sí solo una licencia completa del
  modelo/corpus: **revisión de licencia pendiente antes de redistribuir o usar institucionalmente**.
- Español→inglés 1.9: README atribuye el modelo original OPUS-MT a Jörg Tiedemann y
  Santhosh Thottingal, EAMT 2020, e indica CC-BY 4.0 para el modelo original. Se
  preserva el README; quedan por verificar obligaciones completas del paquete.

Descargas comprobadas: 87.503.191 bytes y 285.208.831 bytes, respectivamente. No son
una medición de RAM. Procedencia, versiones y hashes en `model-set.json` y evidencia.

## Verificación y límites

Evidencias nuevas en `docs/final/evidence/`, sin reescribir actas anteriores:

- `argos-translation-validation-20261029-03/ARGOS_TRANSLATION_VALIDATION.json`:
  15 pruebas del adaptador/gateway (modelos reales y dobles de política/DB), 12
  contratos IA anteriores, CLI real en ambos sentidos, lanzador PowerShell por
  entrada estándar y `pip check` satisfactorios. Incluye hashes finales de fuente.
  `pip check` no es auditoría de vulnerabilidades ni un lock reproducible.
- `argos-translation-browser-20261029-01/FRONTEND_REFRESH_BROWSER.json`: 99 controles
  en Edge real: vistas públicas de regresión y traducción real HTTP en es/en a
  375/768 px con **identidad, política y persistencia simuladas**. Doble envío,
  limpieza, respuesta tardía y auth reset comprobados; no es login real.
- `edunext-brand-backend-argos-20261029-03/EDUNEXT_BACKEND_VALIDATION.json`: creación
  de FastAPI, OpenAPI (203 paths), liveness y 16 pruebas ASGI satisfactorias. Se
  corrigieron referencias inexistentes al estado y permiso de publicación en dos
  archivos de evaluaciones, reutilizando enum y permiso institucional existentes;
  no se habilita ni se certifica ese módulo. Lifespan/seed PostgreSQL no ejecutados.

Pendientes: E2E autenticado/PostgreSQL, cuotas e idempotencia concurrentes reales,
aislamiento entre cuentas, arranque completo/infraestructura, teléfonos físicos,
calidad pedagógica y revisión de seguridad/suministro/licencias. Producción y piloto
siguen NO-GO. El servicio de pruebas se detiene; no es un backend alternativo para
alumnos. No se crearon cuentas reales, migraciones ni proveedores cloud.
