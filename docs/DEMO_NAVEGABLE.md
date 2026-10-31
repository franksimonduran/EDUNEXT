# Demo navegable local

Desde la raíz del proyecto, con Node 24:

```powershell
node tools/demo-server.cjs
```

Abrir http://127.0.0.1:8080/demo.html. Puerto alternativo: `--port 8081`.
El servidor escucha exclusivamente en loopback y no inicia backend ni PostgreSQL.
Usa una ventana/perfil nuevo sin sesión previa; no se borran tokens ni datos.

La entrada ofrece tres perfiles y catálogos existentes. Accede a los detalles
desde sus catálogos para mantener identificadores válidos. Vuelve a demo.html
para cambiar de perfil. No hay cuentas demo universales ni permisos efectivos.
Los logos originales se reutilizan desde `frontend/assets/images/`.
El servidor resuelve las rutas heredadas branding/mark.svg, branding/open-book.svg
y favicon.ico hacia los PNG originales. Son alias exclusivos de este servidor;
otro alojamiento necesitará adaptar esas referencias. La auditoría comprueba
los destinos de esos alias, no declara que existan los SVG antiguos.

## Verificación reproducible

```powershell
$env:AITHRON_FINAL_VALIDATION='1'
node tools/demo-audit.cjs
node tools/demo-smoke.cjs
```

La evidencia nueva se guarda en un namespace separado de docs/final/evidence,
con hashes SHA-256. El smoke usa Edge/Chrome por CDP y perfil temporal propio,
conservado al terminar; no modifica el perfil habitual. DEMO_BROWSER permite
especificar otro ejecutable Chromium. Comprueba los enlaces de la entrada a
360 y 1280 px: render, excepciones, HTTP >=400 y desbordamiento horizontal.
Los fallos API inesperados también cuentan como defectos. No es una prueba
de todas las interacciones, accesibilidad completa ni persistencia real.

## Límites

Solo datos sintéticos. Algunas pantallas guardan cambios demo en IndexedDB.
No introducir datos personales; no activar IA, micrófono ni Sync real.
Los enlaces internos heredados pueden ofrecer modos API: no son parte del
recorrido estático. El runtime Wllama opcional ausente se informa por separado;
no se instala ni se presenta como capacidad verificada.
No hay despliegue ni aceptación institucional: producción/piloto siguen NO-GO.
