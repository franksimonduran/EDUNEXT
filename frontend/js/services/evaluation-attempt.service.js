import { getEvaluation } from '../data/evaluations-demo.data.js';
import { getEvaluationQuestions } from '../data/evaluation-questions-demo.data.js';

export function createAttempt(evaluationId){
 const evalItem = getEvaluation(evaluationId);
 const questions = getEvaluationQuestions(evaluationId);
 return {
  id: `att_${evaluationId}_${Date.now()}`,
  evaluationId,
  evaluation: evalItem,
  questions,
  status: 'en-progreso',
  startedAt: new Date().toISOString(),
  lastSavedAt: null,
  finishedAt: null,
  answers: {},
  review: [],
  sync: { state: 'local', queued: false }
 };
}

export function saveAttempt(attempt, patch={}){
 return { ...attempt, ...patch, lastSavedAt: new Date().toISOString() };
}

export function finalizeAttempt(attempt){
 return { ...attempt, status: 'finalizada-local', finishedAt: new Date().toISOString(), sync: { state: 'local', queued: false } };
}
