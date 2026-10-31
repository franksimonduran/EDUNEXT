# Frontend

Se mantuvo HTML/CSS/ES6, sin frameworks nuevos. Escaneo estático de fuentes y revisión focal de cliente API, SW y almacenamiento demo. `innerHTML` aparece extensamente; múltiples renderizadores usan escape, pero no se completó análisis de flujo desde cada entrada hasta cada sink. No se atribuyen 449 vulnerabilidades a 449 coincidencias iniciales.

Cliente conserva un solo mecanismo API, ahora cubre cuerpo lento/cancelación, valida también apiDownload, y rechaza respuestas de contexto anterior. No elimina borradores ni transforma errores en datos demo. Pruebas de contrato/sesión y fixture HTTP pasan; tres archivos JS pasan sintaxis en Node.

SW ya no reutiliza HTML dinámico privado ni cachés arbitrarias. Usa namespaces v2, conserva caches anteriores sin leerlos aquí y restringe activos a directorios públicos js/css/assets sin query/bearer, respetando private/no-store/no-cache/Vary. Esos directorios **deben ser públicos y no personalizados**; no son lugar para evidencias de menores.

Impacto intencional: navegación autenticada offline preparada por caches antiguas ya no se sirve desde SW. No se considera resuelta la PWA hasta disponer de shell público/paquetes y separación de cuentas probados. Otras funciones frontend pueden consultar Cache Storage directamente y requieren revisión. No se borraron caches/IDB para ocultar fallos.

En navegador se probó únicamente login público: etiquetas, validación vacía, Tab y cuatro anchos, en Edge/Chrome. No probados: rutas protegidas, guardas, menús reales, resto de formularios, DOM XSS, accesibilidad completa, instalación o actualizaciones. Base API same-origin/configuración de Fase 47 se conserva, sin agregar proxy o servidor de aplicación paralelo; la fixture Node solo sirve archivos durante la prueba.
