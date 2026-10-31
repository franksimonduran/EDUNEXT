import { icon } from './icons.js';
import { renderLanguageSelector } from './language-selector.js';
import { dirAttributes } from '../utils/text-direction.js';
import { ts } from '../student/translator-i18n.js';
import { config } from '../core/config.js';
import { escapeHTML as esc } from './student-ui.js';

// Panel de entrada (origen). El controlador gestiona contador, pegado y estados.
export function renderSourcePanel({ from, text }) {
 return `<section class="translation-panel translation-panel--source" aria-labelledby="source-heading">
  <header class="panel-heading"><h2 id="source-heading">${ts('source')}</h2>
   <div class="panel-selectors">${renderLanguageSelector({ id: 'source-language', value: from, label: ts('source') })}
    <button type="button" class="icon-button" id="detect-language" aria-describedby="detect-note" title="${esc(ts('detectPending'))}">${icon('spark')}<span class="sr-only">${ts('detecting')}</span></button>
   </div>
  </header>
  <p class="detect-note" id="detect-note">${ts('detectingNote')}</p>
  <label class="sr-only" for="source-input">${ts('sourceText')}</label>
  <textarea id="source-input" class="translation-textarea" ${dirAttributes(from)} maxlength="${config.translator.maxInputLength}" placeholder="${esc(ts('placeholder'))}" aria-describedby="source-status">${esc(text)}</textarea>
  <div class="panel-footer"><p id="source-status" class="field-status" role="status"></p>
   <div class="panel-actions">
    <button type="button" class="text-button" id="clear-source">${icon('close')}<span>${ts('clear')}</span></button>
    <button type="button" class="text-button" id="paste-source" hidden>${icon('paste')}<span>${ts('paste')}</span></button>
   </div>
  </div>
 </section>`;
}

// Panel de salida (destino). El contenido se rellena tras traducir.
export function renderTargetPanel({ to }) {
 return `<section class="translation-panel translation-panel--target" aria-labelledby="target-heading">
  <header class="panel-heading"><h2 id="target-heading">${ts('target')}</h2>
   <div class="panel-selectors">${renderLanguageSelector({ id: 'target-language', value: to, label: ts('target') })}</div>
  </header>
  <div id="translation-output" class="translation-output" aria-live="polite" aria-busy="false" ${dirAttributes(to)}></div>
 </section>`;
}

// Botón de intercambio, situado entre los paneles.
export function renderSwapButton() {
 return `<button type="button" class="swap-button" id="swap-languages" aria-label="${esc(ts('swap'))}">${icon('swap')}<span class="sr-only">${ts('swap')}</span></button>`;
}

// Estado inicial vacío del panel de salida.
export function renderOutputPlaceholder() {
 return `<div class="output-placeholder"><span class="placeholder-icon" aria-hidden="true">${icon('language')}</span><p>${ts('resultTitle')}</p></div>`;
}
