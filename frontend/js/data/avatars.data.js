export const avatarsData = Object.freeze([
 { id:'av-1', label:'Explorador', desc:'Curioso y aventurero',labelEn:'Explorer',descEn:'Curious and adventurous' },
 { id:'av-2', label:'Lector', desc:'Amante de los libros',labelEn:'Reader',descEn:'Loves books' },
 { id:'av-3', label:'Científico', desc:'Observador y analítico',labelEn:'Scientist',descEn:'Observant and analytical' },
 { id:'av-4', label:'Matemático', desc:'Lógico y preciso',labelEn:'Mathematician',descEn:'Logical and precise' },
 { id:'av-5', label:'Aventurero', desc:'Valiente y decidido',labelEn:'Adventurer',descEn:'Brave and determined' },
]);

export function getAvatars(){ return [...avatarsData]; }
export function getAvatarById(id){ return avatarsData.find(a=>a.id===id) || avatarsData[0]; }
