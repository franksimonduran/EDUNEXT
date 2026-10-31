import { lt } from '../student/learning-i18n.js';
import { escapeHTML as esc } from './student-ui.js';

export function renderAudioPlayer(audio) {
 return `<div class="audio-player"><p class="muted">${lt('audioNote')}</p><audio id="lesson-audio" controls preload="metadata" aria-label="${lt('audioLabel')}" aria-describedby="audio-note"><source src="${esc(audio.src)}" type="audio/wav"></audio><p id="audio-note" class="muted">${lt('resources')}</p><label class="speed-control" for="audio-speed">${lt('speed')}<select id="audio-speed"><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option></select></label><div id="audio-error" role="status" hidden><p>${lt('audioError')}</p><button class="button-secondary" id="retry-audio" type="button">${lt('retry')}</button></div><h3>${lt('transcript')}</h3><p class="transcript" lang="es">${esc(audio.transcript)}</p></div>`;
}
export function setupAudioPlayer(root) {
 const audio=root.querySelector('#lesson-audio');
 const error=root.querySelector('#audio-error');
 root.querySelector('#audio-speed').addEventListener('change',event=>{audio.playbackRate=Number(event.target.value);});
 audio.addEventListener('error',()=>{error.hidden=false;});
 audio.querySelector('source').addEventListener('error',()=>{error.hidden=false;});
 audio.addEventListener('loadedmetadata',()=>{error.hidden=true;});
 root.querySelector('#retry-audio').addEventListener('click',()=>{error.hidden=true;audio.load();});
 return ()=>audio.pause();
}
