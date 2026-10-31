# Offline

No hay almacenamiento local de Insights autenticados ni sincronización remota.
Una consulta requiere servidor y sesión. Error de red no se reemplaza por demo.
No se modifica Service Worker ni se borran borradores o respuestas existentes.

Datos demo locales conservan su identificación original; no pasan a PostgreSQL.
Futura copia offline requeriría partición por usuario/institución, fecha/versiones,
estado stale y revalidación antes de cualquier acción. Nada de ello está habilitado.
La privacidad en equipos compartidos requiere pruebas de cambio de sesión reales.
