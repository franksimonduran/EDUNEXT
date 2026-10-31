# Gemini online — adaptador preparado, no activado

Google AI Studio utiliza Gemini API desde el backend. La pestaña IA online ya
consulta los endpoints institucionales existentes; no lleva claves en el navegador.
MiniCPM local no cambia. No se usa una clave compartida en conversaciones.
Revocar cualquier clave expuesta y generar una nueva en el proyecto de Google.

## Configuración privada del operador

### Opción recomendada: terminal local con entrada oculta

En PowerShell, desde `D:\Programing\EDUNEXT`, ejecutar manualmente:

```powershell
.\tools\configure-gemini-session.ps1
```

Solicita el identificador del modelo, confirmación explícita y una **clave nueva**
con entrada oculta. No ejecutar desde herramientas de chat ni pegar la clave en
comandos: usar únicamente el prompt local. El script no abre ni modifica `.env`,
no guarda la clave, no accede a PostgreSQL y no inicia ni consulta servicios.
Configura variables únicamente en esa terminal; el backend tendría que arrancarse
desde la misma terminal, después de verificar una base de pruebas autorizada.
Un backend ya iniciado no recibe estos cambios. Cerrar la terminal descarta sus
variables, pero no revoca la clave ni termina procesos hijos ya iniciados.
La variable del entorno contiene la clave en memoria; no es un almacén de secretos.
No imprimir variables ni compartir capturas del entorno.

### Alternativa: entorno privado del backend

Configurar en el entorno **del proceso backend**, no en archivos frontend:

```text
AI_PROVIDER_CODE=gemini_online
AI_MODEL=<identificador gemini vigente disponible en tu proyecto>
GEMINI_API_KEY=<nueva clave privada; no compartir>
AI_LOCAL_ONLY_ATTESTED=false
AI_REMOTE_PROCESSING_APPROVED=false
EDUNEXT_AI_ENABLED=false
```

Los dos últimos interruptores quedan apagados hasta revisión/autorización explícita
de procesamiento remoto y posibles costos. No activar con menores ni datos reales.
El modelo no tiene valor predeterminado; comprobar disponibilidad en Google AI Studio.
No leer ni copiar entornos privados a evidencias.
`AITHRON_AI_ENABLED` sigue aceptado por compatibilidad; si ambos nombres están
definidos, prevalece `EDUNEXT_AI_ENABLED`. No duplicar valores contradictorios.

Después de autorización para una prueba sintética: el operador habilita ambos
interruptores, reinicia el backend y utiliza una cuenta autorizada. Se mantienen
la aprobación institucional del proveedor, habilitación del tutor, RBAC, contexto
de lecciones autorizadas, cuotas e idempotencia. No se crean cuentas ni se cambia
la política institucional automáticamente. En IA online: «Comprobar disponibilidad».

No basta un servidor estático: requiere FastAPI y PostgreSQL configurados y verificados.
Elegir Gemini sustituye el proveedor backend configurado; no hay fallback a Ollama
ni Argos ni Gemini como traductor automático. Argos y MiniCPM locales no envían datos.

## Transferencia y límites

### Frontend con API en el mismo origen

`py -m http.server` sirve archivos pero no la API. Detener ese servidor con Ctrl+C
y ejecutar, desde la raíz, **en otra terminal**:

```powershell
node tools/dev-server.cjs --port 8080 --api-port 8000
```

Abrir `http://127.0.0.1:8080/login.html`. El servidor escucha solo en loopback y
redirige `/api/v1` a `127.0.0.1:8000`, preservando cookies, autorización y CSRF.
No configura ni inicia FastAPI. Si falta el backend, responde 503 con un mensaje
explícito, no un 404 de archivos. No pegar claves en esta terminal del frontend.
La clave configurada permanece en la terminal del backend. No se desactiva seguridad.

El arranque de FastAPI ejecuta inicialización de roles/grados y tareas de retención:
no iniciar contra una base desconocida. Verificar primero el entorno y una base
de pruebas autorizada. La habilitación de IA no sustituye login, RBAC ni aprobación
institucional del proveedor. Este proxy es de desarrollo, no un despliegue aprobado.

Se envían a Google la pregunta, instrucciones y el fragmento educativo autorizado.
No se envían JWT, cookies ni historial completo. Revisar términos, tratamiento,
retención, ubicación, facturación y restricciones de la cuenta antes de habilitar.
No se afirma ausencia de retención por Google. Cuotas locales no son un presupuesto
de facturación garantizado. Consulta de disponibilidad GET sin generación; generación
POST solo tras reserva de cuota. Salida estructurada, sin herramientas, sin redirecciones
ni reintentos automáticos; respuestas bloqueadas, truncadas o inválidas se rechazan.

Preparado no equivale a servicio operativo: no se ha hecho una llamada real a Google,
ni probado autenticación PostgreSQL E2E. Producción y piloto real siguen NO-GO.

Referencia: https://ai.google.dev/api/generate-content
