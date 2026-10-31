export const adminNavigation=[
 {label:'Principal',items:[['home','Dashboard','home']]},
 {label:'Gestión Institucional',items:[['users','Usuarios','user'],['students','Estudiantes','user'],['teachers','Monitores','user'],['rooms','Aulas','book'],['grades','Grados y Secciones','book']]},
 {label:'Gestión Académica',items:[['courses','Cursos','book'],['content','Contenidos Educativos','book'],['review','Revisión de Contenidos','clipboard'],['evaluations','Evaluaciones','clipboard']]},
 {label:'Organización Académica',items:[['enrollments','Matrículas','clipboard'],['assignments','Asignaciones Docentes','clipboard'],['periods','Periodos Académicos','calendar'],['movements','Movimientos Académicos','calendar']]},
 {label:'Seguimiento',items:[['statistics','Estadísticas','chart'],['reports','Reportes Institucionales','chart'],['activity','Actividad del Sistema','calendar']]},
 {label:'Plataforma',items:[['sync','EDUNEXT Sync','wifi'],['services','Estado de Servicios','wifi'],['settings','Configuración','user'],['permissions','Seguridad y Permisos','user']]},
 {label:'Cuenta',items:[['profile','Mi Perfil','user'],['help','Ayuda','book'],['logout','Cerrar Sesión','user']]}
];
export const minimumAggregateSample=5;
export const metricDefinitions={
 students:'IDs de estudiante distintos asociados a las aulas seleccionadas. Relación de demostración sin periodo confirmado; este filtro no cambia el total.',
 teachers:'IDs docentes distintos relacionados con las aulas seleccionadas. No cuenta una vez por asignatura. Sin periodo de asignación conocido.',
 rooms:'IDs de aula distintos dentro del grado/aula seleccionados. Las relaciones no tienen periodo de matrícula confirmado.',
 courses:'IDs de asignatura únicos en los cursos seleccionados. Se informa por separado la cantidad de definiciones por grado; no se multiplican por aula.',
 content:'Unidades y lecciones del catálogo base de demostración seleccionadas por grado/aula; excluye borradores locales y no afirma publicación autorizada.',
 pending:'Borradores locales cuyo estado guardado es ready (listo para revisión técnica local), compatibles con el grado y el periodo de modificación seleccionado. No son solicitudes institucionales.'
};
