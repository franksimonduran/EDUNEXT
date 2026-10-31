# Autenticación y roles

`login.js` usa signIn y resolveRoleNavigation. `navigation.js` consulta getAuthorizedSession para navegación autenticada. `/auth/me` devuelve contexto real. El fallo de `/auth/me` ya no se transforma en una sesión autenticada sintetizada desde login.

La autorización de servidor sigue en dependencias existentes. Cambiar una ruta o perfil local no concede permisos API. No se acredita que todas las páginas tengan guardas ni que todos los menús reflejen permisos reales.

Refresh compartido por promesa dentro de un contexto; prueba de diez renovaciones concurrentes pasa con transporte falso. No prueba rotación real, revocación o concurrencia entre pestañas. SignOut conserva lógica existente: revocación si hay access token y limpieza local finalmente. Cancelación de solicitudes en vuelo, cambio de cuenta y cierre con access expirado requieren pruebas y correcciones adicionales.
