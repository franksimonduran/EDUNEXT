import { icon } from './icons.js';

export function renderMicrophoneControl({ disabled = false, recording = false, supported = true }) {
 const label = recording ? 'Grabando...' : 'Iniciar grabación';
 const tone = recording ? 'recording' : 'idle';
 return `<button type="button" class="mic-control mic-control--${tone}" ${disabled ? 'disabled' : ''} ${!supported ? 'aria-disabled="true"' : ''} data-mic-toggle>
  <span class="mic-control-inner">${icon('mic')}</span>
  <span class="mic-control-label">${label}</span>
 </button>`;
}

export function renderAudioPlayer({ url, disabled = false }) {
 return `<audio controls class="pron-audio" ${url ? '' : 'hidden'} src="${url ?? ''}"></audio>`;
}
