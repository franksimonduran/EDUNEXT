# Exportación autorizada

Único formato implementado: **CSV**, UTF-8 con BOM, csv.writer y líneas CRLF.
PDF no está implementado; format=pdf se rechaza con 422.

POST /api/v1/reports/exports recibe report_code conocido, format=csv y filtros
estrictos. Exige todos los permisos de lectura/fuente y exportación del ámbito.
Usa la misma generación y supresión que JSON; nunca columnas privadas adicionales.

El archivo contiene aviso de documento informativo no oficial, versión, fecha,
institución, filtros, estado de datos, definiciones, métricas y tabla. No contiene
logo MINEDU ni afirmación de certificación. Nombres son generados desde código
permitido y hora servidor; no incluyen nombres de menores ni rutas del cliente.

## Seguridad CSV

Escapado estándar de comas/comillas/saltos de línea y neutralización independiente
de fórmulas para textos con =, +, -, @ tras espacios/controles/BOM, o tabulación/
retorno/salto inicial. Se antepone apóstrofo. Valores numéricos reales conservan
tipo numérico, incluidos negativos; los textos no se reinterpretan como números.

## Límites y descarga

Máximo síncrono: 100 filas. Se consulta con página 1/tamaño 100; si total excede
100 se responde 409 sin exportación parcial silenciosa. La página de entrada debe
ser 1. Fuentes no disponibles no se exportan como reportes vacíos exitosos.

Se genera en memoria y se devuelve en la respuesta autenticada, después de commit
de auditoría. No hay archivo persistente, URL pública, export_id ni enlace reutilizable.
El navegador crea una URL de Blob local para descargar y la revoca. No se almacena
en IndexedDB ni Cache Storage. La autorización se revalida en cada POST.

Auditoría: actor, institución, código/versión, operación y estado; no contenido CSV.
Pendientes: PDF, trabajos diferidos, gran volumen, política de retención avanzada
y descargas diferidas con autorización/caducidad, si se añaden en el futuro.
