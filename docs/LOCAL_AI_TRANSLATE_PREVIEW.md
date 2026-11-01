# EDUNEXT — Tutor MiniCPM y traducción Argos en modo local (Windows)

Esta guía usa las **páginas oficiales de EDUNEXT** con dos motores instalados en tu computadora. Solo para pruebas internas con contenido ficticio. No concede acceso a expedientes, calificaciones ni cuentas de estudiantes; no usa PostgreSQL, IA en la nube ni claves de API. El servidor escucha únicamente en 127.0.0.1.

Los modelos de inferencia NO están incluidos en GitHub. Se necesita internet para la descarga inicial y espacio libre. La inferencia posterior ocurre en el equipo local. El uso offline en Android y el acceso PWA sin servidor no están certificados.

## 1. Requisitos

Desde PowerShell:

~~~powershell
cd D:\EDUNEXT
node --version
py -3.11 --version
~~~

Se recomienda Node.js 24, Python 3.11 de 64 bits, memoria suficiente y espacio libre para los modelos y dependencias. No uses cuentas reales ni textos con datos personales.

## 2. Argos Translate: instalación de modelos español ↔ inglés

Crea un Python propio dentro del proyecto (archivos .local excluidos de Git):

~~~powershell
py -3.11 -m venv backend\.local\venv
& .\backend\.local\venv\Scripts\python.exe -m pip install -e ".\backend[argos]"
~~~

Solo si todavía NO existe backend\.local\argos-en-es, autoriza la descarga de los dos modelos (unos 373 MB entre ambos):

~~~powershell
$models = Join-Path (Get-Location) "backend\.local\argos-en-es"
& .\backend\.local\venv\Scripts\python.exe backend\scripts\install_argos_models.py --destination "$models" --download-models
~~~

Si la carpeta ya existe, **no la borres ni la sobrescribas**: verifica los modelos existentes. El instalador rechaza destinos existentes para evitar pérdidas.

Prueba una traducción desde PowerShell:

~~~powershell
.\tools\translate-local.ps1 -Python ".\backend\.local\venv\Scripts\python.exe" -From es -To en
~~~

Escribe El agua es importante. La respuesta esperada aproximada es Water is important. También puedes usar -From en -To es y Hello world!.

## 3. EDUNEXT AI MiniCPM: instalar pesos locales

Desde la raíz del proyecto:

~~~powershell
node tools\install-local-minicpm.cjs --verify
~~~

Si falta el GGUF, lo normal después de clonar GitHub, **autoriza expresamente** la descarga del archivo de 1,56 GB:

~~~powershell
node tools\install-local-minicpm.cjs --download
node tools\install-local-minicpm.cjs --verify
~~~

No elimines un archivo existente con un hash diferente. El verificador trabaja sin Internet; la inferencia corre en el navegador usando WebAssembly y CPU, y puede tardar minutos o consumir varios GB de memoria.

## 4. Iniciar ambos en el mismo EDUNEXT

Detén cualquier servidor anterior que utilice el puerto 8080. Desde otra terminal PowerShell:

~~~powershell
cd D:\EDUNEXT
node tools\local-ai-preview.cjs
~~~

Abre las páginas oficiales:

- Tutor local: http://127.0.0.1:8080/student/tutor.html?grade=4&modo=local
- Traductor Argos local: http://127.0.0.1:8080/student/traductor.html?grade=4&modo=local
- Diccionario de demostración: http://127.0.0.1:8080/student/traductor.html?grade=4&modo=demo

**Tutor:** acepta el consentimiento, pulsa Iniciar IA y formula una pregunta breve sobre los materiales de ejemplo. MiniCPM se ejecuta en ese navegador, sin cambiar automáticamente a la nube.

**Traductor:** selecciona español/inglés y envía una frase educativa sin datos personales. La página usa el modelo Argos por Python, en la misma computadora, sin enviar texto a Google ni Gemini.

El servidor utiliza un token aleatorio solo en memoria, exige peticiones de mismo origen, no escucha en la LAN y rechaza solicitudes simultáneas. No registra las traducciones. Se detiene con Ctrl+C.

## 5. Solución de problemas

- **Modelo Argos ausente:** comprueba backend\.local\argos-en-es\model-set.json y backend\.local\venv\Scripts\python.exe. Prueba primero el traductor en PowerShell.
- **MiniCPM ausente:** ejecuta node tools\install-local-minicpm.cjs --verify. La presencia de EDUNEXT_INSTALL.json no significa que el GGUF esté instalado.
- **Puerto ocupado:** detén el servidor anterior o usa node tools\local-ai-preview.cjs --port 8090 y cambia 8080 por 8090 en la URL.
- **MiniCPM lento:** el motor utiliza CPU; haz pruebas breves en una computadora con suficiente RAM. Android de 6 GB sigue sin validación.
- **Traducción no disponible:** comprueba que la CLI sí traduce. La vista web no inventará una traducción si el motor falla.
- **Sin Internet:** instala primero los modelos. El servidor local debe continuar encendido.

## 6. Pruebas de seguridad del modo local (sin modelos)

~~~powershell
node tests\local-ai-preview.cjs
~~~

Estas pruebas usan un traductor simulado y comprueban origen, token, validación, límite de concurrencia y rutas EDUNEXT. **No acreditan inferencia real**; para eso es necesaria la comprobación manual de ambos motores.

## Límites del modo local

- Este entorno local NO sustituye las rutas institucionales /api/v1/ai/*, que requieren autenticación y política institucional.
- El servidor solo permite conexiones desde la misma computadora. Un celular no puede usar el servicio de la PC a través de 127.0.0.1.
- No se declara MiniCPM apto para celulares de 6 GB, ni Argos integrado como motor dentro de Android.
- Revisa precisión, contenido pedagógico y licencias antes de cualquier despliegue institucional.
- **Estado institucional: NO-GO** para uso con estudiantes reales, calificaciones, producción y piloto.
