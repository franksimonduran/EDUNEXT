import {escapeHTML as esc,progressBar} from './student-ui.js';
export const action=(key,label)=>`<button type="button" data-module="${esc(key)}">${esc(label)}</button>`;
export function summaryCard(title,value,description,key){return `<article class="monitor-card summary"><h3>${esc(title)}</h3><strong>${value}</strong><p>${esc(description)}</p>${action(key,'Consultar '+title.toLowerCase())}</article>`;}
export function academicChart(rows){return rows.map(r=>`<div class="chart-row"><span>${esc(r.course)}</span>${r.percent===null?'<span>Sin datos suficientes</span>':`${progressBar(r.percent,r.course+': aciertos formativos')}<b>${r.percent}%</b>`}</div>`).join('');}
