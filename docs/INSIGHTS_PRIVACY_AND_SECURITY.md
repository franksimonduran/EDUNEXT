# Seguridad y protección de menores

Se reutilizan autorización de sesión e identidad activa de Reports, permisos
granulares y filtros institucionales anteriores. Estudiante se resuelve desde
sesión; Monitor requiere relación docente; no se concede acceso por nombre de rol.
No se crean permisos ni concesiones automáticas.

Se devuelven conteos y referencias mínimas, no respuestas, nombres, conclusiones
descriptivas, diagnósticos, perfiles familiares o rankings. La única regla
institucional trata contenido sin datos estudiantiles. No se incorporan nuevos
agregados de grupos pequeños; si Reports suprime una fuente, Insights no la evalúa.

Datos privados usan no-store; no se cachean en IDB/SW. Auditoría reutiliza evento
Reports; no guarda respuestas completas. No hay motor SQL ni Python configurable.

Los hallazgos abiertos del registro de vulnerabilidades siguen abiertos.
No se ejecutaron pruebas BOLA/IDOR/tenant/sesión reales: este diseño no acredita
seguridad integral ni autorización para piloto o producción.
