import { getLocale } from '../student/i18n.js';
import { learningURL } from '../student/learning-routes.js';

export function mountStudentGuide(container, route) {
  const en = getLocale() === 'en';
  container.innerHTML = `<details class="student-guide"><summary>${en ? 'New here? Find your next step' : '¿Es tu primera visita? Encuentra tu siguiente paso'}</summary>
    <div class="student-guide-content"><ol>
      <li><a href="${learningURL('catalog', route)}">${en ? 'Explore your courses' : 'Explora tus cursos'}</a>. ${en ? 'Open a lesson, read the example and ask for a hint when you need one.' : 'Abre una lección, lee el ejemplo y busca una pista si la necesitas.'}</li>
      <li><a href="${learningURL('practice', route)}">${en ? 'Practise at your own pace' : 'Practica a tu ritmo'}</a>. ${en ? 'An error is a chance to learn. Read the explanation and try again.' : 'Equivocarte también ayuda a aprender. Lee la explicación y vuelve a intentarlo.'}</li>
      <li><a href="${learningURL('agenda', route)}">${en ? 'Check your planner' : 'Consulta tu agenda'}</a>. ${en ? 'Look for assigned activities. An empty day does not mean you have done something wrong.' : 'Busca tus actividades. Un día sin tareas no significa que hayas hecho algo mal.'}</li>
    </ol><p>${en ? 'Check the data label: sample progress and game points are not official grades. A network connection does not guarantee server availability.' : 'Revisa el aviso de datos: los avances de muestra y los puntos de juego no son notas oficiales. Tener conexión de red no garantiza que el servidor esté disponible.'}</p>
    <p><a href="${learningURL('accessibility', route)}">${en ? 'Adjust reading and accessibility' : 'Ajustar lectura y accesibilidad'}</a> · <a href="${learningURL('downloads', route)}">${en ? 'Check resources on this device' : 'Consultar recursos de este dispositivo'}</a></p></div>
  </details>`;
}
