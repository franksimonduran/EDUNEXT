import { learningURL } from './learning-routes.js';

const destinations = Object.freeze({
  home: 'dashboard', courses: 'catalog', practice: 'practice', games: 'games',
  evaluations: 'evaluations', assessments: 'evaluations', progress: 'progress',
  missions: 'missions', achievements: 'achievements', agenda: 'agenda', planner: 'agenda',
  downloads: 'downloads', profile: 'profile', settings: 'settings',
  tutor: 'tutor', translator: 'translator', pronunciation: 'pronunciation',
});

export function studentSectionURL(section, context = {}) {
  const page = destinations[section];
  if (!page) return null;
  const current = new URLSearchParams(globalThis.location?.search ?? '');
  const grade = context.grade ?? current.get('grade') ?? 5;
  const href = learningURL(page, { ...context, grade });
  const mode = current.get('modo');
  return ['api', 'demo'].includes(mode) ? `${href}&modo=${mode}` : href;
}

export function canonicalSection(section) {
  return ({ assessments: 'evaluations', planner: 'agenda' })[section] ?? section;
}
