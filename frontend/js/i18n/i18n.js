import {readPreferences,savePreferences} from '../services/preferences.service.js';
import {accountStrings} from './monitor-account.js';
import {adminStrings} from './admin-dashboard.js';
export const strings = {
 es:{
  profileTitle:'Mi Perfil', profileSub:'Conoce tu espacio personal de aprendizaje', editProfile:'Editar perfil',
  courses:'Cursos activos', lessons:'Lecciones completadas', missions:'Misiones completadas', achievements:'Insignias obtenidas',
  myAchievements:'Mis logros destacados', seeAll:'Ver todos mis logros', myCourses:'Mis cursos', seeCourse:'Ver curso',
  settings:'Configuración', settingsSub:'Personaliza EDUNEXT a tu manera', language:'Idioma', appearance:'Apariencia',
  learningPrefs:'Preferencias de aprendizaje', accessibility:'Accesibilidad', account:'Cuenta y seguridad', privacy:'Privacidad',
  about:'Acerca de EDUNEXT', savedLocal:'Personalización guardada en este dispositivo'
 },
 en:{
  profileTitle:'My Profile', profileSub:'Know your personal learning space', editProfile:'Edit profile',
  courses:'Active courses', lessons:'Lessons completed', missions:'Missions completed', achievements:'Badges obtained',
  myAchievements:'My featured achievements', seeAll:'See all my achievements', myCourses:'My courses', seeCourse:'View course',
  settings:'Settings', settingsSub:'Customize EDUNEXT your way', language:'Language', appearance:'Appearance',
  learningPrefs:'Learning preferences', accessibility:'Accessibility', account:'Account and security', privacy:'Privacy',
  about:'About EDUNEXT', savedLocal:'Customization saved on this device'
 }
};

Object.assign(strings.es,accountStrings.es);Object.assign(strings.en,accountStrings.en);
Object.assign(strings.es,adminStrings.es);Object.assign(strings.en,adminStrings.en);
export function getLocale(){return readPreferences().locale;}
export function setLocale(l){savePreferences({locale:l});document.documentElement.lang=l;}
export function t(key, loc=getLocale()){ return strings[loc]?.[key] || strings.es[key] || key; }
