export const progressDemo = Object.freeze({
  grades: { 4: { completed: 8, total: 40 }, 5: { completed: 0, total: 40 }, 6: { completed: 0, total: 40 } },
  general: { completedLessons: 8, totalLessons: 40, completedPractices: 3, achievements: 1, points: 70 },
  courses: [
    { id:'mat-4', course:'Matemática', grade:4, icon:'book', completed:2, total:8, percent:25, last:'Lección 2' },
    { id:'com-4', course:'Comunicación', grade:4, icon:'book', completed:3, total:8, percent:38, last:'Lección 3' },
    { id:'cyt-4', course:'Ciencia y Tecnología', grade:4, icon:'book', completed:1, total:8, percent:13, last:'Lección 1' },
    { id:'ps-4', course:'Personal Social', grade:4, icon:'book', completed:1, total:8, percent:13, last:'Lección 1' },
    { id:'ing-4', course:'Inglés', grade:4, icon:'book', completed:1, total:8, percent:13, last:'Lección 1' }
  ]
});

export function getProgress({grade=4}={}){
 return { ...progressDemo, grade };
}
