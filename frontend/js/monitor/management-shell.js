import {monitor,monitorNavigation} from '../data/monitor-demo.data.js';
import {renderSidebar} from '../components/sidebar.js';
import {renderTopbar} from '../components/topbar.js';
import {authorizedRooms,roomName,getStudent} from '../services/monitor-students.service.js';
import {escapeHTML as esc} from '../components/student-ui.js';
import {initializeMonitorSettings} from '../services/monitor-settings.service.js';
import {installAccountNavigation} from '../components/monitor-account-navigation.js';
import {monitorDemoURL,demoUnavailable} from './demo-navigation.js';
export function managementShell(title,active){
 initializeMonitorSettings();
  document.addEventListener('click',event=>{const key=event.target.closest('[data-section]')?.dataset.section;const route=monitorDemoURL(key,new URLSearchParams(location.search).get('room'));if(route){event.preventDefault();event.stopImmediatePropagation();location.assign(route);}},true);
 const shell=document.querySelector('.monitor-shell'),dialog=document.querySelector('dialog');let collapsed=false;
 const nav=()=>{renderSidebar(document.querySelector('aside'),collapsed,active,{sections:monitorNavigation});shell.classList.toggle('collapsed',collapsed);};nav();renderTopbar(document.querySelector('header'),monitor,{role:'monitor'});
 document.title=title+' | EDUNEXT';
 document.querySelector('#page-title').textContent=title;
  const open=(title,html=demoUnavailable)=>{document.querySelector('#dialog-title').textContent=title;document.querySelector('#dialog-content').innerHTML=html;if(!dialog.open)dialog.showModal();};
 installAccountNavigation(open);
 function connection(){document.querySelector('#connection-indicator').textContent=navigator.onLine?'Con conexión de red':'Sin conexión';document.querySelector('#network-notice').textContent='Datos de demostración · Sin conexión al servicio.';}
 connection();window.addEventListener('online',connection);window.addEventListener('offline',connection);
  document.addEventListener('click',e=>{
   const b=e.target.closest('button');if(!b)return;
   if(b.id==='close-dialog'){dialog.close();return;}
   if(b.id==='sidebar-toggle'){collapsed=!collapsed;nav();shell.classList.remove('menu-open');document.querySelector('#sidebar-toggle').focus();return;}
   if(b.dataset.open==='navigation'){shell.classList.toggle('menu-open');return;}
   if(b.dataset.open==='notifications'){location.assign('notificaciones.html?modo=demo');return;}
   if(b.dataset.section){open('No disponible en esta demo');return;}
   if(b.hasAttribute('data-future')){
    const id=new URLSearchParams(location.search).get('id'),student=getStudent(id),room=authorizedRooms().find(r=>r.id===id),params=new URLSearchParams({modo:'demo'});
    if(student){params.set('student',student.id);params.set('room',student.classroomId);}else if(room)params.set('room',room.id);
    const label=b.textContent.trim();
    if(label.startsWith('Preparar refuerzo'))location.assign('crear-refuerzo.html?'+params);
    else if(label.startsWith('Consultar actividades'))location.assign('seguimiento-actividades.html?'+params);
    else if(label.startsWith('Ver actividad de refuerzo'))location.assign('refuerzos.html?'+params);
    else open('No disponible en esta demo');
   }
  });
 document.addEventListener('keydown',e=>{if(e.key==='Escape')shell.classList.remove('menu-open');});
 return {open,root:document.querySelector('#page-content'),setActive:key=>{active=key;nav();}};
}
export function roomOptions(all=true){return (all?'<option value="all">Todas mis aulas</option>':'')+authorizedRooms().map(c=>`<option value="${c.id}">${roomName(c.id)}</option>`).join('');}
