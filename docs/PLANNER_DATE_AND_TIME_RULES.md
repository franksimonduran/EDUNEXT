# Fechas y zonas horarias

- Instantes de disponibilidad, entrega, recepción y revisión usan timestamp con
  zona horaria. Pydantic rechaza instantes sin offset.
- Institución configura timezone. Los tests usan America/Lima.
- Disponibilidad y plazo deben estar contenidos en las fechas civiles del periodo,
  interpretadas en la zona institucional; disponibilidad <= plazo.
- El servidor permite entrega exactamente en due_at; después, solo si la tarea
  permite tardanza. No hay penalización académica automática.
- Prórroga individual debe ampliar el plazo anterior, encajar en el periodo y
  registrar actor, fecha anterior/nueva y motivo de texto. No se muestra el motivo
  al resto de estudiantes.
- Eventos all_day usan starts_on y ends_on civiles, con final exclusivo.
  Un día: 2026-10-23 a 2026-10-24. No se transforman a medianoche UTC.
- Eventos con hora usan starts_at/ends_at conscientes de zona; final > inicio.
- Calendario personal recibe fechas civiles [start, end), entre 1 y 93 días.
  Los límites se convierten en la zona institucional; los intervalos se consultan
  por solapamiento, no solo por fecha de inicio.
- El reloj del dispositivo no prueba entrega puntual. El recibo usa hora servidor.

El formulario docente inicial pide ISO con offset explícito para evitar interpretar
sin aviso la zona del navegador. La agenda nueva carga 31 días desde la fecha de
Lima; su selección inicial debe adaptarse en el futuro a otras zonas institucionales.
No hay motor de recurrencia, scheduler de publicación ni prórroga grupal.
