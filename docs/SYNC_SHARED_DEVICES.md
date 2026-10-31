# Equipos compartidos

Operaciones nuevas llevan partición explícita institución/cuenta. Solo se selecciona
la partición devuelta por bootstrap autenticado; POST repite precondiciones expected_*
para detectar cambio de sesión entre bootstrap y envío. Sin migración de propietario.
Recibos/progreso llevan la misma partición. Vista API no muestra la cola demo.

No se borran operaciones al cerrar sesión. ApiRequest conserva controles existentes
contra respuestas tardías; no se ha probado aquí la carrera con sesión real.
La pantalla se desmonta en pagehide, pero cierre/cambio de cuenta/PWA multiusuario
integral no están certificados. No hay credenciales de desbloqueo offline ni cifrado.
Antes de habilitar uso compartido se requiere ensayo real A→B→A y revisión de riesgos.
