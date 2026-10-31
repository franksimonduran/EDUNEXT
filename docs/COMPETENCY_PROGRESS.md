# Seguimiento de competencias — fuente no disponible

La auditoría de FASE 40 encontró contratos iniciales, no persistencia operativa de
CompetencyAchievement/AcademicRecord ni publicación de valoraciones confirmadas.
Por tanto `/api/v1/progress/competencies` y el resumen devuelven `not_available`
con explicación. No se copian ni inventan niveles ni conclusiones descriptivas.

AD/A/B/C son categorías de juicio docente. No se promedian letras ni se convierten
porcentajes de finalización, juego o instrumento en niveles de logro. Sin registro
confirmado no se asigna C.

Futura integración: lectura de valoración vigente autorizada por estudiante,
institución y periodo, conclusiones permitidas y tratamiento de rectificaciones.
El motor de progreso no debe modificar la fuente académica. No hay diagnósticos,
predicciones ni inferencias de dominio por número de lecciones.
