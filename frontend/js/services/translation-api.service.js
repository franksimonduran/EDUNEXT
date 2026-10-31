/**
 * Cliente del gateway FastAPI. No se invoca desde la demostración.
 * El servidor validará sesión/rol, idioma detectado, límites de texto, filtro de
 * evaluación formal activa y moderación. El proveedor de traducción y sus secretos
 * permanecerán exclusivamente en el backend: nunca se exponen claves en el navegador
 * ni se envían textos a terceros desde esta capa.
 */
export {translateWithAI as requestTranslationFromBackend} from './ai-api.service.js';
export function getTranslationAvailability(){return {connected:false,mode:'demonstration'};}
