# Vocabulario y procedencia

Fuente única reutilizada: `frontend/js/data/dictionary-demo.data.js`, FASE 8.
38 entradas redactadas/revisadas manualmente según el comentario del recurso
existente. No se importó un diccionario comercial ni un dataset de terceros.

El backend lee únicamente campos de entradas con un parser restringido y
ast.literal_eval para literales; no ejecuta JavaScript. No crea una copia divergente
en otra tabla. El archivo debe empaquetarse también en un despliegue del backend.
Cambios de formato requieren actualizar/validar el lector y reiniciar su caché.

Idiomas: español/inglés. Campos: palabra, equivalencia, categoría, ejemplo y ejemplo
traducido; no se inventan sentidos, IPA, audio o bibliografía. Varias acepciones no
están cubiertas exhaustivamente (por ejemplo, una equivalencia no resuelve toda ambigüedad).

Búsqueda normaliza mayúsculas y diacríticos, ordena exacta antes de prefijos y pagina.
Cada respuesta señala project_local_dictionary, phase8-v1 y generated_by_ai=false.

Licencia: no hay licencia de redistribución separada declarada en el recurso.
Se reutiliza dentro del proyecto entregado; no se afirma licencia abierta, aprobación
externa ni permiso para publicar/redistribuir un diccionario completo. Verificar
titularidad y términos del proyecto antes de redistribución institucional externa.

Offline: el recurso frontend existente puede consultarse si sus módulos están
realmente descargados. La API no funciona sin conexión. No se descargó nuevo corpus.
