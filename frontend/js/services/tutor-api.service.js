/**
 * Cliente del gateway FastAPI. No se invoca desde la demostración.
 * El servidor validará sesión/rol, límites, grado/contexto y evaluación formal
 * activa; ninguna bandera del navegador constituirá autorización para resolverla.
 * El proveedor y sus secretos permanecerán exclusivamente en el backend.
 */
export {sendTutorMessage as requestTutorFromBackend} from './ai-api.service.js';
// Estado del modo demo exclusivamente; disponibilidad real: GET /ai/capabilities.
export function getTutorAvailability(){return {connected:false,mode:'demonstration'};}
