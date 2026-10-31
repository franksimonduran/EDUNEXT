# Runbook staging — NO desplegado

No se tiene proveedor, credenciales, URL, dominio, acceso o autorización específica de staging. Se preparó plantilla segura, no staging operativo. Gate stagingDeploymentAuthorized/providerConfigured/separateEnvironmentsVerified permanece false.

1. Definir operador/aprobador, proveedor/región/costo y datos sintéticos.
2. Resolver lock, build/escaneo y probar imágenes localmente.
3. Aprovisionar únicamente después de autorización: red privada DB, roles propios, CA, almacenamiento privado cuando exista adapter y secretos separados.
4. Configurar HTTPS/hosts/origins y APP_ENV=staging sin debug, AI/Sync deshabilitados.
5. Revisar migraciones y aplicar solo a DB staging nueva/autorizada.
6. Validar health, readiness/revisión, login/RBAC, dos instituciones, recursos/entregas y rollback.
7. Probar backup cifrado + restore aislado, reinicio sin borrar volúmenes y observabilidad/alertas reales.
8. Probar PWA previa→nueva, borradores/colas/cuentas y compatibilidad. Motores faltantes siguen bloqueados.

No comandos de despliegue cloud inventados. El helper smoke-test.cjs solo permite loopback y no es validación autenticada de staging. Documentar URL/artefacto/CA/medidas solo cuando existan; no reutilizar datos o secretos de producción.
