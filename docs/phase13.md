# Fase 13 - Perfil, Configuración, Preferencias y Accesibilidad

## Objetivo
Implementar las pantallas de perfil, edición de perfil, configuración, preferencias y accesibilidad para AITHRON EDU, con almacenamiento local, tema claro/oscuro/automático, selector de idioma ES/EN, avatares ilustrados, preferencias de aprendizaje y ajustes de accesibilidad.

## Archivos creados

### Datos
- `frontend/js/data/avatars.data.js`
- `frontend/js/data/profile-demo.data.js` (extendido con helpers locales)
- `frontend/js/data/preferences-defaults.data.js`

### i18n
- `frontend/js/i18n/i18n.js`

### Utilidades
- `frontend/js/utils/theme-manager.js`
- `frontend/js/utils/accessibility-manager.js`
- `frontend/js/utils/settings-validation.js`

### Servicios
- `frontend/js/services/profile.service.js`
- `frontend/js/services/preferences.service.js`
- `frontend/js/services/settings.service.js`

### Componentes
- `frontend/js/components/profile-header.js`
- `frontend/js/components/avatar-selector.js`
- `frontend/js/components/settings-card.js`
- `frontend/js/components/language-selector.js`
- `frontend/js/components/theme-selector.js`
- `frontend/js/components/accessibility-preview.js`

### CSS
- `frontend/css/student/profile.css` (añadido/extendido)

### Pantallas y JS estudiante
- `frontend/student/perfil.html`, `frontend/js/student/profile.js`
- `frontend/student/editar-perfil.html`, `frontend/js/student/edit-profile.js`
- `frontend/student/configuracion.html`, `frontend/js/student/settings.js`
- `frontend/student/preferencias.html`, `frontend/js/student/preferences.js`
- `frontend/student/accesibilidad.html`, `frontend/js/student/accessibility.js`

## Integraciones
- Sidebar actualizado para incluir "Mi perfil"
- `frontend/js/student/learning-routes.js` con rutas de perfil/configuración/preferencias/accesibilidad
- Dashboard/Topbar conectados al perfil (menú avatar)

## Comprobación
Servidor de pruebas: `python -m http.server 8088 --bind 127.0.0.1` desde `frontend/`.
Sin backend, sin contraseñas, sin notificaciones push, sin sincronización real. Datos solo locales.
