// Navigation only: these routes confer no permissions and create no records.
export const monitorDemoRoutes=Object.freeze({home:'index.html',students:'estudiantes.html',classrooms:'aulas.html',courses:'cursos.html',tasks:'tareas.html',evaluations:'evaluaciones.html',grades:'notas.html',support:'refuerzos.html',reports:'reportes.html',insights:'analisis-resultados.html',calendar:'calendario.html',sync:'privacidad.html#local-storage',profile:'perfil.html',settings:'configuracion.html'});
export function monitorDemoURL(key,room){
 const route=monitorDemoRoutes[key];if(!route)return null;
 const [page,hash]=route.split('#'),params=new URLSearchParams({modo:'demo'});
 if(room&&room!=='all'&&['students','courses','tasks','grades','support','reports','insights'].includes(key))params.set('room',room);
 return page+'?'+params+(hash?'#'+hash:'');
}
export const demoUnavailable='<p>Esta acción no está disponible en esta demo. Requiere integración y validación del servicio correspondiente; no se han creado asignaciones ni modificado registros oficiales.</p><p><a href="../demo.html">Volver a los recorridos demo</a></p>';
