import {academicOrganizationService as api} from './academic-organization.service.js';

export const ENROLLMENT_STATUS_OPTIONS = Object.freeze([
  ['pending', 'Pendiente'],
  ['active', 'Activa'],
  ['suspended', 'Suspendida'],
  ['transferred', 'Trasladada'],
  ['withdrawn', 'Retirada'],
  ['completed', 'Culminada'],
  ['graduated', 'Graduada'],
  ['cancelled', 'Cancelada'],
]);

const STATUS_LABELS = Object.fromEntries(ENROLLMENT_STATUS_OPTIONS);
const MOVEMENT_LABELS = Object.freeze({
  enrollment: 'Matrícula',
  transfer: 'Traslado',
  withdrawal: 'Retiro',
  completion: 'Culminación',
  reentry: 'Reingreso',
  correction: 'Corrección',
});
const REASON_LABELS = Object.freeze({
  family_request: 'Solicitud familiar',
  relocation: 'Traslado de residencia',
  health: 'Salud',
  economic: 'Económico',
  academic: 'Académico',
  academic_reorganization: 'Reorganización académica',
  behavioral: 'Convivencia',
  capacity: 'Capacidad',
  year_end: 'Fin de año',
  administrative: 'Administrativo',
  other: 'Otro',
});

const text = (value, fallback = '') => value || fallback;

function maps({years = [], periods = [], classrooms = []}) {
  return {
    years: new Map(years.map((year) => [year.id, year])),
    periods: new Map(periods.map((period) => [period.id, period])),
    classrooms: new Map(classrooms.map((classroom) => [classroom.id, classroom])),
  };
}

function mapRow(raw, lookup) {
  const year = lookup.years.get(raw.academic_year_id);
  const period = raw.period_id ? lookup.periods.get(raw.period_id) : null;
  const classroom = lookup.classrooms.get(raw.classroom_id);
  const gradeName = text(raw.grade_name, classroom?.display_name ?? '');
  const sectionName = text(raw.section_name);
  const roomLabel = text(
    raw.classroom_code,
    classroom?.code ?? 'Aula no disponible',
  );
  return {
    id: raw.id,
    kind: 'live',
    record: null,
    raw,
    studentId: raw.student_id,
    studentAlias: text(raw.student_display_name, 'Estudiante'),
    studentCode: text(raw.student_code),
    roomId: raw.classroom_id,
    roomLabel,
    grade: null,
    gradeName,
    section: sectionName,
    periodId: raw.period_id ?? null,
    periodLabel: period?.name ?? 'Sin periodo confirmado',
    academicYearId: raw.academic_year_id,
    academicYearLabel: year?.name ?? String(raw.academic_year_id).slice(0, 8),
    courses: [],
    state: raw.status,
    stateLabel: STATUS_LABELS[raw.status] ?? raw.status,
    source: 'API institucional',
    enrolledAt: raw.enrolled_at,
    updatedAt: raw.updated_at,
  };
}

function normalizeDate(value) {
  return value ? new Date(`${value}T12:00:00`).toISOString() : undefined;
}

export async function fetchEnrollmentWorkspace({
  page = 1,
  pageSize = 25,
  search = '',
  status = '',
  yearId = '',
  classroomId = '',
} = {}) {
  const params = {
    page,
    page_size: pageSize,
    search: search || undefined,
    status: status || undefined,
    academic_year_id: yearId || undefined,
    classroom_id: classroomId || undefined,
  };
  const [result, yearsPage, periodsPage, classroomsPage] = await Promise.all([
    api.listEnrollments(params),
    api.listAcademicYears({page_size: 100}),
    api.listAcademicPeriods({page_size: 100}),
    api.listClassrooms({page_size: 100}),
  ]);
  const lookup = maps({
    years: yearsPage.items,
    periods: periodsPage.items,
    classrooms: classroomsPage.items,
  });
  return {
    page: result,
    rows: result.items.map((item) => mapRow(item, lookup)),
    years: yearsPage.items,
    periods: periodsPage.items,
    classrooms: classroomsPage.items,
    yearOptions: yearsPage.items.map((year) => [year.id, year.name]),
    statusOptions: ENROLLMENT_STATUS_OPTIONS,
    classroomOptions: classroomsPage.items.map((classroom) => [
      classroom.id,
      `${classroom.code} · ${classroom.display_name}`,
    ]),
  };
}

export async function fetchEnrollmentDetail(enrollmentId) {
  const [raw, periodsPage, yearsPage, classroomsPage] = await Promise.all([
    api.getEnrollment(enrollmentId),
    api.listAcademicPeriods({page_size: 100}),
    api.listAcademicYears({page_size: 100}),
    api.listClassrooms({page_size: 100}),
  ]);
  const lookup = maps({
    years: yearsPage.items,
    periods: periodsPage.items,
    classrooms: classroomsPage.items,
  });
  const row = mapRow(raw, lookup);
  return {
    ...row,
    statusReason: raw.status_reason,
    effectiveDate: raw.effective_date,
    endedAt: raw.ended_at,
    movements: (raw.movements ?? []).map((movement) => ({
      ...movement,
      typeLabel: MOVEMENT_LABELS[movement.movement_type] ?? movement.movement_type,
      reasonLabel: REASON_LABELS[movement.reason_code] ?? movement.reason_code ?? 'Sin motivo',
    })),
  };
}

export async function fetchTransferOptions(enrollment) {
  const classroom = await api.getClassroom(enrollment.roomId);
  const result = await api.listClassrooms({
    academic_year_id: enrollment.academicYearId,
    grade_id: classroom.grade_id,
    status: 'active',
    page_size: 100,
  });
  return result.items
    .filter((item) => item.id !== enrollment.roomId)
    .map((item) => [
      item.id,
      `${item.code} · ${item.display_name}${item.capacity ? ` · cupo ${item.capacity}` : ''}`,
    ]);
}

export async function withdrawEnrollment(enrollmentId, values) {
  return api.withdrawEnrollment(enrollmentId, {
    reason_code: values.reason_code || 'other',
    notes: values.notes || undefined,
    effective_date: normalizeDate(values.effective_date),
  });
}

export async function completeEnrollment(enrollmentId, values) {
  return api.completeEnrollment(enrollmentId, {
    reason_code: values.reason_code || 'year_end',
    notes: values.notes || undefined,
    effective_date: normalizeDate(values.effective_date),
  });
}

export async function transferEnrollment(enrollmentId, values, key) {
  return api.transferEnrollment(
    enrollmentId,
    {
      destination_classroom_id: values.destination_classroom_id,
      reason_code: values.reason_code || 'other',
      notes: values.notes || undefined,
      effective_date: normalizeDate(values.effective_date),
    },
    {key},
  );
}

export function formatApiDate(value) {
  if (!value) return 'Sin fecha';
  try {
    return new Intl.DateTimeFormat('es', {dateStyle: 'medium', timeStyle: 'short'}).format(new Date(value));
  } catch {
    return String(value);
  }
}

export function statusLabel(value) {
  return STATUS_LABELS[value] ?? value;
}

export function movementTypeLabel(value) {
  return MOVEMENT_LABELS[value] ?? value;
}

export function reasonLabel(value) {
  return REASON_LABELS[value] ?? value ?? 'Sin motivo';
}
