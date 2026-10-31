import {escapeHTML as esc} from './student-ui.js';
import {getAIConfiguration,updateAIConfiguration,getInstitutionAIUsage} from '../services/ai-api.service.js';

export async function renderAIConfigurationPanel(root){
 let active=true;
 window.addEventListener('pagehide',()=>{active=false;root.replaceChildren();},{once:true});
 window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
 root.innerHTML='<p role="status">Consultando configuración institucional IA…</p>';
 try{
  let config=await getAIConfiguration();
  if(!active)return;
  const booleans=[['tutor_enabled','Permitir Tutor'],['translation_enabled','Permitir traducción generativa'],['dictionary_enabled','Permitir vocabulario local'],['provider_approved','Aprobación institucional del proveedor local']];
  const limits=[['daily_user_limit','Solicitudes diarias por usuario',1,100],['daily_institution_limit','Solicitudes diarias institucionales',1,2000],['max_input_characters','Máximo de caracteres',100,1500],['max_output_tokens','Máximo de tokens de salida',32,512]];
  root.innerHTML=`<section class="dashboard-card"><h2>EDUNEXT AI — Política institucional</h2><p>Proveedor: ${esc(config.provider||'No configurado')}. Habilitación del operador: ${config.operator_enabled?'sí':'no'}.</p><p>Estos controles no instalan modelos ni activan un proveedor ausente. Revisa el funcionamiento local, licencia del modelo y requisitos institucionales antes de aprobar.</p><form><fieldset ${config.can_manage?'':'disabled'}><legend>Disponibilidad y límites</legend>${booleans.map(([key,label])=>`<label><input type="checkbox" name="${key}" ${config[key]?'checked':''}> ${label}</label>`).join('')}${limits.map(([key,label,min,max])=>`<label>${label}<input type="number" name="${key}" min="${min}" max="${max}" value="${config[key]}" required></label>`).join('')}<button type="submit">Guardar política en servidor</button></fieldset></form><p role="status" data-ai-config-status></p><section data-ai-usage><h3>Consumo técnico</h3><p>Consultando ámbito autorizado…</p></section><p>No hay acceso a conversaciones, audio ni transcripciones. Retención de conversaciones: deshabilitada.</p></section>`;
  const form=root.querySelector('form'),status=root.querySelector('[data-ai-config-status]');
  form.addEventListener('submit',async event=>{
   event.preventDefault();const button=form.querySelector('button');button.disabled=true;
   const body={expected_revision:config.revision};
   booleans.forEach(([key])=>body[key]=form.elements[key].checked);limits.forEach(([key])=>body[key]=Number(form.elements[key].value));
   try{config={...config,...await updateAIConfiguration(body)};status.textContent=`Política guardada en servidor, revisión ${config.revision}. Disponibilidad efectiva sujeta a proveedor configurado.`;}
   catch(error){status.textContent=`No se confirmó el cambio: ${error.message}`;}finally{button.disabled=false;}
  });
  try{
   const usage=await getInstitutionAIUsage();if(!active)return;root.querySelector('[data-ai-usage]').innerHTML=`<h3>Consumo técnico retenido</h3><p>Solicitudes: ${usage.requests===null?'Suprimidas por privacidad':Number(usage.requests)} · ${esc(usage.data_status)}</p><p>Costo: no disponible. No se inventan precios ni costos cero.</p>`;
  }catch(error){if(active)root.querySelector('[data-ai-usage]').textContent=`Consumo agregado no disponible: ${error.message}`;}
 }catch(error){if(active)root.innerHTML=`<section role="alert"><h2>Configuración IA no disponible</h2><p>${esc(error.message)}</p><p>No se muestran preferencias demo como configuración aplicada.</p></section>`;}
}
