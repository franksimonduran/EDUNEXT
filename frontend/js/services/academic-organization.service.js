import { apiRequest } from './auth.service.js';

function queryString(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const serialized = search.toString();
  return serialized ? `?${serialized}` : '';
}

function id(value) {
  return encodeURIComponent(value);
}

function idempotencyKey(value) {
  if (value) return value;
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function mutation(path, body, { headers, method = 'POST' } = {}) {
  return apiRequest(path, {
    method,
    body,
    csrf: true,
    headers,
  });
}

function idempotentMutation(path, body, key) {
  return mutation(path, body, {
    headers: { 'Idempotency-Key': idempotencyKey(key) },
  });
}

export function listAcademicYears(params) {
  return apiRequest(`/academic-years${queryString(params)}`);
}

export function getAcademicYear(yearId) {
  return apiRequest(`/academic-years/${id(yearId)}`);
}

export function createAcademicYear(payload) {
  return mutation('/academic-years', payload);
}

export function updateAcademicYear(yearId, payload) {
  return mutation(`/academic-years/${id(yearId)}`, payload, { method: 'PATCH' });
}

export function listAcademicPeriods(params) {
  return apiRequest(`/academic-periods${queryString(params)}`);
}

export function getAcademicPeriod(periodId) {
  return apiRequest(`/academic-periods/${id(periodId)}`);
}

export function createAcademicPeriod(payload) {
  return mutation('/academic-periods', payload);
}

export function updateAcademicPeriod(periodId, payload) {
  return mutation(`/academic-periods/${id(periodId)}`, payload, { method: 'PATCH' });
}

export function listGrades(params) {
  return apiRequest(`/grades${queryString(params)}`);
}

export function getGrade(gradeId) {
  return apiRequest(`/grades/${id(gradeId)}`);
}

export function listSections(params) {
  return apiRequest(`/sections${queryString(params)}`);
}

export function getSection(sectionId) {
  return apiRequest(`/sections/${id(sectionId)}`);
}

export function createSection(payload) {
  return mutation('/sections', payload);
}

export function updateSection(sectionId, payload) {
  return mutation(`/sections/${id(sectionId)}`, payload, { method: 'PATCH' });
}

export function listClassrooms(params) {
  return apiRequest(`/classrooms${queryString(params)}`);
}

export function getClassroom(classroomId) {
  return apiRequest(`/classrooms/${id(classroomId)}`);
}

export function listClassroomStudents(classroomId) {
  return apiRequest(`/classrooms/${id(classroomId)}/students`);
}

export function createClassroom(payload) {
  return mutation('/classrooms', payload);
}

export function updateClassroom(classroomId, payload) {
  return mutation(`/classrooms/${id(classroomId)}`, payload, { method: 'PATCH' });
}

export function archiveClassroom(classroomId) {
  return mutation(`/classrooms/${id(classroomId)}/archive`, {});
}

export function listMyClassrooms() {
  return apiRequest('/monitors/me/classrooms');
}

export function listEnrollments(params) {
  return apiRequest(`/enrollments${queryString(params)}`);
}

export function getEnrollment(enrollmentId) {
  return apiRequest(`/enrollments/${id(enrollmentId)}`);
}

export function createEnrollment(payload, { key } = {}) {
  return idempotentMutation('/enrollments', payload, key);
}

export function updateEnrollment(enrollmentId, payload) {
  return mutation(`/enrollments/${id(enrollmentId)}`, payload, { method: 'PATCH' });
}

export function withdrawEnrollment(enrollmentId, payload = {}) {
  return mutation(`/enrollments/${id(enrollmentId)}/withdraw`, payload);
}

export function completeEnrollment(enrollmentId, payload = {}) {
  return mutation(`/enrollments/${id(enrollmentId)}/complete`, payload);
}

export function transferEnrollment(enrollmentId, payload, { key } = {}) {
  return idempotentMutation(`/enrollments/${id(enrollmentId)}/transfer`, payload, key);
}

export function listAcademicMovements(params) {
  return apiRequest(`/academic-movements${queryString(params)}`);
}

export function listTeacherAssignments(params) {
  return apiRequest(`/teacher-assignments${queryString(params)}`);
}

export function getTeacherAssignment(assignmentId) {
  return apiRequest(`/teacher-assignments/${id(assignmentId)}`);
}

export function createTeacherAssignment(payload) {
  return mutation('/teacher-assignments', payload);
}

export function updateTeacherAssignment(assignmentId, payload) {
  return mutation(`/teacher-assignments/${id(assignmentId)}`, payload, { method: 'PATCH' });
}

export function revokeTeacherAssignment(assignmentId) {
  return mutation(`/teacher-assignments/${id(assignmentId)}/revoke`, {});
}

export const academicOrganizationService = Object.freeze({
  listAcademicYears,
  getAcademicYear,
  createAcademicYear,
  updateAcademicYear,
  listAcademicPeriods,
  getAcademicPeriod,
  createAcademicPeriod,
  updateAcademicPeriod,
  listGrades,
  getGrade,
  listSections,
  getSection,
  createSection,
  updateSection,
  listClassrooms,
  getClassroom,
  listClassroomStudents,
  createClassroom,
  updateClassroom,
  archiveClassroom,
  listMyClassrooms,
  listEnrollments,
  getEnrollment,
  createEnrollment,
  updateEnrollment,
  withdrawEnrollment,
  completeEnrollment,
  transferEnrollment,
  listAcademicMovements,
  listTeacherAssignments,
  getTeacherAssignment,
  createTeacherAssignment,
  updateTeacherAssignment,
  revokeTeacherAssignment,
});
