// Technical checks against explicit synthetic answers; not a pedagogical approval.
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { saveFinalEvidence } = require('../tools/final-evidence.cjs');
const load = file => import(pathToFileURL(path.resolve(__dirname, '../frontend/js', file)).href);
(async () => {
  const [{ getCoursesDemo }, { getUnitsDemo }, { getPracticesDemo }, { getGamesDemo }, { validateAnswer }] = await Promise.all([
    load('data/courses-demo.data.js'), load('data/units-demo.data.js'), load('data/practices-demo.data.js'), load('data/games-demo.data.js'), load('utils/answer-validation.js'),
  ]);
  let lessons = 0, questions = 0, games = 0;
  const groups = [];
  for (const grade of [4, 5, 6]) {
    for (const course of getCoursesDemo(grade)) {
      const units = getUnitsDemo(course);
      assert.equal(units.length, 1);
      for (const unit of units) {
        assert.equal(unit.lessons.length, 4);
        assert.equal(new Set(unit.lessons.map(lesson => lesson.title)).size, 4);
        for (const lesson of unit.lessons) {
          lessons++;
          assert.equal(lesson.grade, grade);
          assert.equal(lesson.courseId, course.id);
          assert.ok(Number.isInteger(lesson.exercise.answer));
          assert.ok(lesson.exercise.options[lesson.exercise.answer]);
          assert.ok(lesson.objective && lesson.examples[0] && lesson.exercise.incorrect);
          for (const image of lesson.images) if (image.kind === 'parts') assert.ok(image.filled > 0 && image.filled <= image.parts);
        }
      }
    }
    for (const practice of getPracticesDemo(grade)) {
      const ids = new Set();
      for (const question of practice.questions) {
        questions++;
        assert.ok(!ids.has(question.id)); ids.add(question.id);
        assert.ok(question.explanation && question.topic && question.hints.length);
        const answer = question.type === 'word' ? question.answer[0] : question.type === 'numeric' ? String(question.answer) : question.answer;
        assert.deepEqual(validateAnswer(question, answer), { valid: true, correct: true }, question.id);
        if (question.options && ['multiple', 'boolean', 'image'].includes(question.type)) {
          assert.equal(question.options.filter(option => validateAnswer(question, option.id).correct).length, 1, question.id);
          for (const option of question.options) if (question.type === 'image') assert.ok(option.alt);
        }
      }
      groups.push({ grade, practice: practice.id, questions: practice.questions.length });
    }
    const math = getPracticesDemo(grade).find(practice => practice.courseId === 'math');
    const independentAnswer = { 4: '9', 5: '0,9', 6: '20' }[grade];
    assert.equal(validateAnswer(math.questions[0], independentAnswer).correct, true);
    assert.equal(validateAnswer(math.questions[0], '999').correct, false);
    if (grade === 6) {
      assert.equal(validateAnswer(math.questions[1], 'false').correct, true);
      assert.match(math.questions[1].explanation, /mitad.*1\/2.*25 %/);
      assert.ok(math.questions[1].hints.some(hint => hint.includes('50')));
    }
    for (const game of getGamesDemo(grade)) {
      games++;
      assert.equal(game.timed, false);
      if (game.type === 'memory') assert.ok(game.pairs.length > 0);
      else assert.ok(game.questions.length > 0 && game.questions.every(Boolean));
    }
  }
  const evidence = { date: new Date().toISOString(), pass: true, lessons, questions, games, groups, scope: 'Technical consistency of synthetic samples and explicit numeric/percentage expectations. Does not certify curriculum, age suitability, learning outcomes, licenses or professional review.', professionalReview: 'pending' };
  saveFinalEvidence('STUDENT_CONTENT_AUDIT.json', evidence);
  console.log(JSON.stringify(evidence, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
