// Registro de SW con scope en la raíz REAL de la app:
// localhost / o Pages /EDUNEXT/. No descarga automáticamente paquetes.
import {initServiceWorker} from '../offline/pwa.js';
if('serviceWorker' in navigator){
 initServiceWorker().catch(()=>{});
}
